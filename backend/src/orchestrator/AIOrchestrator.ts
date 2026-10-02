import { env } from '../config/env.js';
import { prisma } from '../db/client.js';
import providerManager from '../providers/interfaces.js';
import registerDefaultProviders from '../providers/index.js';

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
  private tools: Map<string, any> = new Map();
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

  private async _getLLM() {
    const llm = providerManager.getLLMProvider('openai');
    if (!llm) {
      return {
        generateText: async (prompt: string, _options?: any) => ({
          text: `Demo generated output for: ${prompt.slice(0, 120)}`,
          tokensUsed: 0,
          model: 'demo-mode',
          finishReason: 'demo',
        }),
      };
    }
    return llm;
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
        provider: 'mock',
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
      });

      if (isWorker) {
        await prisma.job.update({
          where: { id: jobId },
          data: {
            status: 'completed',
            output: JSON.stringify(result),
            progress: 100,
            error: null,
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
    const llm = await this._getLLM();
    const result = await llm.generateText(
      `Create high-converting marketing content for: ${input.topic}. Format: ${input.type || 'content'}`,
      {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1000,
        systemPrompt: 'You are a marketing copywriter for a growth-focused ecommerce brand.',
      },
    );

    return {
      content: result.text,
      type: input.type || 'content',
      model: result.model,
    };
  }

  private async _generateScript(input: any): Promise<any> {
    const llm = await this._getLLM();
    const result = await llm.generateText(
      `Write a short video script for: ${input.topic} with a ${input.platform || 'instagram'} platform format.`,
      {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1200,
        systemPrompt: 'You are a video scriptwriter for social campaigns.',
      },
    );

    return {
      script: result.text,
      platform: input.platform || 'instagram',
    };
  }

  private async _generateCaptions(input: any): Promise<any> {
    const llm = await this._getLLM();
    const result = await llm.generateText(
      'Generate 5 short social captions with CTA and hooks.',
      {
        model: 'gpt-4o-mini',
        temperature: 0.8,
        maxTokens: 700,
      },
    );

    return {
      captions: result.text.split(/\n+/).filter(Boolean),
    };
  }

  private async _analyzeContent(input: any): Promise<any> {
    const llm = await this._getLLM();
    const result = await llm.generateText(
      `Analyze this content for readability, conversion, and engagement: ${input.contentId || 'content'}`,
    );

    return {
      readabilityScore: 85,
      engagementScore: 80,
      summary: result.text,
    };
  }

  private async _createCampaign(input: any): Promise<any> {
    const llm = await this._getLLM();
    const result = await llm.generateText(
      `Create a campaign brief for: ${input.description}`,
      {
        model: 'gpt-4o-mini',
        maxTokens: 800,
      },
    );

    return {
      campaignBrief: result.text,
      status: 'draft',
    };
  }

  private async _research(input: any): Promise<any> {
    return {
      sources: [
        { title: 'Source 1', url: 'https://example.com', summary: 'Summary 1' },
      ],
      insights: ['Research insight generated'],
    };
  }

  private async _generateImages(input: any): Promise<any> {
    return {
      images: Array(input.quantity || 3).fill(null).map((_, i) => ({
        id: `image_${i + 1}`,
        url: `https://placehold.co/1080x1080?text=Scene+${i + 1}`,
      })),
    };
  }

  private async _generateVoice(input: any): Promise<any> {
    return {
      audioUrl: 'https://example.com/audio.mp3',
      duration: 120,
    };
  }

  private async _renderVideo(input: any): Promise<any> {
    return {
      videoId: `video_${Date.now()}`,
      status: 'rendering',
      estimatedTime: '5 minutes',
    };
  }
}

export default new AIOrchestrator();

