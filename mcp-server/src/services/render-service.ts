import { v4 as uuidv4 } from 'uuid';
import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';
import { RemotionService } from './remotion-service';
import { VideoStreamingService } from './video-streaming-service';
import { config } from '../utils/config';

export interface RenderJob {
  id: string;
  compositionId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  startTime: Date;
  endTime?: Date;
  outputPath?: string;
  error?: string;
  parameters: RenderParameters;
  estimatedDuration?: number;
  actualDuration?: number;
}

export interface RenderParameters {
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames?: number;
  outputFormat?: 'mp4' | 'gif' | 'png-sequence';
  quality?: number;
  scale?: number;
  concurrency?: number;
  [key: string]: unknown;
}

export interface RenderProgress {
  frame: number;
  totalFrames: number;
  percentage: number;
  timeRemaining?: number;
  fps?: number;
}

export class RenderService {
  private jobs: Map<string, RenderJob> = new Map();
  private activeProcesses: Map<string, ChildProcess> = new Map();
  private readonly remotionService: RemotionService;
  private readonly videoStreamingService: VideoStreamingService;
  private readonly outputDir: string;

  constructor(projectPath?: string, outputDir?: string) {
    this.remotionService = new RemotionService(projectPath);
    this.videoStreamingService = new VideoStreamingService();
    this.outputDir = outputDir || config.getRemotionOutputDir();
  }

  /**
   * Trigger render cho một composition
   */
  public async triggerRender(
    compositionId: string,
    parameters: RenderParameters = {}
  ): Promise<RenderJob> {
    try {
      logger.info('Triggering render', { compositionId, parameters });

      // Validate composition exists
      const compositionExists = await this.remotionService.compositionExists(compositionId);
      if (!compositionExists) {
        throw ErrorHandler.createProcessingError(
          'trigger_render',
          'composition_not_found',
          `Composition '${compositionId}' not found`
        );
      }

      // Get composition info for defaults
      const compositionInfo = await this.remotionService.getCompositionInfo(compositionId);
      if (!compositionInfo) {
        throw ErrorHandler.createProcessingError(
          'trigger_render',
          'composition_info_failed',
          `Failed to get composition info for '${compositionId}'`
        );
      }

      // Create render job
      const jobId = uuidv4();
      const mergedParameters = this.mergeRenderParameters(compositionInfo, parameters);
      
      const job: RenderJob = {
        id: jobId,
        compositionId,
        status: 'pending',
        progress: 0,
        startTime: new Date(),
        parameters: mergedParameters,
        estimatedDuration: this.estimateRenderDuration(compositionInfo, mergedParameters)
      };

      this.jobs.set(jobId, job);

      // Start render process asynchronously
      this.startRenderProcess(job);

      logger.info('Render job created', { jobId, compositionId });
      return job;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to trigger render', { error: errorMessage, compositionId });
      throw error;
    }
  }

  /**
   * Lấy trạng thái render job
   */
  public async getRenderStatus(jobId: string): Promise<RenderJob | null> {
    const job = this.jobs.get(jobId);
    if (!job) {
      logger.warn('Render job not found', { jobId });
      return null;
    }

    logger.debug('Retrieved render status', { jobId, status: job.status, progress: job.progress });
    return job;
  }

