# FAQ & Troubleshooting

## ❓ Câu hỏi thường gặp (FAQ)

### 🎬 Về Video Generation

**Q: Tại sao video của tôi render chậm?**
A: Có nhiều yếu tố ảnh hưởng đến tốc độ render:
- **Độ phức tạp**: Video có nhiều hiệu ứng, particle, lighting phức tạp sẽ render chậm hơn
- **Độ phân giải**: 4K render chậm hơn 1080p rất nhiều
- **Phần cứng**: CPU, GPU, RAM không đủ mạnh
- **Cấu hình**: Chưa tối ưu settings render

**Giải pháp**:
```json
{
  "renderSettings": {
    "quality": 6,
    "concurrency": 4,
    "imageFormat": "jpeg",
    "jpegQuality": 80,
    "scale": 1,
    "everyNthFrame": 1
  }
}
```

**Q: Làm sao để tạo video dài hơn 10 phút?**
A: Emlinh Remotion hỗ trợ video dài:
```json
{
  "meta": {
    "fps": 30,
    "totalDuration": 18000,
    "maxDuration": 36000
  }
}
```

**Q: Có thể tạo video 4K không?**
A: Có, nhưng cần cấu hình phù hợp:
```json
{
  "meta": {
    "width": 3840,
    "height": 2160,
    "fps": 30
  },
  "renderSettings": {
    "quality": 8,
    "scale": 1,
    "concurrency": 2
  }
}
```

### 🎭 Về Avatar và Lip-sync

**Q: Lip-sync không chính xác, làm sao khắc phục?**
A: Kiểm tra các yếu tố sau:
1. **Chất lượng audio**: Đảm bảo audio rõ ràng, không nhiễu
2. **Timing**: Đồng bộ hóa audio với animation
3. **Tốc độ phát**: Không quá nhanh hoặc quá chậm

```json
{
  "audio": {
    "format": "wav",
    "sampleRate": 44100,
    "channels": 1
  },
  "lipSync": {
    "sensitivity": 0.8,
    "smoothing": 0.3,
    "phonemeMapping": "vietnamese"
  }
}
```

**Q: Avatar không hiển thị hoặc bị lỗi?**
A: Kiểm tra:
- Đường dẫn model đúng
- File .glb không bị corrupt
- Model có đúng format Remotion hỗ trợ

```bash
# Kiểm tra file model
ls -la public/models/
# Validate GLB file
npx gltf-validator public/models/avatar.glb
```

**Q: Làm sao thay đổi audio cho Avatar?**
A: Sử dụng các file audio khác nhau:
```json
{
  "audio": {
    "source": "path/to/audio.wav",
    "volume": 1.0,
    "speed": 1.1,
    "pitch": 1.0
  }
}
```

Hỗ trợ các format: `wav`, `mp3`, `aac`, `ogg`

### 🎨 Về Backgrounds và Effects

**Q: Background không load được?**
A: Kiểm tra:
```json
{
  "type": "background",
  "backgroundType": "office",
  "props": {
    "variant": "modern",
    "lighting": "natural"
  }
}
```

Background types hỗ trợ: `office`, `studio`, `outdoor`, `abstract`, `gradient`

**Q: Particle effects làm video lag?**
A: Giảm số lượng particles:
```json
{
  "type": "effect",
  "effectType": "particles",
  "props": {
    "count": 50,
    "emissionRate": 20,
    "quality": "medium"
  }
}
```

### 🔧 Về Technical Issues

**Q: Lỗi "Out of memory" khi render?**
A: Tối ưu memory usage:
```json
{
  "renderSettings": {
    "concurrency": 2,
    "imageFormat": "jpeg",
    "scale": 0.8,
    "chromiumOptions": {
      "args": ["--max-old-space-size=4096"]
    }
  }
}
```

**Q: FFmpeg không được tìm thấy?**
A: Cài đặt và cấu hình FFmpeg:
```bash
# Windows (với Chocolatey)
choco install ffmpeg

# macOS (với Homebrew)
brew install ffmpeg

# Linux (Ubuntu/Debian)
sudo apt update && sudo apt install ffmpeg

# Kiểm tra cài đặt
ffmpeg -version
```

**Q: Node.js version không tương thích?**
A: Emlinh Remotion yêu cầu Node.js >= 18.0.0:
```bash
# Kiểm tra version
node --version

# Cập nhật Node.js
nvm install 18
nvm use 18
```

## 🔧 Troubleshooting Guide

### 🚨 Lỗi thường gặp

#### 1. Render Failed

**Triệu chứng**: Video không render được, báo lỗi

**Nguyên nhân**:
- Script JSON không hợp lệ
- Thiếu dependencies
- Cấu hình sai

