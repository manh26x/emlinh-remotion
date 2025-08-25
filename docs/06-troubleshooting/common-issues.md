# Common Issues & Troubleshooting

## 🚨 Render Issues

### Video Render Fails

**Triệu chứng**: Video không được tạo ra hoặc quá trình render bị dừng

**Nguyên nhân thường gặp**:
- Thiếu bộ nhớ RAM
- FFmpeg không được cài đặt đúng
- Script video có lỗi cú pháp
- Thiếu quyền truy cập thư mục output

**Cách khắc phục**:

```bash
# 1. Kiểm tra FFmpeg
ffmpeg -version

# 2. Kiểm tra bộ nhớ
Get-Process -Name node | Select-Object WorkingSet

# 3. Kiểm tra quyền thư mục
Test-Path -Path "./output" -PathType Container

# 4. Tạo thư mục output nếu chưa có
New-Item -ItemType Directory -Force -Path "./output"
```

**Script kiểm tra**:
```javascript
// debug-render.js
const { renderVideo } = require('./src/mcp-tools/render');
const fs = require('fs');

async function debugRender() {
  try {
    // Kiểm tra script đơn giản
    const simpleScript = {
      schemaVersion: '1.0',
      meta: {
        title: 'Test Video',
        fps: 30,
        width: 1280,
        height: 720
      },
      scenes: [{
        id: 'test',
        duration: 60,
        elements: [{
          type: 'character',
          id: 'speaker',
          text: 'Đây là video test.',
          voice: { voice: 'nova', speed: 1.0 }
        }]
      }]
    };

    console.log('Bắt đầu render test...');
    const result = await renderVideo(simpleScript, {
      quality: 5,
      outputPath: './output/test.mp4'
    });
    
    console.log('Render thành công:', result);
  } catch (error) {
    console.error('Lỗi render:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

debugRender();
```

### Slow Render Performance

**Triệu chứng**: Quá trình render mất quá nhiều thời gian

**Tối ưu hóa**:

```javascript
// Cấu hình tối ưu cho render nhanh
const optimizedConfig = {
  // Giảm chất lượng cho preview
  quality: 3, // Thay vì 8-10
  
  // Giảm độ phân giải
  width: 1280, // Thay vì 1920
  height: 720, // Thay vì 1080
  
  // Tăng tốc độ render
  concurrency: 4, // Số luồng song song
  
  // Tối ưu codec
  codec: 'h264',
  preset: 'fast', // Thay vì 'slow'
  
  // Bỏ qua một số frame
  frameSkip: 2
};
```

**Monitoring script**:
```javascript
// monitor-render.js
const os = require('os');
const { performance } = require('perf_hooks');

class RenderMonitor {
  constructor() {
    this.startTime = 0;
    this.memoryUsage = [];
    this.cpuUsage = [];
  }

  start() {
    this.startTime = performance.now();
    this.monitorInterval = setInterval(() => {
      this.collectMetrics();
    }, 1000);
  }

  stop() {
    clearInterval(this.monitorInterval);
    const duration = performance.now() - this.startTime;
    
    console.log(`\n=== Render Performance Report ===`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log(`Peak Memory: ${Math.max(...this.memoryUsage).toFixed(2)} MB`);
    console.log(`Average CPU: ${(this.cpuUsage.reduce((a, b) => a + b, 0) / this.cpuUsage.length).toFixed(2)}%`);
  }

  collectMetrics() {
    const memUsage = process.memoryUsage();
    this.memoryUsage.push(memUsage.heapUsed / 1024 / 1024);
    
    const cpuUsage = os.loadavg()[0] * 100 / os.cpus().length;
    this.cpuUsage.push(cpuUsage);
    
    console.log(`Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB, CPU: ${cpuUsage.toFixed(2)}%`);
  }
}

// Sử dụng
const monitor = new RenderMonitor();
monitor.start();

// ... render video ...

monitor.stop();
```

## 🎵 Audio Processing Issues

### Audio File Loading Fails

**Triệu chứng**: Không thể load được file audio

