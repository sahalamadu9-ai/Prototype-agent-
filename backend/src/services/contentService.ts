import { prisma } from '../db/client.js';
import orchestrator from '../orchestrator/AIOrchestrator.js';
import { getProviderStatus } from '../providers/index.js';

export const CONTENT_TYPES = ['research', 'strategy', 'ideas', 'scripts', 'captions'] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export interface ContentInput {
  topic: string;
  platform?: string;
  audience?: string;
  tone?: string;
  quantity?: number;
}

export interface ContentPromptSpec {
  title: string;
  systemPrompt: string;
  prompt: string;
  maxTokens: number;
  temperature: number;
}

export class ContentAccessError extends Error {
  readonly code = 'WORKSPACE_ACCESS_DENIED';

  constructor() {
    super('You are not a member of this workspace.');
    this.name = 'ContentAccessError';
  }
}

export function isContentType(value: string): value is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(value);
}

const BRAND_CONTEXT =
  'You are the content engine of Zapcart Agent, an AI workspace for ecommerce sellers. ' +
  'Be specific, practical and conversion-focused. Never invent statistics. ' +
  'Use short paragraphs or numbered lists, and write in the language of the brief.';

/** Deterministic prompt templates — exported so they can be unit tested. */
export function buildContentPrompt(type: ContentType, input: ContentInput): ContentPromptSpec {
  const base = {
    topic: input.topic.trim(),
    platform: input.platform || 'multi-channel',
    audience: input.audience || 'online shoppers',
    tone: input.tone || 'confident and friendly',
    quantity: input.quantity || 5,
  };

  switch (type) {
    case 'research':
      return {
        title: `Research · ${base.topic.slice(0, 60)}`,
        systemPrompt: BRAND_CONTEXT + ' You are a market and audience research analyst.',
        prompt:
          `Research brief for "${base.topic}". Target audience: ${base.audience}. ` +
          `Channel: ${base.platform}. ` +
          'Return 5 actionable market/audience insights, then 3 keyword or content-gap opportunities. ' +
          'Label the two sections clearly.',
        maxTokens: 900,
        temperature: 0.5,
      };
    case 'strategy':
      return {
        title: `Strategy · ${base.topic.slice(0, 60)}`,
        systemPrompt: BRAND_CONTEXT + ' You are a content strategist.',
        prompt:
          `Build a content strategy for "${base.topic}". Audience: ${base.audience}. ` +
          `Primary channel: ${base.platform}. ` +
          'Include: target audience definition, 4 content pillars, a 2-week cadence, and 3 measurable goals.',
        maxTokens: 1000,
        temperature: 0.6,
      };
    case 'ideas':
      return {
        title: `Ideas · ${base.topic.slice(0, 60)}`,
        systemPrompt: BRAND_CONTEXT + ' You are a creative director.',
        prompt:
          `Generate ${base.quantity} distinct content ideas for "${base.topic}" aimed at ${base.audience} on ${base.platform}. ` +
          'For each: a hook, a one-line angle, and 3 relevant hashtags. Tone: ' + base.tone + '.',
        maxTokens: 1100,
        temperature: 0.85,
      };
    case 'scripts':
      return {
        title: `Script · ${base.topic.slice(0, 60)}`,
        systemPrompt: BRAND_CONTEXT + ' You are a short-form video scriptwriter.',
        prompt:
          `Write a ${base.platform} video script about "${base.topic}" for ${base.audience}. ` +
          'Structure: 3-second hook, 3 beats, and a clear CTA. Include on-screen text suggestions. Tone: ' + base.tone + '.',
        maxTokens: 1200,
        temperature: 0.75,
      };
    case 'captions':
      return {
        title: `Captions · ${base.topic.slice(0, 60)}`,
        systemPrompt: BRAND_CONTEXT + ' You are a social copywriter.',
        prompt:
          `Write ${base.quantity} ${base.platform} captions for "${base.topic}" targeting ${base.audience}. ` +
          'Each caption needs a hook, 1-2 lines of body and a CTA. Put each caption on its own line. Tone: ' + base.tone + '.',
        maxTokens: 900,
        temperature: 0.8,
      };
  }
}

async function assertMembership(workspaceId: string, userId: string): Promise<void> {
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) {
    throw new ContentAccessError();
  }
}

async function resolveProjectId(
  workspaceId: string,
  userId: string,
  requestedProjectId?: string,
): Promise<string> {
  if (requestedProjectId) {
    const project = await prisma.project.findFirst({
      where: { id: requestedProjectId, workspaceId },
    });
    if (project) return project.id;
  }

  const existing = await prisma.project.findFirst({
    where: { workspaceId, name: 'AI Content Studio' },
  });
  if (existing) return existing.id;

  const created = await prisma.project.create({
    data: {
      workspaceId,
      userId,
      name: 'AI Content Studio',
      description: 'Auto-created by the Phase 2 content module.',
      type: 'content',
    },
  });
  return created.id;
}

export interface GeneratedContent {
  id: string;
  projectId: string;
  type: ContentType;
  title: string;
  content: string;
  status: string;
  platform: string | null;
  provider: string;
  model: string;
  tokensUsed: number;
  demo: boolean;
}

/**
 * Phase 2 core flow: validate access → build prompt → call the real LLM →
 * persist the result as a ContentItem draft → return generation metadata.
 */
export async function generateContent(params: {
  userId: string;
  workspaceId: string;
  type: ContentType;
  input: ContentInput;
  projectId?: string;
}): Promise<GeneratedContent> {
  const { userId, workspaceId, type, input } = params;

  await assertMembership(workspaceId, userId);

  const spec = buildContentPrompt(type, input);
  const result = await orchestrator.generate(spec.prompt, {
    systemPrompt: spec.systemPrompt,
    maxTokens: spec.maxTokens,
    temperature: spec.temperature,
  });

  const projectId = await resolveProjectId(workspaceId, userId, params.projectId);
  const item = await prisma.contentItem.create({
    data: {
      projectId,
      title: spec.title,
      type,
      content: result.text,
      status: 'draft',
      platform: input.platform || null,
    },
  });

  const provider = getProviderStatus();

  return {
    id: item.id,
    projectId: item.projectId,
    type,
    title: item.title,
    content: item.content,
    status: item.status,
    platform: item.platform,
    provider: provider.name,
    model: result.model,
    tokensUsed: result.tokensUsed,
    demo: provider.demo,
  };
}

export async function listContent(workspaceId: string, userId: string) {
  await assertMembership(workspaceId, userId);

  return prisma.contentItem.findMany({
    where: { project: { workspaceId } },
    orderBy: { createdAt: 'desc' },
    take: 25,
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      platform: true,
      content: true,
      createdAt: true,
    },
  });
}
