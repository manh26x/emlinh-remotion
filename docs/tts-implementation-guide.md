# TTS Implementation Guide

## Bước 1: Setup Dependencies

```bash
cd mcp-server
npm install openai axios form-data uuid
npm install --save-dev @types/uuid
```

## Bước 2: Environment Configuration

```bash
# .env
OPENAI_API_KEY=sk-proj-...
OPENAI_TTS_MODEL=tts-1
OPENAI_TTS_VOICE=alloy
AUDIO_OUTPUT_DIR=../public/audios
AUDIO_RETENTION_HOURS=24
```

## Bước 3: Tạo Service Layer

### TTSService
```typescript
// src/services/tts-service.ts
import OpenAI from 'openai';
import { writeFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

export class TTSService {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateAudio(request: TTSRequest): Promise<TTSResponse> {
    const response = await this.openai.audio.speech.create({
      model: request.model,
      voice: request.voice,
      input: request.text,
      speed: request.speed || 1.0
    });

    const audioId = uuidv4();
    const filename = `${audioId}.mp3`;
    const filePath = path.join(config.getAudioOutputDir(), filename);
    
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(filePath, buffer);

    return {
      audioId,
      filePath,
      duration: this.estimateDuration(request.text),
      size: buffer.length,
      format: 'mp3',
      metadata: {
        originalText: request.text,
        voice: request.voice,
        model: request.model,
        wordCount: request.text.split(' ').length,
        createdAt: new Date()
      }
    };
  }
}
```

## Bước 4: Tạo Handler Layer

### AudioHandlers
```typescript
// src/handlers/audio-handlers.ts
export class AudioHandlers {
  private ttsService: TTSService;
  private audioManager: AudioManager;

  async handleGenerateTTSAudio(args: any): Promise<CallToolResponse> {
    try {
      const request: TTSRequest = {
        text: args.text,
        voice: args.voice || 'alloy',
        model: args.model || 'tts-1',
        speed: args.speed || 1.0
      };

      const response = await this.ttsService.generateAudio(request);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(response)
        }]
      };
    } catch (error) {
      throw new TTSError('Audio generation failed', TTSErrorCode.AUDIO_GENERATION_FAILED);
    }
  }
}
```

## Bước 5: Tích hợp vào MCP Server

### Cập nhật server.ts
```typescript
// src/server.ts
import { AudioHandlers } from './handlers/audio-handlers.js';

class RemotionMCPServer {
  private audioHandlers: AudioHandlers;

  constructor() {
    this.audioHandlers = new AudioHandlers();
    this.setupTTSTools();
  }

  private setupTTSTools(): void {
    // generate_tts_audio tool
    registerTool(
      'generate_tts_audio',
      'Generate TTS audio from text using OpenAI TTS API',
      z.object({
        text: z.string().min(1).max(4096),
        voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional(),
        model: z.enum(['tts-1', 'tts-1-hd']).optional(),
        speed: z.number().min(0.25).max(4.0).optional()
      })
    );
  }
}
```

## Bước 6: Testing

```typescript
// tests/unit/tts-service.test.ts
describe('TTSService', () => {
  test('should generate audio successfully', async () => {
    const service = new TTSService();
    const request = {
      text: 'Hello world',
      voice: 'alloy' as TTSVoice,
      model: 'tts-1' as TTSModel
    };
    
    const response = await service.generateAudio(request);
    
    expect(response.audioId).toBeDefined();
    expect(response.filePath).toContain('.mp3');
  });
});
```

## Bước 7: Deployment

1. Đảm bảo OpenAI API key được set
2. Tạo thư mục `public/audios`
3. Restart MCP server
4. Test với Claude

## Troubleshooting

### Common Issues
- **API Key Invalid**: Kiểm tra OPENAI_API_KEY
- **File Permission**: Đảm bảo write permission cho audio directory
- **Rate Limit**: Implement retry logic với exponential backoff

### Debug Commands
```bash
# Test API key
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models

# Check audio directory
ls -la public/audios/

# Monitor logs
tail -f logs/mcp-server.log
```
