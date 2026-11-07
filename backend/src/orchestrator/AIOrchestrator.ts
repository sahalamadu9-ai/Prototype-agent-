import { prisma } from '../db/client.js';
import providerManager from '../providers/interfaces.js';
import type { ILLMProvider, LLMOptions, LLMResult } from '../providers/interfaces.js';
import registerDefaultProviders, { getProviderStatus } from '../providers/index.js';
import { LLMNotConfiguredError } from '../providers/OpenAIProvider.js';

export interface OrchestratorRequest {
  userId: string;
  workspaceId: string;
  instruction: string;
  context?: Record<string, any>;
  requiresApproval?: boolean;
}

export interface OrchestratorResponse {
  taskId: string;
  status: 'queued' | 'processing' | 'awaiting_approval' | 'completed' | 'failed';
  plan: WorkflowStep[];
  result?: any;
  error?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  tool: string;
  input: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: any;
  requiresApproval: boolean;
}

export class AIOrchestrator {
  private tools: Map<string, (input: any) => Promise<any>> = new Map();
  private workflows: Map<string, WorkflowStep[]> = new Map();
  private brandMemory: Map<string, any> = new Map();

  constructor() {
    registerDefaultProviders();
    this._initializeTools();
  }

  private _initializeTools() {
    this.tools.set('generate_content', this._generateContent.bind(this));
    this.tools.set('generate_script', this._generateScript.bind(this));
    this.tools.set('generate_captions', this._generateCaptions.bind(this));
    this.tools.set('generate_images', this._generateImages.bind(this));
    this.tools.set('generate_voice', this._generateVoice.bind(this));
    this.tools.set('render_video', this._renderVideo.bind(this));
    this.tools.set('research', this._research.bind(this));
    this.tools.set('analyze_content', this._analyzeContent.bind(this));
    this.tools.set('create_campaign', this._createCampaign.bind(this));
  }

  private _classifyTask(instruction: string): string {
    const text = instruction.toLowerCase();

    if (text.includes('script') || text.includes('video')) return 'generate_script';
    if (text.includes('caption') || text.includes('social')) return 'generate_captions';
    if (text.includes('campaign') || text.includes('launch')) return 'create_campaign';
    if (text.includes('research') || text.includes('find')) return 'research';
    if (text.includes('image') || text.includes('visual')) return 'generate_images';
    if (text.includes('voice') || text.includes('audio')) return 'generate_voice';
    if (text.includes('analyze') || text.includes('audit')) return 'analyze_content';

    return 'generate_content';
  }

  /**
   * Always resolve the registered default provider. There is no silent mock
   * fallback any more: without OPENAI_API_KEY (or DEMO_MODE=true) generation
   * throws LLMNotConfiguredError so misconfiguration is visible immediately.
   */
  private _getLLM(): ILLMProvider {
    const llm = providerManager.getLLMProvider();
    if (!llm) {
      throw new LLMNotConfiguredError();
    }
    return llm;
  }

  /** Public generation entry point used by the Phase 2 content service. */
  async generate(prompt: string, options: LLMOptions = {}): Promise<LLMResult> {
    return this._getLLM().generateText(prompt, options);
  }

  /** Runtime provider information for /health and /api/orchestrator/status. */
  get providerStatus() {
    return getProviderStatus();
  }

  async process(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const toolName = this._classifyTask(request.instruction);
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(`Unsupported task type: ${toolName}`);
    }

    const job = await prisma.job.create({
      data: {
        type: toolName,
        workspaceId: request.workspaceId,
        status: 'queued',
        input: JSON.stringify({
          userId: request.userId,
          instruction: request.instruction,
          context: request.context || {},
          requiresApproval: request.requiresApproval || false,
        }),
        progress: 0,
        attempts: 0,
        provider: this.providerStatus.name,
      },
    });

    const plan: WorkflowStep[] = [{
      id: `step-${job.id}`,
      name: toolName,
      tool: toolName,
      input: { instruction: request.instruction, context: request.context || {} },
      status: 'pending',
      requiresApproval: Boolean(request.requiresApproval),
    }];

    this.workflows.set(job.id, plan);

