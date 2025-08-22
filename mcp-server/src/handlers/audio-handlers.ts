import { CallToolResponse } from '../models/types.js';
import { TTSService } from '../services/tts-service.js';
import { AudioManager } from '../services/audio-manager.js';
import { ScriptService } from '../services/script-service.js';
import { AudioConversionService } from '../services/audio-conversion-service.js';
import { RhubarbService } from '../services/rhubarb-service.js';
import { LipSyncManager } from '../services/lipsync-manager.js';
import { promises as fs } from 'fs';
import { logger } from '../utils/logger.js';
import {
  TTSRequest,
  TTSVoice,
  TTSModel,
  AudioFilter,
  TTSError,
  TTSErrorCode
} from '../models/tts-types.js';
import type { RenderHandlers } from './render-handlers.js';

import path from 'path';

export class AudioHandlers {
  private ttsService: TTSService;
  private audioManager: AudioManager;
  private scriptService: ScriptService;
  private audioConversionService: AudioConversionService;
  private rhubarbService: RhubarbService;
  private lipSyncManager: LipSyncManager;
  private renderHandlers: RenderHandlers | null;

  constructor(renderHandlers?: RenderHandlers) {
    this.ttsService = new TTSService();
    this.audioManager = new AudioManager();
    this.scriptService = new ScriptService();
    this.audioConversionService = AudioConversionService.getInstance();
    this.rhubarbService = RhubarbService.getInstance();
    this.lipSyncManager = LipSyncManager.getInstance();
    this.renderHandlers = renderHandlers ?? null;
  }

  private safeParseJSON(text: string): any {
    try {
      return JSON.parse(text);
    } catch (error) {
      logger.warn('Failed to parse JSON response, returning raw text', { text, error });
      return { rawText: text };
    }
  }

