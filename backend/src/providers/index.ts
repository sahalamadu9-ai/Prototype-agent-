import { OpenAIProvider } from './OpenAIProvider.js';
import providerManager from './interfaces.js';

export function registerDefaultProviders() {
  const llm = new OpenAIProvider();

  providerManager.registerLLMProvider('openai', llm);
  providerManager.setDefaultLLMProvider('openai');
}

export default registerDefaultProviders;
