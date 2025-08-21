import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

export interface OpenFileResult {
  success: boolean;
  message: string;
  resolvedPath?: string;
}

export class SystemService {
  public async openFileWithDefaultApp(filePath: string): Promise<OpenFileResult> {
    try {
      if (!filePath || typeof filePath !== 'string') {
        return { success: false, message: 'Invalid filePath parameter' };
      }

      const resolved = await this.resolveExistingPath(filePath);
      if (!resolved) {
        return { success: false, message: `File not found: ${filePath}` };
      }

      const quoted = this.quotePath(resolved);
      const platform = process.platform;
      let command: string;

      if (platform === 'win32') {
        // Use start via cmd; empty title string required
        command = `start "" ${quoted}`;
      } else if (platform === 'darwin') {
        command = `open ${quoted}`;
      } else {
        // linux and others
        command = `xdg-open ${quoted}`;
      }

      logger.info('Opening file with system player', { command, resolvedPath: resolved });

      await this.execAsync(command);

      return { success: true, message: 'Video opened', resolvedPath: resolved };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to open file', { error: message, filePath });
      return { success: false, message };
    }
  }

  private async resolveExistingPath(inputPath: string): Promise<string | null> {
    const candidates: string[] = [];

    // As-is
    candidates.push(inputPath);

    // If relative, try relative to output dir and project root
    if (!path.isAbsolute(inputPath)) {
      candidates.push(path.join(config.getRemotionOutputDir(), inputPath));
      candidates.push(path.join(config.getRemotionProjectPath(), inputPath));
    }

    for (const p of candidates) {
      try {
        const stat = await fs.stat(p);
        if (stat.isFile()) return p;
      } catch {
        // ignore
      }
    }
    return null;
  }

  private quotePath(p: string): string {
    const escaped = p.replace(/"/g, '\\"');
    return `"${escaped}"`;
  }

  private execAsync(cmd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(cmd, { shell: true }, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  }
}


