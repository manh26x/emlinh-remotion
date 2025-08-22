#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('🎬 Testing Emlinh Remotion MCP Server\n');

// Start MCP server
const serverProcess = spawn('node', ['mcp-server/dist/server.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: process.cwd()
});

let serverOutput = '';

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  console.log('📡 Server:', output.trim());
});

serverProcess.stderr.on('data', (data) => {
  console.log('⚠️  Server Error:', data.toString().trim());
});

serverProcess.on('close', (code) => {
  console.log(`\n❌ Server đã đóng với code: ${code}`);
  console.log('\n📋 Server Output:');
  console.log(serverOutput);
  process.exit(0);
});

// Send test request after 2 seconds
setTimeout(() => {
  console.log('\n🔧 Sending test request...\n');
  
  const testRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  const message = `Content-Length: ${JSON.stringify(testRequest).length}\r\n\r\n${JSON.stringify(testRequest)}`;
  serverProcess.stdin.write(message);
  
  // Send tools/list request
  setTimeout(() => {
    const listRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };
    
    const listMessage = `Content-Length: ${JSON.stringify(listRequest).length}\r\n\r\n${JSON.stringify(listRequest)}`;
    serverProcess.stdin.write(listMessage);
    
    // Close after 5 seconds
    setTimeout(() => {
      serverProcess.kill('SIGTERM');
    }, 5000);
  }, 1000);
}, 2000);



