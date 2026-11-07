import OpenAI from 'openai';
import type {
  ChatMessage,
  ILLMProvider,
  LLMOptions,
  LLMResult,
} from './interfaces.js';
import { env } from '../config/env.js';

/** Thrown when a generation is attempted without any usable LLM provider. */
export class LLMNotConfiguredError extends Error {
  readonly code = 'LLM_NOT_CONFIGURED';

  constructor() {
    super(
      'No LLM provider is available. Set OPENAI_API_KEY to use real OpenAI generation, ' +
        'or set DEMO_MODE=true for an explicitly labelled offline demo.',
    );
    this.name = 'LLMNotConfiguredError';
  }
}

const RETRYABLE_NETWORK_CODES = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'ENOTFOUND',
  'EAI_AGAIN',
]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryable(error: unknown): boolean {
  const status = (error as { status?: number; statusCode?: number })?.status
    ?? (error as { statusCode?: number })?.statusCode;
  if (typeof status === 'number') {
    return status === 408 || status === 409 || status === 429 || status >= 500;
  }
  const code = String((error as { code?: string })?.code || '');
  return RETRYABLE_NETWORK_CODES.has(code);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Real OpenAI Chat Completions provider.
 *
 * - Only instantiated when a key exists; `isConfigured` tells the registrar
 *   whether a real provider is available.
 * - Supports custom base URLs (OpenAI-compatible gateways).
 * - Retries transient failures with exponential backoff.
 */
export class OpenAIProvider implements ILLMProvider {
  readonly name = 'openai';
  readonly model: string;
  private readonly client: OpenAI | null;

  constructor(apiKey = env.openaiApiKey) {
    this.model = env.openaiModel;
    this.client = apiKey
      ? new OpenAI({
          apiKey,
          ...(env.openaiBaseUrl ? { baseURL: env.openaiBaseUrl } : {}),
          timeout: env.openaiTimeoutMs,
          // Retries are handled here so every provider behaves consistently.
          maxRetries: 0,
        })
      : null;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  async generateText(prompt: string, options: LLMOptions = {}): Promise<LLMResult> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chat(messages: ChatMessage[], options: LLMOptions = {}): Promise<LLMResult> {
    if (!this.client) {
      throw new LLMNotConfiguredError();
    }

    const requestMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = messages.map(
      (message) => ({ role: message.role, content: message.content }),
    );

    if (options.systemPrompt) {
      requestMessages.unshift({ role: 'system', content: options.systemPrompt });
    }

    let lastError: unknown;
    const maxAttempts = env.llmMaxRetries + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await this.client.chat.completions.create({
          model: options.model || this.model,
          messages: requestMessages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 1000,
          ...(options.topP !== undefined ? { top_p: options.topP } : {}),
        });

        const choice = response.choices[0];
        return {
          text: choice?.message?.content || '',
          tokensUsed: response.usage?.total_tokens || 0,
          model: response.model,
          finishReason: choice?.finish_reason || 'unknown',
        };
      } catch (error) {
        lastError = error;
        if (attempt >= maxAttempts || !isRetryable(error)) break;
        await sleep(500 * 2 ** (attempt - 1));
      }
    }

    throw new Error(
      `OpenAI request failed after ${maxAttempts} attempt(s): ${errorMessage(lastError)}`,
    );
  }

  async countTokens(text: string): Promise<number> {
    // Conservative estimate for routing and budget checks. Exact tokenization
    // depends on the selected model and requires a tokenizer dependency.
    return Math.ceil(text.length / 4);
  }
}

export default OpenAIProvider;
