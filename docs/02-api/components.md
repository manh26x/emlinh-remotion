# Core Components

## 🎬 VideoContainer

**Vị trí**: `src/VideoContainer.tsx`

### Mô tả
Component chính điều phối toàn bộ video, quản lý audio playback, scene sequencing và caption rendering.

### Props
```typescript
interface VideoContainerProps {
  script?: ScriptV1;
}
```

### Chức năng chính
- **Script Loading**: Tự động load script từ `sample-video.json` nếu không có props
- **Audio Management**: Quản lý voiceover và background music
- **Scene Sequencing**: Render các scene theo thứ tự
- **Music Ducking**: Tự động giảm âm lượng nhạc khi có lời nói
- **Caption Display**: Hiển thị phụ đề đồng bộ

### Ví dụ sử dụng
```typescript
import { VideoContainer } from './VideoContainer';
import { ScriptV1 } from './schemas/scriptV1.schema';

const myScript: ScriptV1 = {
  schemaVersion: '1.0',
  meta: {
    title: 'My Video',
    fps: 30,
    width: 1920,
    height: 1080
  },
  audio: {
    voiceover: {
      url: '/audio/speech.wav',
      captions: [
        { text: 'Hello world', start: 0, end: 2 }
      ]
    }
  },
  scenes: []
};

<VideoContainer script={myScript} />
```

## VideoComposition

### Mô tả
Component chính để tạo video với audio và lip-sync.

### Props
```typescript
interface VideoCompositionProps {
  script: ScriptData;              // Script JSON data
  config: {
    width: number;                 // Video width
    height: number;                // Video height
    fps: number;                   // Frame rate
    durationInFrames: number;      // Total frames
  };
  audio: {
    source: string;               // Audio file path
    format: 'mp3' | 'wav' | 'aac' | 'ogg';
    volume: number;               // Audio volume
    speed: number;                // Playback speed
  };
  avatar?: {
    model: string;                // 3D model path
    position: [number, number, number];
    scale: number;
    animations: AnimationConfig[];
  };
  background?: {
    type: 'color' | 'image' | 'video';
    source: string;
    effects?: EffectConfig[];
  };
}
```

### Sử dụng
```jsx
import { VideoComposition } from './src/components';

const MyVideo = () => {
  return (
    <VideoComposition
      script={scriptData}
      config={{
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: 900
      }}
      audio={{
        source: '/audio/narration.mp3',
        format: 'mp3',
        volume: 0.8,
        speed: 1.1
      }}
      avatar={{
        model: '/models/avatar.glb',
        position: [0, 0, 0],
        scale: 1.0
      }}
    />
  );
};
```

## 🎭 ScenePlayer

**Vị trí**: `src/ScenePlayer.tsx`

### Mô tả
Component render từng scene riêng lẻ với 3D avatar, background và các elements.

### Props
```typescript
interface ScenePlayerProps {
  scene: Scene;
}
```

### Chức năng chính
- **3D Rendering**: Sử dụng ThreeCanvas cho 3D content
- **Element Composition**: Render các video elements
- **Camera Control**: Quản lý PerspectiveCamera
- **Lighting Setup**: Thiết lập ánh sáng 3D

### Scene Structure
```typescript
interface Scene {
  id: string;
  durationInFrames: number;
  transitionIn?: {
    name: string;
    durationInFrames: number;
  };
  elements: VideoElement[];
}
```

### Ví dụ sử dụng
```typescript
const scene: Scene = {
  id: 'intro',
  durationInFrames: 150,
  elements: [
    {
      type: 'character',
      props: {
        src: '/models/character.glb',
        position: { x: 0, y: 0, z: 0 }
      }
    }
  ]
};

<ScenePlayer scene={scene} />
```

## 🤖 Avatar

**Vị trí**: `src/Avatar.jsx`

### Mô tả
3D character component với lip-sync, blinking và animation support.

### Props
```typescript
interface AvatarProps {
  modelPath?: string;
  lipsyncData?: VisemeData[];
  emotions?: string[];
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}
```

### Tính năng
- **GLTF Loading**: Load 3D models từ file GLTF/GLB
- **Lip-sync Animation**: Đồng bộ chuyển động môi với audio
- **Blinking Logic**: Chớp mắt tự nhiên
- **Morph Targets**: Facial expression animation
- **Skeletal Animation**: Body animation support

