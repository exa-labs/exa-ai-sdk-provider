/**
 * Settings for the Exa Answer model
 */
export interface ExaAnswerSettings {
  /**
   * If true, the response includes full text content in the search results
   */
  text?: boolean;

  /**
   * Custom system prompt to guide the answer generation
   */
  systemPrompt?: string;

  /**
   * JSON schema for structured output format
   * Note: Cannot be used with streaming
   */
  outputSchema?: Record<string, unknown>;

  /**
   * Additional provider-specific options
   */
  providerOptions?: Record<string, unknown>;
}

/**
 * Citation/source from Exa answer
 */
export interface ExaAnswerCitation {
  id: string;
  url: string;
  title?: string;
  author?: string | null;
  publishedDate?: string | null;
  text?: string;
  image?: string;
  favicon?: string;
}

/**
 * Cost breakdown for Exa API request
 */
export interface ExaCostDollars {
  total: number;
  breakDown?: Array<{
    search?: number;
    contents?: number;
    breakdown?: {
      keywordSearch?: number;
      neuralSearch?: number;
      contentText?: number;
      contentHighlight?: number;
      contentSummary?: number;
    };
  }>;
  perRequestPrices?: {
    neuralSearch_1_25_results?: number;
    neuralSearch_26_100_results?: number;
    neuralSearch_100_plus_results?: number;
    keywordSearch_1_100_results?: number;
    keywordSearch_100_plus_results?: number;
  };
  perPagePrices?: {
    contentText?: number;
    contentHighlight?: number;
    contentSummary?: number;
  };
}

/**
 * Response from Exa Answer API (non-streaming)
 */
export interface ExaAnswerResponse {
  answer: string;
  citations: ExaAnswerCitation[];
  costDollars?: ExaCostDollars;
}

/**
 * Streaming chunk from Exa Answer API
 */
export interface ExaAnswerStreamChunk {
  answer?: string;
  citations?: ExaAnswerCitation[];
}

/**
 * Configuration for Exa Answer model
 */
export interface ExaAnswerConfig {
  provider: string;
  baseURL: string;
  headers: () => Record<string, string>;
  fetch?: typeof fetch;
}

