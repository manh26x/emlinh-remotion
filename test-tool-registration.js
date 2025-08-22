#!/usr/bin/env node

/**
 * Test script to verify lip-sync tools are registered correctly in MCP server
 */

import { spawn } from 'child_process';
import path from 'path';

const MCP_SERVER_PATH = path.join(process.cwd(), 'mcp-server', 'dist', 'server.js');

console.log('🧪 Testing Lip-sync Tool Registration...\n');

function testToolList() {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [MCP_SERVER_PATH], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ stdout, stderr, code });
    });

    child.on('error', (error) => {
      reject(error);
    });

    // Send MCP protocol messages
    const initMsg = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    }) + '\n';

    const toolsMsg = JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list'
    }) + '\n';

    child.stdin.write(initMsg);
    child.stdin.write(toolsMsg);
    child.stdin.end();

    // Timeout after 10 seconds
    setTimeout(() => {
      child.kill();
      reject(new Error('Test timeout'));
    }, 10000);
  });
}

async function main() {
  try {
    console.log('🚀 Starting MCP server and listing tools...');
    const result = await testToolList();
    
    const expectedTools = [
      'convert_audio_format',
      'generate_lipsync_data', 
      'render_video_with_lipsync'
    ];
    
    console.log('\n📋 Checking tool registration:');
    
    let allToolsFound = true;
    for (const tool of expectedTools) {
      const found = result.stdout.includes(`"name":"${tool}"`) || 
                    result.stdout.includes(`"name": "${tool}"`);
      
      console.log(`${found ? '✅' : '❌'} ${tool}`);
      if (!found) allToolsFound = false;
    }
    
    if (allToolsFound) {
      console.log('\n🎉 All lip-sync tools registered successfully!');
      console.log('✅ render_video_with_lipsync tool is now available');
      console.log('✅ MCP server ready for lip-sync operations');
    } else {
      console.log('\n❌ Some tools missing. Check server output:');
      console.log('STDOUT:', result.stdout);
      console.log('STDERR:', result.stderr);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
