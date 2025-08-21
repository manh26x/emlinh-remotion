import { describe, it, expect, beforeEach } from '@jest/globals';
import { MCPHandler } from '../../src/handlers/mcp-handler.js';
import { InitializeRequest, CallToolRequest } from '../../src/models/types.js';

describe('MCPHandler', () => {
  let handler: MCPHandler;

  beforeEach(() => {
    handler = new MCPHandler();
  });

  describe('handleInitialize', () => {
    it('should return correct initialization response', async () => {
      const request: InitializeRequest = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
        },
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      };

      const response = await handler.handleInitialize(request);

      expect(response).toEqual({
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
        },
        serverInfo: {
          name: 'remotion-mcp-server',
          version: '1.0.0',
        },
      });
    });
  });

  describe('handleListTools', () => {
    it('should return list of available tools', async () => {
      const response = await handler.handleListTools();

      expect(response.tools).toBeDefined();
      expect(Array.isArray(response.tools)).toBe(true);
      expect(response.tools.length).toBeGreaterThan(0);

      // Check for expected tools
      const toolNames = response.tools.map(tool => tool.name);
      expect(toolNames).toContain('list_compositions');
      expect(toolNames).toContain('render_video');
      expect(toolNames).toContain('get_render_status');
      expect(toolNames).toContain('cancel_render');
    });
  });

  describe('handleCallTool', () => {
    it('should handle list_compositions tool', async () => {
      const request: CallToolRequest = {
        name: 'list_compositions',
        arguments: {},
      };

      const response = await handler.handleCallTool(request);

      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.content[0]?.type).toBe('text');
    });

    it('should handle render_video tool', async () => {
      const request: CallToolRequest = {
        name: 'render_video',
        arguments: {
          composition: 'test-composition',
          parameters: { width: 1920, height: 1080 },
        },
      };

      const response = await handler.handleCallTool(request);

      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.content[0]?.type).toBe('text');
      expect(response.content[0]?.text).toContain('test-composition');
    });

    it('should handle get_render_status tool', async () => {
      const request: CallToolRequest = {
        name: 'get_render_status',
        arguments: {
          jobId: 'test-job-id',
        },
      };

      const response = await handler.handleCallTool(request);

      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.content[0]?.type).toBe('text');
      expect(response.content[0]?.text).toContain('test-job-id');
    });

    it('should handle cancel_render tool', async () => {
      const request: CallToolRequest = {
        name: 'cancel_render',
        arguments: {
          jobId: 'test-job-id',
        },
      };

      const response = await handler.handleCallTool(request);

      expect(response.content).toBeDefined();
      expect(Array.isArray(response.content)).toBe(true);
      expect(response.content.length).toBeGreaterThan(0);
      expect(response.content[0]?.type).toBe('text');
      expect(response.content[0]?.text).toContain('test-job-id');
    });

    it('should throw error for non-existent tool', async () => {
      const request: CallToolRequest = {
        name: 'non_existent_tool',
        arguments: {},
      };

      await expect(handler.handleCallTool(request)).rejects.toThrow();
    });

    it('should throw error for missing required arguments', async () => {
      const request: CallToolRequest = {
        name: 'render_video',
        arguments: {}, // Missing required 'composition' argument
      };

      await expect(handler.handleCallTool(request)).rejects.toThrow();
    });
  });
});
