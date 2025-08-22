# Epic: ChatGPT TTS + Rhubarb Lip-sync Integration - Brownfield Enhancement

**Epic Created:** 2025-08-22  
**Product Owner:** Sarah (BMad PO)  
**Status:** Ready for Implementation  
**Epic Type:** Brownfield Enhancement  

---

## Epic Goal

Extend existing TTS Integration với advanced lip-sync capabilities using Rhubarb library để create realistic mouth animations synchronized với generated speech, delivering professional-quality avatar videos với accurate lip movement.

## Epic Description

### Existing System Context

- **Current functionality:** Complete TTS pipeline từ topic → script → TTS audio → video rendering
- **Technology stack:** Node.js/TypeScript MCP server, OpenAI TTS, Remotion rendering engine
- **Integration points:** Audio handlers, TTS service, render service, existing MCP tools

### Enhancement Details

- **What's being added:** Audio format conversion (WAV→OGG), Rhubarb CLI integration, lip-sync data processing
- **How it integrates:** Extends existing audio pipeline với 2 new processing steps before video rendering
- **Success criteria:** Videos với synchronized lip movements, <5min end-to-end processing, maintained audio quality

---

## Complete Pipeline Architecture

### Enhanced Flow Specification

```
1. Claude Request Input
   ↓ (topic string)

2. Script Generation  
   ↓ (formatted script text)

3. ChatGPT TTS Processing
   ↓ (WAV audio file)

4. Audio Format Conversion
   ↓ (OGG audio file - Rhubarb compatible)

5. Rhubarb Lip-sync Processing  
   ↓ (JSON với mouth cues timeline)

6. Enhanced Video Rendering
   ↓ (Final video với synchronized lip-sync)
```

### Technical Integration Points

**Existing Services Extension:**
- `tts-service.ts` - Extend để support WAV format
- `audio-manager.ts` - Add OGG conversion management  
- `render-service.ts` - Integrate lip-sync data processing

**New Services Required:**
- `audio-conversion-service.ts` - WAV to OGG conversion
- `rhubarb-service.ts` - CLI integration và JSON processing
- `lipsync-manager.ts` - Mouth cues data management

---

## New MCP Tools Specifications

### 1. `convert_audio_format`
```typescript
{
  name: "convert_audio_format",
  description: "Convert audio từ WAV sang OGG format using ffmpeg",
  inputSchema: {
    type: "object",
    properties: {
      inputPath: { type: "string", description: "Path đến WAV file" },
      outputPath: { type: "string", description: "Output path cho OGG file" },
      quality: { type: "number", default: 5, description: "OGG quality (0-10)" }
    },
    required: ["inputPath", "outputPath"]
  }
}
```

### 2. `generate_lipsync_data`
```typescript
{
  name: "generate_lipsync_data",
  description: "Generate lip-sync data từ OGG audio using Rhubarb CLI",
  inputSchema: {
    type: "object", 
    properties: {
      audioPath: { type: "string", description: "Path đến OGG audio file" },
      outputPath: { type: "string", description: "Path cho JSON output" },
      dialogFile: { type: "string", description: "Optional dialog text file" }
    },
    required: ["audioPath", "outputPath"]
  }
}
```

### 3. `render_video_with_lipsync`
```typescript
{
  name: "render_video_with_lipsync",
  description: "Complete pipeline render video với lip-sync integration",
  inputSchema: {
    type: "object",
    properties: {
      topic: { type: "string", description: "Video topic" },
      outputPath: { type: "string", description: "Output video path" },
      avatarConfig: { type: "object", description: "Avatar configuration" },
      lipSyncIntensity: { type: "number", default: 1.0, description: "Lip-sync intensity" }
    },
    required: ["topic", "outputPath"]
  }
}
```

---

## Technical Dependencies

### Environment Requirements
```json
{
  "dependencies": {
    "existing": [
      "@remotion/cli",
      "openai",
      "fs/promises", 
      "path"
    ],
    "new": [
      "child_process",
      "ffmpeg-static"
    ],
    "external": [
      "ffmpeg (already installed)",
      "rhubarb (already installed)"
    ]
  }
}
```

### Rhubarb JSON Output Format
```json
{
  "metadata": {
    "soundFile": "/path/to/audio.ogg",
    "duration": 4.89
  },
  "mouthCues": [
    { "start": 0.00, "end": 0.34, "value": "B" },
    { "start": 0.34, "end": 0.48, "value": "D" },
    { "start": 0.48, "end": 0.65, "value": "C" }
  ]
}
```

**Mouth Shape Values (Preston Blair visemes):**
- A: Rest position
- B: M, B, P sounds  
- C: E, I sounds
- D: A, I sounds
- E: O sounds
- F: U, Q sounds
- G: F, V sounds
- H: L sounds
- X: Closed mouth/silence

---

## User Stories

### Story 1.1: Audio Format Conversion Service

