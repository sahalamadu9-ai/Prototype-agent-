import { describe, expect, it, vi } from 'vitest';

vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('JWT_SECRET', 'test-secret-key-12345');
vi.stubEnv('OPENAI_API_KEY', '');
vi.stubEnv('DEMO_MODE', 'false');

vi.mock('../db/client.js', () => ({
  prisma: {
    workspaceMember: { findUnique: vi.fn() },
    project: { findFirst: vi.fn(), create: vi.fn() },
    contentItem: { create: vi.fn(), findMany: vi.fn() },
    job: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn() },
  },
}));

import {
  CONTENT_TYPES,
  buildContentPrompt,
  isContentType,
} from '../services/contentService.js';
import { DemoProvider } from '../providers/DemoProvider.js';
import { getProviderStatus, registerDefaultProviders } from '../providers/index.js';

describe('Phase 2 content types', () => {
  it('recognises exactly the five Phase 2 content types', () => {
    expect(CONTENT_TYPES).toEqual(['research', 'strategy', 'ideas', 'scripts', 'captions']);
    expect(isContentType('ideas')).toBe(true);
    expect(isContentType('thumbnails')).toBe(false);
  });

  it('builds a usable prompt for every type', () => {
    for (const type of CONTENT_TYPES) {
      const spec = buildContentPrompt(type, { topic: '拉各斯市场的保温水瓶', platform: 'instagram' });
      expect(spec.title).toContain(' · ');
      expect(spec.title.length).toBeGreaterThan(type.length);
      expect(spec.prompt).toContain('拉各斯市场的保温水瓶');
      expect(spec.prompt).toContain('instagram');
      expect(spec.systemPrompt.length).toBeGreaterThan(20);
      expect(spec.maxTokens).toBeGreaterThan(0);
      expect(spec.temperature).toBeGreaterThanOrEqual(0);
      expect(spec.temperature).toBeLessThanOrEqual(1);
    }
  });

  it('passes quantity and tone into the prompt', () => {
    const spec = buildContentPrompt('captions', {
      topic: 'new arrival',
      quantity: 7,
      tone: '俏皮',
      audience: '年轻妈妈',
    });
    expect(spec.prompt).toContain('7');
    expect(spec.prompt).toContain('俏皮');
    expect(spec.prompt).toContain('年轻妈妈');
  });
});

describe('LLM provider wiring', () => {
  it('reports not-ready when no key and demo mode are absent', () => {
    registerDefaultProviders();
    const status = getProviderStatus();
    expect(status.ready).toBe(false);
    expect(status.configured).toBe(false);
    expect(status.name).toBe('none');
  });

  it('labels demo output explicitly', async () => {
    const provider = new DemoProvider();
    const result = await provider.generateText('hello world');
    expect(result.text).toContain('[DEMO MODE');
    expect(result.model).toBe('demo-mode');
    expect(result.text).not.toContain('Demo generated output for');
  });
});
