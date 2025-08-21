import { createReadStream, statSync } from 'fs';
import { logger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';

export interface VideoStream {
  id: string;
  jobId: string;
  filePath: string;
  status: 'preparing' | 'streaming' | 'completed' | 'error';
  startTime: Date;
  endTime?: Date;
  totalBytes: number;
  streamedBytes: number;
  contentType: string;
  error?: string;
}

export interface StreamChunk {
  chunk: Buffer;
  offset: number;
  total: number;
  isLast: boolean;
}

export class VideoStreamingService {
  private streams: Map<string, VideoStream> = new Map();
  private readonly chunkSize: number = 64 * 1024; // 64KB chunks
  private readonly supportedFormats: string[] = ['mp4', 'webm', 'mov'];

  /**
   * Tạo video stream từ render job
   */
  public async createVideoStream(jobId: string, filePath: string): Promise<VideoStream> {
    try {
      logger.info('Creating video stream', { jobId, filePath });

      // Validate file exists
      if (!this.fileExists(filePath)) {
        throw ErrorHandler.createProcessingError(
          'create_video_stream',
          'file_not_found',
          `Video file not found: ${filePath}`
        );
      }

      // Validate file format
      const fileExtension = this.getFileExtension(filePath);
      if (!this.supportedFormats.includes(fileExtension.toLowerCase())) {
        throw ErrorHandler.createProcessingError(
          'create_video_stream',
          'unsupported_format',
          `Unsupported video format: ${fileExtension}`
        );
      }

      // Get file stats
      const stats = statSync(filePath);
      const contentType = this.getContentType(fileExtension);

      // Create stream record
      const streamId = `stream_${jobId}_${Date.now()}`;
      const stream: VideoStream = {
        id: streamId,
        jobId,
        filePath,
        status: 'preparing',
        startTime: new Date(),
        totalBytes: stats.size,
        streamedBytes: 0,
        contentType
      };

      this.streams.set(streamId, stream);
      stream.status = 'streaming';

      logger.info('Video stream created', { 
        streamId, 
        jobId, 
        filePath, 
        totalBytes: stream.totalBytes,
        contentType 
      });

      return stream;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create video stream', { error: errorMessage, jobId, filePath });
      throw error;
    }
  }

  /**
   * Stream video chunk theo offset
   */
  public async streamVideoChunk(streamId: string, offset: number = 0): Promise<StreamChunk> {
    try {
      const stream = this.streams.get(streamId);
      if (!stream) {
        throw ErrorHandler.createProcessingError(
          'stream_video_chunk',
          'stream_not_found',
          `Video stream not found: ${streamId}`
        );
      }

      if (stream.status !== 'streaming') {
        throw ErrorHandler.createProcessingError(
          'stream_video_chunk',
          'stream_not_active',
          `Video stream is not active: ${stream.status}`
        );
      }

      // Validate offset
      if (offset < 0 || offset >= stream.totalBytes) {
        throw ErrorHandler.createProcessingError(
          'stream_video_chunk',
          'invalid_offset',
          `Invalid offset: ${offset}, total bytes: ${stream.totalBytes}`
        );
      }

      // Calculate chunk size
      const remainingBytes = stream.totalBytes - offset;
      const chunkSize = Math.min(this.chunkSize, remainingBytes);
      const isLast = offset + chunkSize >= stream.totalBytes;

      // Read chunk from file
      const chunk = await this.readFileChunk(stream.filePath, offset, chunkSize);
      
      // Update stream progress
      stream.streamedBytes = Math.max(stream.streamedBytes, offset + chunkSize);

      const streamChunk: StreamChunk = {
        chunk,
        offset,
        total: stream.totalBytes,
        isLast
      };

      logger.debug('Video chunk streamed', { 
        streamId, 
        offset, 
        chunkSize: chunk.length, 
        isLast,
        progress: `${Math.round((stream.streamedBytes / stream.totalBytes) * 100)}%`
      });

      // Mark stream as completed if this is the last chunk
      if (isLast) {
        stream.status = 'completed';
        stream.endTime = new Date();
        logger.info('Video stream completed', { streamId, jobId: stream.jobId });
      }

      return streamChunk;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to stream video chunk', { error: errorMessage, streamId, offset });
      throw error;
    }
  }

  /**
   * Lấy thông tin video stream
   */
  public async getStreamInfo(streamId: string): Promise<VideoStream | null> {
    const stream = this.streams.get(streamId);
    if (!stream) {
      logger.warn('Video stream not found', { streamId });
      return null;
    }

    logger.debug('Retrieved stream info', { 
      streamId, 
      status: stream.status, 
      progress: `${Math.round((stream.streamedBytes / stream.totalBytes) * 100)}%`
    });

    return stream;
  }

  /**
   * Lấy danh sách tất cả video streams
   */
  public async listStreams(): Promise<VideoStream[]> {
    const streams = Array.from(this.streams.values());
    // Sort by start time descending (most recent first)
    streams.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    logger.debug('Listed video streams', { count: streams.length });
    return streams;
  }

  /**
   * Cleanup completed streams
   */
  public async cleanupCompletedStreams(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [streamId, stream] of this.streams.entries()) {
      if (
        (stream.status === 'completed' || stream.status === 'error') &&
        stream.startTime < cutoffTime
      ) {
        this.streams.delete(streamId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up completed video streams', { cleanedCount, olderThanHours });
    }

    return cleanedCount;
  }

  /**
   * Cancel video stream
   */
  public async cancelStream(streamId: string): Promise<boolean> {
    try {
      const stream = this.streams.get(streamId);
      if (!stream) {
        logger.warn('Video stream not found for cancellation', { streamId });
        return false;
      }

      if (stream.status === 'completed' || stream.status === 'error') {
        logger.warn('Cannot cancel stream in current status', { streamId, status: stream.status });
        return false;
      }

      // Update stream status
      stream.status = 'error';
      stream.endTime = new Date();
      stream.error = 'Stream cancelled by user';

      logger.info('Video stream cancelled', { streamId });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to cancel video stream', { error: errorMessage, streamId });
      throw error;
    }
  }

  /**
   * Get video metadata (duration, dimensions, etc.)
   */
  public async getVideoMetadata(filePath: string): Promise<any> {
    try {
      // This would typically use ffprobe or similar tool
      // For now, return basic file info
      const stats = statSync(filePath);
      const fileExtension = this.getFileExtension(filePath);
      
      return {
        filePath,
        size: stats.size,
        format: fileExtension,
        contentType: this.getContentType(fileExtension),
        lastModified: stats.mtime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get video metadata', { error: errorMessage, filePath });
      throw error;
    }
  }

  // Private helper methods

  private fileExists(filePath: string): boolean {
    try {
      statSync(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private getFileExtension(filePath: string): string {
    return filePath.split('.').pop() || '';
  }

  private getContentType(fileExtension: string): string {
    const extension = fileExtension.toLowerCase();
    switch (extension) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'mov':
        return 'video/quicktime';
      default:
        return 'application/octet-stream';
    }
  }

  private async readFileChunk(filePath: string, offset: number, length: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const stream = createReadStream(filePath, { start: offset, end: offset + length - 1 });
      const chunks: Buffer[] = [];

      stream.on('data', (chunk: Buffer | string) => {
        if (Buffer.isBuffer(chunk)) {
          chunks.push(chunk);
        } else {
          chunks.push(Buffer.from(chunk));
        }
      });

      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }
}
