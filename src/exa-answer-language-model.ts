import {
  LanguageModelV2,
  LanguageModelV2CallWarning,
  LanguageModelV2StreamPart,
  LanguageModelV2FinishReason,
  LanguageModelV2CallOptions,
  LanguageModelV2Prompt,
  APICallError,
  InvalidResponseDataError,
} from '@ai-sdk/provider';
import {
  combineHeaders,
  createJsonResponseHandler,
  postJsonToApi,
} from '@ai-sdk/provider-utils';
import { z } from 'zod';
import {
  ExaAnswerSettings,
  ExaAnswerConfig,
  ExaAnswerCitation,
} from './types';

export class ExaAnswerLanguageModel implements LanguageModelV2 {
  readonly specificationVersion = 'v2' as const;
  readonly modelId: string;
  readonly defaultObjectGenerationMode = undefined;

  private readonly settings: ExaAnswerSettings;
  private readonly config: ExaAnswerConfig;

  constructor(
    modelId: string,
    settings: ExaAnswerSettings,
    config: ExaAnswerConfig,
  ) {
    this.modelId = modelId;
    this.settings = settings;
    this.config = config;
  }

  get provider(): string {
    return this.config.provider;
  }

  readonly supportedUrls: Record<string, RegExp[]> = {};

  private convertPromptToQuery(prompt: LanguageModelV2Prompt): string {
    const userMessages = prompt
      .filter((msg) => msg.role === 'user')
      .map((msg) => {
        return msg.content
          .filter((part) => part.type === 'text')
          .map((part) => (part.type === 'text' ? part.text : ''))
          .join(' ');
      })
      .join(' ');

    return userMessages || 'What is this about?';
  }

  private extractSystemPrompt(
    prompt: LanguageModelV2Prompt,
  ): string | undefined {
    const systemMessage = prompt.find((msg) => msg.role === 'system');
    if (systemMessage) {
      return systemMessage.content;
    }
    return undefined;
  }

  private getArgs(options: LanguageModelV2CallOptions) {
    const warnings: LanguageModelV2CallWarning[] = [];

    const query = this.convertPromptToQuery(options.prompt);
    const messageSystemPrompt = this.extractSystemPrompt(options.prompt);
    const systemPrompt =
      this.settings.systemPrompt || messageSystemPrompt || undefined;

    const body: Record<string, unknown> = {
      query,
      stream: false,
    };

    if (this.settings.text !== undefined) {
      body.text = this.settings.text;
    }

    if (systemPrompt) {
      body.systemPrompt = systemPrompt;
    }

    if (this.settings.outputSchema && !body.stream) {
      body.outputSchema = this.settings.outputSchema;
    }

    if (options.maxOutputTokens !== undefined) {
      warnings.push({
        type: 'unsupported-setting',
        setting: 'maxOutputTokens',
      });
    }

    if (options.temperature !== undefined) {
      warnings.push({
        type: 'unsupported-setting',
        setting: 'temperature',
      });
    }

    if (options.topP !== undefined) {
      warnings.push({
        type: 'unsupported-setting',
        setting: 'topP',
      });
    }

    // Tools are not supported by Exa Answer API
    if (options.tools && options.tools.length > 0) {
      warnings.push({
        type: 'unsupported-setting',
        setting: 'tools',
      });
    }

    return { args: body, warnings };
  }

