# 🚀 Hướng dẫn thiết lập MCP Local với Claude

## 📋 Tổng quan

Hướng dẫn này sẽ giúp bạn thiết lập Emlinh Remotion MCP Server để test với Claude locally.

## 🛠️ Yêu cầu hệ thống

- Node.js 18+ 
- npm hoặc yarn
- Claude Desktop App hoặc Claude Web với MCP support

## 📦 Bước 1: Cài đặt dependencies

```bash
# Cài đặt dependencies cho MCP server
cd mcp-server
npm install

# Build server
npm run build
```

## 🔧 Bước 2: Cấu hình MCP với Claude

### Option A: Claude Desktop App

1. **Mở Claude Desktop App**
2. **Vào Settings** → **Model Context Protocol**
3. **Thêm MCP Server mới:**
   - **Name:** `emlinh-remotion`
   - **Command:** `node`
   - **Arguments:** `[path-to-project]/mcp-server/dist/server.js`
   - **Working Directory:** `[path-to-project]`

### Option B: Claude Web (nếu hỗ trợ)

1. **Mở Claude Web**
2. **Vào Settings** → **MCP Configuration**
3. **Thêm server configuration:**
   ```json
   {
     "mcpServers": {
       "emlinh-remotion": {
         "command": "node",
         "args": ["mcp-server/dist/server.js"],
         "cwd": "[path-to-project]"
       }
     }
   }
   ```

## 🧪 Bước 3: Test Local (Không cần Claude)

Chạy script test local để kiểm tra MCP server:

```bash
# Từ thư mục gốc project
node test-mcp-local.js
```

**Menu test sẽ hiển thị:**
```
📋 **Menu Test MCP Tools:**

1. validate_project - Xác thực dự án
2. list_compositions - Liệt kê compositions  
3. render_video - Render video
4. get_render_status - Kiểm tra trạng thái render
5. list_render_jobs - Liệt kê render jobs
6. cancel_render - Hủy render job
7. Test tất cả tools
0. Thoát
```

## 🎬 Bước 4: Test với Claude

Sau khi thiết lập MCP, bạn có thể test với Claude bằng các lệnh:

### **Test cơ bản:**
```
"Xác thực dự án Remotion của tôi"
"Liệt kê tất cả compositions có sẵn"
"Render video Scene-Landscape với độ phân giải 1280x720"
"Kiểm tra trạng thái render job [job-id]"
"Liệt kê tất cả render jobs"
"Hủy render job [job-id]"
```

### **Test nâng cao:**
```
"Render video Scene-Portrait với quality 8 và concurrency 2"
"Render video với duration 5 giây và fps 60"
"Kiểm tra progress của render job đang chạy"
```

## 🔍 Bước 5: Debug và Troubleshooting

### **Kiểm tra server logs:**
```bash
# Chạy server với debug mode
cd mcp-server
NODE_ENV=development LOG_LEVEL=debug node dist/server.js
```

### **Test server trực tiếp:**
```bash
# Test server response
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node mcp-server/dist/server.js
```

### **Lỗi thường gặp:**

1. **"Cannot find module"**
   - Đảm bảo đã chạy `npm install` và `npm run build`
   - Kiểm tra đường dẫn trong MCP config

2. **"Permission denied"**
   - Chạy với quyền admin hoặc sửa permissions
   - Kiểm tra firewall settings

3. **"Server not responding"**
   - Kiểm tra port conflicts
   - Restart Claude app
   - Kiểm tra server logs

## 📊 Bước 6: Monitor và Logs

### **Server Logs:**
- **Info logs:** Hoạt động bình thường
- **Debug logs:** Chi tiết về requests/responses
- **Error logs:** Lỗi cần xử lý

### **Performance Monitoring:**
- **Render time:** Thời gian render video
- **Memory usage:** Sử dụng RAM
- **CPU usage:** Sử dụng CPU

## 🎯 Bước 7: Production Setup

### **Environment Variables:**
```bash
# .env file
NODE_ENV=production
LOG_LEVEL=info
REMOTION_PROJECT_PATH=./src
REMOTION_OUTPUT_DIR=./output
REMOTION_CACHE_DIR=./cache
```

### **Systemd Service (Linux):**
```ini
[Unit]
Description=Emlinh Remotion MCP Server
After=network.target

[Service]
Type=simple
User=remotion
WorkingDirectory=/path/to/emlinh-remotion
ExecStart=/usr/bin/node mcp-server/dist/server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## 🚀 Bước 8: Advanced Configuration

### **Custom MCP Tools:**
Bạn có thể thêm custom tools bằng cách edit `mcp-server/src/handlers/mcp-handler.ts`

### **Multiple Projects:**
```json
{
  "mcpServers": {
    "emlinh-remotion-dev": {
      "command": "node",
      "args": ["mcp-server/dist/server.js"],
      "env": { "NODE_ENV": "development" }
    },
    "emlinh-remotion-prod": {
      "command": "node", 
      "args": ["mcp-server/dist/server.js"],
      "env": { "NODE_ENV": "production" }
    }
  }
}
```

## 📚 Tài liệu tham khảo

- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Claude MCP Documentation](https://docs.anthropic.com/claude/docs/model-context-protocol-mcp)
- [Remotion Documentation](https://www.remotion.dev/)

## 🆘 Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong console
2. Đảm bảo tất cả dependencies đã cài đặt
3. Restart Claude app và MCP server
4. Kiểm tra firewall và permissions

---

**🎉 Chúc bạn test thành công!**