**Kiểm tra file audio**:
```javascript
// test-audio.js
const fs = require('fs');
const path = require('path');

async function testAudio() {
  try {
    const audioPath = './public/audios/narration.mp3';
    console.log('Testing audio file...');
    
    // Kiểm tra file có tồn tại
    if (fs.existsSync(audioPath)) {
      const stats = fs.statSync(audioPath);
      console.log(`File size: ${stats.size} bytes`);
      
      // Kiểm tra format
      const ext = path.extname(audioPath).toLowerCase();
      const supportedFormats = ['.mp3', '.wav', '.aac', '.ogg'];
      
      if (supportedFormats.includes(ext)) {
        console.log('Audio format supported:', ext);
      } else {
        console.error('Unsupported audio format:', ext);
      }
    } else {
      console.error('Audio file không tồn tại!');
    }
  } catch (error) {
    console.error('Audio test failed:', error.message);
    
    console.log('\n🎵 Hướng dẫn kiểm tra audio:');
    console.log('1. Đảm bảo file audio tồn tại trong thư mục public/audios');
    console.log('2. Kiểm tra format được hỗ trợ (MP3, WAV, AAC, OGG)');
    console.log('3. Verify file permissions');
  }
}

testAudio();
```

### Audio Sync Issues

**Triệu chứng**: Audio và video không đồng bộ

**Cách khắc phục**:
```javascript
// audio-sync-fix.js
const ffmpeg = require('fluent-ffmpeg');

function fixAudioSync(videoPath, audioPath, outputPath, offset = 0) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoPath)
      .input(audioPath)
      .inputOptions(`-itsoffset ${offset}`) // Điều chỉnh offset
      .outputOptions([
        '-c:v copy', // Copy video stream
        '-c:a aac',  // Re-encode audio
        '-map 0:v:0',
        '-map 1:a:0',
        '-shortest'  // Cắt theo stream ngắn nhất
      ])
      .output(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

// Sử dụng
fixAudioSync(
  './output/video.mp4',
  './public/audios/narration.mp3',
  './output/synced.mp4',
  0.2 // Delay audio 0.2 giây
);
```

## 👤 Avatar & Lip-sync Issues

### Lip-sync Accuracy Problems

**Triệu chứng**: Môi avatar không khớp với âm thanh

**Cải thiện độ chính xác**:
```javascript
// improved-lipsync.js
const { generateLipSyncData } = require('./src/mcp-tools/lipsync');

function improvedLipSync(audioPath, options = {}) {
  const defaultOptions = {
    // Tăng độ phân giải phân tích
    analysisResolution: 'high',
    
    // Điều chỉnh sensitivity
    sensitivity: 0.8,
    
    // Smooth transitions
    smoothing: true,
    smoothingFactor: 0.3,
    
    // Phoneme mapping
    phonemeMapping: {
      'A': { mouth: 0.8, jaw: 0.6 },
      'E': { mouth: 0.6, jaw: 0.4 },
      'I': { mouth: 0.4, jaw: 0.2 },
      'O': { mouth: 0.9, jaw: 0.7 },
      'U': { mouth: 0.5, jaw: 0.3 }
    },
    
    // Timing adjustments
    leadTime: 0.05,  // Bắt đầu sớm 50ms
    lagTime: 0.02,   // Kết thúc muộn 20ms
    
    ...options
  };
  
  return generateLipSyncData(audioPath, defaultOptions);
}
```

### Avatar Loading Issues

**Triệu chứng**: Avatar không hiển thị hoặc bị lỗi texture

