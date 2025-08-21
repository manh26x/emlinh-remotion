#!/usr/bin/env node

import { spawn } from 'child_process';
import readline from 'readline';

class MCPLocalTester {
  constructor() {
    this.serverProcess = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🎬 Emlinh Remotion MCP Local Tester\n');
    console.log('Đang khởi động MCP server...\n');

    // Start MCP server
    this.serverProcess = spawn('node', ['mcp-server/dist/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let serverReady = false;
    let requestId = 1;

    // Handle server output
    this.serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📡 Server:', output.trim());
      
      if (output.includes('MCP Server started')) {
        serverReady = true;
        console.log('✅ Server sẵn sàng!\n');
        this.showMenu();
      }
    });

    this.serverProcess.stderr.on('data', (data) => {
      console.log('⚠️  Server Error:', data.toString().trim());
    });

    // Handle server exit
    this.serverProcess.on('close', (code) => {
      console.log(`\n❌ Server đã đóng với code: ${code}`);
      process.exit(0);
    });

    // Wait for server to be ready
    await new Promise(resolve => {
      const checkReady = () => {
        if (serverReady) {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }

  showMenu() {
    console.log('📋 **Menu Test MCP Tools:**\n');
    console.log('1. validate_project - Xác thực dự án');
    console.log('2. list_compositions - Liệt kê compositions');
    console.log('3. render_video - Render video');
    console.log('4. get_render_status - Kiểm tra trạng thái render');
    console.log('5. list_render_jobs - Liệt kê render jobs');
    console.log('6. cancel_render - Hủy render job');
    console.log('7. Test tất cả tools');
    console.log('0. Thoát\n');

    this.rl.question('Chọn option (0-7): ', (answer) => {
      this.handleMenuChoice(answer);
    });
  }

  async handleMenuChoice(choice) {
    switch (choice) {
      case '1':
        await this.testValidateProject();
        break;
      case '2':
        await this.testListCompositions();
        break;
      case '3':
        await this.testRenderVideo();
        break;
      case '4':
        await this.testGetRenderStatus();
        break;
      case '5':
        await this.testListRenderJobs();
        break;
      case '6':
        await this.testCancelRender();
        break;
      case '7':
        await this.testAllTools();
        break;
      case '0':
        this.cleanup();
        break;
      default:
        console.log('❌ Lựa chọn không hợp lệ\n');
        this.showMenu();
    }
  }

  async sendMCPRequest(method, params = {}) {
    return new Promise((resolve, reject) => {
      const request = {
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      };

      const message = `Content-Length: ${JSON.stringify(request).length}\r\n\r\n${JSON.stringify(request)}`;
      
      this.serverProcess.stdin.write(message);
      
      // Simple response handling
      setTimeout(() => {
        resolve({ success: true, message: 'Request sent' });
      }, 1000);
    });
  }

  async testValidateProject() {
    console.log('\n🔍 Testing validate_project...\n');
    await this.sendMCPRequest('tools/call', {
      name: 'validate_project',
      arguments: {}
    });
    this.showMenu();
  }

  async testListCompositions() {
    console.log('\n📋 Testing list_compositions...\n');
    await this.sendMCPRequest('tools/call', {
      name: 'list_compositions',
      arguments: {}
    });
    this.showMenu();
  }

  async testRenderVideo() {
    console.log('\n🎬 Testing render_video...\n');
    await this.sendMCPRequest('tools/call', {
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
    this.showMenu();
  }

  async testGetRenderStatus() {
    console.log('\n📊 Testing get_render_status...\n');
    this.rl.question('Nhập Job ID: ', async (jobId) => {
      await this.sendMCPRequest('tools/call', {
        name: 'get_render_status',
        arguments: { jobId }
      });
      this.showMenu();
    });
  }

  async testListRenderJobs() {
    console.log('\n📋 Testing list_render_jobs...\n');
    await this.sendMCPRequest('tools/call', {
      name: 'list_render_jobs',
      arguments: {}
    });
    this.showMenu();
  }

  async testCancelRender() {
    console.log('\n🚫 Testing cancel_render...\n');
    this.rl.question('Nhập Job ID để cancel: ', async (jobId) => {
      await this.sendMCPRequest('tools/call', {
        name: 'cancel_render',
        arguments: { jobId }
      });
      this.showMenu();
    });
  }

  async testAllTools() {
    console.log('\n🧪 Testing tất cả tools...\n');
    
    const tests = [
      { name: 'validate_project', args: {} },
      { name: 'list_compositions', args: {} },
      { name: 'render_video', args: { composition: 'Scene-Landscape', parameters: { width: 1280, height: 720, quality: 5, durationInFrames: 30 } } },
      { name: 'list_render_jobs', args: {} }
    ];

    for (const test of tests) {
      console.log(`\n🔧 Testing ${test.name}...`);
      await this.sendMCPRequest('tools/call', {
        name: test.name,
        arguments: test.args
      });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait between tests
    }

    console.log('\n✅ Tất cả tests hoàn thành!\n');
    this.showMenu();
  }

  cleanup() {
    console.log('\n👋 Đang đóng server...');
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }
    this.rl.close();
    process.exit(0);
  }
}

// Start the tester
const tester = new MCPLocalTester();
tester.start().catch(console.error);

