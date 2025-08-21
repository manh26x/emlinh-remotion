import { spawn, SpawnOptions } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import { ErrorHandler } from '../utils/error-handler';
import { config } from '../utils/config';

export interface Composition {
  id: string;
  name: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaultProps?: Record<string, unknown>;
  schema?: Record<string, unknown>;
}

export interface ProjectValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  compositions: Composition[];
}

export class RemotionService {
  private readonly projectPath: string;
  private readonly remotionPath: string;

  constructor(projectPath?: string) {
    this.projectPath = projectPath || config.getRemotionProjectPath();
    this.remotionPath = path.resolve(this.projectPath, 'src');
  }

  /**
   * Khám phá tất cả compositions trong dự án Remotion
   */
  public async discoverCompositions(): Promise<Composition[]> {
    try {
      logger.info('Discovering Remotion compositions...', { projectPath: this.projectPath });

      // Kiểm tra xem có phải là dự án Remotion không
      await this.validateProjectStructure();

      // Tìm tất cả file .tsx trong thư mục src
      const compositionFiles = await this.findCompositionFiles();
      
      const compositions: Composition[] = [];
      
      for (const file of compositionFiles) {
        const fileCompositions = await this.parseCompositionsFromFile(file);
        compositions.push(...fileCompositions);
      }

      logger.info(`Discovered ${compositions.length} compositions`, { compositions: compositions.map(c => c.id) });
      return compositions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to discover compositions', { error: errorMessage });
      throw ErrorHandler.createProcessingError(
        'discover_compositions',
        'discovery_failed',
        `Failed to discover compositions: ${errorMessage}`
      );
    }
  }

  /**
   * Xác thực cấu trúc dự án Remotion
   */
  public async validateProject(): Promise<ProjectValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Kiểm tra package.json
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      const packageJsonExists = await this.fileExists(packageJsonPath);
      
      if (!packageJsonExists) {
        errors.push('package.json not found');
      } else {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        if (!packageJson.dependencies?.remotion && !packageJson.dependencies?.['@remotion/cli']) {
          errors.push('Remotion dependencies not found in package.json');
        }
      }

      // Kiểm tra thư mục src
      const srcExists = await this.directoryExists(this.remotionPath);
      if (!srcExists) {
        errors.push('src directory not found');
      }

      // Kiểm tra remotion.config.ts
      const configPath = path.join(this.projectPath, 'remotion.config.ts');
      const configExists = await this.fileExists(configPath);
      if (!configExists) {
        warnings.push('remotion.config.ts not found (optional but recommended)');
      }