  /**
   * Cancel render job
   */
  public async cancelRender(jobId: string): Promise<boolean> {
    try {
      const job = this.jobs.get(jobId);
      if (!job) {
        logger.warn('Render job not found for cancellation', { jobId });
        return false;
      }

      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        logger.warn('Cannot cancel render job in current status', { jobId, status: job.status });
        return false;
      }

      // Kill the process if running
      const process = this.activeProcesses.get(jobId);
      if (process) {
        process.kill('SIGTERM');
        this.activeProcesses.delete(jobId);
      }

      // Update job status
      job.status = 'cancelled';
      job.endTime = new Date();
      job.actualDuration = job.endTime.getTime() - job.startTime.getTime();

      logger.info('Render job cancelled', { jobId });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to cancel render', { error: errorMessage, jobId });
      throw error;
    }
  }

  /**
   * Lấy danh sách tất cả render jobs
   */
  public async listRenderJobs(limit?: number): Promise<RenderJob[]> {
    const jobs = Array.from(this.jobs.values());
    // Sort by start time descending (most recent first)
    jobs.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    if (limit && limit > 0) {
      return jobs.slice(0, limit);
    }
    
    return jobs;
  }

  /**
   * Lấy thông tin output file của một render job (file-based workflow)
   */
  public async getRenderOutput(jobId: string): Promise<{
    jobId: string;
    path: string;
    size: number;
    contentType: string;
    filename: string;
    createdAt: Date;
  } | null> {
    const job = this.jobs.get(jobId);
    if (!job || !job.outputPath || job.status !== 'completed') {
      logger.warn('Render output not available', { jobId, status: job?.status });
      return null;
    }

    try {
      const stats = await fs.stat(job.outputPath);
      return {
        jobId,
        path: job.outputPath,
        size: stats.size,
        contentType: this.getContentTypeByExtension(job.outputPath),
        filename: path.basename(job.outputPath),
        createdAt: stats.mtime
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to read render output metadata', { error: errorMessage, jobId, outputPath: job.outputPath });
      return null;
    }
  }

  /**
   * Liệt kê các video file output đã render (ưu tiên theo memory jobs, fallback scan thư mục)
   */
  public async listRenderOutputs(limit?: number): Promise<Array<{
    jobId?: string;
    path: string;
    size: number;
    contentType: string;
    filename: string;
    createdAt: Date;
  }>> {
    const outputs: Array<{
      jobId?: string;
      path: string;
      size: number;
      contentType: string;
      filename: string;
      createdAt: Date;
    }> = [];

    // Từ in-memory jobs
    for (const job of this.jobs.values()) {
      if (job.status === 'completed' && job.outputPath) {
        try {
          const stats = await fs.stat(job.outputPath);
          outputs.push({
            jobId: job.id,
            path: job.outputPath,
            size: stats.size,
            contentType: this.getContentTypeByExtension(job.outputPath),
            filename: path.basename(job.outputPath),
            createdAt: stats.mtime
          });
        } catch {
          // Ignore files that no longer exist
        }
      }
    }

    // Scan thư mục output để thu thập các file có thể không thuộc in-memory jobs
    try {
      const dirents = await fs.readdir(this.outputDir, { withFileTypes: true });
      for (const dirent of dirents) {
        if (!dirent.isFile()) continue;
        const filePath = path.join(this.outputDir, dirent.name);
        const alreadyIncluded = outputs.some((o) => o.path === filePath);
        if (alreadyIncluded) continue;

        const stats = await fs.stat(filePath);
        outputs.push({
          path: filePath,
          size: stats.size,
          contentType: this.getContentTypeByExtension(filePath),
          filename: dirent.name,
          createdAt: stats.mtime
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to scan output directory', { error: errorMessage, outputDir: this.outputDir });
    }

    // Sort by created time desc
    outputs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (limit && limit > 0) {
      return outputs.slice(0, limit);
    }
    return outputs;
  }

  /**
   * Xóa output file theo jobId hoặc path
   */
  public async deleteRenderOutput(params: { jobId?: string; path?: string }): Promise<boolean> {
    try {
      let targetPath = params.path;
      if (!targetPath && params.jobId) {
        const job = this.jobs.get(params.jobId);
        targetPath = job?.outputPath;
      }

      if (!targetPath) {
        logger.warn('No target path to delete');
        return false;
      }

      await fs.unlink(targetPath);
      logger.info('Deleted render output', { path: targetPath });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to delete render output', { error: errorMessage, params });
      return false;
    }
  }

  /**
   * Cleanup outputs cũ hơn N giờ
   */
  public async cleanupRenderOutputs(olderThanHours: number = 24): Promise<number> {
    const cutoff = Date.now() - olderThanHours * 60 * 60 * 1000;
    let deleted = 0;
    try {
      const dirents = await fs.readdir(this.outputDir, { withFileTypes: true });
      for (const dirent of dirents) {
        if (!dirent.isFile()) continue;
        const filePath = path.join(this.outputDir, dirent.name);
        try {
          const stats = await fs.stat(filePath);
          if (stats.mtime.getTime() < cutoff) {
            await fs.unlink(filePath);
            deleted++;
          }
        } catch {
          // ignore
        }
      }
      if (deleted > 0) {
        logger.info('Cleanup old render outputs completed', { olderThanHours, deleted });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to cleanup render outputs', { error: errorMessage, olderThanHours });
    }
    return deleted;
  }

  /**
   * Tạo video stream từ render job
   */
  public async createVideoStream(jobId: string): Promise<any> {
    try {
      const job = this.jobs.get(jobId);
      if (!job) {
        throw ErrorHandler.createProcessingError(
          'create_video_stream',
          'job_not_found',
          `Render job not found: ${jobId}`
        );
      }

      if (job.status !== 'completed') {
        throw ErrorHandler.createProcessingError(
          'create_video_stream',
          'job_not_completed',
          `Render job is not completed: ${job.status}`
        );
      }

      if (!job.outputPath) {
        throw ErrorHandler.createProcessingError(
          'create_video_stream',
          'no_output_path',
          `Render job has no output path: ${jobId}`
        );
      }

      // Create video stream
      const stream = await this.videoStreamingService.createVideoStream(jobId, job.outputPath);
      
      logger.info('Video stream created from render job', { jobId, streamId: stream.id });
      return stream;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create video stream from render job', { error: errorMessage, jobId });
      throw error;
    }
  }

  /**
   * Lấy video stream info
   */
  public async getVideoStreamInfo(streamId: string): Promise<any> {
    return this.videoStreamingService.getStreamInfo(streamId);
  }

  /**
   * Stream video chunk
   */
  public async streamVideoChunk(streamId: string, offset: number = 0): Promise<any> {
    return this.videoStreamingService.streamVideoChunk(streamId, offset);
  }

  /**
   * Lấy danh sách video streams
   */
  public async listVideoStreams(): Promise<any[]> {
    return this.videoStreamingService.listStreams();
  }

  /**
   * Cancel video stream
   */
  public async cancelVideoStream(streamId: string): Promise<boolean> {
    return this.videoStreamingService.cancelStream(streamId);
  }

  /**
   * Xóa render jobs đã hoàn thành hoặc failed
   */
  public async cleanupCompletedJobs(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    let cleanedCount = 0;

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') &&
        job.endTime &&
        job.endTime < cutoffTime
      ) {
        this.jobs.delete(jobId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info('Cleaned up completed render jobs', { cleanedCount, olderThanHours });
    }

    return cleanedCount;
  }

  private async startRenderProcess(job: RenderJob): Promise<void> {
    try {
      job.status = 'running';
      
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      // Generate output filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFilename = `${job.compositionId}_${timestamp}.mp4`;
      const outputPath = path.join(this.outputDir, outputFilename);
      job.outputPath = outputPath;

      // Build Remotion CLI command
      const args = this.buildRenderCommand(job, outputPath);

      logger.info('Starting render process', { jobId: job.id, args });

      // Spawn render process
      const process = spawn('npm', ['run', 'render', '--', ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        cwd: config.getRemotionProjectPath(),
      });

      this.activeProcesses.set(job.id, process);

      let stdout = '';
      let stderr = '';

      // Handle stdout for progress tracking
      process.stdout?.on('data', (data) => {
        stdout += data.toString();
        this.parseRenderProgress(job, data.toString());
      });

      // Handle stderr
      process.stderr?.on('data', (data) => {
        stderr += data.toString();
        logger.debug('Render process stderr', { jobId: job.id, stderr: data.toString() });
      });

      // Handle process completion
      process.on('close', (code) => {
        this.activeProcesses.delete(job.id);
        job.endTime = new Date();
        job.actualDuration = job.endTime.getTime() - job.startTime.getTime();

        if (code === 0) {
          job.status = 'completed';
          job.progress = 100;
          logger.info('Render completed successfully', { 
            jobId: job.id, 
            outputPath: job.outputPath,
            duration: job.actualDuration 
          });
        } else {
          job.status = 'failed';
          job.error = stderr || `Process exited with code ${code}`;
          logger.error('Render failed', { 
            jobId: job.id, 
            exitCode: code, 
            error: job.error 
          });
        }
      });

      // Handle process errors
      process.on('error', (error) => {
        this.activeProcesses.delete(job.id);
        job.status = 'failed';
        job.error = error.message;
        job.endTime = new Date();
        job.actualDuration = job.endTime.getTime() - job.startTime.getTime();
        
        logger.error('Render process error', { jobId: job.id, error: error.message });
      });

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      job.endTime = new Date();
      job.actualDuration = job.endTime.getTime() - job.startTime.getTime();
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to start render process', { error: errorMessage, jobId: job.id });
    }
  }

  private mergeRenderParameters(
    compositionInfo: any,
    userParameters: RenderParameters
  ): RenderParameters {
    return {
      width: userParameters.width ?? compositionInfo.width,
      height: userParameters.height ?? compositionInfo.height,
      fps: userParameters.fps ?? compositionInfo.fps,
      durationInFrames: userParameters.durationInFrames ?? compositionInfo.durationInFrames,
      outputFormat: userParameters.outputFormat ?? 'mp4',
      quality: userParameters.quality ?? 8,
      scale: userParameters.scale ?? 1,
      concurrency: userParameters.concurrency ?? 1,
      ...userParameters
    };
  }

  private estimateRenderDuration(compositionInfo: any, parameters: RenderParameters): number {
    // Rough estimation: 1 frame per second for HD video
    const totalFrames = parameters.durationInFrames || compositionInfo.durationInFrames;
    const complexityFactor = (parameters.width || compositionInfo.width) > 1920 ? 2 : 1;
    const concurrency = parameters.concurrency || 1;
    
    return Math.round((totalFrames * complexityFactor) / concurrency);
  }

  private buildRenderCommand(job: RenderJob, outputPath: string): string[] {
    const args: string[] = [job.compositionId, outputPath];

    if (job.parameters.width) {
      args.push(`--width=${job.parameters.width}`);
    }
    if (job.parameters.height) {
      args.push(`--height=${job.parameters.height}`);
    }
    if (job.parameters.fps) {
      args.push(`--fps=${job.parameters.fps}`);
    }

    // Render full video range explicitly: 0-(duration-1)
    if (job.parameters.durationInFrames && job.parameters.durationInFrames > 0) {
      const lastFrame = job.parameters.durationInFrames - 1;
      args.push(`--frames=0-${lastFrame}`);
    }

    // Do not pass deprecated --quality; mp4 does not use jpeg-quality
    if (job.parameters.scale && job.parameters.scale !== 1) {
      args.push(`--scale=${job.parameters.scale}`);
    }

    return args;
  }

  private getContentTypeByExtension(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.mp4':
        return 'video/mp4';
      case '.webm':
        return 'video/webm';
      case '.mov':
        return 'video/quicktime';
      case '.gif':
        return 'image/gif';
      default:
        return 'application/octet-stream';
    }
  }

  private parseRenderProgress(job: RenderJob, output: string): void {
    try {
      // Parse Remotion CLI output for progress
      // Look for patterns like "Frame 150/300 (50%)" or other CLI progress
      const progressMatch = output.match(/Frame (\d+)\/(\d+) \((\d+)%\)/);
      if (progressMatch && progressMatch[1] && progressMatch[2] && progressMatch[3]) {
        const currentFrame = parseInt(progressMatch[1]);
        const totalFrames = parseInt(progressMatch[2]);
        const percentage = parseInt(progressMatch[3]);

        job.progress = percentage;
        
        logger.debug('Render progress updated', { 
          jobId: job.id, 
          frame: currentFrame, 
          totalFrames, 
          percentage 
        });
      }

      // Look for completion indicators
      if (/Render complete|rendered successfully|done/i.test(output)) {
        job.progress = 100;
      }
    } catch (error) {
      // Ignore parsing errors, just log them
      logger.debug('Failed to parse render progress', { 
        jobId: job.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }
}
