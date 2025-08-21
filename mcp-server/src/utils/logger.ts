import winston from 'winston';
import { config } from './config';

export class Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
        }`;
      })
    );

    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: consoleFormat,
        level: config.getLogLevel(),
        stderrLevels: ['error', 'warn', 'info', 'debug'], // Force all logs to stderr
      }),
    ];

    // Add file transport in production
    if (!config.isDevelopment()) {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: logFormat,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: logFormat,
        })
      );
    }

    return winston.createLogger({
      level: config.getLogLevel(),
      format: logFormat,
      transports,
      exitOnError: false,
    });
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, meta);
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, meta);
  }

  public error(message: string, meta?: Record<string, unknown>): void {
    this.logger.error(message, meta);
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, meta);
  }

  public log(level: string, message: string, meta?: Record<string, unknown>): void {
    this.logger.log(level, message, meta);
  }

  // Convenience methods for specific contexts
  public logMCPRequest(method: string, params?: Record<string, unknown>): void {
    this.info(`MCP Request: ${method}`, { params });
  }

  public logMCPResponse(method: string, response: unknown): void {
    this.info(`MCP Response: ${method}`, { response });
  }

  public logRemotionCommand(command: string, args?: string[]): void {
    this.info(`Remotion Command: ${command}`, { args });
  }

  public logRenderJob(jobId: string, action: string, details?: Record<string, unknown>): void {
    this.info(`Render Job ${action}: ${jobId}`, { jobId, action, ...details });
  }

  public logError(context: string, error: Error, meta?: Record<string, unknown>): void {
    this.error(`Error in ${context}: ${error.message}`, {
      context,
      error: error.stack,
      ...meta,
    });
  }
}

// Export singleton instance
export const logger = new Logger();
