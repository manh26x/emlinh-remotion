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
  ];
}
