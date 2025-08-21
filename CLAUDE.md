# CLAUDE.md

Tệp này cung cấp hướng dẫn cho Claude Code (claude.ai/code) khi làm việc với mã nguồn trong repository này.

## Hướng dẫn ngôn ngữ cho Claude
- **QUAN TRỌNG**: Luôn trả lời và viết tài liệu bằng TIẾNG VIỆT
- Sử dụng tiếng Việt cho tất cả giải thích, comment code, và tài liệu
- Chỉ giữ nguyên tiếng Anh cho: tên biến, hàm, từ khóa lập trình, tên thư viện
- Giải thích logic và kiến trúc code bằng tiếng Việt
- Viết comment trong code bằng tiếng Việt

## Tổng quan dự án

Đây là dự án Emlinh Remotion - một hệ thống tạo video được hỗ trợ bởi AI, kết hợp framework video Remotion với server Model Context Protocol (MCP). Dự án cho phép Claude AI điều khiển việc render video thông qua các lệnh ngôn ngữ tự nhiên via tích hợp MCP server.

**Kiến trúc chính:**
- **Remotion Frontend**: Các composition video dựa trên React Three Fiber với hoạt ảnh avatar, đồng bộ môi và hệ thống background
- **MCP Server**: Dịch vụ Node.js/TypeScript triển khai Model Context Protocol để tích hợp với Claude AI
- **Cấu trúc Monorepo**: MCP server như một package riêng biệt trong dự án Remotion hiện có

## Lệnh phát triển

### Phát triển Remotion
```bash
# Khởi động Remotion studio để phát triển
npm start
npm run dev              # Giống như start

# Build dự án Remotion
npm run build

# Render video cụ thể
npm run render          # Sử dụng --concurrency=1
npm run render-fast     # Sử dụng --concurrency=2

# Lint và kiểm tra kiểu
npm run lint           # Chạy eslint + tsc
```

### Phát triển MCP Server
```bash
cd mcp-server

# Chế độ phát triển với hot reload
npm run dev

# Build cho production
npm run build

# Khởi động server production
npm start

# Testing
npm test                # Unit tests
npm run test:watch      # Chế độ watch
npm run test:integration # Integration tests

# Chất lượng code
npm run lint
npm run lint:fix
npm run type-check
```

### Quy trình thiết lập hoàn chỉnh
```bash
# Thiết lập ban đầu
npm install
cd mcp-server && npm install && cd ..

# Thiết lập phát triển
cd mcp-server
cp env.example .env     # Cấu hình môi trường
npm run build          # Build MCP server
npm run dev            # Khởi động ở chế độ dev
```

## Kiến trúc & Cấu trúc

### Hệ thống Video Remotion
Hệ thống tạo video được xây dựng xung quanh:

- **Avatar Component** (`src/Avatar.jsx`): Render avatar chính với tích hợp đồng bộ môi
- **Lip-Sync Engine** (`src/hooks/lipSync/`): Đồng bộ chuyển động môi nâng cao
  - Xử lý viseme cho chuyển động môi thực tế
  - Tải và biến đổi mouth cue
  - Tiện ích đồng bộ hóa âm thanh-hình ảnh
- **Background System** (`src/backgrounds/`): Các component background modular
- **Scene Management** (`src/Scene.tsx`): Composition scene chính và điều phối

### Kiến trúc MCP Server
MCP server tuân theo thiết kế stateless, modular:

```
mcp-server/src/
├── server.ts              # Entry point chính & xử lý giao thức MCP
├── handlers/              # Handlers giao thức MCP & triển khai tools
├── services/              # Logic nghiệp vụ (tích hợp Remotion, quản lý process)
├── models/                # Kiểu TypeScript & data models
├── utils/                 # Cấu hình, logging, xử lý lỗi
└── tests/                 # Unit & integration tests
```

**Các mẫu thiết kế chính:**
- **Tuân thủ giao thức MCP**: Triển khai Model Context Protocol để tích hợp AI
- **Dịch vụ Stateless**: Không có trạng thái persistent, chỉ hoạt động trong memory
- **Command Pattern**: Đóng gói các hoạt động render như commands
- **Quản lý Process**: Quản lý các process Remotion CLI với monitoring

