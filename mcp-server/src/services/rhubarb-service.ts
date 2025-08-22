import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

export interface RhubarbOptions {
  audioPath: string;
  outputPath: string;
  dialogFile?: string;
  timeout?: number; // seconds, default 60
}

export interface MouthCue {
  start: number;
  end: number;
  value: string; // A-H,X viseme values
}

export interface RhubarbOutput {
  metadata: {
    soundFile: string;
    duration: number;
  };
  mouthCues: MouthCue[];
}

export interface RhubarbResult {
  success: boolean;
  outputPath?: string;
  data?: RhubarbOutput;
  error?: string;
  processingTime?: number;
}

export class RhubarbService {
  private static instance: RhubarbService;
  private rhubarbExecutable: string;

  private constructor() {
    // Try to find Rhubarb executable in common locations
    this.rhubarbExecutable = this.findRhubarbExecutable();
  }

  public static getInstance(): RhubarbService {
    if (!RhubarbService.instance) {
      RhubarbService.instance = new RhubarbService();
    }
    return RhubarbService.instance;
  }

  /**
   * Generate lip-sync data from OGG audio file using Rhubarb CLI
   */
  async generateLipSyncData(options: RhubarbOptions): Promise<RhubarbResult> {
    const { audioPath, outputPath, dialogFile, timeout = 60 } = options;
    const startTime = Date.now();

    try {
      // Validate input file
      await this.validateInputFile(audioPath);

      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fs.mkdir(outputDir, { recursive: true });

      // Execute Rhubarb CLI
      await this.executeRhubarb(audioPath, outputPath, dialogFile, timeout);

      // Parse and validate output
      const data = await this.parseRhubarbOutput(outputPath);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        outputPath,
        data,
        processingTime
      };

    } catch (error) {
      // Cleanup partial files on failure
      await this.cleanupFile(outputPath);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Rhubarb processing error',
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Find Rhubarb executable in system PATH or common locations
   */
  private findRhubarbExecutable(): string {
    const commonPaths = [
      'rhubarb',
      'rhubarb.exe',
      '/usr/local/bin/rhubarb',
      '/usr/bin/rhubarb',
      'C:\\Program Files\\Rhubarb\\rhubarb.exe',
      'C:\\Program Files (x86)\\Rhubarb\\rhubarb.exe',
      process.env['RHUBARB_PATH'] || ''
    ];

    // Return first available path (will be validated during execution)
    return commonPaths.find(path => path.length > 0) || 'rhubarb';
  }

  /**
   * Validate input OGG file exists and is readable
   */
  private async validateInputFile(audioPath: string): Promise<void> {
    try {
      const stats = await fs.stat(audioPath);
      if (!stats.isFile()) {
        throw new Error(`Input path is not a file: ${audioPath}`);
      }
      
      if (!audioPath.toLowerCase().endsWith('.ogg')) {
        throw new Error(`Input file must be OGG format: ${audioPath}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new Error(`Input OGG file not found: ${audioPath}`);
      }
      throw error;
    }
  }

  /**
   * Execute Rhubarb CLI process
   */
  private async executeRhubarb(
    audioPath: string,
    outputPath: string,
    dialogFile?: string,
    timeout: number = 60
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-f', 'json',
        '-o', outputPath
      ];

      // Add dialog file if provided
      if (dialogFile) {
        args.push('--dialogFile', dialogFile);
      }

      // Add input audio file
      args.push(audioPath);

      const process = spawn(this.rhubarbExecutable, args);
      let errorOutput = '';

      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      process.on('close', (code) => {
        if (code !== 0) {
          if (errorOutput.includes('command not found') || errorOutput.includes('is not recognized')) {
            reject(new Error(`Rhubarb CLI not found. Please install Rhubarb and ensure it's in your PATH, or set RHUBARB_PATH environment variable.`));
          } else {
            reject(new Error(`Rhubarb processing failed (exit code ${code}): ${errorOutput}`));
          }
          return;
        }
        resolve();
      });

      process.on('error', (error) => {
        if (error.message.includes('ENOENT')) {
          reject(new Error(`Rhubarb CLI not found. Please install Rhubarb and ensure it's in your PATH.`));
        } else {
          reject(new Error(`Rhubarb spawn error: ${error.message}`));
        }
      });

      // Set timeout for processing
      const timeoutMs = timeout * 1000;
      setTimeout(() => {
        process.kill();
        reject(new Error(`Rhubarb processing timeout after ${timeout} seconds`));
      }, timeoutMs);
    });
  }

  /**
   * Parse and validate Rhubarb JSON output
   */
  private async parseRhubarbOutput(outputPath: string): Promise<RhubarbOutput> {
    try {
      const jsonContent = await fs.readFile(outputPath, 'utf-8');
      const data = JSON.parse(jsonContent);

      // Validate JSON structure
      if (!data.metadata || !data.mouthCues) {
        throw new Error('Invalid Rhubarb output: missing metadata or mouthCues');
      }

      if (typeof data.metadata.duration !== 'number') {
        throw new Error('Invalid Rhubarb output: metadata.duration must be a number');
      }

      if (!Array.isArray(data.mouthCues)) {
        throw new Error('Invalid Rhubarb output: mouthCues must be an array');
      }

      // Validate mouth cues
      for (let i = 0; i < data.mouthCues.length; i++) {
        const cue = data.mouthCues[i];
        if (typeof cue.start !== 'number' || typeof cue.end !== 'number' || typeof cue.value !== 'string') {
          throw new Error(`Invalid mouth cue at index ${i}: must have numeric start/end and string value`);
        }
        
        if (!this.isValidViseme(cue.value)) {
          throw new Error(`Invalid viseme value at index ${i}: ${cue.value}. Must be A-H or X`);
        }
        
        if (cue.start >= cue.end) {
          throw new Error(`Invalid mouth cue timing at index ${i}: start (${cue.start}) must be less than end (${cue.end})`);
        }
      }

      // Verify mouth cues cover full duration
      const totalDuration = data.metadata.duration;
      const lastCue = data.mouthCues[data.mouthCues.length - 1];
      
      if (data.mouthCues.length > 0 && lastCue && lastCue.end < totalDuration * 0.95) {
        console.warn(`Mouth cues may not cover full audio duration: ${lastCue.end}s < ${totalDuration}s`);
      }

      return data as RhubarbOutput;

    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Failed to parse Rhubarb JSON output: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate viseme value according to Preston Blair standard
   */
  private isValidViseme(value: string): boolean {
    const validVisemes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'X'];
    return validVisemes.includes(value.toUpperCase());
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
   * Check if Rhubarb CLI is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      await new Promise<void>((resolve, reject) => {
        const process = spawn(this.rhubarbExecutable, ['--version']);
        process.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Exit code: ${code}`));
        });
        process.on('error', reject);
        
        setTimeout(() => {
          process.kill();
          reject(new Error('Timeout'));
        }, 5000);
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get Rhubarb CLI version information
   */
  async getVersion(): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(this.rhubarbExecutable, ['--version']);
      let output = '';

      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error('Failed to get Rhubarb version'));
        }
      });

      process.on('error', () => {
        reject(new Error('Rhubarb CLI not available'));
      });
    });
  }
}

export default RhubarbService;
