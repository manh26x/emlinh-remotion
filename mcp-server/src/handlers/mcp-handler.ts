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

export class MCPHandler {
  private readonly tools: Tool[];
  private readonly remotionService: RemotionService;

  constructor() {
    this.tools = this.initializeTools();
    this.remotionService = new RemotionService();
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
              description: 'Render parameters (width, height, fps, etc.)',
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
    const composition = arguments_.composition as string;
    const parameters = arguments_.parameters as Record<string, unknown> || {};

    // TODO: Implement render video logic
    // This will be implemented in Epic 3
    return {
      content: [
        {
          type: 'text',
          text: `Render video request received for composition '${composition}' with parameters: ${JSON.stringify(parameters)}. Render functionality will be implemented in Epic 3.`,
        },
      ],
    };
  }

  private async handleGetRenderStatus(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    const jobId = arguments_.jobId as string;

    // TODO: Implement render status checking
    // This will be implemented in Epic 3
    return {
      content: [
        {
          type: 'text',
          text: `Render status request received for job '${jobId}'. Status checking will be implemented in Epic 3.`,
        },
      ],
    };
  }

  private async handleCancelRender(arguments_: Record<string, unknown>): Promise<CallToolResponse> {
    const jobId = arguments_.jobId as string;

    // TODO: Implement render cancellation
    // This will be implemented in Epic 3
    return {
      content: [
        {
          type: 'text',
          text: `Cancel render request received for job '${jobId}'. Cancellation functionality will be implemented in Epic 3.`,
        },
      ],
    };
  }
}
