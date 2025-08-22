# TTS Integration API Specification

## Tổng quan

Tài liệu này định nghĩa chi tiết các API endpoints và tools cho TTS Integration trong MCP-Remotion Server.

## MCP Tools

### 1. generate_tts_audio

Tạo audio file từ text sử dụng OpenAI TTS API.

#### Input Schema
```typescript
{
  text: string;           // Text cần chuyển thành audio (1-4096 chars)
  voice?: TTSVoice;       // Voice option (default: 'alloy')
  model?: TTSModel;       // TTS model (default: 'tts-1')
  speed?: number;         // Speech speed 0.25-4.0 (default: 1.0)
  format?: AudioFormat;   // Output format (default: 'mp3')
}
```

#### Response
```typescript
{
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        audioId: string;        // Unique audio file ID
        filePath: string;       // Relative path to audio file
        duration: number;       // Audio duration in seconds
        size: number;          // File size in bytes
        format: string;        // Audio format
        voice: TTSVoice;       // Voice used
        model: TTSModel;       // Model used
        metadata: {
          originalText: string;
          wordCount: number;
          estimatedTokens: number;
          createdAt: string;
        }
      })
    }
  ]
}
```

#### Error Responses
```typescript
// API Key Invalid
{
  error: {
    code: 'TTS_API_KEY_INVALID',
    message: 'OpenAI API key is invalid or missing',
    details: { apiKeyStatus: 'invalid' }
  }
}

// Text Too Long
{
  error: {
    code: 'TTS_TEXT_TOO_LONG',
    message: 'Text exceeds maximum length of 4096 characters',
    details: { textLength: number, maxLength: 4096 }
  }
}

// Rate Limit
{
  error: {
    code: 'TTS_API_RATE_LIMIT',
    message: 'OpenAI API rate limit exceeded',
    details: { retryAfter: number }
  }
}
```

### 2. generate_script

Tạo script content từ topic cho video.

#### Input Schema
```typescript
{
  topic: string;                    // Chủ đề cần tạo script
  template?: string;                // Template name (default: 'general')
  maxWords?: number;                // Max word count (50-2000, default: 500)
  tone?: ScriptTone;               // Tone of voice (default: 'professional')
  language?: 'vi' | 'en';         // Language (default: 'vi')
}
```

#### Response
```typescript
{
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        scriptId: string;           // Unique script ID
        topic: string;              // Original topic
        content: string;            // Generated script content
        wordCount: number;          // Actual word count
        estimatedDuration: number;  // Estimated audio duration (seconds)
        template: string;           // Template used
        tone: ScriptTone;          // Tone used
        language: string;          // Language used
        createdAt: string;         // Creation timestamp
      })
    }
  ]
}
```

### 3. render_video_with_tts

All-in-one tool để render video với TTS audio.

#### Input Schema
```typescript
{
  composition: string;              // Remotion composition name
  topic?: string;                   // Topic for script generation
  script?: string;                  // Pre-written script (overrides topic)
  voice?: TTSVoice;                // TTS voice (default: 'alloy')
  ttsModel?: TTSModel;             // TTS model (default: 'tts-1')
  parameters?: {                    // Render parameters
    width?: number;
    height?: number;
    fps?: number;
    quality?: number;
    concurrency?: number;
    scale?: number;
  };
}
```

#### Response
```typescript
{
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        jobId: string;              // Render job ID
        status: 'pending' | 'running' | 'completed' | 'failed';
        progress: number;           // 0-100
        composition: string;        // Composition name
        audioId?: string;          // Generated audio ID
        scriptId?: string;         // Generated script ID
        outputPath?: string;       // Video output path (when completed)
        startTime: string;         // Job start time
        endTime?: string;          // Job completion time
        errorMessage?: string;     // Error details (if failed)
      })
    }
  ]
}
```

### 4. list_audio_files

Liệt kê các audio files đã tạo.

#### Input Schema
```typescript
{
  limit?: number;                   // Max files to return (default: 50)
  filter?: {
    voice?: TTSVoice;              // Filter by voice
    model?: TTSModel;              // Filter by model
    createdAfter?: string;         // ISO date string
    createdBefore?: string;        // ISO date string
  };
}
```

#### Response
```typescript
{
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        files: AudioFile[];         // Array of audio files
        total: number;              // Total count
        hasMore: boolean;           // More files available
      })
    }
  ]
}
```

### 5. delete_audio_file

Xóa audio file.

#### Input Schema
```typescript
{
  audioId: string;                  // Audio file ID to delete
}
```

#### Response
```typescript
{
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        success: boolean;
        audioId: string;
        message: string;
      })
    }
  ]
}
```

### 6. cleanup_audio_files

Dọn dẹp audio files cũ.

#### Input Schema
```typescript
{
  olderThanHours?: number;          // Delete files older than N hours (default: 24)
  maxFiles?: number;                // Keep only N newest files
  dryRun?: boolean;                 // Preview only, don't delete (default: false)
}
```

#### Response
```typescript
{
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        deletedCount: number;       // Number of files deleted
        freedSpace: number;         // Bytes freed
        remainingFiles: number;     // Files remaining
        deletedFiles: string[];     // List of deleted file IDs
      })
    }
  ]
}
```

## Type Definitions

