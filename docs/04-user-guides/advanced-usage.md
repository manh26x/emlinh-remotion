# Advanced Usage

## 🎬 Kỹ thuật Video Nâng cao

### Multi-Scene Compositions

#### Tạo Video Nhiều Cảnh
```json
{
  "schemaVersion": "1.0",
  "meta": {
    "title": "Multi-Scene Presentation",
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "totalDuration": 1800
  },
  "scenes": [
    {
      "id": "intro",
      "duration": 300,
      "transition": {
        "type": "fade",
        "duration": 30
      },
      "elements": [
        {
          "type": "character",
          "id": "presenter",
          "text": "Chào mừng đến với presentation của chúng tôi!",
          "position": [0, 0, 0],
          "animation": {
            "type": "slideIn",
            "direction": "left",
            "duration": 60
          }
        },
        {
          "type": "background",
          "id": "intro-bg",
          "backgroundType": "gradient",
          "props": {
            "colors": ["#667eea", "#764ba2"],
            "direction": "diagonal"
          }
        }
      ]
    },
    {
      "id": "main-content",
      "duration": 900,
      "transition": {
        "type": "slide",
        "direction": "up",
        "duration": 45
      },
      "elements": [
        {
          "type": "character",
          "id": "presenter",
          "text": "Bây giờ chúng ta sẽ đi vào nội dung chính. Đây là những điểm quan trọng cần lưu ý.",
          "position": [-200, 0, 0],
          "scale": 0.8
        },
        {
          "type": "label",
          "id": "bullet-1",
          "text": "• Điểm quan trọng số 1",
          "position": [300, 100, 0],
          "fontSize": 32,
          "animation": {
            "type": "typewriter",
            "delay": 120,
            "speed": 0.1
          }
        },
        {
          "type": "label",
          "id": "bullet-2",
          "text": "• Điểm quan trọng số 2",
          "position": [300, 50, 0],
          "fontSize": 32,
          "animation": {
            "type": "typewriter",
            "delay": 240,
            "speed": 0.1
          }
        },
        {
          "type": "background",
          "id": "content-bg",
          "backgroundType": "office",
          "props": {
            "lighting": "professional",
            "camera": "wide"
          }
        }
      ]
    },
    {
      "id": "conclusion",
      "duration": 600,
      "transition": {
        "type": "crossfade",
        "duration": 60
      },
      "elements": [
        {
          "type": "character",
          "id": "presenter",
          "text": "Cảm ơn bạn đã theo dõi presentation. Hẹn gặp lại trong video tiếp theo!",
          "position": [0, 0, 0],
          "animation": {
            "type": "zoomIn",
            "duration": 90
          }
        },
        {
          "type": "label",
          "id": "thank-you",
          "text": "THANK YOU",
          "position": [0, -200, 0],
          "fontSize": 72,
          "color": "#ffffff",
          "animation": {
            "type": "bounce",
            "delay": 180
          }
        }
      ]
    }
  ]
}
```

### Advanced Animations

#### Custom Keyframe Animations
```json
{
  "type": "character",
  "id": "animated-avatar",
  "text": "Xem tôi di chuyển!",
  "animation": {
    "type": "custom",
    "keyframes": [
      {
        "frame": 0,
        "position": [-500, 0, 0],
        "scale": 0.5,
        "rotation": [0, 0, 0],
        "opacity": 0
      },
      {
        "frame": 60,
        "position": [0, 0, 0],
        "scale": 1,
        "rotation": [0, 360, 0],
        "opacity": 1,
        "easing": "easeOutBounce"
      },
      {
        "frame": 240,
        "position": [500, 0, 0],
        "scale": 0.8,
        "rotation": [0, 720, 0],
        "opacity": 0.8,
        "easing": "easeInOutCubic"
      }
    ]
  }
}
```

#### Particle Effects
```json
{
  "type": "effect",
  "id": "magic-particles",
  "effectType": "particles",
  "props": {
    "count": 200,
    "emissionRate": 50,
    "lifetime": 3,
    "startColor": "#ff6b35",
    "endColor": "#f7931e",
    "startSize": 2,
    "endSize": 0,
    "velocity": {
      "x": { "min": -50, "max": 50 },
      "y": { "min": 100, "max": 200 },
      "z": { "min": -20, "max": 20 }
    },
    "gravity": [0, -98, 0],
    "emitterPosition": [0, -300, 0],
    "emitterShape": "circle",
    "emitterRadius": 100
  }
}
```

## 🎭 Avatar Customization Nâng cao

