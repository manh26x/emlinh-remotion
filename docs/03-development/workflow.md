# Development Workflow

## 🔄 Quy trình Phát triển

### Git Workflow

#### Branch Strategy
```bash
# Main branches
main          # Production-ready code
develop       # Integration branch
feature/*     # Feature development
hotfix/*      # Critical bug fixes
release/*     # Release preparation
```

#### Feature Development
```bash
# 1. Tạo feature branch từ develop
git checkout develop
git pull origin develop
git checkout -b feature/video-effects

# 2. Develop và commit
git add .
git commit -m "feat: add particle effects to video compositions"

# 3. Push và tạo Pull Request
git push origin feature/video-effects
# Tạo PR từ feature/video-effects -> develop

# 4. Merge sau khi review
git checkout develop
git pull origin develop
git branch -d feature/video-effects
```

#### Commit Convention
```bash
# Format: <type>(<scope>): <description>

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Code style (formatting, etc.)
refactor: # Code refactoring
test:     # Adding tests
chore:    # Maintenance tasks

# Examples:
feat(avatar): add facial expression morphing
fix(audio): resolve TTS timing synchronization
docs(api): update component documentation
refactor(render): optimize video composition pipeline
test(lipsync): add unit tests for viseme generation
```

### Development Environment

#### Hot Reload Setup
```bash
# Terminal 1: Remotion Preview
npm run dev

# Terminal 2: MCP Server
npm run mcp:dev

# Terminal 3: Test Watcher
npm run test:watch

# Terminal 4: Type Checking
npm run type-check:watch
```

#### Environment Switching
```bash
# Development
cp .env.development .env
npm run dev

# Staging
cp .env.staging .env
npm run build:staging

# Production
cp .env.production .env
npm run build:prod
```

## 🧪 Testing Strategy

### Test Pyramid
```
    E2E Tests (5%)
   ┌─────────────────┐
  │  Integration (15%) │
 ┌─────────────────────┐
│   Unit Tests (80%)   │
└─────────────────────┘
```

### Unit Testing

#### Component Testing
```typescript
// src/components/__tests__/Avatar.test.tsx
import { render, screen } from '@testing-library/react';
import { Avatar } from '../Avatar';

describe('Avatar Component', () => {
  it('renders with default props', () => {
    render(<Avatar modelPath="/models/default.glb" />);
    expect(screen.getByTestId('avatar-container')).toBeInTheDocument();
  });

  it('applies correct transformations', () => {
    const position = [1, 2, 3] as const;
    render(<Avatar modelPath="/models/test.glb" position={position} />);
    
    const mesh = screen.getByTestId('avatar-mesh');
    expect(mesh).toHaveStyle('transform: translate3d(1px, 2px, 3px)');
  });

  it('handles viseme data correctly', async () => {
    const visemeData = [
      { time: 0, viseme: 'A', intensity: 0.8 },
      { time: 1, viseme: 'E', intensity: 0.6 }
    ];
    
    render(<Avatar modelPath="/models/test.glb" visemeData={visemeData} />);
    
    // Test viseme application logic
    await waitFor(() => {
      expect(screen.getByTestId('mouth-shape')).toHaveAttribute('data-viseme', 'A');
    });
  });
});
```

#### Hook Testing
```typescript
// src/hooks/__tests__/useRemotionLipSync.test.ts
import { renderHook } from '@testing-library/react';
import { useRemotionLipSync } from '../useRemotionLipSync';

describe('useRemotionLipSync', () => {
  it('returns correct viseme for current frame', () => {
    const visemeData = [
      { time: 0, viseme: 'A', intensity: 0.8 },
      { time: 30, viseme: 'E', intensity: 0.6 }
    ];
    
    const { result } = renderHook(() => 
      useRemotionLipSync(visemeData, 30)
    );
    
    expect(result.current.currentViseme).toBe('E');
    expect(result.current.intensity).toBe(0.6);
  });

  it('interpolates between visemes', () => {
    const visemeData = [
      { time: 0, viseme: 'A', intensity: 1.0 },
      { time: 60, viseme: 'E', intensity: 0.0 }
    ];
    
    const { result } = renderHook(() => 
      useRemotionLipSync(visemeData, 30)
    );
    
    expect(result.current.intensity).toBeCloseTo(0.5, 1);
  });
});
```

#### Utility Testing
```typescript
// src/utils/__tests__/normalize-script.test.ts
import { normalizeScript } from '../normalize-script';
import { ScriptV1 } from '../types';

describe('normalizeScript', () => {
  it('normalizes script with missing properties', () => {
    const input = {
      schemaVersion: '1.0',
      scenes: [{
        id: 'scene1',
        elements: []
      }]
    };
    
    const result = normalizeScript(input);
    
    expect(result.meta).toBeDefined();
    expect(result.meta.fps).toBe(30);
    expect(result.meta.width).toBe(1920);
    expect(result.meta.height).toBe(1080);
  });

  it('preserves existing meta properties', () => {
    const input = {
      schemaVersion: '1.0',
      meta: { fps: 60, width: 3840, height: 2160 },
      scenes: []
    };
    
    const result = normalizeScript(input);
    
    expect(result.meta.fps).toBe(60);
    expect(result.meta.width).toBe(3840);
    expect(result.meta.height).toBe(2160);
  });
});
```

### Integration Testing