**Giải pháp**:
```bash
# 1. Validate JSON script
npx remotion validate src/compositions/DynamicVideo.tsx

# 2. Kiểm tra dependencies
npm install

# 3. Test render với script đơn giản
npm run render -- --props='{"script":{"schemaVersion":"1.0","scenes":[{"id":"test","duration":90,"elements":[{"type":"label","text":"Test"}]}]}}'
```

#### 2. Audio Sync Issues

**Triệu chứng**: Audio và video không đồng bộ

**Nguyên nhân**:
- TTS timing không chính xác
- Frame rate không ổn định
- Audio processing delay

**Giải pháp**:
```json
{
  "audio": {
    "syncMode": "strict",
    "bufferSize": 1024,
    "sampleRate": 44100
  },
  "renderSettings": {
    "fps": 30,
    "enforceAudioTrack": true
  }
}
```

#### 3. Performance Issues

**Triệu chứng**: Render chậm, preview lag

**Nguyên nhân**:
- Hardware không đủ mạnh
- Quá nhiều effects
- Memory leak

**Giải pháp**:
```json
{
  "renderSettings": {
    "quality": 5,
    "concurrency": 2,
    "imageFormat": "jpeg",
    "jpegQuality": 70
  },
  "performance": {
    "enableGPUAcceleration": true,
    "memoryLimit": "4GB",
    "cacheSize": "1GB"
  }
}
```

#### 4. API Connection Failed

**Triệu chứng**: Không kết nối được API server

**Nguyên nhân**:
- Server chưa start
- Port bị conflict
- Firewall block

**Giải pháp**:
```bash
# 1. Kiểm tra development server
npm run dev

# 2. Test connection
curl http://localhost:3000/health

# 3. Kiểm tra port
netstat -an | grep 3000

# 4. Restart với port khác
PORT=3001 npm run dev
```

### 🔍 Debug Tools

#### 1. Logging

```javascript
// Enable debug logging
process.env.DEBUG = 'remotion:*';
process.env.REMOTION_LOG_LEVEL = 'verbose';

// Custom logging
const { Log } = require('@remotion/logger');

Log.info('Render started');
Log.warn('Performance warning');
Log.error('Render failed', error);
```

#### 2. Performance Monitoring

```javascript
// performance-monitor.js
class PerformanceMonitor {
  static startTimer(label) {
    console.time(label);
  }

  static endTimer(label) {
    console.timeEnd(label);
  }

  static logMemoryUsage() {
    const usage = process.memoryUsage();
    console.log('Memory Usage:', {
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
      external: `${Math.round(usage.external / 1024 / 1024)} MB`
    });
  }
}

// Usage
PerformanceMonitor.startTimer('render');
// ... render code ...
PerformanceMonitor.endTimer('render');
PerformanceMonitor.logMemoryUsage();
```

#### 3. Health Check

```javascript
// health-check.js
const { execSync } = require('child_process');

function systemHealthCheck() {
  const checks = {
    nodejs: checkNodeJS(),
    ffmpeg: checkFFmpeg(),
    memory: checkMemory(),
    disk: checkDiskSpace(),
    network: checkNetwork()
  };

  console.log('System Health Check:', checks);
  return checks;
}

function checkNodeJS() {
  try {
    const version = execSync('node --version', { encoding: 'utf8' }).trim();
    const major = parseInt(version.slice(1).split('.')[0]);
    return {
      status: major >= 18 ? 'OK' : 'WARNING',
      version,
      message: major >= 18 ? 'Compatible' : 'Upgrade to Node.js 18+'
    };
  } catch (error) {
    return { status: 'ERROR', message: 'Node.js not found' };
  }
}

function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return { status: 'OK', message: 'FFmpeg available' };
  } catch (error) {
    return { status: 'ERROR', message: 'FFmpeg not found' };
  }
}

function checkMemory() {
  const totalMem = require('os').totalmem();
  const freeMem = require('os').freemem();
  const usedMem = totalMem - freeMem;
  const usagePercent = (usedMem / totalMem) * 100;

  return {
    status: usagePercent < 80 ? 'OK' : 'WARNING',
    totalGB: Math.round(totalMem / 1024 / 1024 / 1024),
    freeGB: Math.round(freeMem / 1024 / 1024 / 1024),
    usagePercent: Math.round(usagePercent)
  };
}

function checkDiskSpace() {
  try {
    const stats = require('fs').statSync('.');
    return { status: 'OK', message: 'Disk accessible' };
  } catch (error) {
    return { status: 'ERROR', message: 'Disk access error' };
  }
}

function checkNetwork() {
  try {
    execSync('ping -c 1 8.8.8.8', { stdio: 'ignore', timeout: 5000 });
    return { status: 'OK', message: 'Network available' };
  } catch (error) {
    return { status: 'WARNING', message: 'Network issues detected' };
  }
}

module.exports = { systemHealthCheck };
```

### 📊 Performance Optimization