**Kiểm tra và sửa lỗi**:
```javascript
// avatar-validator.js
const fs = require('fs');
const path = require('path');

class AvatarValidator {
  static validateModel(modelPath) {
    const issues = [];
    
    // Kiểm tra file tồn tại
    if (!fs.existsSync(modelPath)) {
      issues.push(`Model file not found: ${modelPath}`);
      return issues;
    }
    
    // Kiểm tra kích thước file
    const stats = fs.statSync(modelPath);
    if (stats.size === 0) {
      issues.push('Model file is empty');
    }
    
    if (stats.size > 50 * 1024 * 1024) { // 50MB
      issues.push('Model file is too large (>50MB)');
    }
    
    // Kiểm tra định dạng
    const ext = path.extname(modelPath).toLowerCase();
    if (!['.glb', '.gltf'].includes(ext)) {
      issues.push(`Unsupported format: ${ext}`);
    }
    
    return issues;
  }
  
  static async validateTextures(modelPath) {
    const issues = [];
    const modelDir = path.dirname(modelPath);
    
    // Tìm các file texture
    const textureFiles = fs.readdirSync(modelDir)
      .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));
    
    for (const textureFile of textureFiles) {
      const texturePath = path.join(modelDir, textureFile);
      const stats = fs.statSync(texturePath);
      
      if (stats.size === 0) {
        issues.push(`Empty texture: ${textureFile}`);
      }
      
      if (stats.size > 4 * 1024 * 1024) { // 4MB
        issues.push(`Large texture: ${textureFile} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
      }
    }
    
    return issues;
  }
  
  static async optimizeModel(inputPath, outputPath) {
    // Sử dụng gltf-pipeline để tối ưu
    const gltfPipeline = require('gltf-pipeline');
    
    const options = {
      dracoOptions: {
        compressionLevel: 7
      },
      optimizeForCesium: false
    };
    
    try {
      const gltf = fs.readFileSync(inputPath);
      const results = await gltfPipeline.processGltf(gltf, options);
      fs.writeFileSync(outputPath, results.gltf);
      
      console.log(`Model optimized: ${inputPath} -> ${outputPath}`);
    } catch (error) {
      console.error('Optimization failed:', error.message);
    }
  }
}

// Sử dụng
const issues = AvatarValidator.validateModel('./models/avatar.glb');
if (issues.length > 0) {
  console.log('Avatar issues found:');
  issues.forEach(issue => console.log(`- ${issue}`));
}
```

## 🌐 API Connection Issues

### API Server Connection Failed

**Triệu chứng**: Không thể kết nối với API server

**Kiểm tra kết nối**:
```javascript
// api-health-check.js
const http = require('http');
const axios = require('axios');

