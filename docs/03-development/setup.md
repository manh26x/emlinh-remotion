# Setup & Installation

## 🚀 Hướng dẫn Cài đặt

### Yêu cầu Hệ thống

#### Phần cứng Tối thiểu
- **CPU**: Intel i5 hoặc AMD Ryzen 5 (4 cores)
- **RAM**: 8GB
- **GPU**: DirectX 11 compatible (khuyến nghị NVIDIA GTX 1060 hoặc tương đương)
- **Ổ cứng**: 10GB dung lượng trống
- **Mạng**: Kết nối internet ổn định

#### Phần cứng Khuyến nghị
- **CPU**: Intel i7/i9 hoặc AMD Ryzen 7/9 (8+ cores)
- **RAM**: 16GB+
- **GPU**: NVIDIA RTX 3060 hoặc cao hơn
- **Ổ cứng**: SSD với 50GB+ dung lượng trống

### Phần mềm Cần thiết

#### 1. Node.js & npm
```bash
# Kiểm tra version hiện tại
node --version  # >= 18.0.0
npm --version   # >= 8.0.0

# Cài đặt Node.js từ https://nodejs.org/
# Hoặc sử dụng nvm (khuyến nghị)
nvm install 18.19.0
nvm use 18.19.0
```

#### 2. FFmpeg
```bash
# Windows (sử dụng Chocolatey)
choco install ffmpeg

# macOS (sử dụng Homebrew)
brew install ffmpeg

# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install ffmpeg

# Kiểm tra cài đặt
ffmpeg -version
```

#### 3. Git
```bash
# Kiểm tra Git
git --version

# Cấu hình Git (nếu chưa có)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 📦 Cài đặt Dự án

### 1. Clone Repository
```bash
# Clone dự án
git clone https://github.com/your-org/emlinh-remotion.git
cd emlinh-remotion

# Kiểm tra branch
git branch -a
git checkout main
```

### 2. Cài đặt Dependencies
```bash
# Cài đặt packages
npm install

# Hoặc sử dụng yarn (nếu prefer)
yarn install

# Kiểm tra dependencies
npm list --depth=0
```

### 3. Cấu hình Environment Variables
```bash
# Copy file .env.example
cp .env.example .env

# Chỉnh sửa file .env
nano .env  # hoặc code .env
```

#### Cấu hình .env
```env
# === REMOTION CONFIGURATION ===
REMOTION_PROJECT_PATH=./
REMOTION_OUTPUT_DIR=./output
REMOTION_CACHE_DIR=./cache
REMOTION_TEMP_DIR=./temp

# === OPENAI CONFIGURATION ===
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_TTS_MODEL=tts-1
OPENAI_TTS_VOICE=alloy

# === AUDIO CONFIGURATION ===
AUDIO_SAMPLE_RATE=44100
AUDIO_CHANNELS=2
AUDIO_BITRATE=192k

# === VIDEO CONFIGURATION ===
DEFAULT_VIDEO_WIDTH=1920
DEFAULT_VIDEO_HEIGHT=1080
DEFAULT_VIDEO_FPS=30
DEFAULT_VIDEO_QUALITY=8

# === API CONFIGURATION ===
API_SERVER_PORT=3001
API_LOG_LEVEL=info
API_ENABLE_CORS=true

# === DEVELOPMENT ===
NODE_ENV=development
DEBUG=true
LOG_LEVEL=debug
HOT_RELOAD=true

# === PATHS ===
ASSETS_DIR=./assets
TEMPLATES_DIR=./templates
LOGS_DIR=./logs
```

### 4. Tạo Cấu trúc Thư mục
```bash
# Tạo các thư mục cần thiết
mkdir -p output cache temp logs assets/audio assets/images assets/models templates

# Kiểm tra cấu trúc
tree -L 2  # hoặc ls -la
```

### 5. Kiểm tra Cài đặt
```bash
# Chạy health check
npm run health-check

# Kiểm tra Remotion
npm run remotion:preview

# Test render đơn giản
npm run test:render
```

## 🔧 Cấu hình IDE

### Visual Studio Code

#### Extensions Khuyến nghị
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-typescript-next",
    "remotion.remotion"
  ]
}
```

#### Settings.json
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.tsx": "typescriptreact",
    "*.ts": "typescript"
  },
  "emmet.includeLanguages": {
    "typescriptreact": "html"
  }
}
```

#### Tasks.json
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Remotion Preview",
      "type": "shell",
      "command": "npm",
      "args": ["run", "remotion:preview"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "new"
      }
    },
    {
      "label": "Render Video",
      "type": "shell",
      "command": "npm",
      "args": ["run", "render"],
      "group": "build"
    }
  ]
}
```

