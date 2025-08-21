import { CallToolResponse } from '../models/types';
import { logger } from '../utils/logger';
import { RemotionService } from '../services/remotion-service';
import { RenderService } from '../services/render-service';

export class RenderHandlers {
  constructor(
    private readonly remotionService: RemotionService,
    private readonly renderService: RenderService
  ) {}

  async handleRenderVideo(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const composition = arguments_['composition'] as string;
      const parameters = (arguments_['parameters'] as Record<string, unknown>) || {};

      // Validate composition exists first
      const compositionExists = await this.remotionService.compositionExists(composition);
      if (!compositionExists) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ **Composition Not Found**\n\nComposition '${composition}' does not exist in the project. Please check the composition name and try again.\n\nUse 'list_compositions' to see available compositions.`,
            },
          ],
        };
      }

      // Trigger render
      const renderJob = await this.renderService.triggerRender(composition, parameters);

      const parametersList = Object.entries(parameters)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `🎬 **Render Job Started**\n\n**Job ID:** ${renderJob.id}\n**Composition:** ${composition}\n**Status:** ${renderJob.status}\n**Progress:** ${renderJob.progress}%\n\n**Parameters:**\n${parametersList || '- Using default parameters'}\n\n**Estimated Duration:** ${renderJob.estimatedDuration || 'Unknown'} seconds\n\nUse 'get_render_status' with job ID to check progress.`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to render video', { error: errorMessage });
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Render Failed**\n\n${errorMessage}\n\nPlease check the composition name and parameters, then try again.`,
          },
        ],
      };
    }
  }

  async handleGetRenderStatus(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const jobId = arguments_['jobId'] as string;

      const renderJob = await this.renderService.getRenderStatus(jobId);
      if (!renderJob) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ **Render Job Not Found**\n\nJob ID '${jobId}' does not exist.\n\nUse 'list_render_jobs' to see all available jobs.`,
            },
          ],
        };
      }

      const statusEmoji = {
        pending: '⏳',
        running: '🎬',
        completed: '✅',
        failed: '❌',
        cancelled: '🚫'
      }[renderJob.status] || '❓';

      const elapsedTime = renderJob.endTime 
        ? renderJob.endTime.getTime() - renderJob.startTime.getTime()
        : Date.now() - renderJob.startTime.getTime();
      
      const elapsedSeconds = Math.round(elapsedTime / 1000);
      const elapsedText = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`;

      let statusText = `${statusEmoji} **Render Status: ${renderJob.status.toUpperCase()}**\n\n`;
      statusText += `**Job ID:** ${renderJob.id}\n`;
      statusText += `**Composition:** ${renderJob.compositionId}\n`;
      statusText += `**Progress:** ${renderJob.progress}%\n`;
      statusText += `**Started:** ${renderJob.startTime.toLocaleString()}\n`;
      statusText += `**Elapsed Time:** ${elapsedText}\n`;

      if (renderJob.estimatedDuration) {
        statusText += `**Estimated Duration:** ${renderJob.estimatedDuration}s\n`;
      }

      if (renderJob.outputPath && renderJob.status === 'completed') {
        statusText += `**Output File:** ${renderJob.outputPath}\n`;
      }

      if (renderJob.error) {
        statusText += `\n**Error:** ${renderJob.error}\n`;
      }

      if (renderJob.endTime) {
        statusText += `**Completed:** ${renderJob.endTime.toLocaleString()}\n`;
        statusText += `**Total Duration:** ${Math.round((renderJob.actualDuration || 0) / 1000)}s\n`;
      }

      return {
        content: [
          {
            type: 'text',
            text: statusText,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get render status', { error: errorMessage });
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Status Check Failed**\n\n${errorMessage}`,
          },
        ],
      };
    }
  }

  async handleListRenderJobs(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const limit = arguments_['limit'] as number | undefined;

      const jobs = await this.renderService.listRenderJobs(limit);

      if (jobs.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `📋 **No Render Jobs Found**\n\nNo render jobs have been created yet.\n\nUse 'render_video' to start a new render job.`,
            },
          ],
        };
      }

      const jobsList = jobs.map((job, index) => {
        const statusEmoji = {
          pending: '⏳',
          running: '🎬',
          completed: '✅',
          failed: '❌',
          cancelled: '🚫'
        }[job.status] || '❓';

        const elapsedTime = job.endTime 
          ? job.endTime.getTime() - job.startTime.getTime()
          : Date.now() - job.startTime.getTime();
        
        const elapsedSeconds = Math.round(elapsedTime / 1000);
        const elapsedText = `${Math.floor(elapsedSeconds / 60)}m ${elapsedSeconds % 60}s`;

        return `**${index + 1}. ${job.compositionId}** ${statusEmoji}\n- Job ID: ${job.id}\n- Status: ${job.status} (${job.progress}%)\n- Started: ${job.startTime.toLocaleString()}\n- Duration: ${elapsedText}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `🎬 **Render Jobs** (${jobs.length} ${limit ? `of ${limit} max` : 'total'})\n\n${jobsList}\n\nUse 'get_render_status' with job ID for detailed status.`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list render jobs', { error: errorMessage });
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Failed to List Jobs**\n\n${errorMessage}`,
          },
        ],
      };
    }
  }

  async handleCancelRender(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const jobId = arguments_['jobId'] as string;

      const success = await this.renderService.cancelRender(jobId);
      
      if (!success) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ **Cancel Failed**\n\nJob ID '${jobId}' not found or cannot be cancelled (already completed/failed/cancelled).\n\nUse 'list_render_jobs' to see available jobs.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `🚫 **Render Job Cancelled**\n\nJob ID '${jobId}' has been successfully cancelled.\n\nUse 'get_render_status' to confirm the cancellation.`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to cancel render', { error: errorMessage });
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Cancel Failed**\n\n${errorMessage}`,
          },
        ],
      };
    }
  }
}