### Multiple Avatars
```json
{
  "scenes": [
    {
      "id": "conversation",
      "duration": 600,
      "elements": [
        {
          "type": "character",
          "id": "avatar-1",
          "text": "Xin chào, tôi là Alice!",
          "modelPath": "/models/female-avatar.glb",
          "position": [-300, 0, 0],
          "voice": {
            "voice": "nova",
            "speed": 1.0
          },
          "timing": {
            "start": 0,
            "end": 180
          }
        },
        {
          "type": "character",
          "id": "avatar-2",
          "text": "Chào Alice! Tôi là Bob.",
          "modelPath": "/models/male-avatar.glb",
          "position": [300, 0, 0],
          "voice": {
            "voice": "onyx",
            "speed": 0.9
          },
          "timing": {
            "start": 200,
            "end": 380
          }
        },
        {
          "type": "character",
          "id": "avatar-1",
          "text": "Rất vui được gặp bạn!",
          "timing": {
            "start": 400,
            "end": 580
          }
        }
      ]
    }
  ]
}
```

### Custom Avatar Materials
```json
{
  "type": "character",
  "id": "custom-avatar",
  "modelPath": "/models/base-avatar.glb",
  "materials": {
    "skin": {
      "type": "PBR",
      "baseColor": "#fdbcb4",
      "roughness": 0.8,
      "metallic": 0.0,
      "normalMap": "/textures/skin-normal.jpg",
      "subsurface": 0.3
    },
    "hair": {
      "type": "Hair",
      "baseColor": "#8b4513",
      "roughness": 0.9,
      "anisotropy": 0.8,
      "sheen": 0.2
    },
    "eyes": {
      "type": "Eye",
      "irisColor": "#4a90e2",
      "pupilSize": 0.3,
      "reflection": 0.9
    },
    "clothing": {
      "type": "Fabric",
      "baseColor": "#2c3e50",
      "roughness": 0.7,
      "normalMap": "/textures/fabric-normal.jpg"
    }
  }
}
```

### Facial Expressions
```json
{
  "type": "character",
  "id": "expressive-avatar",
  "text": "Tôi có thể thể hiện nhiều cảm xúc khác nhau!",
  "expressions": [
    {
      "frame": 0,
      "expression": "neutral",
      "intensity": 1.0
    },
    {
      "frame": 60,
      "expression": "happy",
      "intensity": 0.8,
      "transition": "smooth"
    },
    {
      "frame": 120,
      "expression": "surprised",
      "intensity": 0.9,
      "transition": "quick"
    },
    {
      "frame": 180,
      "expression": "thoughtful",
      "intensity": 0.7,
      "transition": "smooth"
    }
  ],
  "blinking": {
    "enabled": true,
    "frequency": 3,
    "duration": 0.15,
    "randomness": 0.3
  }
}
```

## 🎨 Advanced Visual Effects

### Dynamic Lighting
```json
{
  "type": "lighting",
  "id": "dynamic-lights",
  "lights": [
    {
      "type": "directional",
      "id": "sun",
      "color": "#ffffff",
      "intensity": 1.0,
      "position": [100, 200, 100],
      "target": [0, 0, 0],
      "shadows": true,
      "animation": {
        "type": "orbit",
        "radius": 300,
        "speed": 0.5,
        "axis": "y"
      }
    },
    {
      "type": "point",
      "id": "accent",
      "color": "#ff6b35",
      "intensity": 0.5,
      "position": [-200, 100, 50],
      "distance": 500,
      "decay": 2,
      "animation": {
        "type": "pulse",
        "frequency": 2,
        "amplitude": 0.3
      }
    },
    {
      "type": "spot",
      "id": "spotlight",
      "color": "#4a90e2",
      "intensity": 0.8,
      "position": [0, 300, 200],
      "target": [0, 0, 0],
      "angle": 30,
      "penumbra": 0.2,
      "shadows": true
    }
  ],
  "environment": {
    "type": "HDRI",
    "map": "/hdri/studio.hdr",
    "intensity": 0.3,
    "rotation": 0
  }
}
```

### Post-Processing Effects
```json
{
  "type": "postProcessing",
  "id": "cinematic-effects",
  "effects": [
    {
      "type": "bloom",
      "intensity": 0.5,
      "threshold": 0.8,
      "radius": 0.4
    },
    {
      "type": "colorGrading",
      "exposure": 0.2,
      "contrast": 0.1,
      "saturation": 0.15,
      "temperature": 100,
      "tint": -10,
      "shadows": { "r": 0.9, "g": 0.95, "b": 1.0 },
      "midtones": { "r": 1.0, "g": 1.0, "b": 1.0 },
      "highlights": { "r": 1.05, "g": 1.0, "b": 0.95 }
    },
    {
      "type": "vignette",
      "intensity": 0.3,
      "smoothness": 0.5,
      "color": "#000000"
    },
    {
      "type": "filmGrain",
      "intensity": 0.1,
      "size": 1.0
    },
    {
      "type": "chromaticAberration",
      "intensity": 0.02
    }
  ]
}
```

