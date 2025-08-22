import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test MCP server
async function testMCPServer() {
  console.log('Testing MCP Server...');
  
  const serverPath = join(__dirname, '..', 'dist', 'server.js');
  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  let errorOutput = '';

  server.stdout.on('data', (data) => {
    output += data.toString();
    console.log('Server output:', data.toString());
  });

  server.stderr.on('data', (data) => {
    errorOutput += data.toString();
    console.error('Server error:', data.toString());
  });

  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    console.log('Final output:', output);
    if (errorOutput) {
      console.error('Final error output:', errorOutput);
    }
  });

  // Send a simple test message
  setTimeout(() => {
    console.log('Sending test message...');
    server.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {}, resources: {} },
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    }) + '\n');
  }, 1000);

  // Cleanup after 5 seconds
  setTimeout(() => {
    console.log('Cleaning up...');
    server.kill();
  }, 5000);
}

testMCPServer().catch(console.error);
