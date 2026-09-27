import OpenAI from 'openai';
import type {
  ChatMessage,
  ILLMProvider,
  LLMOptions,
  LLMResult,
} from './interfaces.js';
import { env } from '../config/env.js';

export class OpenAIProvider implements ILLMProvider {
  readonly name = 'openai';
  private readonly client: OpenAI | null;

  constructor(apiKey = env.openaiApiKey) {
    this.client = apiKey ? new OpenAI({ apiKey }) : null;
  }

  async generateText(prompt: string, options: LLMOptions = {}): Promise<LLMResult> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chat(messages: ChatMessage[], options: LLMOptions = {}): Promise<LLMResult> {
    if (!this.client) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const requestMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = messages.map(
      (message) => ({ role: message.role, content: message.content }),
    );

    if (options.systemPrompt) {
      requestMessages.unshift({ role: 'system', content: options.systemPrompt });
    }

    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages: requestMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1000,
      top_p: options.topP,
    });

    const choice = response.choices[0];
    return {
      text: choice?.message?.content || '',
      tokensUsed: response.usage?.total_tokens || 0,
      model: response.model,
      finishReason: choice?.finish_reason || 'unknown',
    };
  }

  async countTokens(text: string): Promise<number> {
    // Conservative estimate for routing and budget checks. Exact tokenization
    // depends on the selected model and requires a tokenizer dependency.
    return Math.ceil(text.length / 4);
  }
}

export default OpenAIProvider;