### Camera Movements
```json
{
  "type": "camera",
  "id": "cinematic-camera",
  "animation": {
    "type": "path",
    "keyframes": [
      {
        "frame": 0,
        "position": [0, 100, 500],
        "target": [0, 0, 0],
        "fov": 50
      },
      {
        "frame": 180,
        "position": [300, 150, 400],
        "target": [0, 50, 0],
        "fov": 45,
        "easing": "easeInOutCubic"
      },
      {
        "frame": 360,
        "position": [-200, 200, 600],
        "target": [0, 0, 0],
        "fov": 55,
        "easing": "easeOutQuart"
      }
    ]
  },
  "effects": {
    "depthOfField": {
      "enabled": true,
      "focusDistance": 500,
      "aperture": 0.025,
      "maxBlur": 0.01
    },
    "motionBlur": {
      "enabled": true,
      "samples": 16,
      "intensity": 0.5
    }
  }
}
```

## 🎵 Advanced Audio Features

### Multi-Language Support
```json
{
  "type": "character",
  "id": "multilingual-avatar",
  "speeches": [
    {
      "language": "vi-VN",
      "text": "Xin chào! Tôi có thể nói nhiều ngôn ngữ.",
      "audioFile": "/audio/vietnamese-greeting.mp3",
      "timing": { "start": 0, "end": 180 }
    },
    {
      "language": "en-US",
      "text": "Hello! I can speak multiple languages.",
      "audioFile": "/audio/english-greeting.mp3",
      "timing": { "start": 200, "end": 350 }
    },
    {
      "language": "ja-JP",
      "text": "こんにちは！私は多言語を話すことができます。",
      "audioFile": "/audio/japanese-greeting.mp3",
      "timing": { "start": 370, "end": 550 }
    }
  ]
}
```

### Background Music & Sound Effects
```json
{
  "audio": {
    "backgroundMusic": {
      "src": "/audio/background-music.mp3",
      "volume": 0.3,
      "loop": true,
      "fadeIn": 2.0,
      "fadeOut": 3.0
    },
    "soundEffects": [
      {
        "id": "notification",
        "src": "/audio/notification.wav",
        "volume": 0.7,
        "timing": { "frame": 120 }
      },
      {
        "id": "applause",
        "src": "/audio/applause.mp3",
        "volume": 0.5,
        "timing": { "frame": 540 },
        "duration": 180
      }
    ],
    "ambientSounds": {
      "type": "office",
      "volume": 0.1,
      "sounds": ["keyboard", "coffee", "conversation"]
    }
  }
}
```

### Audio Effects
```json
{
  "type": "character",
  "id": "enhanced-audio",
  "text": "Âm thanh của tôi có thể thay đổi!",
  "audio": {
    "source": "/audio/character-speech.mp3",
    "effects": [
      {
        "type": "reverb",
        "roomSize": 0.5,
        "damping": 0.3,
        "wetLevel": 0.2
      },
      {
        "type": "chorus",
        "rate": 1.5,
        "depth": 0.3,
        "feedback": 0.2
      },
      {
        "type": "pitchShift",
        "keyframes": [
          { "frame": 0, "value": 1.0 },
          { "frame": 60, "value": 1.2 },
          { "frame": 120, "value": 0.8 },
          { "frame": 180, "value": 1.0 }
        ]
      }
    ]
  }
}
```

## 🔧 Performance Optimization

### Level of Detail (LOD)
```json
{
  "type": "character",
  "id": "optimized-avatar",
  "modelPath": "/models/avatar.glb",
  "lod": {
    "enabled": true,
    "levels": [
      {
        "distance": 0,
        "model": "/models/avatar-high.glb",
        "polygons": 50000
      },
      {
        "distance": 500,
        "model": "/models/avatar-medium.glb",
        "polygons": 20000
      },
      {
        "distance": 1000,
        "model": "/models/avatar-low.glb",
        "polygons": 5000
      }
    ]
  }
}
```

### Texture Streaming
```json
{
  "rendering": {
    "textureStreaming": {
      "enabled": true,
      "maxTextureSize": 2048,
      "compressionFormat": "DXT5",
      "mipmaps": true,
      "anisotropicFiltering": 16
    },
    "geometryOptimization": {
      "enabled": true,
      "decimationRatio": 0.8,
      "normalOptimization": true,
      "uvOptimization": true
    }
  }
}
```

