import { Tool } from '../models/types';

export function initializeTools(): Tool[] {
  return [
    {
      name: 'validate_project',
      description: 'Validate Remotion project structure and configuration',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'list_compositions',
      description: 'List available Remotion compositions in the project',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'render_video',
      description: 'Render a video composition with specified parameters',
      inputSchema: {
        type: 'object',
        properties: {
          composition: {
            type: 'string',
            description: 'Name of the composition to render',
          },
          audioPath: {
            type: 'string',
            description: 'Path to audio file to include in the video',
          },
          parameters: {
            type: 'object',
            description: 'Render parameters (width, height, fps, quality, concurrency, etc.)',
            properties: {
              width: { type: 'number', description: 'Video width in pixels' },
              height: { type: 'number', description: 'Video height in pixels' },
              fps: { type: 'number', description: 'Frames per second' },
              durationInFrames: { type: 'number', description: 'Duration in frames' },
              quality: { type: 'number', description: 'Video quality (1-10)' },
              concurrency: { type: 'number', description: 'Number of parallel render processes' },
              scale: { type: 'number', description: 'Scale factor (0.5, 1, 2, etc.)' }
            }
          },
        },
        required: ['composition'],
      },
    },
    {
      name: 'get_render_status',
      description: 'Get the status of a render job',
      inputSchema: {
        type: 'object',
        properties: {
          jobId: {
            type: 'string',
            description: 'ID of the render job',
          },
        },
        required: ['jobId'],
      },
    },
    {
      name: 'list_render_jobs',
      description: 'List all render jobs with their current status',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of jobs to return (default: all)',
          },
        },
        required: [],
      },
    },
    {
      name: 'get_render_output',
      description: 'Get completed render output file metadata for a job (file-based workflow)',
      inputSchema: {
        type: 'object',
        properties: {
          jobId: {
            type: 'string',
            description: 'ID of the completed render job',
          },
        },
        required: ['jobId'],
      },
    },
    {
      name: 'list_render_outputs',
      description: 'List recent render output files (file-based workflow)',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of outputs to return',
          },
        },
        required: [],
      },
    },
    {
      name: 'delete_render_output',
      description: 'Delete a render output file by jobId or path',
      inputSchema: {
        type: 'object',
        properties: {
          jobId: { type: 'string', description: 'Render job ID' },
          path: { type: 'string', description: 'Absolute file path' },
        },
        required: [],
      },
    },
    {
      name: 'cleanup_render_outputs',
      description: 'Cleanup old render outputs older than N hours',
      inputSchema: {
        type: 'object',
        properties: {
          olderThanHours: { type: 'number', description: 'Threshold in hours (default 24)' },
        },
        required: [],
      },
    },
    {
      name: 'openVideo',
      description: 'Open a video file using the system default player',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Absolute or relative path to video file' },
        },
        required: ['filePath'],
      },
    },
    {
      name: 'create_video_stream',
      description: 'Create a video stream from a completed render job',
      inputSchema: {
        type: 'object',
        properties: {
          jobId: {
            type: 'string',
            description: 'ID of the completed render job',
          },
        },
        required: ['jobId'],
      },
    },
    {
      name: 'get_video_stream_info',
      description: 'Get information about a video stream',
      inputSchema: {
        type: 'object',
        properties: {
          streamId: {
            type: 'string',
            description: 'ID of the video stream',
          },
        },
        required: ['streamId'],
      },
    },
    {
      name: 'stream_video_chunk',
      description: 'Stream a chunk of video data',
      inputSchema: {
        type: 'object',
        properties: {
          streamId: {
            type: 'string',
            description: 'ID of the video stream',
          },
          offset: {
            type: 'number',
            description: 'Byte offset to start streaming from (default: 0)',
          },
        },
        required: ['streamId'],
      },
    },
    {
      name: 'list_video_streams',
      description: 'List all active video streams',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
    {
      name: 'cancel_video_stream',
      description: 'Cancel an active video stream',
      inputSchema: {
        type: 'object',
        properties: {
          streamId: {
            type: 'string',
            description: 'ID of the video stream to cancel',
          },
        },
        required: ['streamId'],
      },
    },
    {
      name: 'cancel_render',
      description: 'Cancel an ongoing render job',
      inputSchema: {
        type: 'object',
        properties: {
          jobId: {
            type: 'string',
            description: 'ID of the render job to cancel',
          },
        },
        required: ['jobId'],
      },
    },
    // TTS Integration Tools
    {
      name: 'generate_tts_audio',
      description: 'Generate TTS audio from text using OpenAI TTS API',
      inputSchema: {
        type: 'object',
        properties: {
          text: {
            type: 'string',
            description: 'Text to convert to speech (max 4096 characters)',
            minLength: 1,
            maxLength: 4096,
          },
          voice: {
            type: 'string',
            description: 'Voice to use for TTS',
            enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
          },
          model: {
            type: 'string',
            description: 'TTS model to use',
            enum: ['tts-1', 'tts-1-hd'],
          },
          speed: {
            type: 'number',
            description: 'Speech speed (0.25 to 4.0)',
            minimum: 0.25,
            maximum: 4.0,
          },
          format: {
            type: 'string',
            description: 'Audio format',
            enum: ['mp3', 'opus', 'aac', 'flac'],
          },
        },
        required: ['text'],
      },
    },
    {
      name: 'generate_script',
      description: 'Generate script content from topic',
      inputSchema: {
        type: 'object',
        properties: {
          topic: {
            type: 'string',
            description: 'Topic to generate script for',
            minLength: 1,
          },
          template: {
            type: 'string',
            description: 'Script template to use',
          },
          maxWords: {
            type: 'number',
            description: 'Maximum words in script (50-2000)',
            minimum: 50,
            maximum: 2000,
          },
          tone: {
            type: 'string',
            description: 'Tone of the script',
            enum: ['professional', 'casual', 'educational', 'entertaining'],
          },
          language: {
            type: 'string',
            description: 'Language for the script',
            enum: ['vi', 'en'],
          },
        },
        required: ['topic'],
      },
    },
    {
      name: 'render_video_with_tts',
      description: 'Render video with auto-generated TTS audio',
      inputSchema: {
        type: 'object',
        properties: {
          composition: {
            type: 'string',
            description: 'Name of the composition to render',
          },
          topic: {
            type: 'string',
            description: 'Topic to generate script for (if script not provided)',
          },
          script: {
            type: 'string',
            description: 'Script text to use (if topic not provided)',
          },
          voice: {
            type: 'string',
            description: 'Voice to use for TTS',
            enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
          },
          ttsModel: {
            type: 'string',
            description: 'TTS model to use',
            enum: ['tts-1', 'tts-1-hd'],
          },
          parameters: {
            type: 'object',
            description: 'Render parameters',
            properties: {
              width: { type: 'number', description: 'Video width in pixels' },
              height: { type: 'number', description: 'Video height in pixels' },
              fps: { type: 'number', description: 'Frames per second' },
              quality: { type: 'number', description: 'Video quality (1-10)' },
              concurrency: { type: 'number', description: 'Number of parallel render processes' },
              scale: { type: 'number', description: 'Scale factor (0.5, 1, 2, etc.)' },
            },
          },
        },
        required: ['composition'],
      },
    },
    {
      name: 'list_audio_files',
      description: 'List recent audio files with filtering options',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of files to return',
          },
          filter: {
            type: 'object',
            description: 'Filter options',
            properties: {
              voice: {
                type: 'string',
                description: 'Filter by voice',
                enum: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
              },
              model: {
                type: 'string',
                description: 'Filter by TTS model',
                enum: ['tts-1', 'tts-1-hd'],
              },
              createdAfter: {
                type: 'string',
                description: 'Filter files created after this date (ISO string)',
              },
              createdBefore: {
                type: 'string',
                description: 'Filter files created before this date (ISO string)',
              },
              scriptId: {
                type: 'string',
                description: 'Filter by script ID',
              },
            },
          },
        },
        required: [],
      },
    },
    {
      name: 'delete_audio_file',
      description: 'Delete an audio file by ID',
      inputSchema: {
        type: 'object',
        properties: {
          audioId: {
            type: 'string',
            description: 'ID of the audio file to delete',
          },
        },
        required: ['audioId'],
      },
    },
    {
      name: 'cleanup_audio_files',
      description: 'Cleanup old audio files based on retention policy',
      inputSchema: {
        type: 'object',
        properties: {
          olderThanHours: {
            type: 'number',
            description: 'Delete files older than this many hours',
          },
          maxFiles: {
            type: 'number',
            description: 'Maximum number of files to keep',
          },
          dryRun: {
            type: 'boolean',
            description: 'Preview cleanup without actually deleting files',
          },
        },
        required: [],
      },
    },
    // Lip-sync Integration Tools
    {
      name: 'convert_audio_format',
      description: 'Convert audio from WAV to OGG format for Rhubarb lip-sync processing',
      inputSchema: {
        type: 'object',
        properties: {
          inputPath: {
            type: 'string',
            description: 'Path to input WAV audio file',
            minLength: 1,
          },
          outputPath: {
            type: 'string',
            description: 'Path for output OGG audio file',
            minLength: 1,
          },
          quality: {
            type: 'number',
            description: 'Audio quality (1-10, default: 5)',
            minimum: 1,
            maximum: 10,
          },
        },
        required: ['inputPath', 'outputPath'],
      },
    },
    {
      name: 'generate_lipsync_data',
      description: 'Generate lip-sync data from OGG audio using Rhubarb CLI',
      inputSchema: {
        type: 'object',
        properties: {
          audioPath: {
            type: 'string',
            description: 'Path to OGG audio file',
            minLength: 1,
          },
          outputPath: {
            type: 'string',
            description: 'Path for output lip-sync JSON file',
            minLength: 1,
          },
          dialogFile: {
            type: 'string',
            description: 'Optional path to dialog text file for improved accuracy',
          },
          timeout: {
            type: 'number',
            description: 'Processing timeout in seconds (10-300, default: 60)',
            minimum: 10,
            maximum: 300,
          },
        },
        required: ['audioPath', 'outputPath'],
      },
    },
    {
      name: 'render_video_with_lipsync',
      description: 'Render video with lip-sync animation from audio file',
      inputSchema: {
        type: 'object',
        properties: {
          audioPath: {
            type: 'string',
            description: 'Path to audio file (WAV/MP3/OGG)',
            minLength: 1,
          },
          compositionId: {
            type: 'string',
            description: 'Composition ID (default: Scene-Landscape)',
          },
          width: {
            type: 'number',
            description: 'Video width in pixels',
          },
          height: {
            type: 'number',
            description: 'Video height in pixels',
          },
          fps: {
            type: 'number',
            description: 'Frames per second',
          },
          durationInFrames: {
            type: 'number',
            description: 'Duration in frames',
          },
          backgroundScene: {
            type: 'string',
            description: 'Background scene to use',
          },
          quality: {
            type: 'number',
            description: 'Audio conversion quality (1-10, default: 5)',
            minimum: 1,
            maximum: 10,
          },
          dialogFile: {
            type: 'string',
            description: 'Optional dialog text file for improved lip-sync accuracy',
          },
          timeout: {
            type: 'number',
            description: 'Lip-sync processing timeout in seconds (10-300, default: 60)',
            minimum: 10,
            maximum: 300,
          },
          lipSyncOffsetSeconds: {
            type: 'number',
            description: 'Lip-sync timing offset in seconds',
          },
          smoothingEnabled: {
            type: 'boolean',
            description: 'Enable lip-sync smoothing (default: true)',
          },
          smoothingWindowFrames: {
            type: 'number',
            description: 'Smoothing window size in frames (1-10, default: 3)',
            minimum: 1,
            maximum: 10,
          },
          renderParams: {
            type: 'object',
            description: 'Additional render parameters',
            properties: {
              scale: { type: 'number', description: 'Scale factor' },
              concurrency: { type: 'number', description: 'Parallel render processes' },
            },
          },
        },
        required: ['audioPath'],
      },
    },
  ];
}
