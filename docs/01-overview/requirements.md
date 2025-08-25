# Yêu cầu Hệ thống

## 💻 Yêu cầu Phần cứng

### Minimum Requirements
```
CPU: Intel i5-8400 / AMD Ryzen 5 2600 hoặc tương đương
RAM: 8GB DDR4
GPU: Integrated graphics (Intel UHD 630 / AMD Vega 8)
Storage: 5GB free space (SSD khuyến nghị)
Network: Broadband internet connection
```

### Recommended Requirements
```
CPU: Intel i7-10700K / AMD Ryzen 7 3700X hoặc cao hơn
RAM: 16GB DDR4 (32GB cho projects lớn)
GPU: NVIDIA GTX 1660 / AMD RX 580 hoặc cao hơn
Storage: 20GB free space (NVMe SSD)
Network: High-speed broadband (100+ Mbps)
```

### Professional Requirements
```
CPU: Intel i9-12900K / AMD Ryzen 9 5900X hoặc cao hơn
RAM: 32GB DDR4/DDR5 (64GB cho production)
GPU: NVIDIA RTX 3070 / AMD RX 6700 XT hoặc cao hơn
Storage: 50GB+ free space (NVMe SSD RAID)
Network: Gigabit ethernet
```

## 🖥️ Hệ điều hành

### Supported Platforms

#### Windows
- **Windows 10**: Version 1903 trở lên
- **Windows 11**: Tất cả versions
- **Windows Server**: 2019, 2022

#### macOS
- **macOS Big Sur**: 11.0 trở lên
- **macOS Monterey**: 12.0 trở lên
- **macOS Ventura**: 13.0 trở lên
- **macOS Sonoma**: 14.0 trở lên

#### Linux
- **Ubuntu**: 20.04 LTS, 22.04 LTS
- **Debian**: 11, 12
- **CentOS**: 8, 9
- **Fedora**: 35, 36, 37
- **Arch Linux**: Rolling release

## 🛠️ Software Dependencies

### Core Runtime

#### Node.js
```bash
# Required version
Node.js >= 18.0.0
npm >= 8.0.0

# Recommended version
Node.js >= 20.0.0
npm >= 10.0.0
```

#### FFmpeg
```bash
# Windows (via Chocolatey)
choco install ffmpeg

# macOS (via Homebrew)
brew install ffmpeg

# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg
```

### Development Tools

#### Git
```bash
# Version control
Git >= 2.30.0

# Installation
# Windows: https://git-scm.com/download/win
# macOS: brew install git
# Linux: sudo apt install git
```

#### Code Editor
- **Visual Studio Code** (khuyến nghị)
- **WebStorm**
- **Sublime Text**
- **Vim/Neovim**

### Browser Requirements

#### Development
- **Chrome**: Version 100+
- **Firefox**: Version 100+
- **Safari**: Version 15+
- **Edge**: Version 100+

#### Production Preview
- **Modern browsers** với WebGL 2.0 support
- **Hardware acceleration** enabled
- **JavaScript** enabled

## 🔧 Environment Setup

### Environment Variables

```bash
# Required
NODE_ENV=development|production
REMOTION_PROJECT_PATH=/path/to/project

# Optional
REMOTION_OUTPUT_DIR=/path/to/output
REMOTION_CACHE_DIR=/path/to/cache
LOG_LEVEL=info|debug|warn|error

# Audio Configuration
AUDIO_SOURCE_PATH=./public/audios
AUDIO_MAX_SIZE=50MB

# API Server
API_SERVER_PORT=3000
API_SERVER_HOST=localhost
```

### System Configuration

#### Memory Settings
```bash
# Node.js heap size
export NODE_OPTIONS="--max-old-space-size=8192"

# For large projects
export NODE_OPTIONS="--max-old-space-size=16384"
```

#### File System
```bash
# Increase file watchers (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Increase file descriptors
ulimit -n 65536
```

## 🌐 Network Requirements

### Bandwidth
- **Minimum**: 10 Mbps download, 5 Mbps upload
- **Recommended**: 50 Mbps download, 25 Mbps upload
- **Professional**: 100+ Mbps download, 50+ Mbps upload

### Ports
```
3000: Remotion development server
3001: API server (alternative)
8080: Preview server (alternative)
9229: Node.js debugger
```

### External Services
```
OpenAI API: api.openai.com (HTTPS)
CDN Assets: Various CDN endpoints
NPM Registry: registry.npmjs.org (HTTPS)
Git Repositories: github.com, gitlab.com (HTTPS/SSH)
```

## 📦 Storage Requirements

### Project Files
```
Source Code: ~100MB
Node Modules: ~500MB - 1GB
Assets: Variable (100MB - 10GB+)
Cache: ~200MB - 2GB
Output Videos: Variable (10MB - 1GB per video)
```

### Temporary Storage
```
Rendering Cache: 2-5x final video size
Audio Processing: ~100MB per minute
Lip-sync Data: ~1MB per minute
Preview Cache: ~500MB
```

## 🔒 Security Requirements

### Firewall Configuration
```bash
# Allow development ports
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp

# Allow HTTPS for external APIs
sudo ufw allow out 443/tcp
```

### API Keys
- **OpenAI API Key**: Required for TTS functionality
- **Storage**: Environment variables hoặc secure key management
- **Permissions**: Read-only access khuyến nghị

### File Permissions
```bash
# Project directory
chmod 755 /path/to/project

# Output directory
chmod 755 /path/to/output

# Cache directory
chmod 755 /path/to/cache
```

## 🧪 Development Environment

### IDE Extensions (VS Code)
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml"
  ]
}
```

### Git Configuration
```bash
# User setup
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Line endings
git config --global core.autocrlf input  # Linux/macOS
git config --global core.autocrlf true   # Windows
```

## 📊 Performance Monitoring

### System Monitoring
```bash
# CPU usage
top -p $(pgrep node)

# Memory usage
ps aux | grep node

# Disk usage
df -h
du -sh node_modules/
```

### Application Monitoring
```javascript
// Performance metrics
console.time('render');
// ... rendering code ...
console.timeEnd('render');

// Memory usage
console.log(process.memoryUsage());
```

## 🚨 Troubleshooting

### Common Issues

#### Out of Memory
```bash
# Increase Node.js heap size
export NODE_OPTIONS="--max-old-space-size=8192"

# Clear cache
npm run clean
rm -rf node_modules/.cache
```

#### Port Conflicts
```bash
# Find process using port
lsof -i :3000
netstat -tulpn | grep :3000

# Kill process
kill -9 <PID>
```

#### Permission Errors
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Performance Optimization

#### Rendering Performance
```typescript
// Reduce quality for preview
Config.setVideoImageFormat('jpeg');
Config.setImageFormat('jpeg');
Config.setConcurrency(2);

// Optimize for production
Config.setVideoImageFormat('png');
Config.setImageFormat('png');
Config.setConcurrency(os.cpus().length);
```

#### Memory Optimization
```typescript
// Lazy load large assets
const Avatar = lazy(() => import('./Avatar'));

// Cleanup unused resources
useEffect(() => {
  return () => {
    // Cleanup code
  };
}, []);
```

---

**Tiếp theo**: [Tài liệu API](../02-api/components.md)