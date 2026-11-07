import type {
  ChatMessage,
  ILLMProvider,
  LLMOptions,
  LLMResult,
} from './interfaces.js';

/**
 * Offline provider used only when DEMO_MODE=true and no API key is present.
 * Its output is deliberately and visibly labelled so demo content can never be
 * mistaken for real model output.
 */
export class DemoProvider implements ILLMProvider {
  readonly name = 'demo';

  async generateText(prompt: string, options: LLMOptions = {}): Promise<LLMResult> {
    return this.chat([{ role: 'user', content: prompt }], options);
  }

  async chat(messages: ChatMessage[], _options: LLMOptions = {}): Promise<LLMResult> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    const brief = (lastUserMessage?.content || '').slice(0, 160);

    return {
      text: [
        '[DEMO MODE — no OpenAI request was made]',
        '',
        `Offline preview for: ${brief}`,
        '',
        'Set OPENAI_API_KEY in backend/.env (or DEMO_MODE=false) to generate real content.',
      ].join('\n'),
      tokensUsed: 0,
      model: 'demo-mode',
      finishReason: 'demo',
    };
  }

  async countTokens(text: string): Promise<number> {
    return Math.ceil(text.length / 4);
  }
}

export default DemoProvider;