**Status:** Draft

**User Story:**
As a MCP Client, I want to convert TTS-generated WAV files to OGG format với configurable quality settings, so that Rhubarb lip-sync processing can receive compatible audio input với preserved fidelity.

**Acceptance Criteria:**

1. **WAV to OGG Conversion Function**
   - Accept WAV file path và output OGG path parameters
   - Support configurable quality settings (0-10 scale)
   - Preserve audio duration và sample rate during conversion

2. **Quality Control & Validation**
   - Validate input WAV file exists và is readable
   - Verify output OGG file created successfully
   - Compare audio durations pre/post conversion (±100ms tolerance)

3. **Error Handling & Recovery**
   - Handle ffmpeg CLI errors gracefully với descriptive messages
   - Clean up partial files on conversion failure
   - Provide fallback quality settings if requested quality fails

4. **Integration Requirements**
   - Existing audio-handlers.ts functionality continues unchanged
   - New service follows existing AudioManager pattern
   - Integration với TTS service maintains current behavior

5. **Quality Requirements**
   - Unit tests cover conversion scenarios và edge cases
   - Documentation updated for new conversion service
   - No regression trong existing audio processing verified

**Implementation Tasks:**
- Create `audio-conversion-service.ts` trong services/
- Add ffmpeg integration với CLI wrapper
- Implement validation và error handling
- Create MCP tool integration
- Add testing và documentation

---

### Story 1.2: Rhubarb Lip-sync Data Generation

**Status:** Draft

**User Story:**
As a MCP Client, I want to generate precise lip-sync mouth cue data từ OGG audio files using Rhubarb CLI, so that I have accurate timing information for realistic avatar mouth animations synchronized với spoken content.

**Acceptance Criteria:**

1. **Rhubarb CLI Integration**
   - Execute Rhubarb command với OGG audio file input
   - Support optional dialog text file for improved accuracy  
   - Generate JSON output với mouth cues timeline format
   - Handle Rhubarb CLI process execution và output capture

2. **JSON Output Processing & Validation**
   - Parse Rhubarb JSON output into structured data
   - Validate JSON contains required fields (metadata, mouthCues)
   - Verify mouth cue coverage spans full audio duration
   - Ensure mouth shape values match Preston Blair visemes (A-H,X)

3. **Error Handling & Recovery**
   - Handle Rhubarb CLI not found error với descriptive message
   - Manage invalid audio file errors gracefully
   - Clean up temporary files on processing failure
   - Provide fallback processing options if Rhubarb fails

4. **Integration Requirements**
   - New service follows existing services/ directory pattern
   - Integration với audio-conversion-service maintains workflow
   - Lip-sync data storage consistent với existing file management
   - Existing audio processing functionality unchanged

5. **Quality Requirements**
   - Unit tests cover Rhubarb processing scenarios và edge cases
   - Integration tests verify JSON format compatibility
   - Documentation updated với lip-sync data generation process
   - Performance benchmarks established for processing time

**Implementation Tasks:**
- Create `rhubarb-service.ts` với CLI wrapper
- Implement CLI process management với timeout handling
- Add JSON processing và validation logic
- Create `lipsync-manager.ts` for data handling
- Add MCP tool integration
- Create testing và documentation

**Rhubarb CLI Command Pattern:**
```bash
rhubarb -f json -o output.json [--dialogFile dialog.txt] input.ogg
```

---

### Story 1.3: Enhanced Video Rendering với Lip-sync

**Status:** Draft

**User Story:**
As a MCP Client, I want to render videos với synchronized avatar mouth animations using lip-sync data, so that I can produce professional-quality videos với realistic speech-matched lip movements từ topic input through complete automated pipeline.

**Acceptance Criteria:**

1. **Complete Pipeline Integration**
   - Execute full workflow: topic → script → TTS WAV → OGG → Rhubarb JSON → lip-sync video
   - Integrate audio conversion và lip-sync services seamlessly
   - Maintain existing video quality và rendering performance
   - Support configurable lip-sync intensity (0.0-2.0 scale)

2. **Lip-sync Data Application**
   - Parse mouth cue JSON data into Remotion timeline
   - Apply mouth shapes to avatar morph targets accurately  
   - Interpolate between mouth cues for smooth transitions
   - Synchronize audio playback với visual lip movements

3. **Avatar Animation Enhancement**
   - Extend existing avatar component với mouth animation support
   - Map Rhubarb visemes (A-H,X) to avatar mouth shapes
   - Preserve existing avatar features (blinking, expressions)
   - Support multiple avatar models với consistent lip-sync

4. **Integration Requirements**
   - Extend render-service.ts với lip-sync rendering capabilities
   - New `render_video_with_lipsync` MCP tool integration
   - Backward compatibility với existing `render_video_with_tts` tool
   - Existing video rendering functionality unchanged

