// TTS Integration Types
export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
export type TTSModel = 'tts-1' | 'tts-1-hd';
export type AudioFormat = 'mp3' | 'opus' | 'aac' | 'flac';
export type ScriptTone = 'professional' | 'casual' | 'educational' | 'entertaining';

// TTS Request/Response Types
export interface TTSRequest {
  text: string;
  voice: TTSVoice;
  model: TTSModel;
  speed?: number; // 0.25 to 4.0
  responseFormat?: AudioFormat;
}

export interface TTSResponse {
  audioId: string;
  filePath: string;
  duration: number;
  size: number;
  format: string;
  metadata: TTSMetadata;
}

export interface TTSMetadata {
  originalText: string;
  voice: TTSVoice;
  model: TTSModel;
  speed: number;
  wordCount: number;
  estimatedTokens: number;
  createdAt: Date;
}

// Script Types
export interface Script {
  id: string;
  topic: string;
  content: string;
  wordCount: number;
  estimatedDuration: number;
  template: string;
  tone: ScriptTone;
  language: string;
  createdAt: Date;
}

export interface ScriptOptions {
  template?: string;
  maxWords?: number;
  tone?: ScriptTone;
  language?: 'vi' | 'en';
}

export interface ScriptTemplate {
  name: string;
  description: string;
  structure: string[];
  defaultTone: ScriptTone;
  estimatedWordsPerMinute: number;
}

// Audio File Management Types
export interface AudioFile {
  id: string;
  filename: string;
  filePath: string;
  duration: number;
  size: number;
  format: string;
  voice: TTSVoice;
  model: TTSModel;
  scriptId?: string;
  createdAt: Date;
  metadata: AudioMetadata;
}

export interface AudioMetadata {
  originalText: string;
  voice: TTSVoice;
  model: TTSModel;
  speed: number;
  wordCount: number;
  estimatedTokens: number;
}

export interface AudioFilter {
  voice?: TTSVoice;
  model?: TTSModel;
  createdAfter?: Date;
  createdBefore?: Date;
  scriptId?: string;
}

// Error Types
export enum TTSErrorCode {
  API_KEY_INVALID = 'TTS_API_KEY_INVALID',
  API_RATE_LIMIT = 'TTS_API_RATE_LIMIT',
  API_QUOTA_EXCEEDED = 'TTS_API_QUOTA_EXCEEDED',
  TEXT_TOO_LONG = 'TTS_TEXT_TOO_LONG',
  INVALID_VOICE = 'TTS_INVALID_VOICE',
  INVALID_MODEL = 'TTS_INVALID_MODEL',
  AUDIO_GENERATION_FAILED = 'TTS_AUDIO_GENERATION_FAILED',
  FILE_SAVE_FAILED = 'TTS_FILE_SAVE_FAILED',
  FILE_NOT_FOUND = 'TTS_FILE_NOT_FOUND',
  NETWORK_ERROR = 'TTS_NETWORK_ERROR',
  SCRIPT_GENERATION_FAILED = 'SCRIPT_GENERATION_FAILED',
  SCRIPT_VALIDATION_FAILED = 'SCRIPT_VALIDATION_FAILED'
}

export class TTSError extends Error {
  constructor(
    message: string,
    public code: TTSErrorCode,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TTSError';
  }
}

// Service Interfaces
export interface ITTSService {
  generateAudio(request: TTSRequest): Promise<TTSResponse>;
  listVoices(): Promise<TTSVoice[]>;
  validateApiKey(): Promise<boolean>;
  estimateTokens(text: string): number;
  estimateDuration(text: string, voice: TTSVoice): number;
}

export interface IScriptService {
  generateScript(topic: string, options?: ScriptOptions): Promise<Script>;
  validateScript(script: string): ValidationResult;
  getTemplates(): ScriptTemplate[];
  getTemplate(name: string): ScriptTemplate | undefined;
}

export interface IAudioManager {
  saveAudio(audioData: Buffer, metadata: AudioMetadata): Promise<string>;
  getAudio(audioId: string): Promise<AudioFile>;
  listAudios(filter?: AudioFilter): Promise<AudioFile[]>;
  deleteAudio(audioId: string): Promise<void>;
  cleanup(olderThan: Date): Promise<number>;
  getStorageInfo(): Promise<StorageInfo>;
}

// Configuration Types
export interface TTSConfig {
  openaiApiKey: string;
  defaultModel: TTSModel;
  defaultVoice: TTSVoice;
  defaultSpeed: number;
  defaultFormat: AudioFormat;
  maxTextLength: number;
  retryAttempts: number;
  timeoutMs: number;
  audioOutputDir: string;
  retentionHours: number;
  maxAudioFiles: number;
  autoCleanupEnabled: boolean;
  maxConcurrentRequests: number;
  rateLimitPerMinute: number;
}

// Utility Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  value: unknown;
  constraint: string;
  message: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
}

export interface StorageInfo {
  totalFiles: number;
  totalSize: number;
  availableSpace: number;
  oldestFile?: Date;
  newestFile?: Date;
}

// Render Integration Types
export interface RenderWithTTSRequest {
  composition: string;
  topic?: string;
  script?: string;
  voice?: TTSVoice;
  ttsModel?: TTSModel;
  parameters?: TTSRenderParameters;
}

export interface RenderWithTTSResponse {
  jobId: string;
  status: TTSRenderStatus;
  progress: number;
  composition: string;
  audioId?: string;
  scriptId?: string;
  outputPath?: string;
  startTime: Date;
  endTime?: Date;
  errorMessage?: string;
}

// Local definitions for render types
export interface TTSRenderParameters {
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames?: number;
  quality?: number;
  concurrency?: number;
  scale?: number;
}

export type TTSRenderStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
