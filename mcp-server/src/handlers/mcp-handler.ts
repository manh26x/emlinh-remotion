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
import { initializeTools } from './tools-config';
import { ProjectHandlers } from './project-handlers';
import { RenderHandlers } from './render-handlers';
import { OutputHandlers } from './output-handlers';
import { StreamingHandlers } from './streaming-handlers';
import { AudioHandlers } from './audio-handlers';

export class MCPHandler {
  private readonly tools: Tool[];
  private readonly remotionService: RemotionService;
  private readonly renderService: RenderService;
  private readonly systemService: SystemService;
  private readonly projectHandlers: ProjectHandlers;
  private readonly renderHandlers: RenderHandlers;
  private readonly outputHandlers: OutputHandlers;
  private readonly streamingHandlers: StreamingHandlers;
  private readonly audioHandlers: AudioHandlers;

  constructor() {
    this.tools = initializeTools();
    this.remotionService = new RemotionService();
    this.renderService = new RenderService();
    this.systemService = new SystemService();
    this.projectHandlers = new ProjectHandlers(this.remotionService);
    this.renderHandlers = new RenderHandlers(this.remotionService, this.renderService);
    this.outputHandlers = new OutputHandlers(this.renderService, this.systemService);
    this.streamingHandlers = new StreamingHandlers(this.renderService);
    this.audioHandlers = new AudioHandlers(this.renderHandlers);
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
          response = await this.projectHandlers.handleValidateProject();
          break;
        case 'list_compositions':
          response = await this.projectHandlers.handleListCompositions();
          break;
        case 'render_video':
          response = await this.renderHandlers.handleRenderVideo(request.arguments);
          break;
        case 'get_render_status':
          response = await this.renderHandlers.handleGetRenderStatus(request.arguments);
          break;
        case 'list_render_jobs':
          response = await this.renderHandlers.handleListRenderJobs(request.arguments);
          break;
        case 'get_render_output':
          response = await this.outputHandlers.handleGetRenderOutput(request.arguments);
          break;
        case 'list_render_outputs':
          response = await this.outputHandlers.handleListRenderOutputs(request.arguments);
          break;
        case 'delete_render_output':
          response = await this.outputHandlers.handleDeleteRenderOutput(request.arguments);
          break;
        case 'cleanup_render_outputs':
          response = await this.outputHandlers.handleCleanupRenderOutputs(request.arguments);
          break;
        case 'openVideo':
          response = await this.outputHandlers.handleOpenVideo(request.arguments);
          break;
        case 'cancel_render':
          response = await this.renderHandlers.handleCancelRender(request.arguments);
          break;
        case 'create_video_stream':
          response = await this.streamingHandlers.handleCreateVideoStream(request.arguments);
          break;
        case 'get_video_stream_info':
          response = await this.streamingHandlers.handleGetVideoStreamInfo(request.arguments);
          break;
        case 'stream_video_chunk':
          response = await this.streamingHandlers.handleStreamVideoChunk(request.arguments);
          break;
        case 'list_video_streams':
          response = await this.streamingHandlers.handleListVideoStreams(request.arguments);
          break;
        case 'cancel_video_stream':
          response = await this.streamingHandlers.handleCancelVideoStream(request.arguments);
          break;
        // TTS Integration Tools
        case 'generate_tts_audio':
          response = await this.audioHandlers.handleGenerateTTSAudio(request.arguments);
          break;
        case 'generate_script':
          response = await this.audioHandlers.handleGenerateScript(request.arguments);
          break;
        case 'render_video_with_tts':
          response = await this.audioHandlers.handleRenderVideoWithTTS(request.arguments);
          break;
        case 'list_audio_files':
          response = await this.audioHandlers.handleListAudioFiles(request.arguments);
          break;
        case 'delete_audio_file':
          response = await this.audioHandlers.handleDeleteAudioFile(request.arguments);
          break;
        case 'cleanup_audio_files':
          response = await this.audioHandlers.handleCleanupAudioFiles(request.arguments);
          break;
        // Lip-sync Integration Tools
        case 'convert_audio_format':
          response = await this.audioHandlers.handleConvertAudioFormat(request.arguments);
          break;
        case 'generate_lipsync_data':
          response = await this.audioHandlers.handleGenerateLipSyncData(request.arguments);
          break;
        case 'render_video_with_lipsync':
          response = await this.audioHandlers.handleRenderVideoWithLipSync(request.arguments);
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
      const property = (tool.inputSchema.properties as Record<string, { type?: string }>)[field];
      if (property && property.type === 'string') {
        ErrorHandler.validateString(value, field);
      } else if (property && property.type === 'number') {
        ErrorHandler.validateNumber(value, field);
      }
    }
  }
} 
