# Emlinh Remotion - AI Video Generation Platform

Advanced video generation platform combining Remotion and lip-sync technology for creating dynamic, personalized video content.

## 🌟 Features

- **Audio Integration**: Support for external audio files
- **Realistic Lip-Sync**: Rhubarb-based mouth movement generation
- **Dynamic Compositions**: Remotion-powered video rendering
- **MCP Integration**: Seamless Model Context Protocol support
- **Real-time Preview**: Live development server with hot reload
- **Customizable Avatars**: Flexible character and scene management

## 📁 Project Structure

```
emlinh-remotion/
├── src/                    # Source code
│   ├── components/        # Remotion components
│   ├── compositions/      # Video compositions
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript definitions
├── tests/                # Test suites
│   ├── unit/            # Unit tests
│   └── integration/     # Integration tests
├── config/              # Configuration files
│   ├── remotion.config.ts  # Remotion settings
│   ├── tsconfig.json      # TypeScript config
│   ├── eslint.config.mjs  # ESLint rules
│   └── mcp-config.json    # MCP integration
├── docs/                # Documentation
│   ├── 01-overview/     # Project overview
│   ├── 02-api/          # API documentation
│   ├── 03-development/  # Development guides
│   └── 04-user-guides/  # User manuals
├── public/              # Static assets
└── output/              # Rendered videos
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- FFmpeg installed and in PATH
- MCP Server running (see `../mcp-server/`)

### Installation

```bash
# Install dependencies
npm install

# Setup MCP Server
cd ../mcp-server
cp config/environment/.env.example .env
nano .env  # Configure your API keys

# Start MCP Server
npm run dev
```

### Development

```bash
# Start Remotion development server
npm start

# Preview compositions
npm run preview

# Render video
npm run render
```

## 🎬 Creating Videos

### Basic Text-to-Video

```javascript
import { Composition } from 'remotion';
import { VideoComposition } from './src/compositions/VideoComposition';

export const RemotionRoot = () => {
  return (
    <Composition
      id="main-video"
      component={VideoComposition}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{
        text: "Hello, this is an AI-generated video!",
        voice: "alloy",
        avatar: "default"
      }}
    />
  );
};
```

### Advanced Lip-Sync Video

```javascript
import { LipSyncComposition } from './src/compositions/LipSyncComposition';

const props = {
  audioUrl: "/audio/narration.wav",
  lipsyncData: "/lipsync/narration.json",
  avatar: {
    character: "emma",
    background: "office",
    emotions: ["happy", "excited"]
  }
};
```

## 🔧 Configuration

### Remotion Settings

Edit `config/remotion.config.ts`:

```typescript
import { Config } from '@remotion/cli/config';

Config.setImageFormat('jpeg');
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setPixelFormat('yuv420p');
Config.setConcurrency(4);
```

### MCP Integration

Configure `config/mcp-config.json`:

```json
{
  "server": {
    "url": "http://localhost:3000",
    "timeout": 30000
  },
  "features": {
    "audio": true,
    "lipsync": true,
    "rendering": true
  }
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# Test with coverage
npm run test:coverage
```

## 📚 API Reference

### Core Components

- **`VideoComposition`**: Video generation with audio integration
- **`LipSyncComposition`**: Lip-sync enabled videos
- **`AvatarComponent`**: Customizable character rendering
- **`SceneComponent`**: Background and environment management

### Hooks

- **`useAudioData`**: Audio file processing and analysis
- **`useLipSyncData`**: Lip-sync data management
- **`useBlinkLogic`**: Natural blinking animations
- **`useEmotions`**: Facial expression control

### Utilities

- **`LipSyncResolver`**: Mouth shape calculation
- **`AudioProcessor`**: Audio file manipulation
- **`SceneManager`**: Scene transition handling

## 🎨 Customization

### Adding New Avatars

1. Create avatar assets in `public/avatars/`
2. Define avatar configuration in `src/types/avatar.ts`
3. Implement avatar component in `src/components/avatars/`
4. Register in `src/utils/avatar-registry.ts`

### Custom Compositions

1. Create composition file in `src/compositions/`
2. Export from `src/Root.tsx`
3. Add to Remotion registry
4. Configure default props

## 🚀 Deployment

### Render Videos

```bash
# Render specific composition
npm run render -- --id="my-composition"

# Batch render
npm run render:batch

# Cloud rendering (if configured)
npm run render:cloud
```

### Production Build

```bash
# Build for production
npm run build

# Serve built files
npm run serve
```

## 🤝 Contributing

1. Follow the project structure guidelines
2. Write comprehensive tests for new features
3. Update documentation for API changes
4. Follow TypeScript and React best practices
5. Test with multiple avatar and voice combinations

## 📖 Documentation

- [Project Overview](./docs/01-overview/)
- [API Documentation](./docs/02-api/)
- [Development Guide](./docs/03-development/)
- [User Guides](./docs/04-user-guides/)

## 📄 License

MIT License - see LICENSE.md for details

## 🆘 Support

For issues and questions:
1. Check the [FAQ](./docs/04-user-guides/faq.md)
2. Review [Troubleshooting Guide](./docs/04-user-guides/troubleshooting.md)
3. Open an issue on GitHub

---

**Built with ❤️ using Remotion, React, and AI technologies**