#### 1. Render Settings Optimization

```json
{
  "renderSettings": {
    "quality": 6,
    "concurrency": 4,
    "imageFormat": "jpeg",
    "jpegQuality": 80,
    "scale": 1,
    "chromiumOptions": {
      "args": [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--max-old-space-size=4096"
      ]
    }
  }
}
```

#### 2. Memory Management

```javascript
// memory-manager.js
class MemoryManager {
  static monitorMemory() {
    setInterval(() => {
      const usage = process.memoryUsage();
      const heapUsedMB = usage.heapUsed / 1024 / 1024;
      
      if (heapUsedMB > 2048) { // 2GB threshold
        console.warn('High memory usage detected:', heapUsedMB, 'MB');
        this.forceGarbageCollection();
      }
    }, 10000);
  }

  static forceGarbageCollection() {
    if (global.gc) {
      global.gc();
      console.log('Garbage collection forced');
    }
  }

  static clearCache() {
    // Clear Remotion cache
    const { clearCache } = require('@remotion/renderer');
    clearCache();
  }
}

// Start monitoring
MemoryManager.monitorMemory();
```

#### 3. Asset Optimization

```javascript
// asset-optimizer.js
const sharp = require('sharp');
const fs = require('fs');

class AssetOptimizer {
  static async optimizeImage(inputPath, outputPath, options = {}) {
    const {
      width = 1920,
      height = 1080,
      quality = 80,
      format = 'jpeg'
    } = options;

    await sharp(inputPath)
      .resize(width, height, { fit: 'cover' })
      .jpeg({ quality })
      .toFile(outputPath);

    console.log(`Optimized: ${inputPath} -> ${outputPath}`);
  }

  static async optimizeAudio(inputPath, outputPath) {
    const { execSync } = require('child_process');
    
    execSync(`ffmpeg -i "${inputPath}" -ar 44100 -ac 2 -b:a 128k "${outputPath}"`);
    console.log(`Audio optimized: ${inputPath} -> ${outputPath}`);
  }

  static async batchOptimize(directory) {
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const ext = path.extname(file).toLowerCase();
      
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        const outputPath = filePath.replace(ext, '_optimized.jpg');
        await this.optimizeImage(filePath, outputPath);
      } else if (['.mp3', '.wav'].includes(ext)) {
        const outputPath = filePath.replace(ext, '_optimized.mp3');
        await this.optimizeAudio(filePath, outputPath);
      }
    }
  }
}

module.exports = AssetOptimizer;
```

### 🆘 Emergency Recovery

#### 1. Reset Configuration

```bash
#!/bin/bash
# reset-config.sh

echo "Resetting Emlinh Remotion configuration..."

# Backup current config
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Reset to default
cat > .env << EOF
# Default Configuration
REMOTION_CONCURRENCY=4
REMOTION_QUALITY=6
REMOTION_IMAGE_FORMAT=jpeg
REMOTION_JPEG_QUALITY=80

# API Configuration
API_PORT=3000
API_HOST=localhost

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Paths
OUTPUT_DIR=./output
ASSETS_DIR=./public
EOF

echo "Configuration reset complete!"
echo "Please update .env with your API keys"
```

#### 2. Clean Installation

```bash
#!/bin/bash
# clean-install.sh

echo "Performing clean installation..."

# Remove node_modules and lock files
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install

# Rebuild native modules
npm rebuild

echo "Clean installation complete!"
```

#### 3. Diagnostic Script

```bash
#!/bin/bash
# diagnose.sh

echo "=== Emlinh Remotion Diagnostic ==="
echo

echo "Node.js Version:"
node --version
echo

echo "NPM Version:"
npm --version
echo

echo "FFmpeg Version:"
ffmpeg -version | head -1
echo

echo "System Memory:"
free -h 2>/dev/null || vm_stat | head -5
echo

echo "Disk Space:"
df -h .
echo

echo "Network Connectivity:"
ping -c 1 8.8.8.8 > /dev/null && echo "✓ Internet OK" || echo "✗ Internet Issues"
echo

echo "Project Dependencies:"
npm list --depth=0 | grep -E "(remotion|react|three)"
echo

echo "Environment Variables:"
env | grep -E "(REMOTION|OPENAI|API)" | sed 's/=.*/=****/'
echo

echo "Recent Logs:"
tail -20 logs/app.log 2>/dev/null || echo "No logs found"
echo

echo "=== Diagnostic Complete ==="
```

---

**Liên hệ hỗ trợ**:
- 📧 Email: support@emlinh.com
- 💬 Discord: [Emlinh Community](https://discord.gg/emlinh)
- 📖 Documentation: [docs.emlinh.com](https://docs.emlinh.com)
- 🐛 Bug Reports: [GitHub Issues](https://github.com/emlinh/remotion/issues)