# Testing Guide

## 🧪 Chiến lược Testing

### Test Pyramid
```
        E2E Tests (5%)
       ┌─────────────────┐
      │ Integration (15%) │
     ┌─────────────────────┐
    │   Unit Tests (80%)   │
    └─────────────────────┘
```

### Testing Philosophy
- **Fast Feedback**: Unit tests chạy nhanh, cung cấp feedback tức thì
- **Confidence**: Integration tests đảm bảo các module hoạt động cùng nhau
- **User Experience**: E2E tests mô phỏng hành vi người dùng thực tế
- **Maintainability**: Tests dễ đọc, dễ maintain và update

## 🔬 Unit Testing

### Component Testing

#### Testing React Components
```typescript
// src/components/__tests__/Avatar.test.tsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Avatar } from '../Avatar';
import { ThreeProvider } from '../../providers/ThreeProvider';

// Mock Three.js dependencies
jest.mock('three', () => ({
  ...jest.requireActual('three'),
  WebGLRenderer: jest.fn().mockImplementation(() => ({
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn()
  }))
}));

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThreeProvider>
      {component}
    </ThreeProvider>
  );
};

describe('Avatar Component', () => {
  const defaultProps = {
    modelPath: '/models/avatar.glb',
    position: [0, 0, 0] as const,
    scale: 1
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<Avatar {...defaultProps} />);
    expect(screen.getByTestId('avatar-container')).toBeInTheDocument();
  });

  it('applies correct position transform', () => {
    const position = [1, 2, 3] as const;
    renderWithProviders(<Avatar {...defaultProps} position={position} />);
    
    const container = screen.getByTestId('avatar-container');
    expect(container).toHaveAttribute('data-position', '1,2,3');
  });

  it('handles viseme data correctly', async () => {
    const visemeData = [
      { time: 0, viseme: 'A', intensity: 0.8 },
      { time: 1000, viseme: 'E', intensity: 0.6 }
    ];
    
    renderWithProviders(
      <Avatar {...defaultProps} visemeData={visemeData} />
    );
    
    await waitFor(() => {
      const mouthShape = screen.getByTestId('mouth-shape');
      expect(mouthShape).toHaveAttribute('data-viseme', 'A');
    });
  });

  it('handles model loading errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    renderWithProviders(
      <Avatar {...defaultProps} modelPath="/invalid/path.glb" />
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('avatar-error')).toBeInTheDocument();
    });
    
    consoleSpy.mockRestore();
  });
});
```

#### Testing Remotion Components
```typescript
// src/components/__tests__/VideoContainer.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { VideoContainer } from '../VideoContainer';
import { Composition } from 'remotion';

// Mock Remotion hooks
jest.mock('remotion', () => ({
  ...jest.requireActual('remotion'),
  useCurrentFrame: () => 30,
  useVideoConfig: () => ({
    fps: 30,
    width: 1920,
    height: 1080,
    durationInFrames: 900
  }),
  AbsoluteFill: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="absolute-fill">{children}</div>
  )
}));

describe('VideoContainer', () => {
  const mockScript = {
    schemaVersion: '1.0' as const,
    meta: {
      title: 'Test Video',
      fps: 30,
      width: 1920,
      height: 1080
    },
    scenes: [
      {
        id: 'scene1',
        duration: 180,
        elements: [
          {
            type: 'character' as const,
            id: 'char1',
            text: 'Hello world',
            position: [0, 0, 0] as const
          }
        ]
      }
    ]
  };

  it('renders video composition correctly', () => {
    const { container } = render(<VideoContainer script={mockScript} />);
    expect(container.firstChild).toHaveAttribute('data-testid', 'absolute-fill');
  });

  it('calculates scene timing correctly', () => {
    const { getByTestId } = render(<VideoContainer script={mockScript} />);
    const sceneContainer = getByTestId('scene-container');
    expect(sceneContainer).toHaveAttribute('data-scene-id', 'scene1');
  });

  it('handles empty script gracefully', () => {
    const emptyScript = {
      ...mockScript,
      scenes: []
    };
    
    const { getByTestId } = render(<VideoContainer script={emptyScript} />);
    expect(getByTestId('empty-video')).toBeInTheDocument();
  });
});
```

