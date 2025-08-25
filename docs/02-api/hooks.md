# Hooks & Utilities

## 🎤 Lip-sync Hooks

### useRemotionLipSync
**Vị trí**: `src/hooks/lipSync/useRemotionLipSync.js`

#### Mô tả
Hook chính để xử lý lip-sync animation trong Remotion environment.

#### Signature
```typescript
function useRemotionLipSync({
  lipsyncData,
  fps,
  offsetFrames = 0
}): {
  currentViseme: string;
  intensity: number;
  mouthShapes: Record<string, number>;
}
```

#### Parameters
- **lipsyncData**: Array of viseme data với timing
- **fps**: Frame rate của video
- **offsetFrames**: Offset để đồng bộ audio

#### Return Value
```typescript
interface LipSyncResult {
  currentViseme: string;     // Viseme hiện tại (A, B, C, etc.)
  intensity: number;         // Cường độ animation (0-1)
  mouthShapes: Record<string, number>; // Morph target values
}
```

#### Ví dụ sử dụng
```typescript
const { currentViseme, intensity, mouthShapes } = useRemotionLipSync({
  lipsyncData: [
    { time: 0.0, viseme: 'A', intensity: 0.8 },
    { time: 0.1, viseme: 'B', intensity: 0.6 },
    // ...
  ],
  fps: 30,
  offsetFrames: 5
});

// Sử dụng trong morph targets
if (mouthMesh.morphTargetInfluences) {
  Object.entries(mouthShapes).forEach(([shape, value]) => {
    const index = mouthMesh.morphTargetDictionary[shape];
    if (index !== undefined) {
      mouthMesh.morphTargetInfluences[index] = value;
    }
  });
}
```

## 👁️ Animation Hooks

### useBlinkLogic
**Vị trí**: `src/hooks/useBlinkLogic.ts`

#### Mô tả
Hook tạo animation chớp mắt tự nhiên cho avatar.

#### Signature
```typescript
function useBlinkLogic({
  blinkInterval = 3000,
  blinkDuration = 150,
  randomness = 0.3
}): {
  leftEyeBlink: number;
  rightEyeBlink: number;
  isBlinking: boolean;
}
```

#### Parameters
- **blinkInterval**: Khoảng thời gian giữa các lần chớp mắt (ms)
- **blinkDuration**: Thời gian chớp mắt (ms)
- **randomness**: Độ ngẫu nhiên (0-1)

#### Ví dụ sử dụng
```typescript
const { leftEyeBlink, rightEyeBlink } = useBlinkLogic({
  blinkInterval: 2500,
  blinkDuration: 120,
  randomness: 0.4
});

// Áp dụng vào morph targets
if (eyeMesh.morphTargetInfluences) {
  eyeMesh.morphTargetInfluences[leftBlinkIndex] = leftEyeBlink;
  eyeMesh.morphTargetInfluences[rightBlinkIndex] = rightEyeBlink;
}
```

## 🎵 Audio Hooks

### useAudio
**Vị trí**: `src/hooks/useAudio.ts`

#### Mô tả
Hook để load và quản lý audio files.

#### Signature
```typescript
function useAudio(options: AudioOptions): AudioResult;

interface AudioOptions {
  source: string;
  processing?: {
    volume?: number;
    speed?: number;
    format?: 'mp3' | 'wav' | 'aac' | 'ogg';
  };
  autoLoad?: boolean;
}

interface AudioResult {
  audioUrl: string | null;
  isLoading: boolean;
  error: Error | null;
  load: () => Promise<void>;
  reload: () => Promise<void>;
  clear: () => void;
  duration: number | null;
}
```

#### Ví dụ sử dụng
```typescript
const { audioUrl, isLoading, load, duration } = useAudio({
  source: '/audio/narration.mp3',
  processing: {
    volume: 0.8,
    speed: 1.1,
    format: 'mp3'
  },
  autoLoad: true
});

if (isLoading) return <div>Đang load audio...</div>;
if (audioUrl) {
  return (
    <div>
      <audio src={audioUrl} controls />
      <p>Duration: {duration}s</p>
      <button onClick={load}>Load lại audio</button>
    </div>
  );
}
```

### useAudioAnalysis
**Vị trí**: `src/hooks/useAudioAnalysis.ts`

#### Mô tả
Hook phân tích audio để tạo visualizations.

#### Signature
```typescript
function useAudioAnalysis(audioBuffer: AudioBuffer): {
  frequencyData: Float32Array;
  waveformData: Float32Array;
  volume: number;
  pitch: number;
}
```

## 🎬 Remotion Hooks

### useFrameCache
**Vị trí**: `src/hooks/useFrameCache.ts`

#### Mô tả
Hook cache expensive calculations theo frame.

#### Signature
```typescript
function useFrameCache<T>(
  calculation: () => T,
  dependencies: any[]
): T
```

#### Ví dụ sử dụng
```typescript
const expensiveResult = useFrameCache(() => {
  return complexCalculation(props.data);
}, [props.data]);
```

### useAnimationProgress
**Vị trí**: `src/hooks/useAnimationProgress.ts`

#### Mô tả
Hook tính toán progress của animation.

#### Signature
```typescript
function useAnimationProgress({
  startFrame,
  endFrame,
  easing = 'linear'
}): number
```

## 🛠️ Utility Functions

### AudioManager
**Vị trí**: `src/utils/AudioManager.ts`

#### Mô tả
Class quản lý audio processing và validation.