### Render Optimization
```json
{
  "renderSettings": {
    "quality": "adaptive",
    "adaptiveQuality": {
      "targetFPS": 30,
      "minQuality": 5,
      "maxQuality": 10,
      "adjustmentSpeed": 0.1
    },
    "culling": {
      "frustumCulling": true,
      "occlusionCulling": true,
      "distanceCulling": {
        "enabled": true,
        "maxDistance": 2000
      }
    },
    "shadows": {
      "enabled": true,
      "quality": "medium",
      "cascades": 3,
      "distance": 1000
    }
  }
}
```

## 🔄 Batch Processing

### Multiple Video Generation
```javascript
// batch-render.js
const { renderVideo } = require('./src/render/batch-renderer');
const fs = require('fs').promises;

async function batchRender() {
  const scripts = [
    './scripts/video1.json',
    './scripts/video2.json',
    './scripts/video3.json'
  ];

  const jobs = scripts.map((scriptPath, index) => ({
    id: `batch-job-${index + 1}`,
    composition: 'DynamicVideo',
    props: {
      script: require(scriptPath)
    },
    outputPath: `./output/batch-video-${index + 1}.mp4`,
    parameters: {
      width: 1920,
      height: 1080,
      fps: 30,
      quality: 8
    }
  }));

  const results = [];
  
  for (const job of jobs) {
    console.log(`Rendering ${job.id}...`);
    
    const result = await renderVideo({
      composition: job.composition,
      props: job.props,
      outputPath: job.outputPath,
      ...job.parameters
    });
    
    results.push(result);
  }

  console.log('Batch render completed:', results);
}

batchRender().catch(console.error);
```

### Template-based Generation
```javascript
// template-generator.js
const templateData = [
  {
    name: 'Alice',
    title: 'Product Manager',
    message: 'Chào mừng đến với sản phẩm mới của chúng tôi!',
    avatar: '/models/female-avatar.glb',
    background: 'office'
  },
  {
    name: 'Bob',
    title: 'Developer',
    message: 'Hãy cùng khám phá các tính năng kỹ thuật!',
    avatar: '/models/male-avatar.glb',
    background: 'tech'
  }
];

const template = {
  schemaVersion: '1.0',
  meta: {
    fps: 30,
    width: 1920,
    height: 1080
  },
  scenes: [{
    id: 'main',
    duration: 300,
    elements: [
      {
        type: 'character',
        id: 'speaker',
        text: '{{message}}',
        modelPath: '{{avatar}}',
        position: [0, 0, 0]
      },
      {
        type: 'label',
        id: 'name-title',
        text: '{{name}} - {{title}}',
        position: [0, -200, 0],
        fontSize: 36
      },
      {
        type: 'background',
        id: 'bg',
        backgroundType: '{{background}}'
      }
    ]
  }]
};

function generateFromTemplate(template, data) {
  let scriptStr = JSON.stringify(template);
  
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    scriptStr = scriptStr.replace(placeholder, value);
  });
  
  return JSON.parse(scriptStr);
}

// Generate videos for each person
templateData.forEach((person, index) => {
  const script = generateFromTemplate(template, person);
  fs.writeFileSync(`./output/script-${person.name.toLowerCase()}.json`, 
    JSON.stringify(script, null, 2));
});
```

## 🌐 Integration với External APIs

### Weather-based Content
```javascript
// weather-video.js
const axios = require('axios');

async function createWeatherVideo(city) {
  // Lấy dữ liệu thời tiết
  const weather = await axios.get(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${process.env.WEATHER_API_KEY}&units=metric&lang=vi`
  );

  const temp = Math.round(weather.data.main.temp);
  const description = weather.data.weather[0].description;
  const humidity = weather.data.main.humidity;

  const script = {
    schemaVersion: '1.0',
    meta: {
      title: `Thời tiết ${city}`,
      fps: 30,
      width: 1920,
      height: 1080
    },
    scenes: [{
      id: 'weather-report',
      duration: 360,
      elements: [
        {
          type: 'character',
          id: 'weather-reporter',
          text: `Xin chào! Hôm nay tại ${city}, thời tiết ${description} với nhiệt độ ${temp} độ C và độ ẩm ${humidity}%.`,
          modelPath: '/models/reporter-avatar.glb',
          voice: { voice: 'alloy', speed: 1.0 }
        },
        {
          type: 'background',
          id: 'weather-bg',
          backgroundType: getWeatherBackground(weather.data.weather[0].main)
        },
        {
          type: 'label',
          id: 'temperature',
          text: `${temp}°C`,
          position: [300, 100, 0],
          fontSize: 72,
          color: getTemperatureColor(temp)
        }
      ]
    }]
  };

  return script;
}

