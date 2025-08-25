# Getting Started

## 🚀 Bắt đầu với Emlinh Remotion

### Tổng quan
Emlinh Remotion là nền tảng tạo video AI mạnh mẽ, cho phép bạn tạo ra các video chất lượng cao từ văn bản với công nghệ lip-sync thực tế và hiệu ứng 3D ấn tượng.

### Yêu cầu Hệ thống

#### Tối thiểu
- **Hệ điều hành**: Windows 10, macOS 10.15, hoặc Ubuntu 18.04+
- **RAM**: 8GB
- **CPU**: Intel i5 hoặc AMD Ryzen 5
- **GPU**: DirectX 11 compatible
- **Ổ cứng**: 10GB dung lượng trống
- **Mạng**: Kết nối internet ổn định

#### Khuyến nghị
- **RAM**: 16GB+
- **CPU**: Intel i7/i9 hoặc AMD Ryzen 7/9
- **GPU**: NVIDIA RTX 3060 hoặc cao hơn
- **Ổ cứng**: SSD với 50GB+ dung lượng trống

## 📦 Cài đặt

### Bước 1: Cài đặt Node.js
1. Truy cập [nodejs.org](https://nodejs.org/)
2. Tải và cài đặt phiên bản LTS (18.x hoặc cao hơn)
3. Kiểm tra cài đặt:
```bash
node --version
npm --version
```

### Bước 2: Cài đặt FFmpeg

#### Windows
```bash
# Sử dụng Chocolatey
choco install ffmpeg

# Hoặc tải từ https://ffmpeg.org/download.html
```

#### macOS
```bash
# Sử dụng Homebrew
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

### Bước 3: Clone và Cài đặt Dự án
```bash
# Clone repository
git clone https://github.com/your-org/emlinh-remotion.git
cd emlinh-remotion

# Cài đặt dependencies
npm install

# Cấu hình environment
cp .env.example .env
```

### Bước 4: Cấu hình API Keys
Chỉnh sửa file `.env`:
```env
# Audio Configuration
AUDIO_SOURCE_PATH=./public/audios

# Cấu hình video mặc định
DEFAULT_VIDEO_WIDTH=1920
DEFAULT_VIDEO_HEIGHT=1080
DEFAULT_VIDEO_FPS=30
```

### Bước 5: Khởi chạy Ứng dụng
```bash
# Khởi động development server
npm run dev

# Mở browser tại http://localhost:3000
```

## 🎬 Tạo Video Đầu tiên

### Phương pháp 1: Sử dụng Web Interface

1. **Mở ứng dụng** tại `http://localhost:3000`

2. **Nhập văn bản**:
   ```
   Xin chào! Tôi là avatar AI được tạo bằng Emlinh Remotion. 
   Tôi có thể nói tiếng Việt và nhiều ngôn ngữ khác với lip-sync chính xác.
   ```

3. **Chọn cấu hình**:
   - **Voice**: `alloy` (giọng nữ tự nhiên)
   - **Resolution**: `1920x1080`
   - **FPS**: `30`
   - **Quality**: `8/10`

4. **Bấm "Generate Video"** và chờ quá trình xử lý

5. **Xem kết quả** trong video player

### Phương pháp 2: Sử dụng Script JSON

1. **Tạo file script** `my-first-video.json`:
```json
{
  "schemaVersion": "1.0",
  "meta": {
    "title": "Video Đầu Tiên",
    "fps": 30,
    "width": 1920,
    "height": 1080
  },
  "scenes": [
    {
      "id": "intro",
      "duration": 300,
      "elements": [
        {
          "type": "character",
          "id": "main-avatar",
          "text": "Chào mừng đến với Emlinh Remotion!",
          "position": [0, 0, 0],
          "scale": 1,
          "modelPath": "/models/avatar-female.glb"
        },
        {
          "type": "label",
          "id": "title",
          "text": "Video Đầu Tiên",
          "position": [0, 200, 0],
          "fontSize": 48,
          "color": "#ffffff"
        }
      ]
    }
  ]
}
```

2. **Render video từ script**:
```bash
npm run render -- --props='{"script": "./my-first-video.json"}'
```

### Phương pháp 3: Sử dụng Command Line

```bash
# Render video với CLI
npm run render -- --composition=DynamicVideo --props=./scripts/video-props.json
```

**Ví dụ props file**:
```json
// scripts/video-props.json
{
  "script": {
    "schemaVersion": "1.0",
    "meta": {
      "title": "My First Video",
      "fps": 30,
      "width": 1280,
      "height": 720
    },
    "scenes": [{
      "id": "scene1",
      "duration": 90,
      "elements": [{
        "type": "text",
        "content": {
          "text": "Hello World!",
          "position": { "x": 640, "y": 360 },
          "style": { "fontSize": 48, "color": "white" }
        }
      }]
    }]
  },
  "outputPath": "./output/cli-video.mp4"
}
```

## 🎨 Tùy chỉnh Video

### Thay đổi Avatar

1. **Thêm model mới** vào thư mục `assets/models/`
2. **Cập nhật script**:
```json
{
  "type": "character",
  "id": "custom-avatar",
  "modelPath": "/models/my-custom-avatar.glb",
  "position": [0, -50, 0],
  "scale": 1.2
}
```

### Thêm Background

```json
{
  "type": "background",
  "id": "office-bg",
  "backgroundType": "office",
  "props": {
    "lighting": "warm",
    "furniture": "modern"
  }
}
```

### Tùy chỉnh Giọng nói

```json
{
  "type": "character",
  "id": "avatar1",
  "text": "Văn bản cần đọc",
  "voice": {
    "provider": "local",
    "voice": "nova",
    "speed": 1.1,
    "language": "vi-VN"
  }
}
```

### Thêm Hiệu ứng

```json
{
  "type": "effect",
  "id": "particles",
  "effectType": "floating-particles",
  "props": {
    "count": 50,
    "color": "#00ff88",
    "speed": 0.5
  }
}
```

## 🔧 Cấu hình Nâng cao

### Tối ưu Hiệu suất

```env
# Trong file .env
REMOTION_CONCURRENCY=4
REMOTION_BROWSER_CONCURRENCY=2
REMOTION_GL=angle
NODE_OPTIONS="--max-old-space-size=4096"
```

### Cấu hình Chất lượng

```json
{
  "renderSettings": {
    "quality": 9,
    "bitrate": "8M",
    "codec": "h264",
    "preset": "slow"
  }
}
```

### Cấu hình Audio

```json
{
  "audioSettings": {
    "sampleRate": 44100,
    "channels": 2,
    "bitrate": "192k",
    "format": "mp3"
  }
}
```

## 📱 Sử dụng trên Mobile

### Responsive Design
Giao diện web tự động thích ứng với màn hình mobile:
- **Portrait mode**: Layout dọc tối ưu
- **Touch controls**: Điều khiển cảm ứng
- **Reduced quality**: Chất lượng thấp hơn để tiết kiệm băng thông

### Mobile-specific Settings
```json
{
  "mobileSettings": {
    "maxWidth": 720,
    "maxHeight": 1280,
    "quality": 6,
    "fps": 24
  }
}
```

## 🌐 Tích hợp với AI Assistants

### Sử dụng với ChatGPT/Claude

1. **Tạo script JSON**:
   - Sử dụng AI để generate script JSON
   - Copy script vào file local
   - Render bằng command line

2. **Workflow tự động**:
```bash
# Tạo script từ prompt
echo "Tạo video giới thiệu công ty" | ai-script-generator > script.json

# Render video
npm run render -- --props=script.json
```

### Template Prompts

#### Tạo Video Cơ bản
```
Tạo JSON script cho video với:
- Nội dung: "[NỘI DUNG]"
- Độ phân giải: 1920x1080
- FPS: 30
- Avatar: female
- Background: office
```

#### Tạo Video Presentation
```
Tạo JSON script cho presentation:
- Tiêu đề: "[TIÊU ĐỀ]"
- Nội dung: "[NỘI DUNG]"
- Bullet points: ["Điểm 1", "Điểm 2", "Điểm 3"]
- Style: professional
```

## 🎯 Use Cases Phổ biến

### 1. Video Marketing
```json
{
  "schemaVersion": "1.0",
  "meta": {
    "title": "Product Launch Video",
    "fps": 30,
    "width": 1920,
    "height": 1080
  },
  "scenes": [
    {
      "id": "intro",
      "duration": 180,
      "elements": [
        {
          "type": "character",
          "text": "Giới thiệu sản phẩm mới của chúng tôi!",
          "voice": { "voice": "nova", "speed": 1.1 }
        },
        {
          "type": "label",
          "text": "SẢN PHẨM MỚI",
          "fontSize": 64,
          "color": "#ff6b35"
        }
      ]
    }
  ]
}
```

### 2. Educational Content
```json
{
  "scenes": [
    {
      "id": "lesson1",
      "elements": [
        {
          "type": "character",
          "text": "Hôm nay chúng ta sẽ học về trí tuệ nhân tạo.",
          "modelPath": "/models/teacher-avatar.glb"
        },
        {
          "type": "background",
          "backgroundType": "classroom"
        }
      ]
    }
  ]
}
```

### 3. News & Updates
```json
{
  "scenes": [
    {
      "id": "news",
      "elements": [
        {
          "type": "character",
          "text": "Tin tức công nghệ mới nhất trong tuần này.",
          "voice": { "voice": "alloy", "speed": 1.0 }
        },
        {
          "type": "background",
          "backgroundType": "newsroom"
        }
      ]
    }
  ]
}
```

## 🔍 Tips & Tricks

### Tối ưu Chất lượng Lip-sync
1. **Sử dụng văn bản rõ ràng**: Tránh từ viết tắt, ký hiệu đặc biệt
2. **Ngắt câu hợp lý**: Thêm dấu phẩy, chấm để tạo nhịp tự nhiên
3. **Kiểm tra audio**: Đảm bảo file audio có chất lượng tốt

### Tăng Tốc Render
1. **Sử dụng SSD**: Lưu project và cache trên SSD
2. **Tăng RAM**: Cấp phát nhiều RAM hơn cho Node.js
3. **GPU Acceleration**: Bật GPU acceleration nếu có
4. **Parallel Processing**: Tăng số worker threads

### Tiết kiệm Dung lượng
1. **Optimize Assets**: Nén model 3D và texture
2. **Reduce Quality**: Giảm chất lượng cho preview
3. **Cache Management**: Dọn dẹp cache định kỳ

### Debug Common Issues
1. **Audio không sync**: Kiểm tra sample rate và timing
2. **Model không load**: Verify đường dẫn và format file
3. **Render chậm**: Giảm quality hoặc resolution
4. **Memory issues**: Tăng Node.js memory limit

## 📚 Tài nguyên Học tập

### Documentation
- [API Reference](../02-api/components.md)
- [Development Guide](../03-development/setup.md)
- [Troubleshooting](../06-troubleshooting/common-issues.md)

### Video Tutorials
- [YouTube Channel](https://youtube.com/emlinh-remotion)
- [Getting Started Playlist](https://youtube.com/playlist?list=xxx)

### Community
- [Discord Server](https://discord.gg/emlinh-remotion)
- [GitHub Discussions](https://github.com/your-org/emlinh-remotion/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/emlinh-remotion)

### Examples
- [Sample Scripts](https://github.com/your-org/emlinh-remotion-examples)
- [Template Library](https://templates.emlinh-remotion.com)
- [Asset Store](https://assets.emlinh-remotion.com)

---

**Tiếp theo**: [Advanced Usage](./advanced-usage.md)