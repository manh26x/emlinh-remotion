import { spawn } from 'child_process';

async function testMCPTools() {
  console.log('🧪 Testing MCP Video Streaming Tools...\n');

  return new Promise((resolve, reject) => {
    // Start MCP server process
    const serverProcess = spawn('node', ['dist/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let responses = [];
    let buffer = '';
    
    serverProcess.stdout.on('data', (data) => {
      buffer += data.toString();
      
      // Try to parse JSON responses
      const lines = buffer.split('\n');
      buffer = lines.pop(); // Keep incomplete line
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            responses.push(response);
            console.log('Response received:', JSON.stringify(response, null, 2));
          } catch (e) {
            // Ignore non-JSON lines
          }
        }
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('Server connected successfully')) {
        console.log('✅ Server connected successfully\n');
        runTests();
      }
    });

    function runTests() {
      console.log('Running tests...\n');
      
      // Test 1: List tools
      const listToolsRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      };
      
      serverProcess.stdin.write(JSON.stringify(listToolsRequest) + '\n');
      
      setTimeout(() => {
        // Test 2: Validate project
        const validateRequest = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'validate_project',
            arguments: {}
          }
        };
        
        serverProcess.stdin.write(JSON.stringify(validateRequest) + '\n');
      }, 1000);
      
      setTimeout(() => {
        // Test 3: List compositions
        const listCompositionsRequest = {
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'list_compositions',
            arguments: {}
          }
        };
        
        serverProcess.stdin.write(JSON.stringify(listCompositionsRequest) + '\n');
      }, 2000);
      
      setTimeout(() => {
        // Test 4: List video streams
        const listStreamsRequest = {
          jsonrpc: '2.0',
          id: 4,
          method: 'tools/call',
          params: {
            name: 'list_video_streams',
            arguments: {}
          }
        };
        
        serverProcess.stdin.write(JSON.stringify(listStreamsRequest) + '\n');
      }, 3000);
      
      setTimeout(() => {
        console.log('\n📊 Test Summary:');
        console.log(`Total responses: ${responses.length}`);
        
        // Analyze responses
        responses.forEach((response, index) => {
          if (response.result) {
            console.log(`✅ Test ${response.id}: Success`);
          } else if (response.error) {
            console.log(`❌ Test ${response.id}: Error - ${response.error.message}`);
          }
        });
        
        serverProcess.kill();
        resolve(responses);
      }, 5000);
    }

    serverProcess.on('error', (error) => {
      console.error('Process error:', error);
      reject(error);
    });
  });
}

testMCPTools().catch(console.error);
