# Schemas & Types

## 📋 Core Schema

### ScriptV1 Schema
**Vị trí**: `src/schemas/scriptV1.schema.ts`

#### Mô tả
Schema chính định nghĩa cấu trúc của video script với validation đầy đủ.

```typescript
const scriptV1Schema = z.object({
  schemaVersion: z.literal('1.0'),
  meta: z.object({
    title: z.string(),
    fps: z.number(),
    width: z.number(),
    height: z.number(),
    stylePreset: z.string().optional(),
  }),
  audio: z.object({
    voiceover: z.object({
      url: z.string(),
      captions: z.array(captionSchema),
    }).optional(),
    music: z.object({
      url: z.string(),
      gainDb: z.number().optional(),
      duckingOnVoiceover: z.boolean().optional(),
    }).optional(),
  }),
  scenes: z.array(sceneSchema),
});

export type ScriptV1 = z.infer<typeof scriptV1Schema>;
```

#### Ví dụ ScriptV1
```typescript
const exampleScript: ScriptV1 = {
  schemaVersion: '1.0',
  meta: {
    title: 'Welcome Video',
    fps: 30,
    width: 1920,
    height: 1080,
    stylePreset: 'professional'
  },
  audio: {
    voiceover: {
      url: '/audio/welcome.wav',
      captions: [
        { text: 'Welcome to our platform', start: 0, end: 2.5 },
        { text: 'Let\'s get started', start: 3, end: 5 }
      ]
    },
    music: {
      url: '/audio/background.mp3',
      gainDb: -12,
      duckingOnVoiceover: true
    }
  },
  scenes: [
    {
      id: 'intro',
      durationInFrames: 150,
      elements: [
        {
          type: 'character',
          props: {
            src: '/models/presenter.glb',
            position: { x: 0, y: 0, z: 0 },
            scale: 1.2
          }
        }
      ]
    }
  ]
};
```

## 🎬 Scene Schema

### Scene Structure
```typescript
const sceneSchema = z.object({
  id: z.string(),
  durationInFrames: z.number(),
  transitionIn: z.object({
    name: z.string(),
    durationInFrames: z.number(),
  }).optional(),
  elements: z.array(elementSchema),
});

export type Scene = z.infer<typeof sceneSchema>;
```

### Transition Types
```typescript
type TransitionType = 
  | 'fadeIn'
  | 'fadeOut'
  | 'slideIn'
  | 'slideOut'
  | 'scaleIn'
  | 'scaleOut'
  | 'wipeLeft'
  | 'wipeRight'
  | 'dissolve';

interface Transition {
  name: TransitionType;
  durationInFrames: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  direction?: 'left' | 'right' | 'up' | 'down';
}
```

## 🎭 Element Schemas

### Video Element Union
```typescript
const elementSchema = z.union([
  z.object({ type: z.literal('image'), props: imagePropsSchema }),
  z.object({ type: z.literal('character'), props: characterPropsSchema }),
  z.object({ type: z.literal('label'), props: labelPropsSchema }),
]);

export type VideoElement = z.infer<typeof elementSchema>;
```

### Image Element
```typescript
const imagePropsSchema = z.object({
  src: z.string(),
  fit: z.enum(['cover', 'contain', 'fill']).optional(),
  position: z.object({
    x: z.union([z.string(), z.number()]),
    y: z.union([z.string(), z.number()]),
  }).optional(),
  size: z.object({
    width: z.union([z.string(), z.number()]),
    height: z.union([z.string(), z.number()]),
  }).optional(),
  animation: animationSchema.optional(),
});

export type ImageProps = z.infer<typeof imagePropsSchema>;
```

### Character Element
```typescript
const characterPropsSchema = z.object({
  src: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).optional(),
  rotation: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }).optional(),
  scale: z.number().optional(),
  animations: z.array(z.string()).optional(),
  emotions: z.array(z.string()).optional(),
  lipsyncData: z.array(visemeDataSchema).optional(),
});

export type CharacterProps = z.infer<typeof characterPropsSchema>;
```

### Label Element
```typescript
const labelPropsSchema = z.object({
  text: z.string(),
  style: z.object({
    color: z.string().optional(),
    fontSize: z.string().optional(),
    fontWeight: z.string().optional(),
    fontFamily: z.string().optional(),
    textAlign: z.enum(['left', 'center', 'right']).optional(),
    textShadow: z.string().optional(),
  }).optional(),
  position: z.object({
    x: z.union([z.string(), z.number()]),
    y: z.union([z.string(), z.number()]),
  }).optional(),
  animation: animationSchema.optional(),
});

export type LabelProps = z.infer<typeof labelPropsSchema>;
```

## 🎵 Audio Schemas

### Caption Schema
```typescript
const captionSchema = z.object({
  text: z.string(),
  start: z.number(),
  end: z.number(),
  speaker: z.string().optional(),
  confidence: z.number().optional(),
});

export type Caption = z.infer<typeof captionSchema>;
```

### Viseme Data Schema
```typescript
const visemeDataSchema = z.object({
  time: z.number(),
  viseme: z.string(),
  intensity: z.number().min(0).max(1),
});

export type VisemeData = z.infer<typeof visemeDataSchema>;
```

### Audio Configuration
```typescript
interface AudioConfig {
  voiceover?: {
    url: string;
    volume?: number;
    captions: Caption[];
    speaker?: string;
    language?: string;
  };
  music?: {
    url: string;
    gainDb?: number;
    duckingOnVoiceover?: boolean;
    fadeIn?: number;
    fadeOut?: number;
  };
  sfx?: {
    url: string;
    volume?: number;
    startTime?: number;
    loop?: boolean;
  }[];
}
```