### WebStorm/IntelliJ

#### Plugins Khuyến nghị
- TypeScript
- Prettier
- ESLint
- Tailwind CSS
- File Watchers

## 🏃‍♂️ Chạy Dự án

### Development Mode
```bash
# Khởi động Remotion preview
npm run dev
# hoặc
npm run remotion:preview

# Mở browser tại http://localhost:3000
```

### Production Build
```bash
# Build dự án
npm run build

# Render video production
npm run render:prod
```

### API Server
```bash
# Khởi động API server
npm run api:start

# Kiểm tra API server
curl http://localhost:3001/health
```

## 🧪 Testing

### Unit Tests
```bash
# Chạy tất cả tests
npm test

# Chạy tests với watch mode
npm run test:watch

# Chạy tests với coverage
npm run test:coverage
```

### Integration Tests
```bash
# Test render pipeline
npm run test:render

# Test API integration
npm run test:api

# Test TTS integration
npm run test:tts
```

### E2E Tests
```bash
# Cài đặt Playwright (nếu chưa có)
npx playwright install

# Chạy E2E tests
npm run test:e2e
```

## 🔍 Debugging

### VS Code Debugging

#### launch.json
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Remotion",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/remotion",
      "args": ["preview"],
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "true"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug API Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/api/server.ts",
      "env": {
        "NODE_ENV": "development",
        "LOG_LEVEL": "debug"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

### Browser DevTools
```javascript
// Thêm vào component để debug
console.log('Current frame:', useCurrentFrame());
console.log('Video config:', useVideoConfig());

// Debug audio data
const audioData = useAudioData(audioSrc);
console.log('Audio data:', audioData);
```

### Logging
```typescript
// Sử dụng logger có sẵn
import { logger } from './src/utils/logger';

logger.debug('Debug message');
logger.info('Info message');
logger.warn('Warning message');
logger.error('Error message');
```

## 🚨 Troubleshooting

### Lỗi Thường gặp

#### 1. FFmpeg không tìm thấy
```bash
# Kiểm tra PATH
echo $PATH

# Thêm FFmpeg vào PATH (Windows)
setx PATH "%PATH%;C:\ffmpeg\bin"

# Restart terminal và kiểm tra lại
ffmpeg -version
```

#### 2. Node.js version không tương thích
```bash
# Kiểm tra version
node --version

# Cài đặt version đúng
nvm install 18.19.0
nvm use 18.19.0

# Cài đặt lại dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 3. Port đã được sử dụng
```bash
# Kiểm tra port đang sử dụng
netstat -tulpn | grep :3000

# Kill process
kill -9 <PID>

# Hoặc sử dụng port khác
PORT=3001 npm run dev
```

#### 4. Memory issues
```bash
# Tăng memory limit cho Node.js
export NODE_OPTIONS="--max-old-space-size=4096"

# Hoặc trong package.json
"scripts": {
  "dev": "node --max-old-space-size=4096 node_modules/.bin/remotion preview"
}
```

### Performance Optimization

#### 1. Caching
```bash
# Clear cache nếu gặp vấn đề
rm -rf cache/*
rm -rf node_modules/.cache

# Rebuild cache
npm run build:cache
```

#### 2. GPU Acceleration
```env
# Trong .env
REMOTION_GL=angle
REMOTION_BROWSER_EXECUTABLE=/path/to/chrome
```

#### 3. Parallel Processing
```env
# Tăng số worker threads
REMOTION_CONCURRENCY=4
REMOTION_BROWSER_CONCURRENCY=2
```

## 📚 Tài nguyên Bổ sung

### Documentation
- [Remotion Docs](https://remotion.dev/docs)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [OpenAI TTS API](https://platform.openai.com/docs/guides/text-to-speech)

### Community
- [Remotion Discord](https://discord.gg/remotion)
- [GitHub Issues](https://github.com/your-org/emlinh-remotion/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/remotion)

### Tools
- [Remotion Lambda](https://remotion.dev/lambda) - Cloud rendering
- [Remotion Player](https://remotion.dev/player) - Embed videos
- [Lottie to Remotion](https://lottie-to-remotion.vercel.app/) - Convert animations

---

**Tiếp theo**: [Development Workflow](./workflow.md)