/**
 * Provider Abstraction Layer
 * Defines interfaces for all external AI and media providers
 * Allows switching providers without changing core logic
 */

/**
 * Image Provider Interface
 * Abstracts image generation and editing across providers
 */
export interface IImageProvider {
  name: string;
  generateImage(prompt: string, options?: ImageGenerationOptions): Promise<ImageResult>;
  editImage(imageUrl: string, prompt: string): Promise<ImageResult>;
  getAvailableModels(): Promise<string[]>;
}

export interface ImageGenerationOptions {
  width?: number;
  height?: number;
  model?: string;
  quality?: 'standard' | 'hd';
  style?: string;
  quantity?: number;
}

export interface ImageResult {
  url: string;
  width: number;
  height: number;
  size: number;
  mimeType: string;
  metadata?: Record<string, any>;
}

/**
 * Voice Provider Interface
 * Abstracts text-to-speech and voice generation
 */
export interface IVoiceProvider {
  name: string;
  generateSpeech(text: string, options?: VoiceGenerationOptions): Promise<AudioResult>;
  listVoices(): Promise<Voice[]>;
  getLanguages(): Promise<string[]>;
}

export interface VoiceGenerationOptions {
  voiceId?: string;
  languageCode?: string;
  speed?: number; // 0.5 - 2.0
  pitch?: number; // -20 - 20
  volume?: number; // 0 - 100
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender?: 'male' | 'female' | 'neutral';
  accent?: string;
}

export interface AudioResult {
  url: string;
  duration: number; // in seconds
  format: string;
  sampleRate?: number;
  size: number;
}

/**
 * Video Provider Interface
 * Abstracts video generation and processing
 */
export interface IVideoProvider {
  name: string;
  generateVideo(input: VideoGenerationInput): Promise<VideoResult>;
  getStatus(jobId: string): Promise<VideoJobStatus>;
  cancel(jobId: string): Promise<boolean>;
}

export interface VideoGenerationInput {
  type: 'image_sequence' | 'talking_head' | 'animation';
  images?: string[];
  script?: string;
  audio?: string;
  captions?: Caption[];
  backgroundMusic?: string;
  duration?: number;
  resolution?: '720p' | '1080p' | '4k';
  format?: string;
  metadata?: Record<string, any>;
}

export interface Caption {
  text: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  position?: 'top' | 'center' | 'bottom';
}

export interface VideoResult {
  jobId: string;
  url?: string;
  status: 'processing' | 'completed' | 'failed';
  estimatedTime?: number;
  error?: string;
}

export interface VideoJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  url?: string;
  error?: string;
}

/**
 * Research Provider Interface
 * Abstracts web search and research capabilities
 */
export interface IResearchProvider {
  name: string;
  search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  summarize(content: string): Promise<string>;
  extractKeywords(text: string): Promise<string[]>;
}

export interface SearchOptions {
  maxResults?: number;
  language?: string;
  region?: string;
  safeSearch?: boolean;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  publishedDate?: string;
  relevanceScore?: number;
}

/**
 * LLM Provider Interface
 * Abstracts language model interactions
 */
export interface ILLMProvider {
  name: string;
  generateText(prompt: string, options?: LLMOptions): Promise<LLMResult>;
  chat(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResult>;
  countTokens(text: string): Promise<number>;
}

export interface LLMOptions {
  model?: string;
  temperature?: number; // 0.0 - 1.0
  maxTokens?: number;
  topP?: number;
  topK?: number;
  systemPrompt?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResult {
  text: string;
  tokensUsed: number;
  model: string;
  finishReason: string;
}

/**
 * Provider Manager
 * Selects and manages providers based on configuration
 */
export class ProviderManager {
  private imageProviders: Map<string, IImageProvider> = new Map();
  private voiceProviders: Map<string, IVoiceProvider> = new Map();
  private videoProviders: Map<string, IVideoProvider> = new Map();
  private researchProviders: Map<string, IResearchProvider> = new Map();
  private llmProviders: Map<string, ILLMProvider> = new Map();

  private defaultImageProvider: string = 'dalle';
  private defaultVoiceProvider: string = 'elevenlabs';
  private defaultVideoProvider: string = 'runway';
  private defaultResearchProvider: string = 'google';
  private defaultLLMProvider: string = 'openai';

  constructor() {
    this._registerDefaultProviders();
  }

  /**
   * Register default providers
   */
  private _registerDefaultProviders() {
    // Image providers will be registered
    // Voice providers will be registered
    // Video providers will be registered
    // Research providers will be registered
    // LLM providers will be registered
  }

  /**
   * Register custom providers
   */
  registerImageProvider(name: string, provider: IImageProvider): void {
    this.imageProviders.set(name, provider);
  }

  registerVoiceProvider(name: string, provider: IVoiceProvider): void {
    this.voiceProviders.set(name, provider);
  }

  registerVideoProvider(name: string, provider: IVideoProvider): void {
    this.videoProviders.set(name, provider);
  }

  registerResearchProvider(name: string, provider: IResearchProvider): void {
    this.researchProviders.set(name, provider);
  }

  registerLLMProvider(name: string, provider: ILLMProvider): void {
    this.llmProviders.set(name, provider);
  }

  /**
   * Get provider by name or use default
   */
  getImageProvider(name?: string): IImageProvider | null {
    return this.imageProviders.get(name || this.defaultImageProvider) || null;
  }

  getVoiceProvider(name?: string): IVoiceProvider | null {
    return this.voiceProviders.get(name || this.defaultVoiceProvider) || null;
  }

  getVideoProvider(name?: string): IVideoProvider | null {
    return this.videoProviders.get(name || this.defaultVideoProvider) || null;
  }

  getResearchProvider(name?: string): IResearchProvider | null {
    return this.researchProviders.get(name || this.defaultResearchProvider) || null;
  }

  getLLMProvider(name?: string): ILLMProvider | null {
    return this.llmProviders.get(name || this.defaultLLMProvider) || null;
  }

  /**
   * Set default providers
   */
  setDefaultImageProvider(name: string): void {
    if (this.imageProviders.has(name)) {
      this.defaultImageProvider = name;
    }
  }

  setDefaultVoiceProvider(name: string): void {
    if (this.voiceProviders.has(name)) {
      this.defaultVoiceProvider = name;
    }
  }

  setDefaultVideoProvider(name: string): void {
    if (this.videoProviders.has(name)) {
      this.defaultVideoProvider = name;
    }
  }

  setDefaultResearchProvider(name: string): void {
    if (this.researchProviders.has(name)) {
      this.defaultResearchProvider = name;
    }
  }

  setDefaultLLMProvider(name: string): void {
    if (this.llmProviders.has(name)) {
      this.defaultLLMProvider = name;
    }
  }

  /**
   * List all available providers
   */
  listImageProviders(): string[] {
    return Array.from(this.imageProviders.keys());
  }

  listVoiceProviders(): string[] {
    return Array.from(this.voiceProviders.keys());
  }

  listVideoProviders(): string[] {
    return Array.from(this.videoProviders.keys());
  }

  listResearchProviders(): string[] {
    return Array.from(this.researchProviders.keys());
  }

  listLLMProviders(): string[] {
    return Array.from(this.llmProviders.keys());
  }
}

export default new ProviderManager();
