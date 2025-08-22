import { CallToolResponse } from '../models/types.js';
import { TTSService } from '../services/tts-service.js';
import { AudioManager } from '../services/audio-manager.js';
import { ScriptService } from '../services/script-service.js';
import { logger } from '../utils/logger.js';
import {
  TTSRequest,
  TTSVoice,
  TTSModel,
  AudioFilter,
  TTSError,
  TTSErrorCode
} from '../models/tts-types.js';

export class AudioHandlers {
  private ttsService: TTSService;
  private audioManager: AudioManager;
  private scriptService: ScriptService;

  constructor() {
    this.ttsService = new TTSService();
    this.audioManager = new AudioManager();
    this.scriptService = new ScriptService();
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
        responseFormat: args.format || 'mp3'
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
        speed: args.speed || 1.0
      };

      const audioResponse = await this.ttsService.generateAudio(ttsRequest);

      // TODO: Integrate with existing render service
      // For now, return the audio info and let the user manually trigger render
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'TTS audio generated successfully. Manual render integration needed.',
            composition: args.composition,
            audioId: audioResponse.audioId,
            audioPath: audioResponse.filePath,
            scriptId,
            audioMetadata: {
              duration: audioResponse.duration,
              size: audioResponse.size,
              voice: audioResponse.metadata.voice,
              model: audioResponse.metadata.model,
              wordCount: audioResponse.metadata.wordCount
            },
            nextSteps: [
              'Use the generated audio file in your Remotion composition',
              'Update composition props with audioPath',
              'Trigger video render with existing render_video tool'
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
}