class APIHealthChecker {
  static async checkServerHealth(host = 'localhost', port = 3000) {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: host,
        port: port,
        path: '/api/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
            statusCode: res.statusCode,
            response: data
          });
        });
      });
      
      req.on('error', (error) => {
        resolve({
          status: 'error',
          error: error.message
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: 'timeout',
          error: 'Request timeout'
        });
      });
      
      req.end();
    });
  }
  
  static async checkAPIEndpoints() {
    const baseURL = 'http://localhost:3000/api';
    
    try {
      // Test các endpoints cơ bản
      const tests = [
        { name: 'render', endpoint: '/render' },
        { name: 'tts', endpoint: '/tts' },
        { name: 'lipsync', endpoint: '/lipsync' }
      ];
      
      const results = [];
      
      for (const test of tests) {
        try {
          const response = await axios.get(`${baseURL}${test.endpoint}/status`);
          results.push({ endpoint: test.name, status: 'ok', statusCode: response.status });
        } catch (error) {
          results.push({ endpoint: test.name, status: 'error', error: error.message });
        }
      }
      
      return results;
    } catch (error) {
      return [{ endpoint: 'connection', status: 'error', error: error.message }];
    }
  }
  
  static async runFullDiagnostic() {
    console.log('🔍 Running API Diagnostic...');
    
    // 1. Kiểm tra server health
    console.log('\n1. Checking server health...');
    const health = await this.checkServerHealth();
    console.log(`Status: ${health.status}`);
    if (health.error) {
      console.log(`Error: ${health.error}`);
    }
    
    // 2. Kiểm tra API endpoints
    console.log('\n2. Checking API endpoints...');
    const endpointResults = await this.checkAPIEndpoints();
    endpointResults.forEach(result => {
      console.log(`${result.endpoint}: ${result.status}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
    
    // 3. Kiểm tra environment
    console.log('\n3. Checking environment...');
    console.log(`Node.js: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`Memory: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`);
    
    // 4. Kiểm tra dependencies
    console.log('\n4. Checking dependencies...');
    try {
      require('ffmpeg-static');
      console.log('FFmpeg: ✓');
    } catch {
      console.log('FFmpeg: ✗ (not found)');
    }
    
    try {
      require('@remotion/cli');
      console.log('Remotion: ✓');
    } catch {
      console.log('Remotion: ✗ (not found)');
    }
  }
}

// Chạy diagnostic
APIHealthChecker.runFullDiagnostic();
```

### Rate Limiting Issues

**Triệu chứng**: Requests bị từ chối do vượt quá giới hạn

**Implement retry logic**:
```javascript
// retry-client.js
class RetryAPIClient {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 10000;
    this.backoffFactor = options.backoffFactor || 2;
  }
  
  async callWithRetry(fn, ...args) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;
        
        // Không retry cho một số lỗi
        if (this.isNonRetryableError(error)) {
          throw error;
        }
        
        if (attempt < this.maxRetries) {
          const delay = this.calculateDelay(attempt);
          console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }
  
  isNonRetryableError(error) {
    // Không retry cho lỗi authentication, validation, etc.
    const nonRetryableCodes = [400, 401, 403, 404, 422];
    return nonRetryableCodes.includes(error.statusCode);
  }
  
  calculateDelay(attempt) {
    const delay = this.baseDelay * Math.pow(this.backoffFactor, attempt);
    return Math.min(delay, this.maxDelay);
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Sử dụng
const retryClient = new RetryAPIClient({
  maxRetries: 3,
  baseDelay: 1000,
  backoffFactor: 2
});

// Wrap API calls
const renderVideo = async (script, options) => {
  return retryClient.callWithRetry(async () => {
    const axios = require('axios');
    const response = await axios.post('http://localhost:3000/api/render', {
      script,
      options
    });
    return response.data;
  });
};
```

## 💾 Storage & File Issues

### Disk Space Issues

**Triệu chứng**: Không đủ dung lượng để lưu video

**Monitoring và cleanup**:
```javascript
// storage-manager.js
const fs = require('fs');
const path = require('path');

class StorageManager {
  static async checkDiskSpace(directory = './') {
    const stats = fs.statSync(directory);
    // Trên Windows, sử dụng PowerShell để kiểm tra
    const { exec } = require('child_process');
    
    return new Promise((resolve) => {
      exec(`Get-WmiObject -Class Win32_LogicalDisk | Where-Object {$_.DeviceID -eq "${path.parse(directory).root.replace('\\', '')}"} | Select-Object Size,FreeSpace`, 
        { shell: 'powershell' }, (error, stdout) => {
        if (error) {
          resolve({ error: error.message });
          return;
        }
        
        const lines = stdout.trim().split('\n');
        if (lines.length >= 3) {
          const dataLine = lines[2].trim();
          const [freeSpace, size] = dataLine.split(/\s+/);
          
          resolve({
            total: parseInt(size),
            free: parseInt(freeSpace),
            used: parseInt(size) - parseInt(freeSpace)
          });
        } else {
          resolve({ error: 'Could not parse disk info' });
        }
      });
    });
  }
  
  static async cleanupOldFiles(directory, maxAge = 7 * 24 * 60 * 60 * 1000) {
    const now = Date.now();
    const files = fs.readdirSync(directory);
    let deletedCount = 0;
    let freedSpace = 0;
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        freedSpace += stats.size;
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`Deleted: ${file}`);
      }
    }
    
    return {
      deletedCount,
      freedSpace: freedSpace / 1024 / 1024 // MB
    };
  }
  
  static async getDirectorySize(directory) {
    let totalSize = 0;
    
    function calculateSize(dir) {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          calculateSize(filePath);
        } else {
          totalSize += stats.size;
        }
      }
    }
    
    calculateSize(directory);
    return totalSize;
  }
  
  static async optimizeStorage() {
    console.log('🧹 Optimizing storage...');
    
    // 1. Kiểm tra dung lượng
    const diskInfo = await this.checkDiskSpace();
    if (diskInfo.error) {
      console.log('Could not check disk space');
    } else {
      const freePercent = (diskInfo.free / diskInfo.total) * 100;
      console.log(`Free space: ${(diskInfo.free / 1024 / 1024 / 1024).toFixed(2)} GB (${freePercent.toFixed(1)}%)`);
      
      if (freePercent < 10) {
        console.log('⚠️ Low disk space detected!');
      }
    }
    
    // 2. Cleanup temporary files
    const tempDirs = ['./temp', './output/temp', './cache'];
    
    for (const dir of tempDirs) {
      if (fs.existsSync(dir)) {
        const result = await this.cleanupOldFiles(dir, 24 * 60 * 60 * 1000); // 1 day
        console.log(`${dir}: Deleted ${result.deletedCount} files, freed ${result.freedSpace.toFixed(2)} MB`);
      }
    }
    
    // 3. Kiểm tra kích thước thư mục
    const outputSize = await this.getDirectorySize('./output');
    console.log(`Output directory size: ${(outputSize / 1024 / 1024).toFixed(2)} MB`);
  }
}

