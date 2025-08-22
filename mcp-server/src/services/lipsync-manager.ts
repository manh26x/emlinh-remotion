import { promises as fs } from 'fs';
import path from 'path';
import { MouthCue, RhubarbOutput } from './rhubarb-service.js';

export interface LipSyncData {
  id: string;
  audioPath: string;
  lipSyncPath: string;
  metadata: {
    soundFile: string;
    duration: number;
    mouthCueCount: number;
    createdAt: Date;
    audioFileSize: number;
  };
  mouthCues: MouthCue[];
}

export interface LipSyncFilter {
  audioPath?: string;
  minDuration?: number;
  maxDuration?: number;
  createdAfter?: Date;
  createdBefore?: Date;
}

export class LipSyncManager {
  private static instance: LipSyncManager;
  private readonly lipSyncDirectory: string;

  private constructor() {
    this.lipSyncDirectory = path.join(process.cwd(), 'public', 'audios');
  }

  public static getInstance(): LipSyncManager {
    if (!LipSyncManager.instance) {
      LipSyncManager.instance = new LipSyncManager();
    }
    return LipSyncManager.instance;
  }

  /**
   * Store lip-sync data with metadata
   */
  async storeLipSyncData(
    audioPath: string, 
    lipSyncPath: string, 
    rhubarbData: RhubarbOutput
  ): Promise<LipSyncData> {
    await this.ensureDirectoryExists();

    const id = this.generateLipSyncId(audioPath);
    const audioStats = await fs.stat(audioPath);

    const lipSyncData: LipSyncData = {
      id,
      audioPath,
      lipSyncPath,
      metadata: {
        soundFile: rhubarbData.metadata.soundFile,
        duration: rhubarbData.metadata.duration,
        mouthCueCount: rhubarbData.mouthCues.length,
        createdAt: new Date(),
        audioFileSize: audioStats.size
      },
      mouthCues: rhubarbData.mouthCues
    };

    // Store data in JSON file alongside the lip-sync file
    const dataPath = lipSyncPath.replace('.json', '.metadata.json');
    await fs.writeFile(dataPath, JSON.stringify(lipSyncData, null, 2));

    return lipSyncData;
  }

  /**
   * Retrieve lip-sync data by ID
   */
  async getLipSyncData(id: string): Promise<LipSyncData | null> {
    try {
      // Files are stored as <audioBase>_lipsync.metadata.json next to audio files in public/audios
      // where id = `${audioBase}_${timestamp}`. We derive audioBase by stripping the trailing timestamp.
      const audioBase = id.replace(/_\d+$/, '');
      const metadataPath = path.join(this.lipSyncDirectory, `${audioBase}_lipsync.metadata.json`);

      const content = await fs.readFile(metadataPath, 'utf-8');
      const data = JSON.parse(content) as LipSyncData;

      // Convert date strings back to Date objects
      data.metadata.createdAt = new Date(data.metadata.createdAt);

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * List all lip-sync data with optional filtering
   */
  async listLipSyncData(filter?: LipSyncFilter): Promise<LipSyncData[]> {
    try {
      await this.ensureDirectoryExists();
      const files = await this.listLipSyncFiles();
      
      const lipSyncData: LipSyncData[] = [];
      
      for (const file of files) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const data = JSON.parse(content) as LipSyncData;
          data.metadata.createdAt = new Date(data.metadata.createdAt);
          lipSyncData.push(data);
        } catch (error) {
          // Skip corrupted files
          continue;
        }
      }

      // Apply filters
      let filteredData = lipSyncData;

      if (filter) {
        filteredData = filteredData.filter(data => {
          if (filter.audioPath && !data.audioPath.includes(filter.audioPath)) {
            return false;
          }
          if (filter.minDuration && data.metadata.duration < filter.minDuration) {
            return false;
          }
          if (filter.maxDuration && data.metadata.duration > filter.maxDuration) {
            return false;
          }
          if (filter.createdAfter && data.metadata.createdAt < filter.createdAfter) {
            return false;
          }
          if (filter.createdBefore && data.metadata.createdAt > filter.createdBefore) {
            return false;
          }
          return true;
        });
      }

      // Sort by creation date (newest first)
      return filteredData.sort((a, b) => 
        b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime()
      );

    } catch (error) {
      return [];
    }
  }