```typescript
class AudioManager {
  static async validateAudioFile(file: File): Promise<boolean>
  static async convertToWav(audioBuffer: ArrayBuffer): Promise<ArrayBuffer>
  static calculateDuration(audioBuffer: AudioBuffer): number
  static normalizeVolume(audioBuffer: AudioBuffer, targetDb: number): AudioBuffer
}
```

#### Ví dụ sử dụng
```typescript
// Validate audio file
const isValid = await AudioManager.validateAudioFile(audioFile);

// Convert to WAV
const wavBuffer = await AudioManager.convertToWav(mp3Buffer);

// Calculate duration
const duration = AudioManager.calculateDuration(audioBuffer);

// Normalize volume
const normalizedAudio = AudioManager.normalizeVolume(audioBuffer, -12);
```

### LipSyncResolver
**Vị trí**: `src/utils/LipSyncResolver.ts`

#### Mô tả
Class xử lý lip-sync data và viseme mapping.

```typescript
class LipSyncResolver {
  static async generateLipSyncData(
    audioPath: string,
    options?: RhubarbOptions
  ): Promise<VisemeData[]>
  
  static mapVisemeToMorphTargets(
    viseme: string,
    intensity: number
  ): Record<string, number>
  
  static interpolateVisemes(
    visemeA: VisemeData,
    visemeB: VisemeData,
    progress: number
  ): VisemeData
}
```

#### Ví dụ sử dụng
```typescript
// Generate lip-sync data
const visemeData = await LipSyncResolver.generateLipSyncData(
  '/audio/speech.wav',
  { recognizer: 'pocketSphinx' }
);

// Map viseme to morph targets
const morphTargets = LipSyncResolver.mapVisemeToMorphTargets('A', 0.8);

// Interpolate between visemes
const interpolated = LipSyncResolver.interpolateVisemes(
  visemeA, visemeB, 0.5
);
```

### normalize-script
**Vị trí**: `src/utils/normalize-script.ts`

#### Mô tả
Utility functions để normalize và validate script data.

```typescript
function normalizeScript(rawScript: any): ScriptV1
function validateScriptSchema(script: any): boolean
function migrateScriptVersion(script: any, targetVersion: string): ScriptV1
```

#### Ví dụ sử dụng
```typescript
// Normalize raw script
const normalizedScript = normalizeScript(rawScriptData);

// Validate schema
const isValid = validateScriptSchema(scriptData);

// Migrate version
const migratedScript = migrateScriptVersion(oldScript, '1.0');
```

## 🎯 Custom Hooks

### useAsyncAsset
**Vị trí**: `src/hooks/useAsyncAsset.ts`

#### Mô tả
Hook load assets bất đồng bộ với caching.

```typescript
function useAsyncAsset<T>(url: string, loader: (url: string) => Promise<T>): {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  reload: () => void;
}
```

#### Ví dụ sử dụng
```typescript
const { data: model, isLoading, error } = useAsyncAsset(
  '/models/character.glb',
  (url) => new GLTFLoader().loadAsync(url)
);
```

### useThreeScene
**Vị trí**: `src/hooks/useThreeScene.ts`

#### Mô tả
Hook setup Three.js scene với Remotion integration.

```typescript
function useThreeScene(): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
}
```

### useVisemeInterpolation
**Vị trí**: `src/hooks/useVisemeInterpolation.ts`

#### Mô tả
Hook interpolate smooth transitions giữa các visemes.

```typescript
function useVisemeInterpolation(
  visemeData: VisemeData[],
  currentTime: number,
  smoothing: number = 0.1
): {
  currentViseme: string;
  morphTargets: Record<string, number>;
  transitionProgress: number;
}
```

## 🔧 Performance Hooks

### usePerformanceMonitor
**Vị trí**: `src/hooks/usePerformanceMonitor.ts`

#### Mô tả
Hook monitor performance metrics.

```typescript
function usePerformanceMonitor(): {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderTime: number;
}
```

### useResourceManager
**Vị trí**: `src/hooks/useResourceManager.ts`

#### Mô tả
Hook quản lý tài nguyên và cleanup.

```typescript
function useResourceManager(): {
  addResource: (resource: Disposable) => void;
  removeResource: (resource: Disposable) => void;
  cleanup: () => void;
}
```

## 📊 Debugging Hooks

### useDebugInfo
**Vị trí**: `src/hooks/useDebugInfo.ts`

#### Mô tả
Hook cung cấp debug information.

```typescript
function useDebugInfo(): {
  currentFrame: number;
  timeInSeconds: number;
  renderStats: RenderStats;
  componentTree: ComponentInfo[];
}
```

### useErrorBoundary
**Vị trí**: `src/hooks/useErrorBoundary.ts`

#### Mô tả
Hook xử lý errors gracefully.

```typescript
function useErrorBoundary(): {
  hasError: boolean;
  error: Error | null;
  resetError: () => void;
}
```

## 🎨 Animation Utilities

### Easing Functions
```typescript
// Built-in easing functions
const easingFunctions = {
  linear: (t: number) => t,
  easeInOut: (t: number) => t * t * (3 - 2 * t),
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => 1 - (1 - t) * (1 - t),
  bounce: (t: number) => /* bounce implementation */
};
```

### Interpolation Utilities
```typescript
// Interpolation helpers
function lerp(a: number, b: number, t: number): number
function slerp(a: Quaternion, b: Quaternion, t: number): Quaternion
function smoothstep(edge0: number, edge1: number, x: number): number
```

---

**Tiếp theo**: [Schemas & Types](./schemas.md)