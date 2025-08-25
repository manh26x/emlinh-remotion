# Kiến trúc Hệ thống

## 🏗️ Tổng quan Kiến trúc

Emlinh Remotion được thiết kế theo kiến trúc modular với các layer rõ ràng:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Remotion UI │  │   Preview   │  │   Export    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Components  │  │    Hooks    │  │  Utilities  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ MCP Server  │  │ Audio Proc  │  │  Lip-sync   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Schemas   │  │   Assets    │  │   Config    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🎬 Video Generation Pipeline

### 1. Input Processing
```
Text Script ──┐
              ├──▶ Script Validation ──▶ Normalized Script
Voice Config ─┘
```

### 2. Audio Generation
```
Normalized Script ──▶ TTS Service ──▶ Audio File ──▶ Lip-sync Analysis ──▶ Viseme Data
```

### 3. Video Composition
```
Viseme Data ──┐
              ├──▶ Scene Composition ──▶ Remotion Render ──▶ Final Video
Assets ───────┘
```

## 🧩 Core Components

### VideoContainer
**Vị trí**: `src/VideoContainer.tsx`
**Chức năng**: Component chính điều phối toàn bộ video

```typescript
interface VideoContainerProps {
  script?: ScriptV1;
}

// Quản lý:
// - Audio playback
// - Scene sequencing  
// - Caption rendering
// - Music ducking
```

### ScenePlayer
**Vị trí**: `src/ScenePlayer.tsx`
**Chức năng**: Render từng scene riêng lẻ

```typescript
// Xử lý:
// - 3D avatar rendering
// - Background composition
// - Element positioning
// - Transition effects
```

### Avatar System
**Vị trí**: `src/Avatar.jsx`
**Chức năng**: 3D character với lip-sync

```typescript
// Tính năng:
// - GLTF model loading
// - Morph target animation
// - Lip-sync integration
// - Blinking logic
```

## 🔧 Service Architecture

### MCP Server
**Vị trí**: `../mcp-server/`
**Chức năng**: Model Context Protocol integration

```javascript
// Tools cung cấp:
// - render_video
// - generate_tts
// - create_lipsync
// - manage_assets
```

### Audio Processing
**Vị trí**: `src/utils/AudioManager.ts`
**Chức năng**: Xử lý audio và đồng bộ

```typescript
class AudioManager {
  // Chức năng:
  // - Audio file validation
  // - Format conversion
  // - Duration calculation
  // - Volume normalization
}
```

### Lip-sync Engine
**Vị trí**: `src/utils/LipSyncResolver.ts`
**Chức năng**: Chuyển đổi audio thành viseme

```typescript
class LipSyncResolver {
  // Xử lý:
  // - Rhubarb integration
  // - Viseme mapping
  // - Timing synchronization
  // - Morph target calculation
}
```

## 📊 Data Flow

### 1. Script Processing
```
Raw Input ──▶ Schema Validation ──▶ Normalization ──▶ ScriptV1
```

### 2. Asset Management
```
Asset Request ──▶ Path Resolution ──▶ Loading ──▶ Caching ──▶ Usage
```

### 3. Rendering Pipeline
```
Composition ──▶ Frame Generation ──▶ Audio Sync ──▶ Video Encoding ──▶ Output
```

## 🎯 Schema System

### ScriptV1 Schema
**Vị trí**: `src/schemas/scriptV1.schema.ts`

```typescript
interface ScriptV1 {
  schemaVersion: '1.0';
  meta: {
    title: string;
    fps: number;
    width: number;
    height: number;
  };
  audio: {
    voiceover?: {
      url: string;
      captions: Caption[];
    };
    music?: {
      url: string;
      gainDb?: number;
      duckingOnVoiceover?: boolean;
    };
  };
  scenes: Scene[];
}
```

### Scene Structure
```typescript
interface Scene {
  id: string;
  durationInFrames: number;
  transitionIn?: Transition;
  elements: VideoElement[];
}
```

## 🔄 State Management

### Component State
- **Local State**: React useState cho UI state
- **Remotion Context**: Frame-based animation state
- **Three.js State**: 3D scene và animation state

### Global State
- **Script State**: Centralized script management
- **Asset Cache**: Loaded assets và metadata
- **Render State**: Current rendering progress

## 🚀 Performance Optimizations

### Rendering Optimizations
```typescript
// Lazy loading components
const Avatar = lazy(() => import('./Avatar'));

// Memoized calculations
const memoizedVisemes = useMemo(() => 
  calculateVisemes(audioData), [audioData]
);

// Frame-based caching
const cachedFrame = useFrameCache(currentFrame);
```

### Asset Optimizations
```typescript
// Progressive loading
const { data: audioData } = useAsyncAsset(audioUrl);

// Compression
Config.setVideoImageFormat('jpeg');
Config.setImageFormat('jpeg');
```

## 🔐 Security Considerations

### Input Validation
- Schema validation cho tất cả inputs
- File type restrictions
- Size limits
- Path traversal protection

### Asset Security
- Sandboxed asset loading
- CORS policy enforcement
- Content type validation
- Malware scanning (planned)

## 📈 Scalability

### Horizontal Scaling
- Stateless rendering workers
- Distributed asset storage
- Load balancing
- Queue management

### Vertical Scaling
- Multi-threading support
- GPU acceleration
- Memory optimization
- CPU utilization

---

**Tiếp theo**: [Tính năng chính](./features.md)