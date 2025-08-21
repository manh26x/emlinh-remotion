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

export class MCPHandler {
  private readonly tools: Tool[];
  private readonly remotionService: RemotionService;
  private readonly renderService: RenderService;

  constructor() {
    this.tools = this.initializeTools();
    this.remotionService = new RemotionService();
    this.renderService = new RenderService();
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
        case 'cancel_render':
          response = await this.handleCancelRender(request.arguments);
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
}