// Chạy optimization
StorageManager.optimizeStorage();
```

## 🔧 Emergency Recovery

### Complete Reset Script

```bash
#!/bin/bash
# emergency-reset.sh

echo "🚨 Emergency Reset - Emlinh Remotion"
echo "This will reset the application to default state"
read -p "Continue? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Cleaning up..."
    
    # Stop all processes
    pkill -f "node.*remotion" || true
    pkill -f "mcp-server" || true
    
    # Remove temporary files
    rm -rf ./temp/* 2>/dev/null || true
    rm -rf ./cache/* 2>/dev/null || true
    rm -rf ./output/temp/* 2>/dev/null || true
    
    # Reset configuration
    cp ./config/default.json ./config/config.json 2>/dev/null || true
    
    # Clear node modules and reinstall
    echo "📦 Reinstalling dependencies..."
    rm -rf node_modules
    rm package-lock.json 2>/dev/null || true
    npm install
    
    # Rebuild native modules
    npm rebuild
    
    # Reset database/cache
    rm -f ./data/*.db 2>/dev/null || true
    
    echo "✅ Reset complete!"
    echo "Run 'npm start' to restart the application"
else
    echo "Reset cancelled"
fi
```

### Diagnostic Script

```javascript
// diagnostic.js
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class DiagnosticTool {
  static async runFullDiagnostic() {
    console.log('🔍 Running Full System Diagnostic...');
    console.log('=' .repeat(50));
    
    const results = {
      system: await this.checkSystem(),
      dependencies: await this.checkDependencies(),
      configuration: await this.checkConfiguration(),
      storage: await this.checkStorage(),
      network: await this.checkNetwork(),
      performance: await this.checkPerformance()
    };
    
    this.generateReport(results);
    return results;
  }
  
  static async checkSystem() {
    return {
      platform: process.platform,
      nodeVersion: process.version,
      architecture: process.arch,
      memory: {
        total: Math.round(require('os').totalmem() / 1024 / 1024),
        free: Math.round(require('os').freemem() / 1024 / 1024),
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
      },
      cpu: {
        cores: require('os').cpus().length,
        model: require('os').cpus()[0].model
      }
    };
  }
  
  static async checkDependencies() {
    const deps = {
      ffmpeg: await this.checkCommand('ffmpeg -version'),
      node: await this.checkCommand('node --version'),
      npm: await this.checkCommand('npm --version')
    };
    
    // Check package.json dependencies
    try {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      deps.packageDependencies = Object.keys(packageJson.dependencies || {}).length;
      deps.devDependencies = Object.keys(packageJson.devDependencies || {}).length;
    } catch (error) {
      deps.packageJsonError = error.message;
    }
    
    return deps;
  }
  
  static async checkConfiguration() {
    const config = {};
    
    // Check .env file
    config.envFile = fs.existsSync('.env');
    
    // Check config files
    config.configFiles = {
      'package.json': fs.existsSync('./package.json'),
      'remotion.config.ts': fs.existsSync('./remotion.config.ts'),
      'tsconfig.json': fs.existsSync('./tsconfig.json')
    };
    
    // Check directories
    config.directories = {
      'src': fs.existsSync('./src'),
      'output': fs.existsSync('./output'),
      'models': fs.existsSync('./models'),
      'assets': fs.existsSync('./assets')
    };
    
    return config;
  }
  
  static async checkStorage() {
    const storage = {};
    
    try {
      const outputStats = fs.statSync('./output');
      storage.outputDirectory = {
        exists: true,
        writable: true // Simplified check
      };
    } catch (error) {
      storage.outputDirectory = {
        exists: false,
        error: error.message
      };
    }
    
    // Check disk space (simplified)
    storage.diskSpace = 'Check manually with df -h or dir';
    
    return storage;
  }
  
  static async checkNetwork() {
    const network = {};
    
    // Test internet connectivity
    try {
      await this.checkCommand('ping -c 1 google.com || ping -n 1 google.com');
      network.internet = true;
    } catch {
      network.internet = false;
    }
    
    // Test API server
    try {
      const http = require('http');
      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: 3000,
          path: '/api/health',
          timeout: 2000
        }, resolve);
        req.on('error', reject);
        req.end();
      });
      network.apiServer = true;
    } catch {
      network.apiServer = false;
    }
    
    return network;
  }
  
  static async checkPerformance() {
    const performance = {};
    
    // Memory usage
    const memUsage = process.memoryUsage();
    performance.memory = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };
    
    // CPU load (simplified)
    performance.cpuLoad = require('os').loadavg();
    
    return performance;
  }
  
  static async checkCommand(command) {
    return new Promise((resolve) => {
      exec(command, (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: error ? stderr : stdout.split('\n')[0],
          error: error ? error.message : null
        });
      });
    });
  }
  
  static generateReport(results) {
    console.log('\n📊 Diagnostic Report');
    console.log('=' .repeat(50));
    
    // System info
    console.log('\n🖥️  System:');
    console.log(`Platform: ${results.system.platform}`);
    console.log(`Node.js: ${results.system.nodeVersion}`);
    console.log(`Memory: ${results.system.memory.used}MB / ${results.system.memory.total}MB`);
    console.log(`CPU: ${results.system.cpu.cores} cores`);
    
    // Dependencies
    console.log('\n📦 Dependencies:');
    Object.entries(results.dependencies).forEach(([name, info]) => {
      if (typeof info === 'object' && info.success !== undefined) {
        console.log(`${name}: ${info.success ? '✅' : '❌'} ${info.output || info.error}`);
      } else {
        console.log(`${name}: ${info}`);
      }
    });
    
    // Configuration
    console.log('\n⚙️  Configuration:');
    console.log(`Environment file: ${results.configuration.envFile ? '✅' : '❌'}`);
    Object.entries(results.configuration.configFiles).forEach(([file, exists]) => {
      console.log(`${file}: ${exists ? '✅' : '❌'}`);
    });
    
    // Network
    console.log('\n🌐 Network:');
    console.log(`Internet: ${results.network.internet ? '✅' : '❌'}`);
    console.log(`API Server: ${results.network.apiServer ? '✅' : '❌'}`);
    
    // Performance
    console.log('\n⚡ Performance:');
    console.log(`Heap Memory: ${results.performance.memory.heapUsed}MB`);
    console.log(`CPU Load: ${results.performance.cpuLoad[0].toFixed(2)}`);
    
    console.log('\n' + '=' .repeat(50));
    console.log('Diagnostic complete!');
  }
}

// Run diagnostic
if (require.main === module) {
  DiagnosticTool.runFullDiagnostic();
}

module.exports = DiagnosticTool;
```

---

**Liên hệ hỗ trợ**: Nếu các giải pháp trên không khắc phục được vấn đề, vui lòng tạo issue trên GitHub repository với thông tin từ diagnostic script.