// src/utils/LipSyncResolver.ts
import { staticFile } from 'remotion';

/**
 * Resolves lipsync:// protocol URLs to actual metadata.json URLs
 */
export class LipSyncResolver {
  /**
   * Resolves a lipsync://id URL to the actual metadata file URL
   * @param url - The lipsync:// URL to resolve
   * @returns Resolved static file URL or null
   */
  static resolveLipSyncUrl(url: string): string | null {
    if (!url || !url.startsWith('lipsync://')) {
      return url; // Return as-is if not a lipsync:// URL
    }

    // Extract ID from lipsync://id format
    const lipSyncId = url.replace('lipsync://', '');
    
    if (!lipSyncId) {
      console.warn('[LipSyncResolver] Empty lip-sync ID in URL:', url);
      return null;
    }

    // Backend stores metadata as <audioName>_lipsync.metadata.json where
    // lipSyncId is generated as `${audioName}_${timestamp}`.
    // Strip the trailing `_<timestamp>` to derive the audio base name.
    const audioBase = lipSyncId.replace(/_\d+$/, '');
    const metadataFileName = `${audioBase}_lipsync.metadata.json`;
    
    console.log('[LipSyncResolver] Resolving lipsync URL:', {
      originalUrl: url,
      lipSyncId,
      audioBase,
      metadataFileName
    });
    
    return staticFile(`audios/${metadataFileName}`);
  }

  /**
   * Checks if a URL is a lipsync protocol URL
   */
  static isLipSyncUrl(url: string): boolean {
    return Boolean(url && url.startsWith('lipsync://'));
  }
}
