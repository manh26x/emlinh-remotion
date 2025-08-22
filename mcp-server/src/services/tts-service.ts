import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { config } from '../utils/config.js';
import {
  ITTSService,
  TTSRequest,
  TTSResponse,
  TTSVoice,
  TTSModel,
  TTSError,
  TTSErrorCode,
  TTSMetadata
} from '../models/tts-types.js';

export class TTSService implements ITTSService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openai.com/v1';
  private readonly maxRetries = 3;
  private readonly timeoutMs = 30000;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      throw new TTSError(
        'OpenAI API key is required',
        TTSErrorCode.API_KEY_INVALID
      );
    }
  }

  async generateAudio(request: TTSRequest): Promise<TTSResponse> {
    try {
      logger.info('Generating TTS audio', {
        textLength: request.text.length,
        voice: request.voice,
        model: request.model
      });

      // Validate request
      this.validateRequest(request);

      // Generate audio via OpenAI API
      const audioBuffer = await this.callOpenAITTS(request);

      // Save audio file
      const audioId = uuidv4();
      const filename = `${audioId}.mp3`;
      const audioOutputDir = this.getAudioOutputDir();
      const filePath = path.join(audioOutputDir, filename);

      // Ensure directory exists
      await fs.mkdir(audioOutputDir, { recursive: true });

      // Write audio file
      await fs.writeFile(filePath, audioBuffer);

      // Create metadata
      const metadata: TTSMetadata = {
        originalText: request.text,
        voice: request.voice,
        model: request.model,
        speed: request.speed || 1.0,
        wordCount: this.countWords(request.text),
        estimatedTokens: this.estimateTokens(request.text),
        createdAt: new Date()
      };

      const response: TTSResponse = {
        audioId,
        filePath: path.relative(process.cwd(), filePath),
        duration: this.estimateDuration(request.text, request.voice),
        size: audioBuffer.length,
        format: 'mp3',
        metadata
      };

      logger.info('TTS audio generated successfully', {
        audioId,
        duration: response.duration,
        size: response.size
      });

      return response;

    } catch (error) {
      logger.logError('TTS Audio Generation', error as Error);
      
      if (error instanceof TTSError) {
        throw error;
      }

      throw new TTSError(
        'Audio generation failed',
        TTSErrorCode.AUDIO_GENERATION_FAILED,
        { originalError: (error as Error).message }
      );
    }
  }

  async listVoices(): Promise<TTSVoice[]> {
    return ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return response.status === 200;
    } catch (error) {
      logger.logError('API Key Validation', error as Error);
      return false;
    }
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  estimateDuration(text: string, voice: TTSVoice): number {
    const wordCount = this.countWords(text);
    // Average speaking rate varies by voice
    const wordsPerMinute = this.getWordsPerMinute(voice);
    return Math.ceil((wordCount / wordsPerMinute) * 60); // seconds
  }

  private async callOpenAITTS(request: TTSRequest): Promise<Buffer> {
    const payload = {
      model: request.model,
      input: request.text,
      voice: request.voice,
      response_format: request.responseFormat || 'mp3',
      speed: request.speed || 1.0
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info(`TTS API call attempt ${attempt}`, { 
          model: request.model,
          voice: request.voice 
        });

        const response = await axios.post(
          `${this.baseUrl}/audio/speech`,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            responseType: 'arraybuffer',
            timeout: this.timeoutMs
          }
        );

        if (response.status === 200) {
          return Buffer.from(response.data);
        }

        throw new Error(`API returned status ${response.status}`);

      } catch (error) {
        lastError = error as Error;
        
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          
          if (status === 401) {
            throw new TTSError(
              'Invalid API key',
              TTSErrorCode.API_KEY_INVALID
            );
          }
          
          if (status === 429) {
            const retryAfter = error.response?.headers['retry-after'];
            throw new TTSError(
              'Rate limit exceeded',
              TTSErrorCode.API_RATE_LIMIT,
              { retryAfter: retryAfter ? parseInt(retryAfter) : 60 }
            );
          }

          if (status === 413) {
            throw new TTSError(
              'Text too long for TTS API',
              TTSErrorCode.TEXT_TOO_LONG,
              { textLength: request.text.length, maxLength: 4096 }
            );
          }
        }

        // Wait before retry (exponential backoff)
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.info(`Retrying TTS API call in ${delay}ms`, { attempt });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new TTSError(
      'TTS API call failed after retries',
      TTSErrorCode.NETWORK_ERROR,
      { attempts: this.maxRetries, lastError: lastError?.message }
    );
  }

  private validateRequest(request: TTSRequest): void {
    if (!request.text || request.text.trim().length === 0) {
      throw new TTSError(
        'Text is required',
        TTSErrorCode.TEXT_TOO_LONG
      );
    }

    if (request.text.length > 4096) {
      throw new TTSError(
        'Text exceeds maximum length of 4096 characters',
        TTSErrorCode.TEXT_TOO_LONG,
        { textLength: request.text.length, maxLength: 4096 }
      );
    }

    const validVoices: TTSVoice[] = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    if (!validVoices.includes(request.voice)) {
      throw new TTSError(
        `Invalid voice: ${request.voice}`,
        TTSErrorCode.INVALID_VOICE,
        { voice: request.voice, validVoices }
      );
    }

    const validModels: TTSModel[] = ['tts-1', 'tts-1-hd'];
    if (!validModels.includes(request.model)) {
      throw new TTSError(
        `Invalid model: ${request.model}`,
        TTSErrorCode.INVALID_MODEL,
        { model: request.model, validModels }
      );
    }

    if (request.speed && (request.speed < 0.25 || request.speed > 4.0)) {
      throw new TTSError(
        'Speed must be between 0.25 and 4.0',
        TTSErrorCode.AUDIO_GENERATION_FAILED,
        { speed: request.speed, validRange: [0.25, 4.0] }
      );
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private getWordsPerMinute(voice: TTSVoice): number {
    // Different voices have different speaking rates
    const rates: Record<TTSVoice, number> = {
      'alloy': 160,
      'echo': 150,
      'fable': 170,
      'onyx': 140,
      'nova': 180,
      'shimmer': 165
    };
    return rates[voice] || 160;
  }

  private getAudioOutputDir(): string {
    return process.env.AUDIO_OUTPUT_DIR || path.join(process.cwd(), '../public/audios');
  }
}
