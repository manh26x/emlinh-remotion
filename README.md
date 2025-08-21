# Emlinh Remotion - AI-Powered Video Generation

Dự án Remotion với tích hợp MCP (Model Context Protocol) server để cho phép Claude AI điều khiển video rendering thông qua natural language commands.

## 🎯 Tổng quan

Emlinh Remotion là một dự án video generation sử dụng Remotion framework, được tích hợp với MCP server để cho phép AI assistant (Claude) có thể:

- **Liệt kê compositions** có sẵn trong dự án
- **Trigger video rendering** với parameters tùy chỉnh
- **Monitor render progress** và status
- **Cancel render jobs** khi cần thiết

## ✨ Tính năng chính

### 🎬 Remotion Video Generation
- **Avatar Animation** với lip-sync và blink logic
- **Background Systems** (Abstract, Office)
- **Audio Integration** với mouth cue processing
- **Custom Hooks** cho animation logic

### 🤖 MCP Server Integration
- **MCP Protocol Compliance** - Tuân thủ Model Context Protocol standard
- **4 MCP Tools** được implement:
  - `list_compositions` - Liệt kê video compositions
  - `render_video` - Render video với parameters
  - `get_render_status` - Kiểm tra trạng thái render
  - `cancel_render` - Hủy render job
- **TypeScript Strict Mode** với comprehensive type safety
- **Error Handling & Logging** system
- **Configuration Management** với environment variables

## 🏗️ Kiến trúc dự án

```
emlinh-remotion/
├── src/                          # Remotion source code
│   ├── Root.tsx                  # Main composition
│   ├── Scene.tsx                 # Scene component
│   ├── Avatar.jsx                # Avatar component
│   ├── backgrounds/              # Background components
│   ├── hooks/                    # Custom hooks
│   │   ├── lipSync/             # Lip-sync logic
│   │   └── useBlinkLogic.ts     # Blink animation
│   └── utils/                    # Utilities
├── mcp-server/                   # MCP Server package
│   ├── src/
│   │   ├── handlers/            # MCP protocol handlers
│   │   ├── services/            # Business logic
│   │   ├── models/              # TypeScript types
│   │   ├── utils/               # Utilities
│   │   └── server.ts            # Main server
│   ├── tests/                   # Unit & integration tests
│   └── package.json             # MCP server dependencies
├── docs/                         # Documentation
│   ├── brief.md                 # Project brief
│   ├── prd.md                   # Product requirements
│   └── architecture.md          # Technical architecture
├── public/                       # Static assets
│   ├── audios/                  # Audio files
│   └── models/                  # 3D models
└── package.json                 # Root dependencies
```

## 🚀 Cài đặt và Setup

### Prerequisites
- **Node.js 18+**
- **Remotion CLI** (`npm install -g @remotion/cli`)
- **Git**

### Installation

1. **Clone repository:**
```bash
git clone https://github.com/manh26x/emlinh-remotion.git
cd emlinh-remotion
```

2. **Install dependencies:**
```bash
# Install root dependencies
npm install

# Install MCP server dependencies
cd mcp-server
npm install
cd ..
```

3. **Setup environment:**
```bash
# Copy MCP server environment template
cp mcp-server/env.example mcp-server/.env

# Edit environment variables
nano mcp-server/.env
```

### Environment Configuration

**MCP Server (.env):**
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

## 🛠️ Development

### Remotion Development

```bash
# Start Remotion studio
npm start

# Preview specific composition
npx remotion preview src/Root.tsx

# Render video
npx remotion render src/Root.tsx output.mp4
```

### MCP Server Development

```bash
# Navigate to MCP server
cd mcp-server

# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

### Testing

```bash
# Run MCP server tests
cd mcp-server
npm test

# Run with coverage
npm run test:coverage

# Integration tests
npm run test:integration
```

## 🤖 Sử dụng MCP Server với Claude

### Kết nối MCP Server

1. **Build MCP server:**
```bash
cd mcp-server
npm run build
```

2. **Configure Claude với MCP server:**
```json
{
  "mcpServers": {
    "remotion": {
      "command": "node",
      "args": ["path/to/emlinh-remotion/mcp-server/dist/server.js"]
    }
  }
}
```

### MCP Tools Available

#### 1. List Compositions
```json
{
  "name": "list_compositions",
  "arguments": {}
}
```

#### 2. Render Video
```json
{
  "name": "render_video",
  "arguments": {
    "composition": "Root",
    "parameters": {
      "width": 1920,
      "height": 1080,
      "fps": 30,
      "duration": 60
    }
  }
}
```

#### 3. Get Render Status
```json
{
  "name": "get_render_status",
  "arguments": {
    "jobId": "render-job-123"
  }
}
```

#### 4. Cancel Render
```json
{
  "name": "cancel_render",
  "arguments": {
    "jobId": "render-job-123"
  }
}
```

## 📚 Documentation

- **[Project Brief](docs/brief.md)** - Tổng quan dự án và mục tiêu
- **[Product Requirements](docs/prd.md)** - Chi tiết requirements và epics
- **[Technical Architecture](docs/architecture.md)** - Kiến trúc kỹ thuật chi tiết
- **[MCP Server README](mcp-server/README.md)** - Hướng dẫn MCP server

## 🔧 Scripts

### Root Project
```bash
npm start          # Start Remotion studio
npm run build      # Build Remotion project
npm test           # Run tests
```

### MCP Server
```bash
cd mcp-server
npm run dev        # Development mode
npm run build      # Build for production
npm start          # Start production server
npm test           # Run unit tests
npm run lint       # Lint code
npm run type-check # TypeScript check
```

## 🏛️ Project Structure

### Epic Progress

- ✅ **Epic 1: Foundation & MCP Server Setup** - HOÀN THÀNH
  - MCP Protocol Implementation
  - Error Handling & Logging
  - Configuration Management
  - Unit Tests & Documentation

- 🔄 **Epic 2: Remotion Integration** - ĐANG THỰC HIỆN
  - Composition Discovery
  - Remotion CLI Integration
  - Parameter Validation

- 📋 **Epic 3: Render Operations** - PLANNED
  - Video Rendering
  - Progress Monitoring
  - Job Management

- 📋 **Epic 4: Parameter Management** - PLANNED
  - Dynamic Parameters
  - Validation & Constraints

- 📋 **Epic 5: Error Handling & Logging** - PLANNED
  - Advanced Error Handling
  - Comprehensive Logging

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- **TypeScript Strict Mode** - Tất cả code phải tuân thủ strict mode
- **Unit Tests** - Viết tests cho mọi feature mới
- **Error Handling** - Implement comprehensive error handling
- **Documentation** - Cập nhật documentation khi cần thiết
- **MCP Compliance** - Tuân thủ MCP protocol standards

## 📄 License

MIT License - xem [LICENSE.md](LICENSE.md) để biết chi tiết.

## 🆘 Support

- **Issues:** [GitHub Issues](https://github.com/manh26x/emlinh-remotion/issues)
- **Documentation:** [docs/](docs/) folder
- **MCP Server:** [mcp-server/README.md](mcp-server/README.md)

## 🎯 Roadmap

- [ ] **Epic 2:** Remotion Integration hoàn thành
- [ ] **Epic 3:** Render Operations implementation
- [ ] **Epic 4:** Advanced Parameter Management
- [ ] **Epic 5:** Production-ready Error Handling
- [ ] **Performance Optimization**
- [ ] **Additional MCP Tools**
- [ ] **Web UI for MCP Server**

---

**Made with ❤️ by BMAD Dev Team**
