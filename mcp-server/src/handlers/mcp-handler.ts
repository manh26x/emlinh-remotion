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

export class MCPHandler {
  private readonly tools: Tool[];

  constructor() {
    this.tools = this.initializeTools();
  }

  private initializeTools(): Tool[] {
    return [
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

  private async handleListCompositions(): Promise<CallToolResponse> {
    // TODO: Implement composition discovery
    // This will be implemented in Epic 2
    return {
      content: [
        {
          type: 'text',
          text: 'Composition discovery will be implemented in the next epic. For now, this is a placeholder response.',
        },
      ],
    };
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
