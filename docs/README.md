# Emlinh Remotion Documentation

> Tài liệu hướng dẫn đầy đủ cho dự án Emlinh Remotion - Hệ thống tạo video AI với Avatar và Lip-sync

## 📚 Mục lục

### [01. Tổng quan dự án](./01-overview/)
- [**Project Overview**](./01-overview/project-overview.md) - Giới thiệu tổng quan về dự án
- [**Architecture**](./01-overview/architecture.md) - Kiến trúc hệ thống và các thành phần
- [**Features**](./01-overview/features.md) - Tính năng chính và khả năng của hệ thống

### [02. API & Components](./02-api/)
- [**Schema Reference**](./02-api/schema-reference.md) - Tài liệu tham khảo schema video
- [**Components**](./02-api/components.md) - Các component React và Remotion
- [**Hooks**](./02-api/hooks.md) - Custom hooks và utilities

### [03. Development Guide](./03-development/)
- [**Setup**](./03-development/setup.md) - Hướng dẫn cài đặt môi trường phát triển
- [**Workflow**](./03-development/workflow.md) - Quy trình phát triển và best practices
- [**Testing**](./03-development/testing.md) - Hướng dẫn kiểm thử và quality assurance

### [04. User Guides](./04-user-guides/)
- [**Getting Started**](./04-user-guides/getting-started.md) - Hướng dẫn bắt đầu cho người dùng
- [**Advanced Usage**](./04-user-guides/advanced-usage.md) - Kỹ thuật nâng cao và tùy chỉnh
- [**FAQ & Troubleshooting**](./04-user-guides/faq-troubleshooting.md) - Câu hỏi thường gặp và xử lý sự cố

### [05. Troubleshooting](./05-troubleshooting/)
- [**Common Issues**](./06-troubleshooting/common-issues.md) - Các vấn đề thường gặp và cách khắc phục

## 🚀 Quick Start

### Cho người dùng cuối
1. Đọc [Getting Started Guide](./04-user-guides/getting-started.md)
2. Cài đặt theo hướng dẫn
3. Tạo video đầu tiên của bạn

### Cho nhà phát triển
1. Đọc [Project Overview](./01-overview/project-overview.md)
2. Thiết lập môi trường theo [Setup Guide](./03-development/setup.md)
3. Tìm hiểu [Architecture](./01-overview/architecture.md)
4. Bắt đầu phát triển với [Workflow Guide](./03-development/workflow.md)



## 🎯 Tính năng chính

- **🎬 Video Generation**: Tạo video từ script JSON với AI
- **👤 Avatar System**: Hệ thống avatar 3D với lip-sync chính xác
- **🎵 Audio Integration**: Tích hợp file audio từ nguồn bên ngoài
- **🔄 API Integration**: Tích hợp với các dịch vụ bên ngoài
- **⚡ Real-time Preview**: Xem trước video thời gian thực
- **🎨 Customizable**: Tùy chỉnh avatar, background, effects
- **📱 Multi-platform**: Hỗ trợ Windows, macOS, Linux

## 🛠️ Công nghệ sử dụng

- **Frontend**: React, TypeScript, Remotion
- **Backend**: Node.js, Express
- **3D Graphics**: Three.js, React Three Fiber
- **Audio**: Web Audio API, External Audio Files
- **Video**: FFmpeg, Remotion Renderer
- **Audio Processing**: Audio file processing and synchronization

## 📋 Yêu cầu hệ thống

### Tối thiểu
- **OS**: Windows 10, macOS 10.15, Ubuntu 18.04+
- **CPU**: Intel i5 hoặc AMD Ryzen 5
- **RAM**: 8GB
- **Storage**: 5GB trống
- **Node.js**: 18.0+

### Khuyến nghị
- **CPU**: Intel i7 hoặc AMD Ryzen 7
- **RAM**: 16GB+
- **GPU**: Dedicated graphics card
- **Storage**: SSD với 20GB+ trống

## 🔧 Cài đặt nhanh

```bash
# Clone repository
git clone https://github.com/your-org/emlinh-remotion.git
cd emlinh-remotion

# Cài đặt dependencies
npm install

# Cấu hình environment
cp .env.example .env
# Chỉnh sửa .env với API keys của bạn

# Khởi chạy development server
npm run dev

# Build project
npm run build
```

## 📖 Cách sử dụng documentation

### Biểu tượng và ký hiệu
- 🚀 **Quick Start**: Hướng dẫn nhanh
- ⚙️ **Configuration**: Cấu hình
- 💡 **Tips**: Mẹo và thủ thuật
- ⚠️ **Warning**: Cảnh báo quan trọng
- 🔧 **Troubleshooting**: Xử lý sự cố
- 📝 **Example**: Ví dụ code

### Code blocks
```javascript
// JavaScript/TypeScript examples
const example = 'code';
```

```bash
# Terminal commands
npm install
```

```json
{
  "config": "JSON configuration"
}
```

### Liên kết nội bộ
- Sử dụng đường dẫn tương đối: `[Link text](./path/to/file.md)`
- Anchor links: `[Section](#section-name)`

## 🤝 Đóng góp

Chúng tôi hoan nghênh mọi đóng góp! Vui lòng:

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push to branch
5. Tạo Pull Request

### Đóng góp documentation
- Tuân thủ format Markdown
- Thêm ví dụ code khi cần thiết
- Cập nhật mục lục nếu thêm file mới
- Kiểm tra spelling và grammar

## 📞 Hỗ trợ

- **GitHub Issues**: [Tạo issue mới](https://github.com/your-org/emlinh-remotion/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/emlinh-remotion/discussions)
- **Email**: support@emlinh.com

## 📄 License

Dự án này được phân phối dưới [MIT License](../LICENSE).

## 🔄 Cập nhật gần đây

- **v1.0.0** (2024-01): Phiên bản đầu tiên
- **v1.1.0** (2024-02): Cải thiện audio processing
- **v1.2.0** (2024-03): Cải thiện lip-sync accuracy

---

**📚 Tài liệu này được cập nhật thường xuyên. Vui lòng kiểm tra phiên bản mới nhất trên GitHub.**