5. **Quality Requirements**
   - Lip-sync accuracy within ±50ms timing tolerance
   - Complete pipeline processing <5 minutes end-to-end
   - Integration tests cover full workflow scenarios
   - Documentation updated với lip-sync rendering process

**Implementation Tasks:**
- Extend Avatar.tsx với mouth animation morph targets
- Create lip-sync timeline integration với Remotion
- Enhance render service với lip-sync rendering method
- Create complete pipeline MCP tool
- Add configuration và quality control
- Create comprehensive testing và documentation

**Avatar Mouth Shape Mapping:**
```typescript
const MOUTH_SHAPES = {
  'A': 'rest',      // Rest position
  'B': 'mbp',       // M, B, P sounds
  'C': 'ei',        // E, I sounds  
  'D': 'ai',        // A, I sounds
  'E': 'o',         // O sounds
  'F': 'u',         // U, Q sounds
  'G': 'fv',        // F, V sounds
  'H': 'l',         // L sounds
  'X': 'closed'     // Closed mouth/silence
};
```

---

## Compatibility Requirements

- ✅ Existing APIs remain unchanged
- ✅ Database schema changes are backward compatible
- ✅ UI changes follow existing patterns
- ✅ Performance impact is minimal

## Risk Mitigation

- **Primary Risk:** Audio quality degradation during WAV→OGG conversion affecting lip-sync accuracy
- **Mitigation:** Implement quality validation và configurable conversion settings với fallback to original WAV
- **Rollback Plan:** Feature flags để disable lip-sync processing và revert to existing TTS-only pipeline

## Definition of Done

- ✅ All 3 stories completed với acceptance criteria met
- ✅ Existing TTS functionality verified through regression testing  
- ✅ New MCP tools integrated và tested
- ✅ Documentation updated cho new pipeline flow
- ✅ No regression trong existing video generation features

---

## Implementation Roadmap

### Phase 1: Core Services (High Priority)
1. Create `audio-conversion-service.ts` - FFmpeg integration
2. Create `rhubarb-service.ts` - CLI wrapper và JSON processing  
3. Create `lipsync-manager.ts` - Mouth cues data management

### Phase 2: MCP Tools Integration (High Priority)
1. Implement `convert_audio_format` handler
2. Implement `generate_lipsync_data` handler
3. Implement `render_video_with_lipsync` complete pipeline

### Phase 3: Testing & Validation (Medium Priority)
1. Unit tests cho new services
2. Integration tests cho complete pipeline
3. Performance benchmarking

---

## System-Level Acceptance Criteria

**Performance Requirements:**
- Audio conversion WAV→OGG: < 30 seconds per 5-minute audio
- Rhubarb processing: < 60 seconds per 5-minute audio  
- Complete pipeline execution: < 5 minutes end-to-end
- Memory usage: < 500MB during processing

**Quality Standards:**
- Audio fidelity maintained after OGG conversion
- Lip-sync accuracy: ±50ms timing tolerance
- Mouth cue coverage: 100% of spoken audio duration
- Video output quality unchanged từ existing pipeline

**Error Handling:**
- Graceful failure với descriptive error messages
- Automatic cleanup of temporary files
- Retry logic for CLI operations
- Validation of all intermediate outputs

---

## Testing Scenarios

### Scenario 1: Happy Path Complete Pipeline
```
Input: "Explain quantum computing in simple terms"
Expected: 
- Generate script (≈200 words)
- Create TTS WAV file (≈2-3 minutes)
- Convert to OGG successfully
- Generate Rhubarb JSON với 50+ mouth cues
- Render video với synchronized lip movement
- Final MP4 file trong output/ directory
```

### Scenario 2: Edge Cases
- Very short text (< 10 words)
- Long text (> 1000 words) 
- Special characters trong script
- Silent periods trong audio
- Multiple sentences với pauses

### Scenario 3: Error Conditions
- Invalid audio file
- Rhubarb CLI not found
- Insufficient disk space
- Corrupted intermediate files

---

## Epic Summary

**Total Implementation Scope:**
- **17 Task Groups** với **53 Subtasks**
- **3 New Services:** audio-conversion, rhubarb, lipsync-manager
- **3 New MCP Tools:** convert_audio_format, generate_lipsync_data, render_video_with_lipsync
- **Avatar Enhancement:** Mouth animation với 9 viseme shapes
- **Complete Pipeline:** topic → script → TTS WAV → OGG → Rhubarb JSON → lip-sync video

**Business Value:**
- Enhanced video realism với accurate lip-sync
- Professional-quality avatar animations
- Complete automated pipeline từ text đến synchronized video

This brownfield enhancement maintains existing system integrity while enabling advanced lip-sync capabilities for professional-quality video generation.

---

**Document Version:** 1.0  
**Last Updated:** 2025-08-22  
**Next Action:** Transform to Developer Agent for implementation or validate stories before development
