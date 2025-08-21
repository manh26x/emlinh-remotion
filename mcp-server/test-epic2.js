#!/usr/bin/env node

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

// Test Epic 2: Remotion Integration
async function testEpic2() {
  console.log('🎬 Testing Epic 2: Remotion Integration\n');

  // Test 1: Validate Project
  console.log('1️⃣ Testing Project Validation...');
  await testValidateProject();

  // Test 2: List Compositions
  console.log('\n2️⃣ Testing Composition Discovery...');
  await testListCompositions();

  console.log('\n✅ Epic 2 Testing Complete!');
}

async function testValidateProject() {
  try {
    const response = await sendMCPRequest('validate_project', {});
    console.log('✅ Project validation successful');
    console.log('Response:', response.content[0].text);
  } catch (error) {
    console.log('❌ Project validation failed:', error.message);
  }
}

async function testListCompositions() {
  try {
    const response = await sendMCPRequest('list_compositions', {});
    console.log('✅ Composition discovery successful');
    console.log('Response:', response.content[0].text);
  } catch (error) {
    console.log('❌ Composition discovery failed:', error.message);
  }
}

async function sendMCPRequest(toolName, arguments_) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', ['dist/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log('STDOUT:', data.toString());
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('STDERR:', data.toString());
    });

    child.on('close', (code) => {
      console.log('Process closed with code:', code);
      console.log('Full stdout:', stdout);
      console.log('Full stderr:', stderr);
      
      if (code === 0) {
        try {
          // Parse MCP response
          const lines = stdout.trim().split('\n');
          const responseLines = lines.filter(line => line.startsWith('Content-Length:'));
          
          if (responseLines.length > 0) {
            const lastResponse = responseLines[responseLines.length - 1];
            const contentLength = parseInt(lastResponse.split(':')[1].trim());
            const responseData = stdout.substring(stdout.lastIndexOf('\r\n\r\n') + 4);
            const response = JSON.parse(responseData);
            resolve(response.result);
          } else {
            reject(new Error('No valid response found'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });

    // Send initialize request first
    const initializeRequest = {
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

    // Send list tools request
    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };

    // Send tool call request
    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: arguments_
      }
    };

    // Send requests in sequence
    setTimeout(() => {
      const initData = JSON.stringify(initializeRequest);
      const initMessage = `Content-Length: ${initData.length}\r\n\r\n${initData}`;
      child.stdin.write(initMessage);
      
      setTimeout(() => {
        const listData = JSON.stringify(listToolsRequest);
        const listMessage = `Content-Length: ${listData.length}\r\n\r\n${listData}`;
        child.stdin.write(listMessage);
        
        setTimeout(() => {
          const callData = JSON.stringify(toolCallRequest);
          const callMessage = `Content-Length: ${callData.length}\r\n\r\n${callData}`;
          child.stdin.write(callMessage);
          child.stdin.end();
        }, 100);
      }, 100);
    }, 100);
  });
}

// Run the test
testEpic2().catch(console.error);