## 🎨 Animation Schemas

### Animation Schema
```typescript
const animationSchema = z.object({
  enter: z.object({
    name: z.string(),
    durationInFrames: z.number(),
    delay: z.number().optional(),
    easing: z.string().optional(),
  }).optional(),
  exit: z.object({
    name: z.string(),
    durationInFrames: z.number(),
    delay: z.number().optional(),
    easing: z.string().optional(),
  }).optional(),
  loop: z.object({
    name: z.string(),
    durationInFrames: z.number(),
    iterations: z.number().optional(),
  }).optional(),
});

export type AnimationConfig = z.infer<typeof animationSchema>;
```

### Keyframe Schema
```typescript
interface Keyframe {
  frame: number;
  value: any;
  easing?: string;
}

interface AnimationTrack {
  property: string;
  keyframes: Keyframe[];
}

interface ComplexAnimation {
  name: string;
  duration: number;
  tracks: AnimationTrack[];
}
```

## 🤖 Avatar Schemas

### Avatar Configuration
```typescript
interface AvatarConfig {
  model: {
    url: string;
    format: 'gltf' | 'glb' | 'fbx';
    scale?: number;
  };
  materials?: {
    [key: string]: MaterialConfig;
  };
  morphTargets?: {
    [key: string]: MorphTargetConfig;
  };
  animations?: {
    [key: string]: AnimationClip;
  };
  physics?: PhysicsConfig;
}
```

### Material Configuration
```typescript
interface MaterialConfig {
  type: 'standard' | 'physical' | 'toon' | 'shader';
  properties: {
    color?: string;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    transparent?: boolean;
    opacity?: number;
  };
  textures?: {
    map?: string;
    normalMap?: string;
    roughnessMap?: string;
    metalnessMap?: string;
  };
}
```

### Morph Target Configuration
```typescript
interface MorphTargetConfig {
  name: string;
  influences: {
    [targetName: string]: number;
  };
  blendMode: 'additive' | 'override';
}
```

## 🎯 Validation Utilities

### Schema Validation
```typescript
// Validate script
function validateScript(data: unknown): ScriptV1 {
  try {
    return scriptV1Schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Script validation failed: ${error.message}`);
    }
    throw error;
  }
}

// Validate scene
function validateScene(data: unknown): Scene {
  return sceneSchema.parse(data);
}

// Validate element
function validateElement(data: unknown): VideoElement {
  return elementSchema.parse(data);
}
```

### Type Guards
```typescript
// Type guards for elements
function isImageElement(element: VideoElement): element is { type: 'image'; props: ImageProps } {
  return element.type === 'image';
}

function isCharacterElement(element: VideoElement): element is { type: 'character'; props: CharacterProps } {
  return element.type === 'character';
}

function isLabelElement(element: VideoElement): element is { type: 'label'; props: LabelProps } {
  return element.type === 'label';
}
```

## 🔧 Configuration Types

### Remotion Configuration
```typescript
interface RemotionConfig {
  composition: {
    id: string;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
  };
  rendering: {
    imageFormat: 'jpeg' | 'png';
    videoImageFormat: 'jpeg' | 'png';
    quality: number;
    concurrency: number;
    pixelFormat: string;
  };
  output: {
    format: 'mp4' | 'webm' | 'gif';
    codec: string;
    bitrate: string;
  };
}
```

### MCP Configuration
```typescript
interface MCPConfig {
  server: {
    url: string;
    timeout: number;
    retries: number;
  };
  features: {
    tts: boolean;
    lipsync: boolean;
    rendering: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    file?: string;
  };
}
```

## 📊 Performance Types

### Render Statistics
```typescript
interface RenderStats {
  totalFrames: number;
  renderedFrames: number;
  progress: number;
  estimatedTimeRemaining: number;
  averageFrameTime: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: number;
  gpuUsage?: number;
}
```

### Performance Metrics
```typescript
interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  renderTime: number;
  audioProcessingTime: number;
  lipsyncProcessingTime: number;
  totalProcessingTime: number;
}
```

## 🚨 Error Types

### Custom Error Classes
```typescript
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class RenderError extends Error {
  constructor(
    message: string,
    public frame: number,
    public component: string
  ) {
    super(message);
    this.name = 'RenderError';
  }
}

class AssetError extends Error {
  constructor(
    message: string,
    public assetUrl: string,
    public assetType: string
  ) {
    super(message);
    this.name = 'AssetError';
  }
}
```

## 🔄 Migration Utilities

### Schema Migration
```typescript
interface SchemaMigration {
  fromVersion: string;
  toVersion: string;
  migrate: (data: any) => any;
}

const migrations: SchemaMigration[] = [
  {
    fromVersion: '0.9',
    toVersion: '1.0',
    migrate: (data) => {
      // Migration logic here
      return {
        ...data,
        schemaVersion: '1.0'
      };
    }
  }
];

function migrateScript(data: any, targetVersion: string = '1.0'): ScriptV1 {
  let currentData = data;
  const currentVersion = data.schemaVersion || '0.9';
  
  for (const migration of migrations) {
    if (migration.fromVersion === currentVersion) {
      currentData = migration.migrate(currentData);
    }
  }
  
  return validateScript(currentData);
}
```

---

**Tiếp theo**: [API Documentation](./api-docs.md)