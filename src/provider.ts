import { ProviderV2 } from '@ai-sdk/provider';
import { loadApiKey, withoutTrailingSlash } from '@ai-sdk/provider-utils';
import { ExaAnswerLanguageModel } from './exa-answer-language-model';
import { ExaAnswerSettings } from './types';

export { ExaAnswerSettings };

// Exa provider interface
export interface ExaProvider extends ProviderV2 {
  (modelId: string, settings?: ExaAnswerSettings): ExaAnswerLanguageModel;
  languageModel(modelId: string, settings?: ExaAnswerSettings): ExaAnswerLanguageModel;
  answer(settings?: ExaAnswerSettings): ExaAnswerLanguageModel;
}

// Provider settings
export interface ExaProviderSettings {
  baseURL?: string;
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

// Create an Exa provider instance
export function createExa(
  options: ExaProviderSettings = {},
): ExaProvider {
  const baseURL =
    withoutTrailingSlash(options.baseURL ?? options.baseUrl) ??
    'https://api.exa.ai';

  const getHeaders = () => ({
    'x-api-key': loadApiKey({
      apiKey: options.apiKey,
      environmentVariableName: 'EXA_API_KEY',
      description: 'Exa',
    }),
    'Content-Type': 'application/json',
    ...options.headers,
  });

  const createAnswerModel = (settings: ExaAnswerSettings = {}) =>
    new ExaAnswerLanguageModel('answer', settings, {
      provider: 'exa.answer',
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
    });

  const createLanguageModel = (
    modelId: string,
    settings: ExaAnswerSettings = {},
  ) => {
    if (new.target) {
      throw new Error(
        'The Exa model function cannot be called with the new keyword.',
      );
    }

    if (modelId !== 'answer') {
      throw new Error(
        `Unknown Exa model: ${modelId}. Currently supported models: 'answer'`,
      );
    }

    return createAnswerModel(settings);
  };

  const provider = (
    modelId: string,
    settings?: ExaAnswerSettings,
  ) => createLanguageModel(modelId, settings);

  provider.languageModel = createLanguageModel;
  provider.answer = createAnswerModel;
  provider.textEmbeddingModel = (_modelId: string) => {
    throw new Error('Not supported');
  };
  provider.imageModel = (_modelId: string) => {
    throw new Error('Not supported');
  };

  return provider as ExaProvider;
}

// Default Exa provider instance
export const exa = createExa();

