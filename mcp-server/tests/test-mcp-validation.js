import { spawn } from 'child_process';

async function testMCPValidation() {
  console.log('🧪 Testing MCP Validation Tool...\n');

  return new Promise((resolve, reject) => {
    // Start MCP server process
    const serverProcess = spawn('node', ['../dist/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    serverProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    serverProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Send validation request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'validate_project',
        arguments: {}
      }
    };

    setTimeout(() => {
      serverProcess.stdin.write(JSON.stringify(request) + '\n');
    }, 1000);

    // Wait for response
    setTimeout(() => {
      serverProcess.kill();
      
      console.log('Server Output:', output);
      if (errorOutput) {
        console.log('Server Errors:', errorOutput);
      }
      
      resolve({ output, errorOutput });
    }, 3000);

    serverProcess.on('error', (error) => {
      console.error('Process error:', error);
      reject(error);
    });
  });
}

testMCPValidation().catch(console.error);
