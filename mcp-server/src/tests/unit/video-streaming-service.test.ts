import { VideoStreamingService } from '../../services/video-streaming-service';
import { jest } from '@jest/globals';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    stat: jest.fn(),
  },
  createReadStream: jest.fn(),
  statSync: jest.fn(),
}));

describe('VideoStreamingService', () => {
  let service: VideoStreamingService;
  let mockCreateReadStream: jest.MockedFunction<any>;
  let mockStatSync: jest.MockedFunction<any>;

  beforeEach(() => {
    service = new VideoStreamingService();
    mockCreateReadStream = require('fs').createReadStream as jest.MockedFunction<any>;
    mockStatSync = require('fs').statSync as jest.MockedFunction<any>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createVideoStream', () => {
    it('should create a video stream successfully', async () => {
      const jobId = 'test-job-123';
      const filePath = '/path/to/video.mp4';
      const mockStats = {
        size: 1024 * 1024, // 1MB
        isFile: () => true,
      };

      mockStatSync.mockReturnValue(mockStats);

      const stream = await service.createVideoStream(jobId, filePath);

      expect(stream).toBeDefined();
      expect(stream.id).toMatch(/^stream_test-job-123_\d+$/);
      expect(stream.jobId).toBe(jobId);
      expect(stream.filePath).toBe(filePath);
      expect(stream.status).toBe('streaming');
      expect(stream.totalBytes).toBe(1024 * 1024);
      expect(stream.contentType).toBe('video/mp4');
    });

    it('should throw error for non-existent file', async () => {
      const jobId = 'test-job-123';
      const filePath = '/path/to/nonexistent.mp4';

      mockStatSync.mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      await expect(service.createVideoStream(jobId, filePath)).rejects.toThrow();
    });

    it('should throw error for unsupported format', async () => {
      const jobId = 'test-job-123';
      const filePath = '/path/to/video.avi';

      await expect(service.createVideoStream(jobId, filePath)).rejects.toThrow('Unsupported video format');
    });
  });

  describe('streamVideoChunk', () => {
    it('should stream video chunk successfully', async () => {
      const jobId = 'test-job-123';
      const filePath = '/path/to/video.mp4';
      const mockStats = {
        size: 1024 * 1024, // 1MB
        isFile: () => true,
      };

      mockStatSync.mockReturnValue(mockStats);

      // Create stream first
      const stream = await service.createVideoStream(jobId, filePath);

      // Mock read stream
      const mockReadStream: any = {
        on: jest.fn().mockImplementation((event: any, callback: any) => {
          if (event === 'data') {
            callback(Buffer.from('test video data'));
          }
          if (event === 'end') {
            callback();
          }
          return mockReadStream;
        }),
      };

      mockCreateReadStream.mockReturnValue(mockReadStream);

      const chunk = await service.streamVideoChunk(stream.id, 0);

      expect(chunk).toBeDefined();
      expect(chunk.chunk).toBeInstanceOf(Buffer);
      expect(chunk.offset).toBe(0);
      expect(chunk.total).toBe(1024 * 1024);
      expect(chunk.isLast).toBe(false);
    });

    it('should throw error for non-existent stream', async () => {
      await expect(service.streamVideoChunk('non-existent-stream', 0)).rejects.toThrow('Video stream not found');
    });

    it('should throw error for invalid offset', async () => {
      const jobId = 'test-job-123';
      const filePath = '/path/to/video.mp4';
      const mockStats = {
        size: 1024, // 1KB
        isFile: () => true,
      };

      mockStatSync.mockReturnValue(mockStats);

      const stream = await service.createVideoStream(jobId, filePath);

      await expect(service.streamVideoChunk(stream.id, 2000)).rejects.toThrow('Invalid offset');
    });
  });

  describe('getStreamInfo', () => {
    it('should return stream info for existing stream', async () => {
      const jobId = 'test-job-123';
      const filePath = '/path/to/video.mp4';
      const mockStats = {
        size: 1024 * 1024,
        isFile: () => true,
      };

      mockStatSync.mockReturnValue(mockStats);

      const createdStream = await service.createVideoStream(jobId, filePath);
      const streamInfo = await service.getStreamInfo(createdStream.id);

      expect(streamInfo).toBeDefined();
      expect(streamInfo?.id).toBe(createdStream.id);
      expect(streamInfo?.jobId).toBe(jobId);
    });

    it('should return null for non-existent stream', async () => {
      const streamInfo = await service.getStreamInfo('non-existent-stream');
      expect(streamInfo).toBeNull();
    });
  });

  describe('listStreams', () => {
    it('should return empty array when no streams exist', async () => {
      const streams = await service.listStreams();
      expect(streams).toEqual([]);
    });

    it('should return all streams sorted by start time', async () => {
      const mockStats = {
        size: 1024 * 1024,
        isFile: () => true,
      };

      mockStatSync.mockReturnValue(mockStats);

      // Create multiple streams
      await service.createVideoStream('job1', '/path/to/video1.mp4');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await service.createVideoStream('job2', '/path/to/video2.mp4');

      const streams = await service.listStreams();

      expect(streams).toHaveLength(2);
      expect(streams[0]?.jobId).toBe('job2'); // Most recent first
      expect(streams[1]?.jobId).toBe('job1');
    });
  });

  describe('cancelStream', () => {
    it('should cancel active stream successfully', async () => {
      const jobId = 'test-job-123';
      const filePath = '/path/to/video.mp4';
      const mockStats = {
        size: 1024 * 1024,
        isFile: () => true,
      };

      mockStatSync.mockReturnValue(mockStats);

      const stream = await service.createVideoStream(jobId, filePath);
      const success = await service.cancelStream(stream.id);

      expect(success).toBe(true);

      const streamInfo = await service.getStreamInfo(stream.id);
      expect(streamInfo?.status).toBe('error');
      expect(streamInfo?.error).toBe('Stream cancelled by user');
    });

    it('should return false for non-existent stream', async () => {
      const success = await service.cancelStream('non-existent-stream');
      expect(success).toBe(false);
    });
  });

  describe('cleanupCompletedStreams', () => {
    it('should cleanup old completed streams', async () => {
      const mockStats = {
        size: 1024 * 1024,
        isFile: () => true,
      };

      mockStatSync.mockReturnValue(mockStats);

      // Create a stream
      const stream = await service.createVideoStream('job1', '/path/to/video1.mp4');

      // Manually set it as completed with old timestamp
      const streamInfo = await service.getStreamInfo(stream.id);
      if (streamInfo) {
        streamInfo.status = 'completed';
        streamInfo.startTime = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      }

      const cleanedCount = await service.cleanupCompletedStreams(24); // Cleanup older than 24 hours

      expect(cleanedCount).toBe(1);

      const remainingStreams = await service.listStreams();
      expect(remainingStreams).toHaveLength(0);
    });
  });

  describe('getVideoMetadata', () => {
    it('should return video metadata', async () => {
      const filePath = '/path/to/video.mp4';
      const mockStats = {
        size: 1024 * 1024,
        mtime: new Date('2024-01-01T00:00:00Z'),
        isFile: () => true,
      };

      mockStatSync.mockReturnValue(mockStats);

      const metadata = await service.getVideoMetadata(filePath);

      expect(metadata).toBeDefined();
      expect(metadata.filePath).toBe(filePath);
      expect(metadata.size).toBe(1024 * 1024);
      expect(metadata.format).toBe('mp4');
      expect(metadata.contentType).toBe('video/mp4');
    });
  });
});
