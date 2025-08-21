# MCP Handlers - Refactored Structure

## Tổng quan

File `mcp-handler.ts` đã được refactor thành nhiều file nhỏ hơn để dễ bảo trì và mỗi file có trách nhiệm rõ ràng. Tất cả các file đều dưới 300 dòng.

## Cấu trúc Files

### 1. `mcp-handler.ts` (Main Handler - ~150 dòng)
- **Trách nhiệm**: Điều phối chính cho MCP protocol
- **Chức năng**: 
  - Khởi tạo và quản lý các handler con
  - Xử lý initialize và list_tools
  - Routing các tool calls đến handler phù hợp
  - Validation arguments

### 2. `tools-config.ts` (~200 dòng)
- **Trách nhiệm**: Cấu hình tất cả MCP tools
- **Chức năng**:
  - Định nghĩa schema cho tất cả tools
  - Validation rules cho input parameters
  - Tool descriptions và metadata

### 3. `project-handlers.ts` (~120 dòng)
- **Trách nhiệm**: Xử lý các chức năng liên quan đến project
- **Chức năng**:
  - `validate_project`: Kiểm tra cấu trúc project
  - `list_compositions`: Liệt kê compositions có sẵn

### 4. `render-handlers.ts` (~250 dòng)
- **Trách nhiệm**: Xử lý các chức năng render video
- **Chức năng**:
  - `render_video`: Bắt đầu render job
  - `get_render_status`: Kiểm tra trạng thái render
  - `list_render_jobs`: Liệt kê render jobs
  - `cancel_render`: Hủy render job

### 5. `output-handlers.ts` (~180 dòng)
- **Trách nhiệm**: Quản lý output files và system operations
- **Chức năng**:
  - `get_render_output`: Lấy metadata output file
  - `list_render_outputs`: Liệt kê output files
  - `delete_render_output`: Xóa output file
  - `cleanup_render_outputs`: Dọn dẹp files cũ
  - `openVideo`: Mở video với default player

### 6. `streaming-handlers.ts` (~220 dòng)
- **Trách nhiệm**: Xử lý video streaming
- **Chức năng**:
  - `create_video_stream`: Tạo video stream
  - `get_video_stream_info`: Thông tin stream
  - `stream_video_chunk`: Stream chunk data
  - `list_video_streams`: Liệt kê streams
  - `cancel_video_stream`: Hủy stream

## Lợi ích của Refactoring

### 1. **Dễ bảo trì**
- Mỗi file có trách nhiệm rõ ràng
- Dễ tìm và sửa lỗi
- Dễ thêm tính năng mới

### 2. **Tách biệt concerns**
- Project logic tách khỏi render logic
- Output management tách khỏi streaming
- Configuration tách khỏi business logic

### 3. **Testability**
- Có thể test từng handler riêng biệt
- Mock dependencies dễ dàng
- Unit tests nhỏ và focused

### 4. **Code reusability**
- Handlers có thể được sử dụng độc lập
- Dễ dàng tái sử dụng logic
- Dependency injection rõ ràng

## Cách sử dụng

```typescript
// Khởi tạo main handler
const mcpHandler = new MCPHandler();

// Sử dụng các handler con trực tiếp nếu cần
const projectHandlers = new ProjectHandlers(remotionService);
const renderHandlers = new RenderHandlers(remotionService, renderService);
```

## Lưu ý quan trọng

1. **Dependency Injection**: Tất cả handlers đều nhận dependencies qua constructor
2. **Error Handling**: Mỗi handler có error handling riêng
3. **Logging**: Sử dụng logger chung cho consistency
4. **Type Safety**: Tất cả đều có TypeScript types đầy đủ

## Migration từ code cũ

- Tất cả functionality được giữ nguyên
- API không thay đổi
- Chỉ cấu trúc code được cải thiện
- Backward compatibility được đảm bảo