  async doGenerate(options: LanguageModelV2CallOptions) {
    const { args, warnings } = this.getArgs(options);

    const { value: response } = await postJsonToApi({
      url: `${this.config.baseURL}/answer`,
      headers: combineHeaders(this.config.headers(), options.headers),
      body: args,
      failedResponseHandler: async ({ response: errorResponse }) => {
        const errorText = await errorResponse.text();
        throw new Error(`Exa API error: ${errorText}`);
      },
      successfulResponseHandler: createJsonResponseHandler(
        z.object({
          answer: z.string(),
          citations: z.array(
            z.object({
              id: z.string(),
              url: z.string(),
              title: z.string().optional(),
              author: z.string().nullable().optional(),
              publishedDate: z.string().nullable().optional(),
              text: z.string().optional(),
              snippet: z.string().optional(),
              image: z.string().optional(),
              favicon: z.string().optional(),
              score: z.number().optional(),
            }),
          ),
          costDollars: z
            .object({
              total: z.number(),
            })
            .passthrough()
            .optional(),
        }),
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    const { answer, citations, costDollars } = response;

    // Build V2 content structure
    const content = [
      {
        type: 'text' as const,
        text: answer,
      },
      ...citations.map((citation) => ({
        type: 'source' as const,
        sourceType: 'url' as const,
        id: citation.id,
        url: citation.url,
        title: citation.title,
      })),
    ];

    return {
      content,
      finishReason: 'stop' as LanguageModelV2FinishReason,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
      request: {
        body: JSON.stringify(args),
      },
      response: {
        timestamp: new Date(),
        modelId: this.modelId,
      },
      warnings,
      providerMetadata: {
        exa: {
          citations: JSON.parse(JSON.stringify(citations)),
          costDollars: costDollars ? JSON.parse(JSON.stringify(costDollars)) : undefined,
        },
      },
    };
  }

  async doStream(options: LanguageModelV2CallOptions) {
    const { args, warnings } = this.getArgs(options);

    const streamingArgs = { ...args, stream: true };

    // Remove outputSchema from streaming (not compatible)
    if ('outputSchema' in streamingArgs) {
      delete streamingArgs.outputSchema;
    }

    const headers: Record<string, string> = {
      ...this.config.headers(),
      'Content-Type': 'application/json',
    };

    const fetchFn = this.config.fetch || fetch;
    const response = await fetchFn(`${this.config.baseURL}/answer`, {
      method: 'POST',
      headers,
      body: JSON.stringify(streamingArgs),
      signal: options.abortSignal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new APICallError({
        message: `Exa API error: ${errorText}`,
        statusCode: response.status,
        url: `${this.config.baseURL}/answer`,
        requestBodyValues: streamingArgs,
        isRetryable: response.status >= 500 && response.status < 600,
      });
    }

    if (!response.body) {
      throw new InvalidResponseDataError({
        message: 'Response body is null',
        data: response,
      });
    }

    const stream = response.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(this.createSSEParser())
      .pipeThrough(this.createTransformer(warnings));

    return {
      stream,
      warnings,
    };
  }

  private createSSEParser(): TransformStream<string, string> {
    let buffer = '';

    return new TransformStream<string, string>({
      transform(chunk, controller) {
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data !== '[DONE]') {
              controller.enqueue(data);
            }
          }
        }
      },

      flush(controller) {
        if (buffer.trim().startsWith('data: ')) {
          const data = buffer.trim().slice(6);
          if (data !== '[DONE]') {
            controller.enqueue(data);
          }
        }
      },
    });
  }

  private createTransformer(
    warnings: LanguageModelV2CallWarning[],
  ): TransformStream<string, LanguageModelV2StreamPart> {
    let citationsSent = false;
    let isFirstChunk = true;
    let metadataSent = false;
    let textId = 'text-0';
    let textStarted = false;
    const modelId = this.modelId;

    return new TransformStream<string, LanguageModelV2StreamPart>({
      transform: (chunk, controller) => {
        try {
          // Send stream-start with warnings on first chunk
          if (isFirstChunk) {
            controller.enqueue({
              type: 'stream-start',
              warnings,
            });
            isFirstChunk = false;
          }

          const parsed = JSON.parse(chunk);

          // Send response metadata once
          if (!metadataSent) {
            controller.enqueue({
              type: 'response-metadata',
              modelId: modelId,
            });
            metadataSent = true;
          }

          // Send text content with proper start/delta/end
          if (parsed.answer) {
            if (!textStarted) {
              controller.enqueue({
                type: 'text-start',
                id: textId,
              });
              textStarted = true;
            }
            
            controller.enqueue({
              type: 'text-delta',
              id: textId,
              delta: parsed.answer,
            });
          }

          // Send source citations
          if (parsed.citations && !citationsSent) {
            citationsSent = true;
            parsed.citations.forEach((citation: ExaAnswerCitation) => {
              controller.enqueue({
                type: 'source',
                sourceType: 'url',
                id: citation.id,
                url: citation.url,
                title: citation.title,
              });
            });
          }
        } catch (error) {
          controller.enqueue({
            type: 'error',
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      },

      flush: (controller) => {
        // End text if it was started
        if (textStarted) {
          controller.enqueue({
            type: 'text-end',
            id: textId,
          });
        }
        
        controller.enqueue({
          type: 'finish',
          finishReason: 'stop' as LanguageModelV2FinishReason,
          usage: {
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
          },
        });
      },
    });
  }
}

