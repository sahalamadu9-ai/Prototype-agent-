import { OpenAIProvider } from './OpenAIProvider.js';
import { DemoProvider } from './DemoProvider.js';
import providerManager from './interfaces.js';
import { env } from '../config/env.js';

export interface ProviderStatus {
  name: 'openai' | 'demo' | 'none';
  model: string;
  configured: boolean;
  demo: boolean;
  ready: boolean;
}

let status: ProviderStatus = {
  name: 'none',
  model: env.openaiModel,
  configured: false,
  demo: false,
  ready: false,
};
let registered = false;

/**
 * Register exactly one LLM provider:
 *   1. OPENAI_API_KEY present        -> real OpenAI provider
 *   2. DEMO_MODE=true, no key        -> explicitly labelled demo provider
 *   3. neither                       -> no provider; generation fails loudly
 */
export function registerDefaultProviders(): void {
  if (registered) return;
  registered = true;

  const openai = new OpenAIProvider();

  if (openai.isConfigured) {
    providerManager.registerLLMProvider('openai', openai);
    providerManager.setDefaultLLMProvider('openai');
    status = {
      name: 'openai',
      model: openai.model,
      configured: true,
      demo: false,
      ready: true,
    };
    return;
  }

  if (env.demoMode) {
    providerManager.registerLLMProvider('demo', new DemoProvider());
    providerManager.setDefaultLLMProvider('demo');
    status = {
      name: 'demo',
      model: 'demo-mode',
      configured: false,
      demo: true,
      ready: true,
    };
    return;
  }

  status = {
    name: 'none',
    model: env.openaiModel,
    configured: false,
    demo: false,
    ready: false,
  };
}

export function getProviderStatus(): ProviderStatus {
  return { ...status };
}

export default registerDefaultProviders;
