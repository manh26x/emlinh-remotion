#!/usr/bin/env node

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

async function testMCPServer() {
  console.log('Starting MCP server test...');
  
  // Start the MCP server
  const serverProcess = spawn('node', ['../dist/server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let serverOutput = '';
  let serverError = '';

  // Collect server output
  serverProcess.stdout?.on('data', (data) => {
    serverOutput += data.toString();
    console.log('Server stdout:', data.toString());
  });

  serverProcess.stderr?.on('data', (data) => {
    serverError += data.toString();
    console.log('Server stderr:', data.toString());
  });

  // Wait a bit for server to start
  await setTimeout(1000);

  // Send initialize request
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };

  console.log('Sending initialize request...');
  serverProcess.stdin?.write(JSON.stringify(initRequest) + '\n');

  // Wait for response
  await setTimeout(2000);

  // Send ping request
  const pingRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'ping',
    params: {}
  };

  console.log('Sending ping request...');
  serverProcess.stdin?.write(JSON.stringify(pingRequest) + '\n');

  // Wait for response
  await setTimeout(2000);

  // Kill the server
  serverProcess.kill('SIGTERM');

  console.log('Test completed.');
  console.log('Server output:', serverOutput);
  if (serverError) {
    console.log('Server errors:', serverError);
  }
}

testMCPServer().catch(console.error);