function getWeatherBackground(condition) {
  const backgrounds = {
    'Clear': 'sunny',
    'Clouds': 'cloudy',
    'Rain': 'rainy',
    'Snow': 'snowy',
    'Thunderstorm': 'stormy'
  };
  return backgrounds[condition] || 'neutral';
}

function getTemperatureColor(temp) {
  if (temp < 10) return '#4a90e2'; // Blue for cold
  if (temp < 25) return '#50c878'; // Green for mild
  return '#ff6b35'; // Orange for hot
}
```

### News Feed Integration
```javascript
// news-video.js
const RSS = require('rss-parser');
const parser = new RSS();

async function createNewsVideo() {
  const feed = await parser.parseURL('https://vnexpress.net/rss/tin-moi-nhat.rss');
  const topStories = feed.items.slice(0, 3);

  const scenes = topStories.map((story, index) => ({
    id: `news-${index + 1}`,
    duration: 300,
    transition: { type: 'slide', direction: 'left', duration: 30 },
    elements: [
      {
        type: 'character',
        id: 'news-anchor',
        text: `Tin số ${index + 1}: ${story.title}`,
        modelPath: '/models/news-anchor.glb',
        voice: { voice: 'nova', speed: 1.1 }
      },
      {
        type: 'label',
        id: 'headline',
        text: story.title,
        position: [0, -150, 0],
        fontSize: 32,
        maxWidth: 800,
        textAlign: 'center'
      },
      {
        type: 'background',
        id: 'newsroom',
        backgroundType: 'newsroom'
      }
    ]
  }));

  return {
    schemaVersion: '1.0',
    meta: {
      title: 'Bản tin thời sự',
      fps: 30,
      width: 1920,
      height: 1080
    },
    scenes
  };
}
```

## 📊 Analytics & Monitoring

### Performance Tracking
```javascript
// analytics.js
class VideoAnalytics {
  constructor() {
    this.metrics = {
      renderTimes: [],
      memoryUsage: [],
      errorCounts: {},
      qualityScores: []
    };
  }

  trackRender(startTime, endTime, outputPath) {
    const renderTime = endTime - startTime;
    this.metrics.renderTimes.push({
      timestamp: Date.now(),
      duration: renderTime,
      outputPath
    });

    // Analyze video quality
    this.analyzeVideoQuality(outputPath);
  }

  trackMemoryUsage() {
    const usage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      timestamp: Date.now(),
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external
    });
  }

  trackError(error, context) {
    const errorKey = error.constructor.name;
    if (!this.metrics.errorCounts[errorKey]) {
      this.metrics.errorCounts[errorKey] = 0;
    }
    this.metrics.errorCounts[errorKey]++;

    console.error(`Error in ${context}:`, error);
  }

  async analyzeVideoQuality(videoPath) {
    // Sử dụng FFprobe để phân tích chất lượng video
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);

    try {
      const { stdout } = await execAsync(
        `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`
      );
      
      const data = JSON.parse(stdout);
      const videoStream = data.streams.find(s => s.codec_type === 'video');
      
      if (videoStream) {
        this.metrics.qualityScores.push({
          timestamp: Date.now(),
          bitrate: parseInt(videoStream.bit_rate),
          fps: eval(videoStream.r_frame_rate),
          resolution: `${videoStream.width}x${videoStream.height}`,
          codec: videoStream.codec_name
        });
      }
    } catch (error) {
      this.trackError(error, 'video quality analysis');
    }
  }

  generateReport() {
    const avgRenderTime = this.metrics.renderTimes.reduce((sum, r) => sum + r.duration, 0) / this.metrics.renderTimes.length;
    const peakMemory = Math.max(...this.metrics.memoryUsage.map(m => m.heapUsed));
    
    return {
      summary: {
        totalRenders: this.metrics.renderTimes.length,
        averageRenderTime: avgRenderTime,
        peakMemoryUsage: peakMemory,
        errorRate: Object.values(this.metrics.errorCounts).reduce((a, b) => a + b, 0) / this.metrics.renderTimes.length
      },
      details: this.metrics
    };
  }
}

// Usage
const analytics = new VideoAnalytics();

// Track render performance
setInterval(() => analytics.trackMemoryUsage(), 5000);

module.exports = analytics;
```

---

**Tiếp theo**: [Troubleshooting](../05-troubleshooting/common-issues.md)