import { CallToolResponse } from '../models/types';
import { logger } from '../utils/logger';
import { RenderService } from '../services/render-service';
import { SystemService } from '../services/system-service';
import { config } from '../utils/config';

export class OutputHandlers {
  constructor(
    private readonly renderService: RenderService,
    private readonly systemService: SystemService
  ) {}

  async handleGetRenderOutput(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const jobId = arguments_['jobId'] as string;
      const output = await this.renderService.getRenderOutput(jobId);
      if (!output) {
        return {
          content: [
            { type: 'text', text: `❌ **No Output Found**\n\nJob '${jobId}' chưa hoàn thành hoặc không có output file.` }
          ]
        };
      }

      const sizeMB = Math.round((output.size / 1024 / 1024) * 100) / 100;
      const httpUrl = `http://localhost:${config.getStaticServerPort()}/${output.filename}`;
      const link = {
        type: 'resource_link' as const,
        uri: `remotion-output://${output.filename}`,
        name: output.filename,
        mimeType: output.contentType,
        description: 'Rendered video output file'
      };
      const text = `📄 **Render Output**\n\n` +
        `**Job ID:** ${output.jobId}\n` +
        `**Filename:** ${output.filename}\n` +
        `**Path:** ${output.path}\n` +
        `**Size:** ${sizeMB} MB\n` +
        `**Content Type:** ${output.contentType}\n` +
        `**Created:** ${output.createdAt.toLocaleString()}\n` +
        `**HTTP URL:** ${httpUrl}\n\n` +
        `Use the resource link below to open the video (or the HTTP URL).`;

      return { content: [{ type: 'text', text }, link] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get render output', { error: errorMessage, arguments_ });
      return { content: [{ type: 'text', text: `❌ **Get Output Failed**\n\n${errorMessage}` }] };
    }
  }

  async handleListRenderOutputs(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const limit = arguments_['limit'] as number | undefined;
      const outputs = await this.renderService.listRenderOutputs(limit);

      if (outputs.length === 0) {
        return { content: [{ type: 'text', text: `📋 **No Render Outputs Found**` }] };
      }

      const list = outputs.map((o, i) => {
        const sizeMB = Math.round((o.size / 1024 / 1024) * 100) / 100;
        const jobIdText = o.jobId ? `\n- Job ID: ${o.jobId}` : '';
        return `**${i + 1}. ${o.filename}**\n- Path: ${o.path}${jobIdText}\n- Size: ${sizeMB} MB\n- Type: ${o.contentType}\n- Created: ${o.createdAt.toLocaleString()}`;
      }).join('\n\n');

      const links = outputs.map((o) => ({
        type: 'resource_link' as const,
        uri: `remotion-output://${o.filename}`,
        name: o.filename,
        mimeType: o.contentType,
        description: 'Rendered video output file'
      }));

      return { content: [
        { type: 'text', text: `📂 **Render Outputs** (${outputs.length}${limit ? ` of ${limit}` : ''})\n\n${list}` },
        ...links
      ] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list render outputs', { error: errorMessage, arguments_ });
      return { content: [{ type: 'text', text: `❌ **List Outputs Failed**\n\n${errorMessage}` }] };
    }
  }

  async handleDeleteRenderOutput(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const jobId = arguments_['jobId'] as string | undefined;
      const path = arguments_['path'] as string | undefined;
      const ok = await this.renderService.deleteRenderOutput({ 
        jobId: jobId || undefined, 
        path: path || undefined 
      });
      if (!ok) {
        return { content: [{ type: 'text', text: `❌ **Delete Failed**\n\nKhông tìm thấy hoặc xóa không thành công.` }] };
      }
      return { content: [{ type: 'text', text: `🗑️ **Output Deleted**` }] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to delete render output', { error: errorMessage, arguments_ });
      return { content: [{ type: 'text', text: `❌ **Delete Failed**\n\n${errorMessage}` }] };
    }
  }

  async handleCleanupRenderOutputs(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const olderThanHours = (arguments_['olderThanHours'] as number) ?? 24;
      const deleted = await this.renderService.cleanupRenderOutputs(olderThanHours);
      return { content: [{ type: 'text', text: `🧹 **Cleanup Completed**\n\nDeleted: ${deleted} files (older than ${olderThanHours}h)` }] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to cleanup render outputs', { error: errorMessage, arguments_ });
      return { content: [{ type: 'text', text: `❌ **Cleanup Failed**\n\n${errorMessage}` }] };
    }
  }

  async handleOpenVideo(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const filePath = arguments_['filePath'] as string;

      const result = await this.systemService.openFileWithDefaultApp(filePath);

      if (!result.success) {
        return {
          content: [{ type: 'text', text: `❌ **Open Video Failed**\n\n${result.message}` }],
        };
      }

      return {
        content: [{ type: 'text', text: `✅ **Video opened**\n\nPath: ${result.resolvedPath}` }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to open video', { error: errorMessage, arguments_ });
      return { content: [{ type: 'text', text: `❌ **Open Video Failed**\n\n${errorMessage}` }] };
    }
  }
}