### Hook Testing

#### Testing Custom Hooks
```typescript
// src/hooks/__tests__/useRemotionLipSync.test.ts
import { renderHook, act } from '@testing-library/react';
import { useRemotionLipSync } from '../useRemotionLipSync';

// Mock Remotion hooks
jest.mock('remotion', () => ({
  useCurrentFrame: jest.fn(),
  useVideoConfig: () => ({ fps: 30 })
}));

const { useCurrentFrame } = require('remotion');

describe('useRemotionLipSync', () => {
  const mockVisemeData = [
    { time: 0, viseme: 'A', intensity: 1.0 },
    { time: 30, viseme: 'E', intensity: 0.8 },
    { time: 60, viseme: 'I', intensity: 0.6 },
    { time: 90, viseme: 'O', intensity: 0.4 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns correct viseme for exact frame match', () => {
    useCurrentFrame.mockReturnValue(30);
    
    const { result } = renderHook(() => 
      useRemotionLipSync(mockVisemeData)
    );
    
    expect(result.current.currentViseme).toBe('E');
    expect(result.current.intensity).toBe(0.8);
  });

  it('interpolates between visemes', () => {
    useCurrentFrame.mockReturnValue(15); // Halfway between frame 0 and 30
    
    const { result } = renderHook(() => 
      useRemotionLipSync(mockVisemeData)
    );
    
    expect(result.current.currentViseme).toBe('A');
    expect(result.current.intensity).toBeCloseTo(0.9, 1);
  });

  it('handles empty viseme data', () => {
    useCurrentFrame.mockReturnValue(15);
    
    const { result } = renderHook(() => 
      useRemotionLipSync([])
    );
    
    expect(result.current.currentViseme).toBe('X');
    expect(result.current.intensity).toBe(0);
  });

  it('clamps to last viseme after data ends', () => {
    useCurrentFrame.mockReturnValue(120); // After last viseme
    
    const { result } = renderHook(() => 
      useRemotionLipSync(mockVisemeData)
    );
    
    expect(result.current.currentViseme).toBe('O');
    expect(result.current.intensity).toBe(0.4);
  });

  it('updates when frame changes', () => {
    useCurrentFrame.mockReturnValue(0);
    
    const { result, rerender } = renderHook(() => 
      useRemotionLipSync(mockVisemeData)
    );
    
    expect(result.current.currentViseme).toBe('A');
    
    // Change frame
    useCurrentFrame.mockReturnValue(60);
    rerender();
    
    expect(result.current.currentViseme).toBe('I');
  });
});
```

#### Testing Audio Hooks
```typescript
// src/hooks/__tests__/useAudioData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useAudioData } from '../useAudioData';

// Mock Web Audio API
const mockAudioContext = {
  decodeAudioData: jest.fn(),
  createAnalyser: jest.fn(),
  createGain: jest.fn()
};

global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);

describe('useAudioData', () => {
  const mockAudioSrc = '/audio/test.mp3';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful audio decoding
    mockAudioContext.decodeAudioData.mockResolvedValue({
      length: 44100,
      sampleRate: 44100,
      numberOfChannels: 2,
      getChannelData: jest.fn().mockReturnValue(new Float32Array(44100))
    });
  });

  it('loads audio data successfully', async () => {
    const { result } = renderHook(() => useAudioData(mockAudioSrc));
    
    expect(result.current.loading).toBe(true);
    expect(result.current.audioData).toBeNull();
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.audioData).toBeDefined();
    });
  });

  it('handles audio loading errors', async () => {
    mockAudioContext.decodeAudioData.mockRejectedValue(
      new Error('Failed to decode audio')
    );
    
    const { result } = renderHook(() => useAudioData('/invalid/audio.mp3'));
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(result.current.audioData).toBeNull();
    });
  });

  it('caches audio data for same source', async () => {
    const { result: result1 } = renderHook(() => useAudioData(mockAudioSrc));
    const { result: result2 } = renderHook(() => useAudioData(mockAudioSrc));
    
    await waitFor(() => {
      expect(result1.current.audioData).toBe(result2.current.audioData);
    });
    
    // Should only call decodeAudioData once
    expect(mockAudioContext.decodeAudioData).toHaveBeenCalledTimes(1);
  });
});
```