### Cấu hình Remotion
- **Entry Point**: `src/index.ts`
- **Concurrency**: Đặt thành 1 để đảm bảo ổn định (via `RemotionConfig.setConcurrency(1)`)
- **Renderer**: Sử dụng renderer OpenGL `angle` để tương thích
- **Định dạng ảnh**: JPEG với pixel format YUV420p

## Tích hợp MCP Server

### Các MCP Tools có sẵn
Server cung cấp các tools này cho Claude:
1. **`list_compositions`** - Liệt kê các composition video Remotion có sẵn
2. **`render_video`** - Kích hoạt render video với tham số
3. **`get_render_status`** - Kiểm tra tiến độ và trạng thái render
4. **`cancel_render`** - Hủy các hoạt động render đang diễn ra

### Tham số Render
Các tham số phổ biến cho render video:
- `width`, `height`: Kích thước video
- `fps`: Khung hình trên giây
- `duration`: Độ dài video tính bằng frames
- `quality`: Cài đặt chất lượng render
- `format`: Định dạng đầu ra (mp4, webm, gif)

### Cấu hình môi trường
MCP server yêu cầu các biến môi trường này (trong `mcp-server/.env`):
```bash
REMOTION_PROJECT_PATH=../src
LOG_LEVEL=info
PORT=3001
REMOTION_OUTPUT_DIR=./output
REMOTION_CACHE_DIR=./cache
NODE_ENV=development
```

## Ghi chú phát triển quan trọng

### Những điều cần lưu ý đặc biệt về Remotion
- **Giới hạn Concurrency**: Dự án sử dụng `setConcurrency(1)` do vấn đề timeout của ThreeCanvas
- **Tích hợp Audio**: Xử lý âm thanh rộng rãi với các tệp JSON mouth cue cho lip-sync
- **Components 3D**: Sử dụng React Three Fiber - cần cẩn thận với hiệu năng và rendering

### Yêu cầu giao thức MCP
- **TypeScript nghiêm ngặt**: Tất cả code MCP sử dụng strict mode để đảm bảo type safety
- **Xử lý lỗi**: Tất cả hoạt động async phải có xử lý lỗi phù hợp
- **Logging**: Tất cả hoạt động phải được log với mức độ phù hợp
- **Quản lý Process**: Các child processes phải được quản lý và dọn dẹp đúng cách

### Chiến lược Testing
- **Unit Tests**: Services, utilities, handlers
- **Integration Tests**: Tích hợp Remotion CLI, tuân thủ giao thức MCP
- **Tổ chức Test**: Thư mục test unit/integration riêng biệt

## Lệnh Lint và Build

Trước khi commit thay đổi, luôn chạy:
```bash
# Dự án gốc
npm run lint           # ESLint + TypeScript check

# MCP server
cd mcp-server
npm run lint           # ESLint
npm run type-check     # Kiểm tra biên dịch TypeScript
npm test              # Unit tests
npm run test:integration # Integration tests
```

## Trạng thái dự án

**Tiến độ Epic:**
- ✅ Epic 1: MCP Server Foundation - HOÀN THÀNH
- 🔄 Epic 2: Remotion Integration - ĐANG THỰC HIỆN  
- 📋 Epic 3: Render Operations - ĐÃ LẬP KẾ HOẠCH
- 📋 Epic 4: Parameter Management - ĐÃ LẬP KẾ HOẠCH
- 📋 Epic 5: Error Handling & Logging - ĐÃ LẬP KẾ HOẠCH

Dự án hiện đang hoạt động với chức năng MCP server cơ bản và khả năng render video Remotion.

## Hướng dẫn cho Claude khi làm việc

### Phong cách làm việc ưa thích
- Luôn giải thích logic trước khi viết code
- Ưu tiên tính ổn định và performance
- Kiểm tra lỗi kỹ lưỡng trước khi triển khai
- Viết comment rõ ràng bằng tiếng Việt
- Test kỹ các tính năng mới

### Quy ước đặt tên
- Sử dụng camelCase cho variables và functions
- Sử dụng PascalCase cho components và classes
- Tên file sử dụng kebab-case
- Thư mục sử dụng lowercase với dấu gạch ngang

### Xử lý lỗi
- Luôn wrap async operations trong try-catch
- Log lỗi với context đầy đủ
- Provide fallback mechanisms khi có thể
- Validate input parameters