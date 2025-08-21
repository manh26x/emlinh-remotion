import { CallToolResponse } from '../models/types';
import { logger } from '../utils/logger';
import { RenderService } from '../services/render-service';

export class StreamingHandlers {
  constructor(private readonly renderService: RenderService) {}

  async handleCreateVideoStream(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const jobId = arguments_['jobId'] as string;

      const stream = await this.renderService.createVideoStream(jobId);

      return {
        content: [
          {
            type: 'text',
            text: `🎥 **Video Stream Created**\n\n**Stream ID:** ${stream.id}\n**Job ID:** ${stream.jobId}\n**Status:** ${stream.status}\n**Content Type:** ${stream.contentType}\n**Total Size:** ${Math.round(stream.totalBytes / 1024 / 1024 * 100) / 100} MB\n\nUse 'get_video_stream_info' with stream ID to get stream details.\nUse 'stream_video_chunk' to start streaming video data.`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to create video stream', { error: errorMessage });
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Video Stream Creation Failed**\n\n${errorMessage}\n\nMake sure the render job is completed and has an output file.`,
          },
        ],
      };
    }
  }

  async handleGetVideoStreamInfo(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const streamId = arguments_['streamId'] as string;

      const stream = await this.renderService.getVideoStreamInfo(streamId);
      if (!stream) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ **Video Stream Not Found**\n\nStream ID '${streamId}' does not exist.\n\nUse 'list_video_streams' to see all available streams.`,
            },
          ],
        };
      }

      const statusEmoji = {
        preparing: '⏳',
        streaming: '🎥',
        completed: '✅',
        error: '❌'
      }[stream.status as keyof typeof statusEmoji] || '❓';

      const progress = Math.round((stream.streamedBytes / stream.totalBytes) * 100);
      const sizeMB = Math.round(stream.totalBytes / 1024 / 1024 * 100) / 100;

      let statusText = `${statusEmoji} **Video Stream Status: ${stream.status.toUpperCase()}**\n\n`;
      statusText += `**Stream ID:** ${stream.id}\n`;
      statusText += `**Job ID:** ${stream.jobId}\n`;
      statusText += `**Progress:** ${progress}% (${stream.streamedBytes} / ${stream.totalBytes} bytes)\n`;
      statusText += `**File Size:** ${sizeMB} MB\n`;
      statusText += `**Content Type:** ${stream.contentType}\n`;
      statusText += `**Started:** ${stream.startTime.toLocaleString()}\n`;

      if (stream.endTime) {
        statusText += `**Completed:** ${stream.endTime.toLocaleString()}\n`;
      }

      if (stream.error) {
        statusText += `\n**Error:** ${stream.error}\n`;
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
      logger.error('Failed to get video stream info', { error: errorMessage });
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Failed to Get Stream Info**\n\n${errorMessage}`,
          },
        ],
      };
    }
  }

  async handleStreamVideoChunk(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const streamId = arguments_['streamId'] as string;
      const offset = (arguments_['offset'] as number) || 0;

      const chunk = await this.renderService.streamVideoChunk(streamId, offset);

      const chunkSizeKB = Math.round(chunk.chunk.length / 1024 * 100) / 100;
      const progress = Math.round((chunk.offset / chunk.total) * 100);

      return {
        content: [
          {
            type: 'text',
            text: `🎥 **Video Chunk Streamed**\n\n**Stream ID:** ${streamId}\n**Chunk Size:** ${chunkSizeKB} KB\n**Offset:** ${chunk.offset} / ${chunk.total} bytes\n**Progress:** ${progress}%\n**Is Last Chunk:** ${chunk.isLast ? 'Yes' : 'No'}\n\nVideo data is ready for transmission to client.`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to stream video chunk', { error: errorMessage });
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Video Streaming Failed**\n\n${errorMessage}\n\nMake sure the stream is active and the offset is valid.`,
          },
        ],
      };
    }
  }

  async handleListVideoStreams(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const streams = await this.renderService.listVideoStreams();

      if (streams.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `📋 **No Video Streams Found**\n\nNo video streams have been created yet.\n\nUse 'create_video_stream' with a completed render job to start streaming.`,
            },
          ],
        };
      }

      const streamsList = streams.map((stream, index) => {
        const statusEmoji = {
          preparing: '⏳',
          streaming: '🎥',
          completed: '✅',
          error: '❌'
        }[stream.status as keyof typeof statusEmoji] || '❓';

        const progress = Math.round((stream.streamedBytes / stream.totalBytes) * 100);
        const sizeMB = Math.round(stream.totalBytes / 1024 / 1024 * 100) / 100;

        return `**${index + 1}. Stream ${stream.id}** ${statusEmoji}\n- Job ID: ${stream.jobId}\n- Status: ${stream.status} (${progress}%)\n- Size: ${sizeMB} MB\n- Started: ${stream.startTime.toLocaleString()}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `🎥 **Video Streams** (${streams.length} total)\n\n${streamsList}\n\nUse 'get_video_stream_info' with stream ID for detailed status.`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list video streams', { error: errorMessage });
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Failed to List Streams**\n\n${errorMessage}`,
          },
        ],
      };
    }
  }

  async handleCancelVideoStream(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const streamId = arguments_['streamId'] as string;

      const success = await this.renderService.cancelVideoStream(streamId);
      
      if (!success) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ **Cancel Failed**\n\nStream ID '${streamId}' not found or cannot be cancelled (already completed/error).\n\nUse 'list_video_streams' to see available streams.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `🚫 **Video Stream Cancelled**\n\nStream ID '${streamId}' has been successfully cancelled.\n\nUse 'get_video_stream_info' to confirm the cancellation.`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to cancel video stream', { error: errorMessage });
      
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