### Utility Testing

#### Testing Schema Validation
```typescript
// src/utils/__tests__/normalize-script.test.ts
import { normalizeScript, validateScript } from '../normalize-script';
import { ScriptV1 } from '../types';

describe('normalizeScript', () => {
  it('adds default meta properties', () => {
    const input = {
      schemaVersion: '1.0' as const,
      scenes: []
    };
    
    const result = normalizeScript(input);
    
    expect(result.meta).toEqual({
      title: 'Untitled Video',
      fps: 30,
      width: 1920,
      height: 1080
    });
  });

  it('preserves existing meta properties', () => {
    const input = {
      schemaVersion: '1.0' as const,
      meta: {
        title: 'Custom Title',
        fps: 60,
        width: 3840,
        height: 2160
      },
      scenes: []
    };
    
    const result = normalizeScript(input);
    
    expect(result.meta).toEqual(input.meta);
  });

  it('normalizes scene elements', () => {
    const input = {
      schemaVersion: '1.0' as const,
      scenes: [{
        id: 'scene1',
        elements: [{
          type: 'character' as const,
          id: 'char1',
          text: 'Hello'
          // Missing position, scale, etc.
        }]
      }]
    };
    
    const result = normalizeScript(input);
    const element = result.scenes[0].elements[0];
    
    expect(element.position).toEqual([0, 0, 0]);
    expect(element.scale).toBe(1);
    expect(element.visible).toBe(true);
  });
});

describe('validateScript', () => {
  it('validates correct script', () => {
    const validScript: ScriptV1 = {
      schemaVersion: '1.0',
      meta: {
        title: 'Test',
        fps: 30,
        width: 1920,
        height: 1080
      },
      scenes: [{
        id: 'scene1',
        duration: 180,
        elements: []
      }]
    };
    
    const result = validateScript(validScript);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects invalid schema version', () => {
    const invalidScript = {
      schemaVersion: '2.0', // Invalid version
      scenes: []
    };
    
    const result = validateScript(invalidScript as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid schema version');
  });

  it('detects missing required fields', () => {
    const invalidScript = {
      schemaVersion: '1.0'
      // Missing scenes
    };
    
    const result = validateScript(invalidScript as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: scenes');
  });
});
```

## 🔗 Integration Testing

### Render Pipeline Testing
```typescript
// src/__tests__/integration/render-pipeline.test.ts
import { renderVideo } from '../../render/renderVideo';
import { generateTTS } from '../../audio/tts';
import { generateLipSync } from '../../lipsync/generator';
import { ScriptV1 } from '../../types';
import fs from 'fs/promises';
import path from 'path';

describe('Render Pipeline Integration', () => {
  const testOutputDir = path.join(__dirname, 'test-output');
  
  beforeAll(async () => {
    await fs.mkdir(testOutputDir, { recursive: true });
  });
  
  afterAll(async () => {
    await fs.rmdir(testOutputDir, { recursive: true });
  });

  it('completes full text-to-video pipeline', async () => {
    const script: ScriptV1 = {
      schemaVersion: '1.0',
      meta: {
        title: 'Integration Test Video',
        fps: 30,
        width: 1280,
        height: 720
      },
      scenes: [{
        id: 'scene1',
        duration: 180, // 6 seconds at 30fps
        elements: [{
          type: 'character',
          id: 'avatar1',
          text: 'This is an integration test for the video pipeline.',
          position: [0, 0, 0],
          scale: 1
        }]
      }]
    };

    // Step 1: Generate TTS
    const audioPath = path.join(testOutputDir, 'test-audio.wav');
    const ttsResult = await generateTTS({
      text: script.scenes[0].elements[0].text,
      voice: 'alloy',
      outputPath: audioPath
    });
    
    expect(ttsResult.success).toBe(true);
    expect(await fs.access(audioPath)).resolves.toBeUndefined();

    // Step 2: Generate Lip-sync
    const lipsyncPath = path.join(testOutputDir, 'test-lipsync.json');
    const lipsyncResult = await generateLipSync({
      audioPath,
      outputPath: lipsyncPath
    });
    
    expect(lipsyncResult.success).toBe(true);
    expect(await fs.access(lipsyncPath)).resolves.toBeUndefined();

    // Step 3: Render Video
    const videoPath = path.join(testOutputDir, 'test-video.mp4');
    const renderResult = await renderVideo({
      composition: 'DynamicVideo',
      props: { script },
      outputPath: videoPath,
      parameters: {
        width: 1280,
        height: 720,
        fps: 30
      }
    });
    
    expect(renderResult.success).toBe(true);
    expect(await fs.access(videoPath)).resolves.toBeUndefined();
    
    // Verify video properties
    expect(renderResult.duration).toBeGreaterThan(5);
    expect(renderResult.fileSize).toBeGreaterThan(0);
  }, 60000); // 60 second timeout

  it('handles audio-video synchronization', async () => {
    const script: ScriptV1 = {
      schemaVersion: '1.0',
      meta: { title: 'Sync Test', fps: 30, width: 1920, height: 1080 },
      scenes: [{
        id: 'sync-scene',
        duration: 300, // 10 seconds
        elements: [{
          type: 'character',
          id: 'sync-avatar',
          text: 'Testing audio and video synchronization with precise timing.',
          position: [0, 0, 0]
        }]
      }]
    };

    const result = await renderVideo({
      composition: 'DynamicVideo',
      props: { script },
      outputPath: path.join(testOutputDir, 'sync-test.mp4')
    });
    
    expect(result.success).toBe(true);
    
    // Verify timing accuracy (within 1 frame tolerance)
    const expectedDuration = 300 / 30; // 10 seconds
    expect(Math.abs(result.duration - expectedDuration)).toBeLessThan(1/30);
  }, 45000);
});
```