  async handleGenerateTTSAudio(args: any): Promise<CallToolResponse> {
    try {
      logger.info('Handling generate_tts_audio request', { args });

      // Validate and prepare request
      const request: TTSRequest = {
        text: args.text,
        voice: (args.voice as TTSVoice) || 'alloy',
        model: (args.model as TTSModel) || 'tts-1',
        speed: args.speed || 1.0,
        responseFormat: args.format || 'wav'
      };

      // Generate audio
      const response = await this.ttsService.generateAudio(request);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            audioId: response.audioId,
            filePath: response.filePath,
            duration: response.duration,
            size: response.size,
            format: response.format,
            voice: response.metadata.voice,
            model: response.metadata.model,
            wordCount: response.metadata.wordCount,
            estimatedTokens: response.metadata.estimatedTokens,
            createdAt: response.metadata.createdAt.toISOString()
          }, null, 2)
        }]
      };

    } catch (error) {
      logger.logError('Generate TTS Audio Failed', error as Error);
      
      if (error instanceof TTSError) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                code: error.code,
                message: error.message,
                details: error.details
              }
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'UNKNOWN_ERROR',
              message: 'An unexpected error occurred',
              details: { originalError: (error as Error).message }
            }
          }, null, 2)
        }]
      };
    }
  }

  async handleListAudioFiles(args: any): Promise<CallToolResponse> {
    try {
      logger.info('Handling list_audio_files request', { args });

      const limit = args.limit || 50;
      const filter: AudioFilter = {};

      if (args.filter) {
        if (args.filter.voice) filter.voice = args.filter.voice as TTSVoice;
        if (args.filter.model) filter.model = args.filter.model as TTSModel;
        if (args.filter.createdAfter) filter.createdAfter = new Date(args.filter.createdAfter);
        if (args.filter.createdBefore) filter.createdBefore = new Date(args.filter.createdBefore);
        if (args.filter.scriptId) filter.scriptId = args.filter.scriptId;
      }

      const audioFiles = await this.audioManager.listAudios(filter);
      const limitedFiles = audioFiles.slice(0, limit);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            files: limitedFiles.map(file => ({
              id: file.id,
              filename: file.filename,
              filePath: file.filePath,
              duration: file.duration,
              size: file.size,
              format: file.format,
              voice: file.voice,
              model: file.model,
              scriptId: file.scriptId,
              createdAt: file.createdAt,
              metadata: {
                originalText: file.metadata.originalText.substring(0, 100) + '...', // Truncate for display
                wordCount: file.metadata.wordCount,
                estimatedTokens: file.metadata.estimatedTokens
              }
            })),
            total: audioFiles.length,
            hasMore: audioFiles.length > limit
          }, null, 2)
        }]
      };

    } catch (error) {
      logger.logError('List Audio Files Failed', error as Error);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'LIST_FAILED',
              message: 'Failed to list audio files',
              details: { originalError: (error as Error).message }
            }
          }, null, 2)
        }]
      };
    }
  }

  async handleDeleteAudioFile(args: any): Promise<CallToolResponse> {
    try {
      logger.info('Handling delete_audio_file request', { args });

      if (!args.audioId) {
        throw new TTSError(
          'Audio ID is required',
          TTSErrorCode.FILE_NOT_FOUND
        );
      }

      await this.audioManager.deleteAudio(args.audioId);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            audioId: args.audioId,
            message: 'Audio file deleted successfully'
          }, null, 2)
        }]
      };

    } catch (error) {
      logger.logError('Delete Audio File Failed', error as Error);
      
      if (error instanceof TTSError) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                code: error.code,
                message: error.message,
                details: error.details
              }
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'DELETE_FAILED',
              message: 'Failed to delete audio file',
              details: { originalError: (error as Error).message }
            }
          }, null, 2)
        }]
      };
    }
  }

  async handleCleanupAudioFiles(args: any): Promise<CallToolResponse> {
    try {
      logger.info('Handling cleanup_audio_files request', { args });

      const olderThanHours = args.olderThanHours || 24;
      const dryRun = args.dryRun || false;

      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);

      let deletedCount = 0;
      let deletedFiles: string[] = [];
      let freedSpace = 0;

      if (dryRun) {
        // Preview mode - just list what would be deleted
        const audioFiles = await this.audioManager.listAudios();
        const filesToDelete = audioFiles.filter(file => 
          new Date(file.createdAt) < cutoffDate
        );

        deletedFiles = filesToDelete.map(file => file.id);
        freedSpace = filesToDelete.reduce((sum, file) => sum + file.size, 0);
        deletedCount = filesToDelete.length;
      } else {
        // Actually delete files
        deletedCount = await this.audioManager.cleanup(cutoffDate);
        
        // Get remaining files count
        const remainingFiles = await this.audioManager.listAudios();
        const storageInfo = await this.audioManager.getStorageInfo();
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              deletedCount,
              freedSpace: storageInfo.availableSpace,
              remainingFiles: remainingFiles.length,
              cutoffDate: cutoffDate.toISOString()
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            dryRun,
            deletedCount,
            freedSpace,
            deletedFiles: deletedFiles.slice(0, 10), // Show first 10
            cutoffDate: cutoffDate.toISOString()
          }, null, 2)
        }]
      };

    } catch (error) {
      logger.logError('Cleanup Audio Files Failed', error as Error);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'CLEANUP_FAILED',
              message: 'Failed to cleanup audio files',
              details: { originalError: (error as Error).message }
            }
          }, null, 2)
        }]
      };
    }
  }

  async handleGenerateScript(args: any): Promise<CallToolResponse> {
    try {
      logger.info('Handling generate_script request', { args });

      if (!args.topic) {
        throw new TTSError(
          'Topic is required for script generation',
          TTSErrorCode.SCRIPT_GENERATION_FAILED
        );
      }

      const script = await this.scriptService.generateScript(args.topic, {
        template: args.template,
        maxWords: args.maxWords,
        tone: args.tone,
        language: args.language
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            scriptId: script.id,
            topic: script.topic,
            content: script.content,
            wordCount: script.wordCount,
            estimatedDuration: script.estimatedDuration,
            template: script.template,
            tone: script.tone,
            language: script.language,
            createdAt: script.createdAt.toISOString()
          }, null, 2)
        }]
      };

    } catch (error) {
      logger.logError('Generate Script Failed', error as Error);
      
      if (error instanceof TTSError) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                code: error.code,
                message: error.message,
                details: error.details
              }
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'SCRIPT_GENERATION_FAILED',
              message: 'Failed to generate script',
              details: { originalError: (error as Error).message }
            }
          }, null, 2)
        }]
      };
    }
  }

  async handleRenderVideoWithTTS(args: any): Promise<CallToolResponse> {
    try {
      logger.info('Handling render_video_with_tts request', { args });

      if (!args.composition) {
        throw new TTSError(
          'Composition is required',
          TTSErrorCode.SCRIPT_GENERATION_FAILED
        );
      }

      let script = args.script;
      let scriptId: string | undefined;

      // Generate script if not provided but topic is given
      if (!script && args.topic) {
        const generatedScript = await this.scriptService.generateScript(args.topic);
        script = generatedScript.content;
        scriptId = generatedScript.id;
      }

      if (!script) {
        throw new TTSError(
          'Either script or topic must be provided',
          TTSErrorCode.SCRIPT_GENERATION_FAILED
        );
      }

      // Generate TTS audio
      const ttsRequest: TTSRequest = {
        text: script,
        voice: (args.voice as TTSVoice) || 'alloy',
        model: (args.ttsModel as TTSModel) || 'tts-1',
        speed: args.speed || 1.0,
        responseFormat: 'wav'
      };

      const audioResponse = await this.ttsService.generateAudio(ttsRequest);

      // Trigger video render with audio
      const renderHandlers = this.renderHandlers || new (await import('./render-handlers.js')).RenderHandlers(
        new (await import('../services/remotion-service.js')).RemotionService(),
        new (await import('../services/render-service.js')).RenderService()
      );

      const audioFileName = path.basename(audioResponse.filePath);
      
      // Prepare render parameters and apply defaults
      const renderParams = { ...(args.parameters || {}) } as Record<string, unknown>;
      // Support alternate key 'background' by mapping it to 'backgroundScene' if provided
      if ((renderParams as any)['background'] && !(renderParams as any)['backgroundScene']) {
        (renderParams as any)['backgroundScene'] = (renderParams as any)['background'];
      }
      // Default to 'office' if neither provided or falsy
      if (!('backgroundScene' in renderParams) || !renderParams['backgroundScene']) {
        renderParams['backgroundScene'] = 'office';
      }

      const renderResponse = await renderHandlers.handleRenderVideo({
        composition: args.composition,
        audioFileName,
        durationInSeconds: audioResponse.duration,
        parameters: renderParams
      });
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'TTS audio generated and video render started successfully.',
            composition: args.composition,
            audioId: audioResponse.audioId,
            audioPath: audioResponse.filePath,
            audioFileName: audioFileName,
            durationInSeconds: audioResponse.duration,
            renderJob: renderResponse.content[0] && 'text' in renderResponse.content[0] ? this.safeParseJSON(renderResponse.content[0].text) : null,
            scriptId,
            audioMetadata: {
              duration: audioResponse.duration,
              size: audioResponse.size,
              voice: audioResponse.metadata.voice,
              model: audioResponse.metadata.model,
              wordCount: audioResponse.metadata.wordCount
            },
            nextSteps: [
              'Audio đã được tích hợp vào composition qua props audioFileName',
              'durationInSeconds đã được truyền để tính durationInFrames động',
              'Theo dõi tiến độ bằng get_render_status với job ID'
            ]
          }, null, 2)
        }]
      };

    } catch (error) {
      logger.logError('Render Video with TTS Failed', error as Error);
      
      if (error instanceof TTSError) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                code: error.code,
                message: error.message,
                details: error.details
              }
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'RENDER_WITH_TTS_FAILED',
              message: 'Failed to render video with TTS',
              details: { originalError: (error as Error).message }
            }
          }, null, 2)
        }]
      };
    }
  }

  async handleConvertAudioFormat(args: any): Promise<CallToolResponse> {
    try {
      logger.info('Handling convert_audio_format request', { args });

      if (!args.inputPath) {
        throw new TTSError(
          'Input path is required',
          TTSErrorCode.FILE_NOT_FOUND
        );
      }

      if (!args.outputPath) {
        throw new TTSError(
          'Output path is required',
          TTSErrorCode.FILE_NOT_FOUND
        );
      }

      const result = await this.audioConversionService.convertWavToOgg({
        inputPath: args.inputPath,
        outputPath: args.outputPath,
        quality: args.quality || 5
      });

      if (!result.success) {
        throw new TTSError(
          result.error || 'Audio conversion failed',
          TTSErrorCode.AUDIO_GENERATION_FAILED
        );
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            inputPath: args.inputPath,
            outputPath: result.outputPath,
            duration: result.duration,
            quality: args.quality || 5,
            message: 'Audio converted from WAV to OGG successfully'
          }, null, 2)
        }]
      };

    } catch (error) {
      logger.logError('Convert Audio Format Failed', error as Error);
      
      if (error instanceof TTSError) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                code: error.code,
                message: error.message,
                details: error.details
              }
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'CONVERSION_FAILED',
              message: 'Failed to convert audio format',
              details: { originalError: (error as Error).message }
            }
          }, null, 2)
        }]
      };
    }
  }

  async handleGenerateLipSyncData(args: any): Promise<CallToolResponse> {
    try {
      logger.info('Handling generate_lipsync_data request', { args });

      if (!args.audioPath) {
        throw new TTSError(
          'Audio path is required',
          TTSErrorCode.FILE_NOT_FOUND
        );
      }

      if (!args.outputPath) {
        throw new TTSError(
          'Output path is required',
          TTSErrorCode.FILE_NOT_FOUND
        );
      }

      // Check if Rhubarb is available
      const isRhubarbAvailable = await this.rhubarbService.isAvailable();
      if (!isRhubarbAvailable) {
        throw new TTSError(
          'Rhubarb CLI not found. Please install Rhubarb and ensure it\'s in your PATH.',
          TTSErrorCode.AUDIO_GENERATION_FAILED
        );
      }

      // Generate lip-sync data using Rhubarb
      const result = await this.rhubarbService.generateLipSyncData({
        audioPath: args.audioPath,
        outputPath: args.outputPath,
        dialogFile: args.dialogFile,
        timeout: args.timeout || 60
      });

      if (!result.success) {
        throw new TTSError(
          result.error || 'Lip-sync data generation failed',
          TTSErrorCode.AUDIO_GENERATION_FAILED
        );
      }

      // Store lip-sync data with metadata
      const lipSyncData = await this.lipSyncManager.storeLipSyncData(
        args.audioPath,
        args.outputPath,
        result.data!
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            audioPath: args.audioPath,
            outputPath: result.outputPath,
            lipSyncId: lipSyncData.id,
            metadata: {
              duration: lipSyncData.metadata.duration,
              mouthCueCount: lipSyncData.metadata.mouthCueCount,
              processingTime: result.processingTime
            },
            mouthCues: lipSyncData.mouthCues.slice(0, 5), // Show first 5 cues as preview
            message: 'Lip-sync data generated successfully'
          }, null, 2)
        }]
      };

    } catch (error) {
      logger.logError('Generate Lip-sync Data Failed', error as Error);
      
      if (error instanceof TTSError) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                code: error.code,
                message: error.message,
                details: error.details
              }
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'LIPSYNC_GENERATION_FAILED',
              message: 'Failed to generate lip-sync data',
              details: { originalError: (error as Error).message }
            }
          }, null, 2)
        }]
      };
    }
  }

  async handleRenderVideoWithLipSync(args: any): Promise<CallToolResponse> {
    try {
      logger.info('Handling render_video_with_lipsync request', { args });

      if (!args.audioPath) {
        throw new TTSError(
          'Audio path is required',
          TTSErrorCode.FILE_NOT_FOUND
        );
      }

      if (!args.compositionId) {
        args.compositionId = 'Scene-Landscape'; // Default composition
      }

      // Step 1: Check if OGG version exists for Rhubarb processing
      const audioPath = args.audioPath;
      const oggPath = audioPath.replace(/\.(wav|mp3)$/i, '.ogg');
      
      let finalOggPath = oggPath;
      try {
        // Check if OGG exists
        await fs.access(oggPath);
        logger.info('Found existing OGG file', { oggPath });
      } catch {
        // Convert audio to OGG for Rhubarb processing
        logger.info('Converting audio to OGG for lip-sync processing', { audioPath });
        const conversionResult = await this.audioConversionService.convertWavToOgg({
          inputPath: audioPath,
          outputPath: oggPath,
          quality: args.quality || 5
        });

        if (!conversionResult.success) {
          throw new TTSError(
            'Failed to convert audio for lip-sync processing',
            TTSErrorCode.AUDIO_PROCESSING_FAILED
          );
        }
        finalOggPath = conversionResult.outputPath;
      }

      // Step 2: Generate lip-sync data
      const lipSyncOutputPath = finalOggPath.replace('.ogg', '_lipsync.json');
      const lipSyncResult = await this.rhubarbService.generateLipSyncData({
        audioPath: finalOggPath,
        outputPath: lipSyncOutputPath,
        dialogFile: args.dialogFile,
        timeout: args.timeout || 60
      });

      if (!lipSyncResult.success) {
        throw new TTSError(
          lipSyncResult.error || 'Lip-sync generation failed',
          TTSErrorCode.AUDIO_PROCESSING_FAILED
        );
      }

      // Step 3: Store lip-sync data
      const lipSyncData = await this.lipSyncManager.storeLipSyncData(
        finalOggPath,
        lipSyncOutputPath,
        lipSyncResult.data!
      );

      // Step 4: Prepare render parameters with lip-sync
      const renderParams = {
        width: args.width,
        height: args.height,
        durationInFrames: args.durationInFrames,
        backgroundScene: args.backgroundScene,
        audioFileName: path.basename(audioPath),
        mouthCuesUrl: `lipsync://${lipSyncData.id}`, // Special protocol for internal lip-sync data
        lipSyncOptions: {
          offsetInSeconds: args.lipSyncOffsetSeconds || 0,
          smoothingOptions: {
            enabled: true,
            factor: 0.3
          }
        },
        ...args.renderParams
      };

      // Step 5: Trigger video render if render handlers available
      if (!this.renderHandlers) {
        throw new TTSError(
          'Render service not available',
          TTSErrorCode.AUDIO_PROCESSING_FAILED
        );
      }

      const renderResponse = await this.renderHandlers.handleRenderVideo({
        composition: args.compositionId,
        parameters: renderParams
      });

      // Parse render response to get job info
      let renderJobId = 'unknown';
      let renderStatus = 'unknown';
      try {
        if (renderResponse.content && renderResponse.content.length > 0) {
          const responseContent = renderResponse.content[0];
          if (responseContent && 'text' in responseContent) {
            // Try to parse JSON response for render job info
            const parsed = JSON.parse(responseContent.text);
            renderJobId = parsed.jobId || parsed.id || 'unknown';
            renderStatus = parsed.status || 'pending';
          }
        }
      } catch {
        // If parsing fails, use defaults
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            audioPath,
            oggPath: finalOggPath,
            lipSyncPath: lipSyncOutputPath,
            lipSyncId: lipSyncData.id,
            renderJobId,
            compositionId: args.compositionId,
            metadata: {
              mouthCueCount: lipSyncData.metadata.mouthCueCount,
              duration: lipSyncData.metadata.duration,
              processingTime: lipSyncResult.processingTime,
              renderStatus
            },
            message: 'Video rendering with lip-sync started successfully'
          }, null, 2)
        }]
      };

    } catch (error) {
      logger.logError('Render Video with Lip-sync Failed', error as Error);
      
      if (error instanceof TTSError) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: {
                code: error.code,
                message: error.message,
                details: error.details
              }
            }, null, 2)
          }]
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: 'LIPSYNC_RENDER_FAILED',
              message: 'Failed to render video with lip-sync',
              details: { originalError: (error as Error).message }
            }
          }, null, 2)
        }]
      };
    }
  }
}