    return {
      taskId: job.id,
      status: 'queued',
      plan,
    };
  }

  async execute(jobId: string, isWorker = false): Promise<{ status: 'completed' | 'failed'; result?: any; error?: string }> {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return { status: 'failed', error: 'Job not found' };
    }

    const toolName = job.type;
    const tool = this.tools.get(toolName);
    if (!tool) {
      return { status: 'failed', error: `Unknown job type: ${toolName}` };
    }

    const payload = JSON.parse(job.input || '{}');

    try {
      const result = await tool({
        topic: payload.instruction,
        description: payload.instruction,
        platform: payload.context?.platform || 'instagram',
        quantity: payload.context?.quantity || 3,
        type: payload.context?.type || 'content',
        contentId: payload.context?.contentId,
        audience: payload.context?.audience,
        tone: payload.context?.tone,
      });

      if (isWorker) {
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: 'completed',
            output: JSON.stringify(result),
            progress: 100,
            error: null,
            provider: this.providerStatus.name,
          },
        });
      }

      return { status: 'completed', result };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (isWorker) {
        const attempts = job.attempts + 1;
        const shouldRetry = attempts < 3;

        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: shouldRetry ? 'queued' : 'failed',
            attempts,
            error: errorMessage,
            progress: shouldRetry ? 20 : 50,
          },
        });
      }

      return { status: 'failed', error: errorMessage };
    }
  }

  private async _generateContent(input: any): Promise<any> {
    const result = await this.generate(
      `Create high-converting marketing content for: ${input.topic}. Format: ${input.type || 'content'}. Tone: ${input.tone || 'professional'}.`,
      {
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: 'You are a marketing copywriter for a growth-focused ecommerce brand.',
      },
    );

    return {
      content: result.text,
      type: input.type || 'content',
      model: result.model,
      tokensUsed: result.tokensUsed,
    };
  }

  private async _generateScript(input: any): Promise<any> {
    const result = await this.generate(
      `Write a short video script for: ${input.topic} with a ${input.platform || 'instagram'} platform format.`,
      {
        temperature: 0.7,
        maxTokens: 1200,
        systemPrompt: 'You are a video scriptwriter for social campaigns.',
      },
    );

    return {
      script: result.text,
      platform: input.platform || 'instagram',
      model: result.model,
      tokensUsed: result.tokensUsed,
    };
  }

  private async _generateCaptions(input: any): Promise<any> {
    const result = await this.generate(
      `Generate ${input.quantity || 5} short social captions with CTA and hooks for: ${input.topic}.`,
      {
        temperature: 0.8,
        maxTokens: 700,
      },
    );

    return {
      captions: result.text.split(/\n+/).filter(Boolean),
      model: result.model,
      tokensUsed: result.tokensUsed,
    };
  }

  private async _analyzeContent(input: any): Promise<any> {
    const result = await this.generate(
      `Analyze this content for readability, conversion, and engagement: ${input.contentId || input.topic}`,
      { systemPrompt: 'You are a content performance analyst.', maxTokens: 700 },
    );

    return {
      summary: result.text,
      model: result.model,
      tokensUsed: result.tokensUsed,
    };
  }

  private async _createCampaign(input: any): Promise<any> {
    const result = await this.generate(
      `Create a campaign brief for: ${input.description}`,
      { maxTokens: 800, systemPrompt: 'You are a growth marketing strategist.' },
    );

    return {
      campaignBrief: result.text,
      status: 'draft',
      model: result.model,
      tokensUsed: result.tokensUsed,
    };
  }

  /** Phase 2 research: now backed by the real LLM instead of hard-coded data. */
  private async _research(input: any): Promise<any> {
    const result = await this.generate(
      `Produce a market research brief for: ${input.topic}. Audience: ${input.audience || 'ecommerce shoppers'}. ` +
        'Return 5 concise, actionable insights followed by 3 keyword opportunities.',
      { systemPrompt: 'You are a market research analyst for ecommerce brands.', maxTokens: 800 },
    );

    return {
      insights: result.text.split(/\n+/).filter(Boolean),
      model: result.model,
      tokensUsed: result.tokensUsed,
    };
  }

  // Placeholder tools for Phase 3+ — intentionally explicit so a caller can
  // never mistake them for a real image/voice/video generation result.
  private async _generateImages(_input: any): Promise<any> {
    return {
      notImplemented: true,
      mode: 'stub',
      message: 'Image provider is not wired yet (Phase 3: Creative Asset Studio).',
      images: [],
    };
  }

  private async _generateVoice(_input: any): Promise<any> {
    return {
      notImplemented: true,
      mode: 'stub',
      message: 'Voice provider is not wired yet (Phase 4: Video Maker / Audio).',
      audioUrl: null,
    };
  }

  private async _renderVideo(_input: any): Promise<any> {
    return {
      notImplemented: true,
      mode: 'stub',
      message: 'Video rendering is not wired yet (Phase 4: Rendering).',
      status: 'not_started',
    };
  }
}

export default new AIOrchestrator();
