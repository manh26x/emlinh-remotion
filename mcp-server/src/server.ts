import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { MCPHandler } from './handlers/mcp-handler.js';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import { ErrorHandler } from './utils/error-handler.js';

class RemotionMCPServer {
  private server: Server;
  private mcpHandler: MCPHandler;

  constructor() {
    this.mcpHandler = new MCPHandler();
    this.server = new Server(
      {
        name: 'remotion-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupServer();
  }

  private setupServer(): void {
    // Handle initialization
    this.server.setRequestHandler('initialize', async (request) => {
      try {
        logger.info('Initializing MCP server', { clientInfo: request.params.clientInfo });
        
        const response = await this.mcpHandler.handleInitialize(request.params);
        
        logger.info('MCP server initialized successfully');
        return response;
      } catch (error) {
        logger.logError('Server Initialize', error as Error);
        throw error;
      }
    });

    // Handle list tools
    this.server.setRequestHandler('tools/list', async () => {
      try {
        logger.info('Listing MCP tools');
        
        const response = await this.mcpHandler.handleListTools();
        
        logger.info('MCP tools listed successfully', { toolCount: response.tools.length });
        return response;
      } catch (error) {
        logger.logError('Server List Tools', error as Error);
        throw error;
      }
    });

    // Handle call tool
    this.server.setRequestHandler('tools/call', async (request) => {
      try {
        const { name, arguments: args } = request.params;
        logger.info('Calling MCP tool', { toolName: name, arguments: args });
        
        const response = await this.mcpHandler.handleCallTool({ name, arguments: args });
        
        logger.info('MCP tool called successfully', { toolName: name });
        return response;
      } catch (error) {
        logger.logError('Server Call Tool', error as Error);
        
        // Convert error to MCP error format
        const mcpError = ErrorHandler.handleError(error as Error, 'MCP Tool Call');
        throw new Error(JSON.stringify(mcpError));
      }
    });

    // Handle ping (for health checks)
    this.server.setRequestHandler('ping', async () => {
      logger.debug('Ping received');
      return { timestamp: new Date().toISOString() };
    });
  }

  public async start(): Promise<void> {
    try {
      // Validate configuration
      config.validateConfig();
      
      logger.info('Starting Remotion MCP Server', {
        version: '1.0.0',
        nodeEnv: config.isDevelopment() ? 'development' : 'production',
        logLevel: config.getLogLevel(),
      });

      // Create transport
      const transport = new StdioServerTransport();
      
      // Start server
      await this.server.connect(transport);
      
      logger.info('Remotion MCP Server started successfully');
      
      // Handle graceful shutdown
      process.on('SIGINT', () => this.gracefulShutdown());
      process.on('SIGTERM', () => this.gracefulShutdown());
      
    } catch (error) {
      logger.logError('Server Start', error as Error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(): Promise<void> {
    try {
      logger.info('Shutting down Remotion MCP Server...');
      
      // Close server connection
      await this.server.close();
      
      logger.info('Remotion MCP Server shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.logError('Server Shutdown', error as Error);
      process.exit(1);
    }
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new RemotionMCPServer();
  server.start().catch((error) => {
    logger.logError('Server Startup', error);
    process.exit(1);
  });
}

export { RemotionMCPServer };