### Morph Targets
```typescript
const defaultEyeMorphTargetNames = {
  left: 'eyeBlinkLeft',
  right: 'eyeBlinkRight'
};

const mouthMorphTargetNames = {
  A: 'mouthOpen',
  B: 'mouthPucker',
  C: 'mouthSmile',
  // ... other visemes
};
```

### Ví dụ sử dụng
```typescript
<Avatar
  modelPath="/models/character.glb"
  lipsyncData={visemeData}
  emotions={['happy', 'excited']}
  scale={1.2}
  position={[0, -1, 0]}
/>
```

## 🎨 Background Components

### AbstractBackground
**Vị trí**: `src/backgrounds/AbstractBackground.tsx`

#### Tính năng
- **Procedural Generation**: Tạo background động
- **Particle Systems**: Hiệu ứng particle
- **Shader Effects**: Custom shader materials
- **Animation**: Smooth animation với Remotion timeline

```typescript
<AbstractBackground
  colorScheme="purple"
  intensity={0.8}
  particleCount={1000}
/>
```

### OfficeBackground
**Vị trí**: `src/backgrounds/OfficeBackground.tsx`

#### Tính năng
- **Professional Setting**: Môi trường văn phòng
- **Realistic Lighting**: Ánh sáng tự nhiên
- **Props**: Furniture và decorations

## 📝 UI Components

### Label
**Vị trí**: `src/components/Label.tsx`

#### Props
```typescript
interface LabelProps {
  text: string;
  style?: {
    color?: string;
    fontSize?: string;
    fontWeight?: string;
    fontFamily?: string;
  };
  position?: {
    x: string | number;
    y: string | number;
  };
  animation?: {
    enter?: {
      name: string;
      durationInFrames: number;
    };
    exit?: {
      name: string;
      durationInFrames: number;
    };
  };
}
```

#### Ví dụ
```typescript
<Label
  text="Welcome to our presentation"
  style={{
    color: 'white',
    fontSize: '48px',
    fontWeight: 'bold'
  }}
  position={{ x: '50%', y: '20%' }}
  animation={{
    enter: { name: 'fadeIn', durationInFrames: 30 }
  }}
/>
```

### StaticImage
**Vị trí**: `src/components/StaticImage.tsx`

#### Props
```typescript
interface StaticImageProps {
  src: string;
  fit?: 'cover' | 'contain' | 'fill';
  position?: {
    x: string | number;
    y: string | number;
  };
  size?: {
    width: string | number;
    height: string | number;
  };
  animation?: AnimationConfig;
}
```

### Captions
**Vị trí**: `src/components/Captions.tsx`

#### Props
```typescript
interface CaptionsProps {
  captions: Caption[];
  fps: number;
  style?: {
    fontSize?: string;
    color?: string;
    backgroundColor?: string;
    fontFamily?: string;
  };
  position?: 'bottom' | 'top' | 'center';
}
```

## 🎪 Effects Components

### FloatingParticles
**Vị trí**: `src/effects/FloatingParticles.tsx`

#### Tính năng
- **Particle Animation**: Floating particle effects
- **Customizable**: Color, size, count, speed
- **Performance Optimized**: Efficient rendering

```typescript
<FloatingParticles
  count={500}
  color="#ffffff"
  size={0.02}
  speed={0.01}
  area={{ width: 10, height: 10, depth: 10 }}
/>
```

## 🔧 Component Composition

### Element System
Tất cả components được quản lý thông qua element system:

```typescript
type VideoElement = 
  | { type: 'image'; props: ImageProps }
  | { type: 'character'; props: CharacterProps }
  | { type: 'label'; props: LabelProps };
```

### Animation System
Các components hỗ trợ animation thông qua:

```typescript
interface AnimationConfig {
  enter?: {
    name: 'fadeIn' | 'slideIn' | 'scaleIn';
    durationInFrames: number;
    delay?: number;
  };
  exit?: {
    name: 'fadeOut' | 'slideOut' | 'scaleOut';
    durationInFrames: number;
    delay?: number;
  };
}
```

### Performance Tips

1. **Lazy Loading**: Sử dụng `React.lazy()` cho large components
2. **Memoization**: Sử dụng `React.memo()` cho expensive renders
3. **Asset Optimization**: Compress textures và models
4. **Frame Caching**: Cache expensive calculations

```typescript
// Lazy loading
const Avatar = lazy(() => import('./Avatar'));

// Memoization
const MemoizedLabel = memo(Label);

// Frame caching
const cachedValue = useMemo(() => 
  expensiveCalculation(props), [props]
);
```

---

**Tiếp theo**: [Hooks & Utilities](./hooks.md)