import dotenv from 'dotenv';
import path from 'path';

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

  private loadConfig(): Config {
    return {
      remotion: {
        projectPath: this.getEnvVar('REMOTION_PROJECT_PATH', '../src'),
        outputDir: this.getEnvVar('REMOTION_OUTPUT_DIR', './output'),
        cacheDir: this.getEnvVar('REMOTION_CACHE_DIR', './cache'),
      },
      server: {
        port: parseInt(this.getEnvVar('PORT', '3001'), 10),
        logLevel: this.getEnvVar('LOG_LEVEL', 'info'),
      },
      development: {
        nodeEnv: this.getEnvVar('NODE_ENV', 'development'),
      },
    };
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
    return path.resolve(this.config.remotion.projectPath);
  }

  public getRemotionOutputDir(): string {
    return path.resolve(this.config.remotion.outputDir);
  }

  public getRemotionCacheDir(): string {
    return path.resolve(this.config.remotion.cacheDir);
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

  public validateConfig(): void {
    const errors: string[] = [];

    // Validate Remotion project path exists
    const projectPath = this.getRemotionProjectPath();
    if (!this.pathExists(projectPath)) {
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

  private pathExists(filePath: string): boolean {
    try {
      const fs = require('fs');
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const config = ConfigManager.getInstance();
