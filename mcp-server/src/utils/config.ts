import dotenv from 'dotenv';
import path from 'path';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

export interface Config {
  remotion: {
    projectPath: string;
    outputDir: string;
    cacheDir: string;
  };
  server: {
    port: number;
    logLevel: string;
  };
  development: {
    nodeEnv: string;
  };
}

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;

  private constructor() {
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private resolvePath(baseDir: string, value: string): string {
    return path.isAbsolute(value) ? value : path.resolve(baseDir, value);
  }

  private loadConfig(): Config {
    // Determine project root based on compiled file location: dist -> mcp-server -> repo root
    const distFilePath = fileURLToPath(import.meta.url);
    const distDir = path.dirname(distFilePath);
    const projectRoot = path.resolve(distDir, '../../');

    // Resolve project path (env may be relative)
    const envProjectPath = process.env.REMOTION_PROJECT_PATH;
    const defaultProjectPath = path.join(projectRoot, 'src');
    const candidateProjectPath = this.resolvePath(projectRoot, envProjectPath || defaultProjectPath);
    const projectPath = fsSync.existsSync(candidateProjectPath) ? candidateProjectPath : defaultProjectPath;

    // Resolve output and cache dirs
    const envOutputDir = process.env.REMOTION_OUTPUT_DIR || path.join(projectRoot, 'mcp-server/output');
    const envCacheDir = process.env.REMOTION_CACHE_DIR || path.join(projectRoot, 'mcp-server/cache');

    const outputDir = this.resolvePath(projectRoot, envOutputDir);
    const cacheDir = this.resolvePath(projectRoot, envCacheDir);

    return {
      remotion: {
        projectPath,
        outputDir,
        cacheDir,
      },
      server: {
        port: parseInt(this.getEnvVar('PORT', '3001'), 10),
        logLevel: this.getEnvVar('LOG_LEVEL', 'info'),
      },
      development: {
        nodeEnv: this.getEnvVar('NODE_ENV', 'development'),
      },
    } as Config;
  }

  private getEnvVar(key: string, defaultValue: string): string {
    const value = process.env[key];
    if (!value) {
      console.warn(`Environment variable ${key} not set, using default: ${defaultValue}`);
      return defaultValue;
    }
    return value;
  }

  public getConfig(): Config {
    return this.config;
  }

  public getRemotionProjectPath(): string {
    return this.config.remotion.projectPath;
  }

  public getRemotionOutputDir(): string {
    return this.config.remotion.outputDir;
  }

  public getRemotionCacheDir(): string {
    return this.config.remotion.cacheDir;
  }

  public getServerPort(): number {
    return this.config.server.port;
  }

  public getLogLevel(): string {
    return this.config.server.logLevel;
  }

  public isDevelopment(): boolean {
    return this.config.development.nodeEnv === 'development';
  }

  public async validateConfig(): Promise<void> {
    const errors: string[] = [];

    // Validate Remotion project path exists
    const projectPath = this.getRemotionProjectPath();
    const pathExists = await this.pathExists(projectPath);
    if (!pathExists) {
      errors.push(`Remotion project path does not exist: ${projectPath}`);
    }

    // Validate port is valid
    const port = this.getServerPort();
    if (port < 1 || port > 65535) {
      errors.push(`Invalid port number: ${port}`);
    }

    // Validate log level
    const validLogLevels = ['error', 'warn', 'info', 'debug'];
    if (!validLogLevels.includes(this.getLogLevel())) {
      errors.push(`Invalid log level: ${this.getLogLevel()}`);
    }

    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance();