### API Integration Testing
```typescript
// src/__tests__/integration/api-integration.test.ts
import request from 'supertest';
import { app } from '../../server/app';
import path from 'path';

describe('API Integration', () => {
  const testOutputDir = path.join(__dirname, 'test-output');
  
  beforeAll(async () => {
    await fs.mkdir(testOutputDir, { recursive: true });
  });
  
  afterAll(async () => {
    await fs.rmdir(testOutputDir, { recursive: true });
  });

  it('lists available endpoints', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
    expect(response.body.endpoints).toContain('/api/render');
    expect(response.body.endpoints).toContain('/api/tts');
    expect(response.body.endpoints).toContain('/api/lipsync');
  });

  it('renders video via API', async () => {
    const response = await request(app)
      .post('/api/render')
      .send({
        composition: 'DynamicVideo',
        parameters: {
          width: 1280,
          height: 720,
          fps: 30,
          durationInFrames: 90
        },
        props: {
          script: {
            schemaVersion: '1.0',
            meta: { title: 'API Test', fps: 30, width: 1280, height: 720 },
            scenes: [{
              id: 'api-scene',
              duration: 90,
              elements: []
            }]
          }
        },
        outputPath: path.join(testOutputDir, 'api-test-output.mp4')
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.outputPath).toBeDefined();
    expect(response.body.duration).toBeCloseTo(3, 1); // 90 frames at 30fps = 3 seconds
  });

  it('generates TTS via API', async () => {
    const response = await request(app)
      .post('/api/tts')
      .send({
        text: 'API integration test for text-to-speech functionality.',
        voice: 'alloy',
        speed: 1.0,
        outputPath: path.join(testOutputDir, 'api-tts-test.mp3')
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.audioPath).toBeDefined();
    expect(response.body.duration).toBeGreaterThan(0);
  });

  it('handles API errors gracefully', async () => {
    const response = await request(app)
      .post('/api/render')
      .send({
        composition: 'NonExistentComposition',
        outputPath: '/invalid/path.mp4'
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
  });
});
```

