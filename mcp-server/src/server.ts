import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { logger } from './utils/logger.js';
import { config } from './utils/config.js';
import { MCPHandler } from './handlers/mcp-handler.js';

class RemotionMCPServer {
  private mcp: McpServer;
  private handler: MCPHandler;

  constructor() {
    console.error('Creating RemotionMCPServer...');
    
    // Khởi tạo server với thông tin cơ bản
    console.error('Initializing MCP Server...');
    this.mcp = new McpServer({
      name: 'remotion-mcp-server',
      version: '1.0.0',
    });
    this.handler = new MCPHandler();

    this.setupServer();
  }

  private setupServer(): void {
    console.error('Setting up server...');
    
    // Register capabilities and expose tools
    this.mcp.server.registerCapabilities({
      tools: {
        listChanged: true,
      },
    });

    // Helper to register a tool that forwards to handler.callTool
    const registerTool = (
      name: string,
      description: string,
      inputSchema: ReturnType<typeof z.object>
    ) => {
      this.mcp.registerTool(
        name,
        {
          description,
          inputSchema: inputSchema.shape,
        },
        async (args) => {
          const resp = await this.handler.handleCallTool({ name, arguments: args as unknown as Record<string, unknown> });
          return resp as unknown as { [x: string]: unknown; content: any[] };
        }
      );
    };

    // validate_project
    registerTool(
      'validate_project',
      'Validate Remotion project structure and configuration',
      z.object({})
    );

    // list_compositions
    registerTool(
      'list_compositions',
      'List available Remotion compositions in the project',
      z.object({})
    );

    // render_video
    registerTool(
      'render_video',
      'Render a video composition with specified parameters',
      z.object({
        composition: z.string(),
        parameters: z
          .object({
            width: z.number().optional(),
            height: z.number().optional(),
            fps: z.number().optional(),
            durationInFrames: z.number().optional(),
            quality: z.number().optional(),
            concurrency: z.number().optional(),
            scale: z.number().optional(),
          })
          .partial()
          .optional(),
      })
    );

    // get_render_status
    registerTool(
      'get_render_status',
      'Get the status of a render job',
      z.object({
        jobId: z.string(),
      })
    );

    // list_render_jobs
    registerTool(
      'list_render_jobs',
      'List all render jobs with their current status',
      z.object({
        limit: z.number().optional(),
      })
    );

    // cancel_render
    registerTool(
      'cancel_render',
      'Cancel an ongoing render job',
      z.object({
        jobId: z.string(),
      })
    );

    console.error('Server setup completed');
    logger.info('Server setup completed');
  }

  public async start(): Promise<void> {
    try {
      console.error('Starting server...');
      
      // Validate configuration
      await config.validateConfig();
      
      logger.info('Starting Remotion MCP Server', {
        version: '1.0.0',
        nodeEnv: config.isDevelopment() ? 'development' : 'production',
        logLevel: config.getLogLevel(),
      });

      // Create transport
      console.error('Creating transport...');
      const transport = new StdioServerTransport();
      
      // Start server
      console.error('Connecting server...');
      await this.mcp.connect(transport);
      
      console.error('Server connected successfully');
      logger.info('Remotion MCP Server started successfully');
      
      // Handle graceful shutdown
      process.on('SIGINT', () => this.gracefulShutdown());
      process.on('SIGTERM', () => this.gracefulShutdown());
      
    } catch (error) {
      console.error('Server start error:', error);
      logger.logError('Server Start', error as Error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(): Promise<void> {
    try {
      console.error('Shutting down server...');
      logger.info('Shutting down Remotion MCP Server...');
      
      // Close server connection
      await this.mcp.close();
      
      console.error('Server shutdown complete');
      logger.info('Remotion MCP Server shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Shutdown error:', error);
      logger.logError('Server Shutdown', error as Error);
      process.exit(1);
    }
  }
}

// Start server if this file is run directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  console.error('Starting MCP server...');
  const server = new RemotionMCPServer();
  server.start().catch((error) => {
    console.error('Server startup error:', error);
    logger.logError('Server Startup', error);
    process.exit(1);
  });
}

export { RemotionMCPServer };