### Core Types
```typescript
// Voice Options
export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

// Model Options
export type TTSModel = 'tts-1' | 'tts-1-hd';

// Audio Formats
export type AudioFormat = 'mp3' | 'opus' | 'aac' | 'flac';

// Script Tones
export type ScriptTone = 'professional' | 'casual' | 'educational' | 'entertaining';

// Audio File Structure
export interface AudioFile {
  id: string;
  filename: string;
  filePath: string;
  duration: number;
  size: number;
  format: string;
  voice: TTSVoice;
  model: TTSModel;
  scriptId?: string;
  createdAt: string;
  metadata: {
    originalText: string;
    wordCount: number;
    estimatedTokens: number;
    speed: number;
  };
}

// Script Structure
export interface Script {
  id: string;
  topic: string;
  content: string;
  wordCount: number;
  estimatedDuration: number;
  template: string;
  tone: ScriptTone;
  language: string;
  createdAt: string;
}
```

## Error Codes

### TTS Errors
| Code | Description | HTTP Status | Retry |
|------|-------------|-------------|-------|
| `TTS_API_KEY_INVALID` | OpenAI API key invalid | 401 | No |
| `TTS_API_RATE_LIMIT` | Rate limit exceeded | 429 | Yes |
| `TTS_API_QUOTA_EXCEEDED` | Quota exceeded | 429 | No |
| `TTS_TEXT_TOO_LONG` | Text exceeds 4096 chars | 400 | No |
| `TTS_INVALID_VOICE` | Invalid voice option | 400 | No |
| `TTS_AUDIO_GENERATION_FAILED` | Audio generation failed | 500 | Yes |
| `TTS_FILE_SAVE_FAILED` | File save operation failed | 500 | Yes |
| `TTS_NETWORK_ERROR` | Network connectivity issue | 503 | Yes |

### Script Errors
| Code | Description | HTTP Status | Retry |
|------|-------------|-------------|-------|
| `SCRIPT_TOPIC_EMPTY` | Topic is required | 400 | No |
| `SCRIPT_GENERATION_FAILED` | Script generation failed | 500 | Yes |
| `SCRIPT_TEMPLATE_NOT_FOUND` | Template not found | 404 | No |
| `SCRIPT_VALIDATION_FAILED` | Script validation failed | 400 | No |

### File Management Errors
| Code | Description | HTTP Status | Retry |
|------|-------------|-------------|-------|
| `AUDIO_FILE_NOT_FOUND` | Audio file not found | 404 | No |
| `AUDIO_FILE_DELETE_FAILED` | Delete operation failed | 500 | Yes |
| `AUDIO_STORAGE_FULL` | Storage space exhausted | 507 | No |
| `AUDIO_PERMISSION_DENIED` | File permission denied | 403 | No |

## Rate Limits

### OpenAI API Limits
- **Requests per minute**: 50 (configurable)
- **Characters per request**: 4,096
- **Concurrent requests**: 3 (configurable)

### Internal Limits
- **Max audio files**: 100 (configurable)
- **Max file size**: 25MB per audio
- **Storage limit**: 1GB total (configurable)

## Authentication

### API Key Configuration
```bash
# Environment variable
OPENAI_API_KEY=sk-proj-...

# Validation endpoint
GET /api/tts/validate-key
```

### Key Rotation
- Support for multiple API keys
- Automatic failover
- Key usage tracking

## Caching Strategy

### Audio Caching
- **Cache key**: SHA-256 hash of (text + voice + model + speed)
- **TTL**: 24 hours (configurable)
- **Max cache size**: 500MB
- **Eviction**: LRU policy

### Script Caching
- **Cache key**: SHA-256 hash of (topic + template + tone + language)
- **TTL**: 1 hour (configurable)
- **Max entries**: 100

## Monitoring Endpoints

### Health Check
```typescript
GET /api/tts/health
Response: {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    openai: 'up' | 'down';
    storage: 'up' | 'down';
    cache: 'up' | 'down';
  };
  metrics: {
    totalRequests: number;
    successRate: number;
    avgResponseTime: number;
    cacheHitRate: number;
  };
}
```

### Metrics
```typescript
GET /api/tts/metrics
Response: {
  requests: {
    total: number;
    success: number;
    failed: number;
    rate: number; // per minute
  };
  audio: {
    totalFiles: number;
    totalSize: number;
    avgDuration: number;
  };
  performance: {
    avgGenerationTime: number;
    p95GenerationTime: number;
    cacheHitRate: number;
  };
}
```

## WebSocket Events (Future)

### Real-time Updates
```typescript
// TTS Generation Progress
{
  type: 'tts_progress';
  audioId: string;
  progress: number; // 0-100
  stage: 'queued' | 'processing' | 'completed' | 'failed';
}

// Render Progress with TTS
{
  type: 'render_progress';
  jobId: string;
  progress: number;
  stage: 'script_generation' | 'tts_generation' | 'video_rendering';
  audioId?: string;
  scriptId?: string;
}
```

---

## Usage Examples

### Basic TTS Generation
```javascript
// Generate audio from text
const response = await callTool('generate_tts_audio', {
  text: 'Xin chào, đây là video về công nghệ AI.',
  voice: 'nova',
  model: 'tts-1-hd'
});
```

### Complete Video Workflow
```javascript
// Generate video with TTS from topic
const response = await callTool('render_video_with_tts', {
  composition: 'Scene-Landscape',
  topic: 'Artificial Intelligence in 2024',
  voice: 'alloy',
  parameters: {
    width: 1920,
    height: 1080,
    fps: 30
  }
});
```

### Audio Management
```javascript
// List recent audio files
const files = await callTool('list_audio_files', {
  limit: 10,
  filter: {
    voice: 'nova',
    createdAfter: '2024-01-01T00:00:00Z'
  }
});

// Cleanup old files
const cleanup = await callTool('cleanup_audio_files', {
  olderThanHours: 48,
  dryRun: true
});
```
