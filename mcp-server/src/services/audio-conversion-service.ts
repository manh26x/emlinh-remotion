import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export interface AudioConversionOptions {
  inputPath: string;
  outputPath: string;
  quality?: number; // 0-10 scale, default 5
}

export interface ConversionResult {
  success: boolean;
  outputPath?: string;
  error?: string;
  duration?: number;
}

export class AudioConversionService {
  private static instance: AudioConversionService;

  public static getInstance(): AudioConversionService {
    if (!AudioConversionService.instance) {
      AudioConversionService.instance = new AudioConversionService();
    }
    return AudioConversionService.instance;
  }

  /**
   * Convert WAV audio file to OGG format using ffmpeg
   */
  async convertWavToOgg(options: AudioConversionOptions): Promise<ConversionResult> {
    const { inputPath, outputPath, quality = 5 } = options;

    try {
      // Validate input file exists
      await this.validateInputFile(inputPath);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Get input duration for validation
      const inputDuration = await this.getAudioDuration(inputPath);

      // Convert WAV to OGG
      await this.executeFFmpegConversion(inputPath, outputPath, quality);

      // Validate output file
      await this.validateOutputFile(outputPath, inputDuration);

      return {
        success: true,
        outputPath,
        duration: inputDuration
      };

    } catch (error) {
      // Cleanup partial files on failure
      await this.cleanupFile(outputPath);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown conversion error'
      };
    }
  }

  /**
   * Validate input WAV file exists and is readable
   */
  private async validateInputFile(inputPath: string): Promise<void> {
    try {
      const stats = await fs.stat(inputPath);
      if (!stats.isFile()) {
        throw new Error(`Input path is not a file: ${inputPath}`);
      }
      
      if (!inputPath.toLowerCase().endsWith('.wav')) {
        throw new Error(`Input file must be WAV format: ${inputPath}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new Error(`Input WAV file not found: ${inputPath}`);
      }
      throw error;
    }
  }

  /**
   * Get FFmpeg binary path with fallback options
   */
  private getFFmpegPath(): string {
    // Try to use system ffmpeg first
    // This avoids the dynamic require issue with ffmpeg-static
    return 'ffmpeg';
  }

  /**
   * Get audio duration using ffprobe
   */
  private async getAudioDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffmpegPath = this.getFFmpegPath();
      const ffprobePath = ffmpegPath.replace('ffmpeg', 'ffprobe');
      const args = [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        filePath
      ];

      const process = spawn(ffprobePath, args);
      let output = '';
      let errorOutput = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`ffprobe failed: ${errorOutput}`));
          return;
        }

        try {
          const result = JSON.parse(output);
          const duration = parseFloat(result.format.duration);
          resolve(duration);
        } catch (error) {
          reject(new Error('Failed to parse ffprobe output'));
        }
      });

      process.on('error', (error) => {
        reject(new Error(`ffprobe spawn error: ${error.message}`));
      });
    });
  }

  /**
   * Execute FFmpeg conversion process
   */
  private async executeFFmpegConversion(
    inputPath: string,
    outputPath: string,
    quality: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {

      // Ensure quality is within valid range
      const validQuality = Math.max(0, Math.min(10, quality));

      const args = [
        '-i', inputPath,
        '-c:a', 'libvorbis',
        '-q:a', validQuality.toString(),
        '-y', // Overwrite output file
        outputPath
      ];

      const process = spawn(this.getFFmpegPath(), args);
      let errorOutput = '';

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`FFmpeg conversion failed: ${errorOutput}`));
          return;
        }
        resolve();
      });

      process.on('error', (error) => {
        reject(new Error(`FFmpeg spawn error: ${error.message}`));
      });

      // Set timeout for conversion (5 minutes max)
      setTimeout(() => {
        process.kill();
        reject(new Error('FFmpeg conversion timeout'));
      }, 300000);
    });
  }

  /**
   * Validate output file was created successfully
   */
  private async validateOutputFile(outputPath: string, expectedDuration: number): Promise<void> {
    try {
      const stats = await fs.stat(outputPath);
      if (!stats.isFile()) {
        throw new Error(`Output file was not created: ${outputPath}`);
      }

      if (stats.size === 0) {
        throw new Error(`Output file is empty: ${outputPath}`);
      }

      // Verify duration matches (±100ms tolerance)
      const outputDuration = await this.getAudioDuration(outputPath);
      const durationDiff = Math.abs(outputDuration - expectedDuration);
      
      if (durationDiff > 0.1) {
        throw new Error(
          `Duration mismatch: expected ${expectedDuration}s, got ${outputDuration}s`
        );
      }

    } catch (error) {
      throw new Error(`Output validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean up file if it exists
   */
  private async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Convert audio with fallback quality settings
   */
  async convertWithFallback(options: AudioConversionOptions): Promise<ConversionResult> {
    const qualities = [options.quality || 5, 3, 1]; // Try requested quality, then fallbacks
    
    for (const quality of qualities) {
      const result = await this.convertWavToOgg({ ...options, quality });
      if (result.success) {
        return result;
      }
    }

    return {
      success: false,
      error: 'All conversion attempts failed with different quality settings'
    };
  }
}

export default AudioConversionService;
