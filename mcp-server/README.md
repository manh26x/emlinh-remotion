# Remotion MCP Server

MCP (Model Context Protocol) server for Remotion video rendering integration. This server enables Claude AI to control Remotion video rendering through natural language commands.

## Features

- **MCP Protocol Compliance**: Implements the Model Context Protocol standard
- **Remotion Integration**: Direct integration with Remotion CLI commands
- **Composition Discovery**: List available video compositions
- **Render Management**: Trigger and monitor video rendering processes
- **Parameter Validation**: Validate render parameters before execution
- **Error Handling**: Comprehensive error handling and logging
- **TypeScript**: Full TypeScript support with strict type checking

## Prerequisites

- Node.js 18+ 
- Remotion CLI installed globally
- Existing Remotion project

## Installation

1. Navigate to the MCP server directory:
```bash
cd mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment template:
```bash
cp env.example .env
```

4. Configure environment variables in `.env`:
```bash
# MCP Server Configuration
REMOTION_PROJECT_PATH=../src
LOG_LEVEL=info
PORT=3001

# Remotion Configuration
REMOTION_OUTPUT_DIR=./output
REMOTION_CACHE_DIR=./cache

# Development Configuration
NODE_ENV=development
```

## Development

### Start Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Run Tests
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Watch mode
npm run test:watch
```

### Linting
```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix
```

### Type Checking
```bash
npm run type-check
```

## Project Structure

```
mcp-server/
├── src/
│   ├── handlers/          # MCP protocol handlers
│   ├── services/          # Business logic services
│   ├── models/            # Data models and types
│   ├── utils/             # Utilities (config, logger, etc.)
│   └── server.ts          # Main server entry point
├── tests/
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── dist/                  # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## MCP Tools

The server provides the following MCP tools:

### list_compositions
Lists all available Remotion compositions in the project.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {},
  "required": []
}
```

### render_video
Renders a video composition with specified parameters.

**Input Schema:**
```json
{
  "type": "object",
  "properties": {
    "composition": {
      "type": "string",
      "description": "Name of the composition to render"
    },
    "parameters": {
      "type": "object",
      "description": "Render parameters (width, height, fps, etc.)"
    }
  },
  "required": ["composition"]
}
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REMOTION_PROJECT_PATH` | Path to Remotion project | `../src` |
| `LOG_LEVEL` | Logging level | `info` |
| `PORT` | Server port | `3001` |
| `REMOTION_OUTPUT_DIR` | Output directory for renders | `./output` |
| `REMOTION_CACHE_DIR` | Cache directory | `./cache` |
| `NODE_ENV` | Environment | `development` |

## Error Handling

The server provides comprehensive error handling with the following error types:

- **VALIDATION_ERROR**: Parameter validation failures
- **PROCESSING_ERROR**: Remotion CLI execution errors
- **INTERNAL_ERROR**: Unexpected server errors

All errors include:
- Error code and message
- Timestamp and request ID
- Detailed context information

## Logging

The server uses Winston for structured logging with the following features:

- Console output in development
- File logging in production
- Configurable log levels
- Structured JSON format
- Context-specific logging methods

## Testing

### Unit Tests
Unit tests cover individual components and utilities:
- Configuration management
- Error handling
- Logging utilities
- Type validation

### Integration Tests
Integration tests verify:
- MCP protocol compliance
- Remotion CLI integration
- End-to-end workflows

### Running Tests
```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Coverage report
npm run test:coverage
```

## Contributing

1. Follow TypeScript strict mode guidelines
2. Write tests for new features
3. Update documentation as needed
4. Follow the established error handling patterns
5. Use the logging utilities for debugging

## License

MIT License - see LICENSE file for details.
