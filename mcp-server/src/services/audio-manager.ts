import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import {
  IAudioManager,
  AudioMetadata,
  AudioFile,
  StorageInfo,
  AudioFilter,
  TTSError,
  TTSErrorCode
} from '../models/tts-types.js';

export class AudioManager implements IAudioManager {
  private readonly audioOutputDir: string;
  private readonly maxAudioFiles: number;
  private readonly retentionHours: number;

  constructor() {
    this.audioOutputDir = path.join(process.cwd(), 'public', 'audios');
    this.maxAudioFiles = 100;
    this.retentionHours = 24;
  }

  async saveAudio(audioData: Buffer, metadata: AudioMetadata): Promise<string> {
    try {
      const audioId = uuidv4();
      const filename = `${audioId}.mp3`;
      const filePath = path.join(this.audioOutputDir, filename);

      // Ensure directory exists
      await fs.mkdir(this.audioOutputDir, { recursive: true });

      // Write audio file
      await fs.writeFile(filePath, audioData);

      // Save metadata file
      const metadataPath = path.join(this.audioOutputDir, `${audioId}.json`);
      const audioFile: AudioFile = {
        id: audioId,
        filename,
        filePath: path.relative(process.cwd(), filePath),
        duration: this.estimateDuration(metadata.originalText, metadata.voice),
        size: audioData.length,
        format: 'mp3',
        voice: metadata.voice,
        model: metadata.model,
        createdAt: new Date(),
        metadata
      };

      await fs.writeFile(metadataPath, JSON.stringify(audioFile, null, 2));

      logger.info('Audio file saved', {
        audioId,
        filename,
        size: audioData.length
      });

      return audioId;

    } catch (error) {
      logger.logError('Audio Save Failed', error as Error);
      throw new TTSError(
        'Failed to save audio file',
        TTSErrorCode.FILE_SAVE_FAILED,
        { error: (error as Error).message }
      );
    }
  }

  async getAudio(audioId: string): Promise<AudioFile> {
    try {
      const metadataPath = path.join(this.audioOutputDir, `${audioId}.json`);
      
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const audioFile: AudioFile = JSON.parse(metadataContent);

      // Verify audio file exists
      const audioPath = path.join(this.audioOutputDir, audioFile.filename);
      await fs.access(audioPath);

      return audioFile;

    } catch (error) {
      logger.logError('Audio Get Failed', error as Error, { audioId });
      throw new TTSError(
        `Audio file not found: ${audioId}`,
        TTSErrorCode.FILE_NOT_FOUND,
        { audioId }
      );
    }
  }

  async listAudios(filter?: AudioFilter): Promise<AudioFile[]> {
    try {
      // Ensure directory exists
      await fs.mkdir(this.audioOutputDir, { recursive: true });

      const files = await fs.readdir(this.audioOutputDir);
      const metadataFiles = files.filter(file => file.endsWith('.json'));

      const audioFiles: AudioFile[] = [];

      for (const metadataFile of metadataFiles) {
        try {
          const metadataPath = path.join(this.audioOutputDir, metadataFile);
          const content = await fs.readFile(metadataPath, 'utf-8');
          const audioFile: AudioFile = JSON.parse(content);

          // Apply filters
          if (this.matchesFilter(audioFile, filter)) {
            audioFiles.push(audioFile);
          }
        } catch (error) {
          logger.logError('Failed to read audio metadata', error as Error, {
            metadataFile
          });
        }
      }

      // Sort by creation date (newest first)
      audioFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return audioFiles;

    } catch (error) {
      logger.logError('Audio List Failed', error as Error);
      throw new TTSError(
        'Failed to list audio files',
        TTSErrorCode.FILE_NOT_FOUND,
        { error: (error as Error).message }
      );
    }
  }