## 🌐 E2E Testing

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
});
```

### E2E Test Examples
```typescript
// tests/e2e/video-generation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Video Generation E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('creates video from text input', async ({ page }) => {
    // Input text
    await page.fill('[data-testid="text-input"]', 
      'Hello, this is an end-to-end test for video generation.');
    
    // Select voice
    await page.selectOption('[data-testid="voice-select"]', 'alloy');
    
    // Configure video settings
    await page.fill('[data-testid="width-input"]', '1280');
    await page.fill('[data-testid="height-input"]', '720');
    await page.fill('[data-testid="fps-input"]', '30');
    
    // Start generation
    await page.click('[data-testid="generate-button"]');
    
    // Wait for progress indicator
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    
    // Wait for completion (with generous timeout)
    await expect(page.locator('[data-testid="video-player"]'))
      .toBeVisible({ timeout: 120000 });
    
    // Verify video is playable
    const video = page.locator('video');
    await expect(video).toHaveAttribute('src', /.+\.mp4$/);
    
    // Test video controls
    await video.click(); // Play
    await page.waitForTimeout(2000);
    
    const currentTime = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
    expect(currentTime).toBeGreaterThan(0);
  });

  test('previews video in real-time', async ({ page }) => {
    await page.goto('/preview');
    
    // Load sample script
    await page.click('[data-testid="load-sample"]');
    
    // Verify script loaded
    await expect(page.locator('[data-testid="script-editor"]')).toContainText('schemaVersion');
    
    // Play preview
    await page.click('[data-testid="play-button"]');
    
    // Verify playback started
    await expect(page.locator('[data-testid="timeline"]')).toBeVisible();
    
    // Check timeline progress
    await page.waitForTimeout(3000);
    const currentTime = await page.locator('[data-testid="current-time"]').textContent();
    expect(currentTime).not.toBe('0:00');
    
    // Test pause
    await page.click('[data-testid="pause-button"]');
    const pausedTime = await page.locator('[data-testid="current-time"]').textContent();
    
    await page.waitForTimeout(1000);
    const stillPausedTime = await page.locator('[data-testid="current-time"]').textContent();
    expect(pausedTime).toBe(stillPausedTime);
  });

  test('handles errors gracefully', async ({ page }) => {
    // Test with invalid input
    await page.fill('[data-testid="text-input"]', '');
    await page.click('[data-testid="generate-button"]');
    
    // Should show validation error
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Text is required');
    
    // Test with invalid video settings
    await page.fill('[data-testid="text-input"]', 'Valid text');
    await page.fill('[data-testid="width-input"]', '0');
    await page.click('[data-testid="generate-button"]');
    
    await expect(page.locator('[data-testid="error-message"]'))
      .toContainText('Width must be greater than 0');
  });

  test('supports multiple video formats', async ({ page }) => {
    await page.fill('[data-testid="text-input"]', 'Format test video');
    
    // Test MP4 format
    await page.selectOption('[data-testid="format-select"]', 'mp4');
    await page.click('[data-testid="generate-button"]');
    
    await expect(page.locator('[data-testid="video-player"]'))
      .toBeVisible({ timeout: 60000 });
    
    const mp4Video = page.locator('video');
    await expect(mp4Video).toHaveAttribute('src', /\.mp4$/);
    
    // Test WebM format
    await page.selectOption('[data-testid="format-select"]', 'webm');
    await page.click('[data-testid="generate-button"]');
    
    await expect(page.locator('[data-testid="video-player"]'))
      .toBeVisible({ timeout: 60000 });
    
    const webmVideo = page.locator('video');
    await expect(webmVideo).toHaveAttribute('src', /\.webm$/);
  });
});
```

### Visual Regression Testing
```typescript
// tests/e2e/visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('homepage layout', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('video preview interface', async ({ page }) => {
    await page.goto('/preview');
    await page.click('[data-testid="load-sample"]');
    await expect(page).toHaveScreenshot('preview-interface.png');
  });

  test('video generation progress', async ({ page }) => {
    await page.goto('/');
    await page.fill('[data-testid="text-input"]', 'Visual test');
    await page.click('[data-testid="generate-button"]');
    
    // Wait for progress bar to appear
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page).toHaveScreenshot('generation-progress.png');
  });
});
```

## 📊 Test Coverage & Reporting

### Coverage Configuration
```json
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/index.tsx'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/components/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

### Test Scripts
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:visual": "playwright test --grep=visual",
    "test:all": "npm run test:ci && npm run test:e2e"
  }
}
```

---

**Tiếp theo**: [User Guides](../04-user-guides/getting-started.md)