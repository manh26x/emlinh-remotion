# TTS User Guide - Hướng dẫn sử dụng

## Tổng quan

TTS Integration cho phép bạn tạo video với voice-over tự động từ text hoặc topic. Hệ thống sử dụng OpenAI TTS API để tạo audio chất lượng cao.

## Cách sử dụng cơ bản

### 1. Tạo video từ topic
```
Render video về "Artificial Intelligence in 2024"
```

**Quy trình tự động:**
1. Claude tạo script từ topic
2. MCP server generate TTS audio
3. Render video với audio

### 2. Tạo video với script có sẵn
```
Render video với script: "Xin chào, hôm nay chúng ta sẽ tìm hiểu về AI..."
```

### 3. Tùy chỉnh voice và chất lượng
```
Render video về "Technology" với voice "nova" và chất lượng HD
```

## Các lệnh chi tiết

### generate_tts_audio
Tạo audio từ text.

**Cú pháp:**
```
Tạo audio TTS từ text: "Nội dung cần chuyển thành giọng nói"
```

**Tùy chọn:**
- **Voice**: alloy, echo, fable, onyx, nova, shimmer
- **Model**: tts-1 (standard), tts-1-hd (high quality)
- **Speed**: 0.25 - 4.0 (tốc độ nói)

**Ví dụ:**
```
Tạo audio với voice "nova", model "tts-1-hd", speed 1.2
```

### generate_script
Tạo script từ topic.

**Cú pháp:**
```
Tạo script về chủ đề: "Machine Learning"
```

**Tùy chọn:**
- **Template**: general, educational, professional, entertaining
- **Tone**: professional, casual, educational, entertaining
- **Language**: vi (tiếng Việt), en (English)
- **Max words**: 50-2000 từ

**Ví dụ:**
```
Tạo script educational về "Blockchain" với tone professional, 800 từ
```

### render_video_with_tts
All-in-one command để render video với TTS.

**Cú pháp:**
```
Render video composition "Scene-Landscape" về topic "AI Revolution"
```

**Tùy chọn đầy đủ:**
```
Render video "Scene-Portrait" với:
- Topic: "Future of Work"
- Voice: "alloy"
- TTS Model: "tts-1-hd"
- Resolution: 1920x1080
- FPS: 30
- Quality: 8
```

## Voice Options

### Các giọng nói có sẵn

| Voice | Mô tả | Phù hợp cho |
|-------|-------|-------------|
| **alloy** | Cân bằng, trung tính | Nội dung chung, professional |
| **echo** | Nam, rõ ràng | Presentation, giáo dục |
| **fable** | Nữ, ấm áp | Storytelling, friendly content |
| **onyx** | Nam, sâu | Dramatic, authoritative |
| **nova** | Nữ, năng động | Energetic, modern content |
| **shimmer** | Nữ, nhẹ nhàng | Soft, calming content |

### Chất lượng model

| Model | Chất lượng | Tốc độ | Chi phí | Khuyến nghị |
|-------|------------|--------|---------|-------------|
| **tts-1** | Standard | Nhanh | Thấp | Prototype, test |
| **tts-1-hd** | High | Chậm hơn | Cao hơn | Production, final video |

## Quản lý Audio Files

### Xem danh sách audio
```
Liệt kê các file audio đã tạo
```

### Lọc audio files
```
Liệt kê audio files với voice "nova" trong 24h qua
```

### Xóa audio file
```
Xóa audio file với ID: abc-123-def
```

### Dọn dẹp files cũ
```
Dọn dẹp audio files cũ hơn 48 giờ
```

## Tips & Best Practices

### 1. Tối ưu Script
- **Độ dài**: 300-800 từ cho video ngắn
- **Câu ngắn**: Dễ nghe, rõ ràng
- **Dấu câu**: Sử dụng đúng để tạo nhịp điệu
- **Từ khóa**: Nhấn mạnh từ quan trọng

### 2. Chọn Voice phù hợp
- **Professional content**: alloy, echo
- **Educational**: echo, nova
- **Storytelling**: fable, shimmer
- **Marketing**: nova, onyx

### 3. Tối ưu Performance
- **Cache**: Reuse audio cho text giống nhau
- **Batch**: Tạo nhiều audio cùng lúc
- **Quality**: Dùng tts-1 cho test, tts-1-hd cho final

### 4. Xử lý lỗi
- **API Key**: Đảm bảo OpenAI key hợp lệ
- **Rate Limit**: Chờ và retry tự động
- **Text quá dài**: Chia nhỏ thành các đoạn

## Workflow Examples

### Video giáo dục
```
1. Tạo script educational về "Python Programming" với 1000 từ
2. Generate TTS với voice "echo", model "tts-1-hd"
3. Render video "Scene-Landscape" với audio
```

### Video marketing
```
1. Viết script marketing về sản phẩm
2. Generate TTS với voice "nova", speed 1.1
3. Render video "Scene-Portrait" với effects
```

### Video presentation
```
1. Import slides content làm script
2. Generate TTS với voice "alloy", model "tts-1-hd"
3. Render video với custom parameters
```

## Troubleshooting

### Lỗi thường gặp

**"API key invalid"**
- Kiểm tra OPENAI_API_KEY trong environment
- Đảm bảo key có quyền TTS

**"Text too long"**
- Giới hạn 4096 characters per request
- Chia text thành các đoạn nhỏ hơn

**"Rate limit exceeded"**
- Chờ 1 phút rồi thử lại
- Giảm số request đồng thời

**"Audio generation failed"**
- Kiểm tra network connection
- Thử lại với text đơn giản hơn

**"File save failed"**
- Kiểm tra quyền write vào thư mục audios
- Đảm bảo đủ disk space

### Debug Commands

```bash
# Kiểm tra API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Kiểm tra thư mục audio
ls -la public/audios/

# Xem logs
tail -f logs/mcp-server.log
```

## Limitations

### OpenAI API Limits
- **Text length**: Maximum 4,096 characters
- **Rate limit**: 50 requests/minute
- **File size**: ~25MB per audio file
- **Concurrent**: 3 requests simultaneously

### Storage Limits
- **Max files**: 100 audio files
- **Total size**: 1GB storage
- **Retention**: 24 hours default

### Language Support
- **Primary**: English (tốt nhất)
- **Vietnamese**: Hỗ trợ tốt
- **Other languages**: Có thể có accent

## Advanced Usage

### Custom Script Templates
```javascript
// Tạo template riêng
const customTemplate = {
  name: 'product-demo',
  structure: [
    'Hook (15s)',
    'Problem (30s)', 
    'Solution (45s)',
    'Call-to-action (15s)'
  ]
};
```

### Batch Processing
```javascript
// Xử lý nhiều scripts cùng lúc
const topics = ['AI', 'Blockchain', 'IoT'];
for (const topic of topics) {
  await generateTTSAudio(topic);
}
```

### Integration với Remotion
```typescript
// Sử dụng audio trong Remotion composition
export const MyComposition: React.FC = () => {
  return (
    <Audio src={staticFile('audios/generated-audio.mp3')} />
  );
};
```

---

## Kết luận

TTS Integration cung cấp workflow hoàn chỉnh từ idea đến video với voice-over chuyên nghiệp. Sử dụng các best practices và tips trên để tạo ra content chất lượng cao một cách hiệu quả.