  /**
   * Delete lip-sync data and associated files
   */
  async deleteLipSyncData(id: string): Promise<boolean> {
    try {
      const data = await this.getLipSyncData(id);
      if (!data) {
        return false;
      }

      // Delete lip-sync JSON file
      if (await this.fileExists(data.lipSyncPath)) {
        await fs.unlink(data.lipSyncPath);
      }

      // Delete metadata file
      const metadataPath = data.lipSyncPath.replace('.json', '.metadata.json');
      if (await this.fileExists(metadataPath)) {
        await fs.unlink(metadataPath);
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clean up old lip-sync data files
   */
  async cleanup(olderThan: Date): Promise<number> {
    const allData = await this.listLipSyncData();
    const toDelete = allData.filter(data => data.metadata.createdAt < olderThan);
    
    let deletedCount = 0;
    for (const data of toDelete) {
      if (await this.deleteLipSyncData(data.id)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get storage information for lip-sync files
   */
  async getStorageInfo(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageDuration: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  }> {
    const allData = await this.listLipSyncData();
    
    if (allData.length === 0) {
      return {
        totalFiles: 0,
        totalSize: 0,
        averageDuration: 0,
        oldestFile: null,
        newestFile: null
      };
    }

    const totalSize = allData.reduce((sum, data) => sum + data.metadata.audioFileSize, 0);
    const averageDuration = allData.reduce((sum, data) => sum + data.metadata.duration, 0) / allData.length;
    const dates = allData.map(data => data.metadata.createdAt);
    const oldestFile = new Date(Math.min(...dates.map(d => d.getTime())));
    const newestFile = new Date(Math.max(...dates.map(d => d.getTime())));

    return {
      totalFiles: allData.length,
      totalSize,
      averageDuration,
      oldestFile,
      newestFile
    };
  }

  /**
   * Validate lip-sync data integrity
   */
  async validateLipSyncData(id: string): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const data = await this.getLipSyncData(id);
    const issues: string[] = [];

    if (!data) {
      return { valid: false, issues: ['Lip-sync data not found'] };
    }

    // Check if lip-sync file exists
    if (!(await this.fileExists(data.lipSyncPath))) {
      issues.push('Lip-sync JSON file is missing');
    }

    // Check if audio file exists
    if (!(await this.fileExists(data.audioPath))) {
      issues.push('Associated audio file is missing');
    }

    // Validate mouth cues
    if (data.mouthCues.length === 0) {
      issues.push('No mouth cues found');
    }

    // Check for timing issues
    for (let i = 0; i < data.mouthCues.length - 1; i++) {
      const current = data.mouthCues[i];
      const next = data.mouthCues[i + 1];
      
      if (current && next && current.end > next.start) {
        issues.push(`Overlapping mouth cues at index ${i}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Generate unique ID for lip-sync data
   */
  private generateLipSyncId(audioPath: string): string {
    const timestamp = Date.now();
    const audioName = path.basename(audioPath, path.extname(audioPath));
    return `${audioName}_${timestamp}`;
  }

  /**
   * Ensure lip-sync directory exists
   */
  private async ensureDirectoryExists(): Promise<void> {
    try {
      await fs.mkdir(this.lipSyncDirectory, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  /**
   * List all lip-sync metadata files
   */
  private async listLipSyncFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.lipSyncDirectory);
      return files
        .filter(file => file.endsWith('_lipsync.metadata.json'))
        .map(file => path.join(this.lipSyncDirectory, file));
    } catch (error) {
      return [];
    }
  }

  /**
   * Check if file exists
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get lip-sync data by audio path
   */
  async getLipSyncDataByAudioPath(audioPath: string): Promise<LipSyncData | null> {
    const allData = await this.listLipSyncData({ audioPath });
    return allData.length > 0 ? allData[0] || null : null;
  }

  /**
   * Get mouth cues for a specific time range
   */
  getMouthCuesInRange(mouthCues: MouthCue[], startTime: number, endTime: number): MouthCue[] {
    return mouthCues.filter(cue => 
      (cue.start >= startTime && cue.start <= endTime) ||
      (cue.end >= startTime && cue.end <= endTime) ||
      (cue.start <= startTime && cue.end >= endTime)
    );
  }

  /**
   * Get mouth shape at specific time
   */
  getMouthShapeAtTime(mouthCues: MouthCue[], time: number): string {
    const activeCue = mouthCues.find(cue => time >= cue.start && time <= cue.end);
    return activeCue ? activeCue.value : 'A'; // Default to rest position
  }
}

export default LipSyncManager;
