import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // --- LLM / OpenAI ---
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().min(1).default('gpt-4o-mini'),
  OPENAI_BASE_URL: z.string().optional(),
  OPENAI_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  LLM_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  // Explicit opt-in for offline demos. Without a key and without this flag,
  // generation endpoints fail loudly instead of returning fake content.
  DEMO_MODE: z.enum(['true', 'false']).default('false'),

  // --- Worker ---
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
  WORKER_MAX_RETRIES: z.coerce.number().int().positive().default(3),
});

const rawEnv = envSchema.parse(process.env);

export const env = {
  nodeEnv: rawEnv.NODE_ENV,
  port: rawEnv.PORT,
  jwtSecret: rawEnv.JWT_SECRET,
  jwtExpiresIn: rawEnv.JWT_EXPIRES_IN,
  openaiApiKey: rawEnv.OPENAI_API_KEY,
  openaiModel: rawEnv.OPENAI_MODEL,
  openaiBaseUrl: rawEnv.OPENAI_BASE_URL,
  openaiTimeoutMs: rawEnv.OPENAI_TIMEOUT_MS,
  llmMaxRetries: rawEnv.LLM_MAX_RETRIES,
  demoMode: rawEnv.DEMO_MODE === 'true',
  llmConfigured: Boolean(rawEnv.OPENAI_API_KEY),
  workerPollIntervalMs: rawEnv.WORKER_POLL_INTERVAL_MS,
  workerMaxRetries: rawEnv.WORKER_MAX_RETRIES,
};
