#!/usr/bin/env node

import { spawn } from 'child_process';
import readline from 'readline';

console.log('🎬 Manual MCP Server Test\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Start MCP server
const serverProcess = spawn('node', ['mcp-server/dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.cwd()
});

serverProcess.stdout.on('data', (data) => {
  console.log('📡 Server Output:', data.toString().trim());
});

serverProcess.stderr.on('data', (data) => {
  console.log('⚠️  Server Error:', data.toString().trim());
});

serverProcess.on('close', (code) => {
  console.log(`\n❌ Server đã đóng với code: ${code}`);
  process.exit(0);
});

console.log('✅ Server đã khởi động. Nhập lệnh để test:\n');
console.log('1. initialize - Khởi tạo server');
console.log('2. list_tools - Liệt kê tools');
console.log('3. validate_project - Test validate project');
console.log('4. list_compositions - Test list compositions');
console.log('5. render_video - Test render video');
console.log('6. quit - Thoát\n');

function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  };

  const message = `Content-Length: ${JSON.stringify(request).length}\r\n\r\n${JSON.stringify(request)}`;
  console.log(`📤 Sending: ${method}`);
  serverProcess.stdin.write(message);
}

function promptUser() {
  rl.question('Nhập lệnh (1-6): ', (answer) => {
    switch (answer) {
      case '1':
        sendRequest('initialize', {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {}, resources: {} },
          clientInfo: { name: 'test-client', version: '1.0.0' }
        });
        break;
      case '2':
        sendRequest('tools/list', {});
        break;
      case '3':
        sendRequest('tools/call', {
          name: 'validate_project',
          arguments: {}
        });
        break;
      case '4':
        sendRequest('tools/call', {
          name: 'list_compositions',
          arguments: {}
        });
        break;
      case '5':
        sendRequest('tools/call', {
          name: 'render_video',
          arguments: {
            composition: 'Scene-Landscape',
            parameters: {
              width: 1280,
              height: 720,
              quality: 5,
              durationInFrames: 30
            }
          }
        });
        break;
      case '6':
        console.log('👋 Thoát...');
        serverProcess.kill('SIGTERM');
        rl.close();
        return;
      default:
        console.log('❌ Lựa chọn không hợp lệ');
    }
    
    setTimeout(promptUser, 1000);
  });
}

promptUser();



