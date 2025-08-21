// MCP Protocol Types
export interface InitializeRequest {
  protocolVersion: string;
  capabilities: {
    tools: Record<string, unknown>;
    resources: Record<string, unknown>;
  };
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface InitializeResponse {
  protocolVersion: string;
  capabilities: {
    tools: Record<string, unknown>;
    resources: Record<string, unknown>;
  };
  serverInfo: {
    name: string;
    version: string;
  };
}

export interface ListToolsResponse {
  tools: Tool[];
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}

export interface CallToolRequest {
  name: string;
  arguments: Record<string, unknown>;
}

export interface CallToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

// Render Job Types
export interface RenderJob {
  id: string;
  compositionName: string;
  parameters: RenderParameters;
  status: RenderStatus;
  progress: number;
  startTime: Date;
  endTime?: Date;
  outputPath?: string;
  errorMessage?: string;
}

export type RenderStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface RenderParameters {
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  quality?: number;
  format?: 'mp4' | 'webm' | 'gif';
  [key: string]: unknown;
}

// Composition Types
export interface Composition {
  name: string;
  duration: number;
  fps: number;
  width: number;
  height: number;
  parameters: CompositionParameter[];
}

export interface CompositionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  defaultValue?: unknown;
  required: boolean;
  description: string;
  constraints?: ParameterConstraint;
}

export interface ParameterConstraint {
  min?: number;
  max?: number;
  pattern?: string;
  enum?: string[];
}

// Process Management Types
export interface ProcessResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
}

export interface ProcessStatus {
  isRunning: boolean;
  pid?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  value: unknown;
  constraint: string;
  message: string;
}

// Error Types
export interface MCPError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    timestamp: string;
    requestId: string;
  };
}

export interface ValidationErrorResponse extends MCPError {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: {
      field: string;
      value: unknown;
      constraint: string;
    };
    timestamp: string;
    requestId: string;
  };
}

export interface ProcessingErrorResponse extends MCPError {
  error: {
    code: 'PROCESSING_ERROR';
    message: string;
    details: {
      operation: string;
      reason: string;
    };
    timestamp: string;
    requestId: string;
  };
}