      // Kiểm tra compositions
      let compositions: Composition[] = [];
      if (srcExists) {
        try {
          compositions = await this.discoverCompositions();
          if (compositions.length === 0) {
            warnings.push('No compositions found in src directory');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to discover compositions: ${errorMessage}`);
        }
      }

      const isValid = errors.length === 0;

      logger.info('Project validation completed', { 
        isValid, 
        errorCount: errors.length, 
        warningCount: warnings.length,
        compositionCount: compositions.length 
      });

      return {
        isValid,
        errors,
        warnings,
        compositions
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Project validation failed', { error: errorMessage });
      errors.push(`Validation process failed: ${errorMessage}`);
      return {
        isValid: false,
        errors,
        warnings,
        compositions: []
      };
    }
  }

  /**
   * Thực thi lệnh Remotion CLI
   */
  public async executeRemotionCommand(
    command: string, 
    args: string[] = [], 
    options: SpawnOptions = {}
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    return new Promise((resolve, reject) => {
      const remotionArgs = [command, ...args];
      
      logger.info('Executing Remotion command', { 
        command: `remotion ${remotionArgs.join(' ')}`,
        cwd: this.projectPath 
      });

      const child = spawn('npx', ['remotion', ...remotionArgs], {
        cwd: this.projectPath,
        stdio: ['pipe', 'pipe', 'pipe'],
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        const exitCode = code || 0;
        
        logger.info('Remotion command completed', { 
          command: `remotion ${remotionArgs.join(' ')}`,
          exitCode,
          stdoutLength: stdout.length,
          stderrLength: stderr.length 
        });

        if (exitCode === 0) {
          resolve({ stdout, stderr, exitCode });
        } else {
          reject(new Error(`Remotion command failed with exit code ${exitCode}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        logger.error('Remotion command spawn error', { error: error.message });
        reject(error);
      });
    });
  }

  /**
   * Lấy thông tin chi tiết về một composition
   */
  public async getCompositionInfo(compositionId: string): Promise<Composition | null> {
    try {
      const compositions = await this.discoverCompositions();
      return compositions.find(c => c.id === compositionId) || null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get composition info', { error: errorMessage });
      return null;
    }
  }

  /**
   * Kiểm tra xem composition có tồn tại không
   */
  public async compositionExists(compositionId: string): Promise<boolean> {
    const composition = await this.getCompositionInfo(compositionId);
    return composition !== null;
  }

  private async validateProjectStructure(): Promise<void> {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    const srcPath = this.remotionPath;

    if (!await this.fileExists(packageJsonPath)) {
      throw new Error('package.json not found in project directory');
    }

    if (!await this.directoryExists(srcPath)) {
      throw new Error('src directory not found in project directory');
    }
  }

  private async findCompositionFiles(): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(this.remotionPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.tsx')) {
          files.push(path.join(this.remotionPath, entry.name));
        } else if (entry.isDirectory()) {
          // Recursively search subdirectories
          const subFiles = await this.findCompositionFilesInDirectory(path.join(this.remotionPath, entry.name));
          files.push(...subFiles);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to read src directory', { error: errorMessage });
      throw error;
    }

    return files;
  }

  private async findCompositionFilesInDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.tsx')) {
          files.push(path.join(dirPath, entry.name));
        } else if (entry.isDirectory()) {
          const subFiles = await this.findCompositionFilesInDirectory(path.join(dirPath, entry.name));
          files.push(...subFiles);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn(`Failed to read directory: ${dirPath}`, { error: errorMessage });
    }

    return files;
  }

  private async parseCompositionsFromFile(filePath: string): Promise<Composition[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const compositions: Composition[] = [];

      // Tìm tất cả Composition components trong file
      const compositionRegex = /<Composition[^>]*id="([^"]*)"[^>]*>/g;
      let match;

      while ((match = compositionRegex.exec(content)) !== null) {
        const compositionId = match[1] || '';
        
        // Parse các thuộc tính khác từ Composition component
        const compositionMatch = content.substring(match.index);
        const endMatch = compositionMatch.match(/\/>/);
        const compositionProps = endMatch && endMatch.index !== undefined
          ? compositionMatch.substring(0, endMatch.index + 2)
          : compositionMatch;

        const composition = this.parseCompositionProps(compositionId, compositionProps);
        if (composition) {
          compositions.push(composition);
        }
      }

      return compositions;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn(`Failed to parse compositions from file: ${filePath}`, { error: errorMessage });
      return [];
    }
  }

  private parseCompositionProps(id: string, propsString: string): Composition | null {
    try {
      // Parse các thuộc tính cơ bản
      const widthMatch = propsString.match(/width=\{([^}]+)\}/);
      const heightMatch = propsString.match(/height=\{([^}]+)\}/);
      const fpsMatch = propsString.match(/fps=\{([^}]+)\}/);
      const durationMatch = propsString.match(/durationInFrames=\{([^}]+)\}/);

      const width = widthMatch && widthMatch[1] ? parseInt(widthMatch[1]) : 1920;
      const height = heightMatch && heightMatch[1] ? parseInt(heightMatch[1]) : 1080;
      const fps = fpsMatch && fpsMatch[1] ? parseInt(fpsMatch[1]) : 30;
      
      // Handle durationInFrames - could be a variable or direct value
      let durationInFrames = 300; // Default
      if (durationMatch && durationMatch[1]) {
        const durationValue = durationMatch[1].trim();
        // If it's a number, parse it directly
        if (/^\d+$/.test(durationValue)) {
          durationInFrames = parseInt(durationValue);
        } else {
          // If it's a variable, try to estimate based on typical values
          // For now, use a reasonable default based on fps
          durationInFrames = fps * 10; // 10 seconds default
        }
      }

      return {
        id,
        name: id,
        durationInFrames,
        fps,
        width,
        height
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn(`Failed to parse composition props for ${id}`, { error: errorMessage });
      return null;
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }
}
