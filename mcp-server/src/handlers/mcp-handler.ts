import {
  InitializeRequest,
  InitializeResponse,
  ListToolsResponse,
  CallToolRequest,
  CallToolResponse,
  Tool,
} from '../models/types';
import { logger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';
import { RemotionService } from '../services/remotion-service';
import { RenderService } from '../services/render-service';
import { SystemService } from '../services/system-service';

export class MCPHandler {
  private readonly tools: Tool[];
  private readonly remotionService: RemotionService;
  private readonly renderService: RenderService;
  private readonly systemService: SystemService;

  constructor() {
    this.tools = this.initializeTools();
    this.remotionService = new RemotionService();
    this.renderService = new RenderService();
    this.systemService = new SystemService();
  }

  private initializeTools(): Tool[] {
    return [
      {
        name: 'validate_project',
        description: 'Validate Remotion project structure and configuration',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'list_compositions',
        description: 'List available Remotion compositions in the project',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'render_video',
        description: 'Render a video composition with specified parameters',
        inputSchema: {
          type: 'object',
          properties: {
            composition: {
              type: 'string',
              description: 'Name of the composition to render',
            },
            parameters: {
              type: 'object',
              description: 'Render parameters (width, height, fps, quality, concurrency, etc.)',
              properties: {
                width: { type: 'number', description: 'Video width in pixels' },
                height: { type: 'number', description: 'Video height in pixels' },
                fps: { type: 'number', description: 'Frames per second' },
                durationInFrames: { type: 'number', description: 'Duration in frames' },
                quality: { type: 'number', description: 'Video quality (1-10)' },
                concurrency: { type: 'number', description: 'Number of parallel render processes' },
                scale: { type: 'number', description: 'Scale factor (0.5, 1, 2, etc.)' }
              }
            },
          },
          required: ['composition'],
        },
      },
      {
        name: 'get_render_status',
        description: 'Get the status of a render job',
        inputSchema: {
          type: 'object',
          properties: {
            jobId: {
              type: 'string',
              description: 'ID of the render job',
            },
          },
          required: ['jobId'],
        },
      },
      {
        name: 'list_render_jobs',
        description: 'List all render jobs with their current status',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of jobs to return (default: all)',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_render_output',
        description: 'Get completed render output file metadata for a job (file-based workflow)',
        inputSchema: {
          type: 'object',
          properties: {
            jobId: {
              type: 'string',
              description: 'ID of the completed render job',
            },
          },
          required: ['jobId'],
        },
      },
      {
        name: 'list_render_outputs',
        description: 'List recent render output files (file-based workflow)',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of outputs to return',
            },
          },
          required: [],
        },
      },
      {
        name: 'delete_render_output',
        description: 'Delete a render output file by jobId or path',
        inputSchema: {
          type: 'object',
          properties: {
            jobId: { type: 'string', description: 'Render job ID' },
            path: { type: 'string', description: 'Absolute file path' },
          },
          required: [],
        },
      },
      {
        name: 'cleanup_render_outputs',
        description: 'Cleanup old render outputs older than N hours',
        inputSchema: {
          type: 'object',
          properties: {
            olderThanHours: { type: 'number', description: 'Threshold in hours (default 24)' },
          },
          required: [],
        },
      },
      {
        name: 'openVideo',
        description: 'Open a video file using the system default player',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: { type: 'string', description: 'Absolute or relative path to video file' },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'create_video_stream',
        description: 'Create a video stream from a completed render job',
        inputSchema: {
          type: 'object',
          properties: {
            jobId: {
              type: 'string',
              description: 'ID of the completed render job',
            },
          },
          required: ['jobId'],
        },
      },
      {
        name: 'get_video_stream_info',
        description: 'Get information about a video stream',
        inputSchema: {
          type: 'object',
          properties: {
            streamId: {
              type: 'string',
              description: 'ID of the video stream',
            },
          },
          required: ['streamId'],
        },
      },
      {
        name: 'stream_video_chunk',
        description: 'Stream a chunk of video data',
        inputSchema: {
          type: 'object',
          properties: {
            streamId: {
              type: 'string',
              description: 'ID of the video stream',
            },
            offset: {
              type: 'number',
              description: 'Byte offset to start streaming from (default: 0)',
            },
          },
          required: ['streamId'],
        },
      },
      {
        name: 'list_video_streams',
        description: 'List all active video streams',
        inputSchema: {
          type: 'object',
          properties: {},
          required: [],
        },
      },
      {
        name: 'cancel_video_stream',
        description: 'Cancel an active video stream',
        inputSchema: {
          type: 'object',
          properties: {
            streamId: {
              type: 'string',
              description: 'ID of the video stream to cancel',
            },
          },
          required: ['streamId'],
        },
      },
      {
        name: 'cancel_render',
        description: 'Cancel an ongoing render job',
        inputSchema: {
          type: 'object',
          properties: {
            jobId: {
              type: 'string',
              description: 'ID of the render job to cancel',
            },
          },
          required: ['jobId'],
        },
      },
    ];
  }

  public async handleInitialize(request: InitializeRequest): Promise<InitializeResponse> {
    try {
      logger.logMCPRequest('initialize', { clientInfo: request.clientInfo });

      const response: InitializeResponse = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
        },
        serverInfo: {
          name: 'remotion-mcp-server',
          version: '1.0.0',
        },
      };

      logger.logMCPResponse('initialize', response);
      return response;
    } catch (error) {
      logger.logError('MCP Initialize', error as Error);
      throw error;
    }
  }

  public async handleListTools(): Promise<ListToolsResponse> {
    try {
      logger.logMCPRequest('list_tools');

      const response: ListToolsResponse = {
        tools: this.tools,
      };

      logger.logMCPResponse('list_tools', response);
      return response;
    } catch (error) {
      logger.logError('MCP List Tools', error as Error);
      throw error;
    }
  }

  public async handleCallTool(request: CallToolRequest): Promise<CallToolResponse> {
    try {
      logger.logMCPRequest('call_tool', { name: request.name, arguments: request.arguments });

      // Validate tool exists
      const tool = this.tools.find((t) => t.name === request.name);
      if (!tool) {
        throw ErrorHandler.createProcessingError(
          'call_tool',
          'tool_not_found',
          `Tool '${request.name}' not found`
        );
      }

      // Validate required arguments
      this.validateToolArguments(tool, request.arguments);

      // Route to appropriate tool handler
      let response: CallToolResponse;
      switch (request.name) {
        case 'validate_project':
          response = await this.handleValidateProject();
          break;
        case 'list_compositions':
          response = await this.handleListCompositions();
          break;
        case 'render_video':
          response = await this.handleRenderVideo(request.arguments);
          break;
        case 'get_render_status':
          response = await this.handleGetRenderStatus(request.arguments);
          break;
        case 'list_render_jobs':
          response = await this.handleListRenderJobs(request.arguments);
          break;
        case 'get_render_output':
          response = await this.handleGetRenderOutput(request.arguments);
          break;
        case 'list_render_outputs':
          response = await this.handleListRenderOutputs(request.arguments);
          break;
        case 'delete_render_output':
          response = await this.handleDeleteRenderOutput(request.arguments);
          break;
        case 'cleanup_render_outputs':
          response = await this.handleCleanupRenderOutputs(request.arguments);
          break;
        case 'openVideo':
          response = await this.handleOpenVideo(request.arguments);
          break;
        case 'cancel_render':
          response = await this.handleCancelRender(request.arguments);
          break;
        case 'create_video_stream':
          response = await this.handleCreateVideoStream(request.arguments);
          break;
        case 'get_video_stream_info':
          response = await this.handleGetVideoStreamInfo(request.arguments);
          break;
        case 'stream_video_chunk':
          response = await this.handleStreamVideoChunk(request.arguments);
          break;
        case 'list_video_streams':
          response = await this.handleListVideoStreams(request.arguments);
          break;
        case 'cancel_video_stream':
          response = await this.handleCancelVideoStream(request.arguments);
          break;
        default:
          throw ErrorHandler.createProcessingError(
            'call_tool',
            'unsupported_tool',
            `Tool '${request.name}' is not yet implemented`
          );
      }

      logger.logMCPResponse('call_tool', response);
      return response;
    } catch (error) {
      logger.logError('MCP Call Tool', error as Error);
      throw error;
    }
  }

  private validateToolArguments(tool: Tool, arguments_: Record<string, unknown>): void {
    const requiredFields = tool.inputSchema.required || [];
    
    for (const field of requiredFields) {
      ErrorHandler.validateRequired(arguments_[field], field, 'MCP Tool Arguments');
    }

    // Validate argument types based on schema
    for (const [field, value] of Object.entries(arguments_)) {
      const property = tool.inputSchema.properties[field];
      if (property && property.type === 'string') {
        ErrorHandler.validateString(value, field);
      } else if (property && property.type === 'number') {
        ErrorHandler.validateNumber(value, field);
      }
    }
  }

  private async handleValidateProject(): Promise<CallToolResponse> {
    try {
      const validation = await this.remotionService.validateProject();
      
      const status = validation.isValid ? '✅' : '❌';
      const statusText = validation.isValid ? 'Valid' : 'Invalid';
      
      const errorSection = validation.errors.length > 0 
        ? `\n\n**❌ Errors:**\n${validation.errors.map(e => `- ${e}`).join('\n')}`
        : '';
      
      const warningSection = validation.warnings.length > 0
        ? `\n\n**⚠️ Warnings:**\n${validation.warnings.map(w => `- ${w}`).join('\n')}`
        : '';
      
      const compositionSection = validation.compositions.length > 0
        ? `\n\n**🎬 Compositions Found:** ${validation.compositions.length}`
        : '\n\n**📋 No Compositions Found**';

      return {
        content: [
          {
            type: 'text',
            text: `${status} **Project Validation: ${statusText}**${errorSection}${warningSection}${compositionSection}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to validate project', { error: errorMessage });
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Project Validation Failed**\n\n${errorMessage}\n\nPlease check the project structure and ensure Remotion is properly configured.`,
          },
        ],
      };
    }
  }

  private async handleListCompositions(): Promise<CallToolResponse> {
    try {
      // Validate project first
      const validation = await this.remotionService.validateProject();
      
      if (!validation.isValid) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ **Project Validation Failed**\n\n**Errors:**\n${validation.errors.map(e => `- ${e}`).join('\n')}\n\n**Warnings:**\n${validation.warnings.map(w => `- ${w}`).join('\n')}`,
            },
          ],
        };
      }

      // Discover compositions
      const compositions = await this.remotionService.discoverCompositions();
      
      if (compositions.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: '📋 **No Compositions Found**\n\nNo Remotion compositions were discovered in the project. Please ensure that:\n- The project has a valid `src` directory\n- Composition components are defined in `.tsx` files\n- Compositions have valid `id` attributes',
            },
          ],
        };
      }

      // Format composition list
      const compositionList = compositions.map(comp => {
        const durationInSeconds = Math.round(comp.durationInFrames / comp.fps * 100) / 100;
        return `**${comp.id}**\n- Resolution: ${comp.width}x${comp.height}\n- Duration: ${durationInSeconds}s (${comp.durationInFrames} frames)\n- FPS: ${comp.fps}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `🎬 **Available Compositions** (${compositions.length} found)\n\n${compositionList}\n\n**Warnings:**\n${validation.warnings.map(w => `- ${w}`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list compositions', { error: errorMessage });
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Error Listing Compositions**\n\n${errorMessage}\n\nPlease check the project structure and ensure Remotion is properly configured.`,
          },
        ],
      };
    }
  }

  private async handleRenderVideo(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const composition = arguments_.composition as string;
      const parameters = (arguments_.parameters as Record<string, unknown>) || {};

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

  private async handleGetRenderStatus(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const jobId = arguments_.jobId as string;

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

  private async handleListRenderJobs(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const limit = arguments_.limit as number | undefined;

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

  // File-based handlers

  private async handleGetRenderOutput(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const jobId = arguments_.jobId as string;
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

  private async handleListRenderOutputs(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const limit = arguments_.limit as number | undefined;
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

  private async handleDeleteRenderOutput(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const jobId = arguments_.jobId as string | undefined;
      const path = arguments_.path as string | undefined;
      const ok = await this.renderService.deleteRenderOutput({ jobId, path });
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

  private async handleCleanupRenderOutputs(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const olderThanHours = (arguments_.olderThanHours as number) ?? 24;
      const deleted = await this.renderService.cleanupRenderOutputs(olderThanHours);
      return { content: [{ type: 'text', text: `🧹 **Cleanup Completed**\n\nDeleted: ${deleted} files (older than ${olderThanHours}h)` }] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to cleanup render outputs', { error: errorMessage, arguments_ });
      return { content: [{ type: 'text', text: `❌ **Cleanup Failed**\n\n${errorMessage}` }] };
    }
  }

  private async handleOpenVideo(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const filePath = arguments_.filePath as string;
      ErrorHandler.validateString(filePath, 'filePath', 'openVideo');

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
  private async handleCancelRender(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const jobId = arguments_.jobId as string;

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

  // Video Streaming Handlers

  private async handleCreateVideoStream(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const jobId = arguments_.jobId as string;

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

  private async handleGetVideoStreamInfo(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const streamId = arguments_.streamId as string;

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
      }[stream.status] || '❓';

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

  private async handleStreamVideoChunk(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const streamId = arguments_.streamId as string;
      const offset = (arguments_.offset as number) || 0;

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

  private async handleListVideoStreams(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
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
        }[stream.status] || '❓';

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

  private async handleCancelVideoStream(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    try {
      const streamId = arguments_.streamId as string;

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
