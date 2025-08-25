# Integration Tests - Emlinh Remotion

Thư mục này chứa các integration tests cho Remotion project.

## Cấu trúc

- `rendering/` - Tests cho video rendering workflow
- `mcp/` - Tests cho MCP integration
- `lipsync/` - Tests cho lip-sync functionality
- `audio/` - Tests cho audio processing

## Quy tắc

- Mỗi file test phải có suffix `.integration.test.ts`
- Test với real Remotion rendering
- Sử dụng test fixtures và sample data
- Verify actual video output