#### Render Pipeline Testing
```typescript
// src/__tests__/integration/render-pipeline.test.ts
import { renderVideo } from '../render/renderVideo';
import { generateTTS } from '../audio/tts';
import { generateLipSync } from '../lipsync/generator';

describe('Render Pipeline Integration', () => {
  it('completes full text-to-video pipeline', async () => {
    const script = {
      schemaVersion: '1.0',
      meta: { fps: 30, width: 1920, height: 1080 },
      scenes: [{
        id: 'scene1',
        duration: 180,
        elements: [{
          type: 'character',
          id: 'avatar1',
          text: 'Hello, this is a test message'
        }]
      }]
    };

    // 1. Generate TTS
    const audioResult = await generateTTS({
      text: 'Hello, this is a test message',
      voice: 'alloy'
    });
    expect(audioResult.success).toBe(true);

    // 2. Generate Lip-sync
    const lipsyncResult = await generateLipSync({
      audioPath: audioResult.audioPath
    });
    expect(lipsyncResult.success).toBe(true);

    // 3. Render Video
    const renderResult = await renderVideo({
      composition: 'DynamicVideo',
      props: { script },
      outputPath: './test-output.mp4'
    });
    expect(renderResult.success).toBe(true);
    expect(renderResult.outputPath).toMatch(/\.mp4$/);
  }, 30000);
});
```

#### MCP Integration Testing
```typescript
// src/__tests__/integration/mcp.test.ts
import { MCPClient } from '../mcp/client';

describe('MCP Integration', () => {
  let mcpClient: MCPClient;

  beforeAll(async () => {
    mcpClient = new MCPClient();
    await mcpClient.connect();
  });

  afterAll(async () => {
    await mcpClient.disconnect();
  });

  it('renders video via MCP', async () => {
    const result = await mcpClient.callTool('render_video', {
      composition: 'DynamicVideo',
      parameters: {
        width: 1280,
        height: 720,
        fps: 30
      },
      outputPath: './mcp-test-output.mp4'
    });

    expect(result.success).toBe(true);
    expect(result.outputPath).toBeDefined();
  });

  it('generates TTS via MCP', async () => {
    const result = await mcpClient.callTool('generate_tts', {
      text: 'MCP integration test',
      voice: 'alloy',
      outputPath: './mcp-test-audio.mp3'
    });

    expect(result.success).toBe(true);
    expect(result.audioPath).toBeDefined();
  });
});
```

### E2E Testing

#### Playwright Setup
```typescript
// tests/e2e/video-generation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Video Generation E2E', () => {
  test('creates video from text input', async ({ page }) => {
    // Navigate to application
    await page.goto('http://localhost:3000');

    // Input text
    await page.fill('[data-testid="text-input"]', 'Hello world from E2E test');
    
    // Select voice
    await page.selectOption('[data-testid="voice-select"]', 'alloy');
    
    // Start generation
    await page.click('[data-testid="generate-button"]');
    
    // Wait for completion
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="video-player"]')).toBeVisible({ timeout: 60000 });
    
    // Verify video is playable
    const video = page.locator('video');
    await expect(video).toHaveAttribute('src', /.+\.mp4$/);
  });

  test('previews video in real-time', async ({ page }) => {
    await page.goto('http://localhost:3000/preview');
    
    // Load sample script
    await page.click('[data-testid="load-sample"]');
    
    // Play preview
    await page.click('[data-testid="play-button"]');
    
    // Verify playback
    await expect(page.locator('[data-testid="timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="current-time"]')).not.toHaveText('0:00');
  });
});
```

## 🔧 Code Quality

### Linting & Formatting

#### ESLint Configuration
```json
// .eslintrc.json
{
  "extends": [
    "@remotion",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react-hooks/exhaustive-deps": "error",
    "no-console": "warn"
  },
  "overrides": [
    {
      "files": ["**/*.test.ts", "**/*.test.tsx"],
      "rules": {
        "no-console": "off"
      }
    }
  ]
}
```

#### Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

#### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{json,md}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

### Type Safety

#### Strict TypeScript
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

#### Type Guards
```typescript
// src/utils/type-guards.ts
export function isScriptV1(obj: unknown): obj is ScriptV1 {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'schemaVersion' in obj &&
    'scenes' in obj
  );
}

export function isValidViseme(viseme: string): viseme is VisemeType {
  return ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X'].includes(viseme);
}

// Usage
if (isScriptV1(data)) {
  // TypeScript knows data is ScriptV1
  console.log(data.scenes.length);
}
```

## 📊 Performance Monitoring

### Metrics Collection
```typescript
// src/utils/performance.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(value);
  }

  getStats(label: string) {
    const values = this.metrics.get(label) || [];
    return {
      count: values.length,
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
}

// Usage in components
const monitor = new PerformanceMonitor();

export const VideoContainer: React.FC<Props> = (props) => {
  const endTimer = monitor.startTimer('video-render');
  
  useEffect(() => {
    return endTimer;
  }, []);
  
  // Component logic...
};
```

### Bundle Analysis
```bash
# Analyze bundle size
npm run build:analyze

# Check for duplicate dependencies
npm run check-duplicates

# Performance profiling
npm run profile
```

## 🚀 Deployment

### Build Process
```bash
# Development build
npm run build:dev

# Production build
npm run build:prod

# Build with analysis
npm run build:analyze
```

### CI/CD Pipeline
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build:prod
      
      - name: Test render
        run: npm run test:render

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: echo "Deploy to production"
```

### Release Process
```bash
# 1. Create release branch
git checkout develop
git checkout -b release/v1.2.0

# 2. Update version
npm version minor

# 3. Update changelog
npm run changelog

# 4. Commit and push
git add .
git commit -m "chore: prepare release v1.2.0"
git push origin release/v1.2.0

# 5. Create PR to main
# 6. After merge, tag release
git checkout main
git pull origin main
git tag v1.2.0
git push origin v1.2.0

# 7. Merge back to develop
git checkout develop
git merge main
git push origin develop
```

---

**Tiếp theo**: [Testing Guide](./testing.md)