  async deleteAudio(audioId: string): Promise<void> {
    try {
      const audioFile = await this.getAudio(audioId);
      
      // Delete audio file
      const audioPath = path.join(this.audioOutputDir, audioFile.filename);
      await fs.unlink(audioPath);

      // Delete metadata file
      const metadataPath = path.join(this.audioOutputDir, `${audioId}.json`);
      await fs.unlink(metadataPath);

      logger.info('Audio file deleted', { audioId, filename: audioFile.filename });

    } catch (error) {
      logger.logError('Audio Delete Failed', error as Error, { audioId });
      throw new TTSError(
        `Failed to delete audio file: ${audioId}`,
        TTSErrorCode.FILE_NOT_FOUND,
        { audioId, error: (error as Error).message }
      );
    }
  }

  async cleanup(olderThan: Date): Promise<number> {
    try {
      const audioFiles = await this.listAudios();
      let deletedCount = 0;

      for (const audioFile of audioFiles) {
        const createdAt = new Date(audioFile.createdAt);
        if (createdAt < olderThan) {
          try {
            await this.deleteAudio(audioFile.id);
            deletedCount++;
          } catch (error) {
            logger.logError('Cleanup delete failed', error as Error, {
              audioId: audioFile.id
            });
          }
        }
      }

      // Also cleanup by max files limit
      if (audioFiles.length > this.maxAudioFiles) {
        const excessFiles = audioFiles.slice(this.maxAudioFiles);
        for (const audioFile of excessFiles) {
          try {
            await this.deleteAudio(audioFile.id);
            deletedCount++;
          } catch (error) {
            logger.logError('Max files cleanup failed', error as Error, {
              audioId: audioFile.id
            });
          }
        }
      }

      logger.info('Audio cleanup completed', {
        deletedCount,
        olderThan,
        maxFiles: this.maxAudioFiles
      });

      return deletedCount;

    } catch (error) {
      logger.logError('Audio Cleanup Failed', error as Error);
      throw new TTSError(
        'Audio cleanup failed',
        TTSErrorCode.FILE_NOT_FOUND,
        { error: (error as Error).message }
      );
    }
  }

  async getStorageInfo(): Promise<StorageInfo> {
    try {
      const audioFiles = await this.listAudios();
      
      const totalFiles = audioFiles.length;
      const totalSize = audioFiles.reduce((sum, file) => sum + file.size, 0);
      
      const dates = audioFiles.map(file => new Date(file.createdAt));
      const oldestFile = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : undefined;
      const newestFile = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : undefined;

      // Estimate available space (simplified)
      const maxStorageBytes = 1024 * 1024 * 1024; // 1GB default
      const availableSpace = Math.max(0, maxStorageBytes - totalSize);

      return {
        totalFiles,
        totalSize,
        availableSpace,
        oldestFile,
        newestFile
      };

    } catch (error) {
      logger.logError('Storage Info Failed', error as Error);
      throw new TTSError(
        'Failed to get storage info',
        TTSErrorCode.FILE_NOT_FOUND,
        { error: (error as Error).message }
      );
    }
  }

  // Auto cleanup based on retention policy
  async autoCleanup(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - this.retentionHours);
    
    return await this.cleanup(cutoffDate);
  }

  private matchesFilter(audioFile: AudioFile, filter?: AudioFilter): boolean {
    if (!filter) return true;

    if (filter.voice && audioFile.voice !== filter.voice) {
      return false;
    }

    if (filter.model && audioFile.model !== filter.model) {
      return false;
    }

    if (filter.scriptId && audioFile.scriptId !== filter.scriptId) {
      return false;
    }

    const createdAt = new Date(audioFile.createdAt);
    
    if (filter.createdAfter && createdAt < filter.createdAfter) {
      return false;
    }

    if (filter.createdBefore && createdAt > filter.createdBefore) {
      return false;
    }

    return true;
  }

  private estimateDuration(text: string, voice: string): number {
    const wordCount = text.trim().split(/\s+/).length;
    const wordsPerMinute = 160; // Average speaking rate
    return Math.ceil((wordCount / wordsPerMinute) * 60); // seconds
  }
}
