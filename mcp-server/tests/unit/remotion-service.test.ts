import { RemotionService, Composition } from '../../src/services/remotion-service';
import { promises as fs } from 'fs';

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
    access: jest.fn(),
    stat: jest.fn(),
  },
}));

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

describe('RemotionService', () => {
  let remotionService: RemotionService;
  const mockProjectPath = '/test/project';

  beforeEach(() => {
    remotionService = new RemotionService(mockProjectPath);
    jest.clearAllMocks();
  });

  describe('validateProject', () => {
    it('should return valid project when all checks pass', async () => {
      // Mock package.json exists and has Remotion dependencies
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        dependencies: {
          remotion: '4.0.0',
          '@remotion/cli': '4.0.0'
        }
      }));
      (fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => true });
      (fs.readdir as jest.Mock).mockResolvedValue([]);

      const result = await remotionService.validateProject();

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.compositions).toHaveLength(0);
    });

    it('should return invalid project when package.json is missing', async () => {
      (fs.access as jest.Mock).mockRejectedValue(new Error('File not found'));

      const result = await remotionService.validateProject();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('package.json not found');
    });

    it('should return invalid project when Remotion dependencies are missing', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        dependencies: {
          react: '18.0.0'
        }
      }));

      const result = await remotionService.validateProject();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Remotion dependencies not found in package.json');
    });

    it('should return invalid project when src directory is missing', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify({
        dependencies: {
          remotion: '4.0.0'
        }
      }));
      (fs.stat as jest.Mock).mockRejectedValue(new Error('Directory not found'));

      const result = await remotionService.validateProject();

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('src directory not found');
    });
  });

  describe('discoverCompositions', () => {
    it('should discover compositions from TSX files', async () => {
      // Mock validateProjectStructure to pass
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => true });
      
      // Mock file system structure
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'Root.tsx', isFile: () => true, isDirectory: () => false },
        { name: 'components', isFile: () => false, isDirectory: () => true }
      ]);

      // Mock file content with compositions
      const mockFileContent = `
        <Composition
          id="Scene-Landscape"
          component={Scene}
          durationInFrames={300}
          fps={30}
          width={1920}
          height={1080}
        />
        <Composition
          id="Scene-Portrait"
          component={Scene}
          durationInFrames={600}
          fps={30}
          width={1080}
          height={1920}
        />
      `;
      (fs.readFile as jest.Mock).mockResolvedValue(mockFileContent);

      const compositions = await remotionService.discoverCompositions();

      expect(compositions).toHaveLength(2);
      expect(compositions[0]).toEqual({
        id: 'Scene-Landscape',
        name: 'Scene-Landscape',
        durationInFrames: 300,
        fps: 30,
        width: 1920,
        height: 1080
      });
      expect(compositions[1]).toEqual({
        id: 'Scene-Portrait',
        name: 'Scene-Portrait',
        durationInFrames: 600,
        fps: 30,
        width: 1080,
        height: 1920
      });
    });

    it('should return empty array when no compositions found', async () => {
      // Mock validateProjectStructure to pass
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => true });
      
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'utils.ts', isFile: () => true, isDirectory: () => false }
      ]);
      (fs.readFile as jest.Mock).mockResolvedValue('// No compositions here');

      const compositions = await remotionService.discoverCompositions();

      expect(compositions).toHaveLength(0);
    });

    it('should handle malformed composition props gracefully', async () => {
      // Mock validateProjectStructure to pass
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.stat as jest.Mock).mockResolvedValue({ isDirectory: () => true });
      
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'Root.tsx', isFile: () => true, isDirectory: () => false }
      ]);
      (fs.readFile as jest.Mock).mockResolvedValue(`
        <Composition id="Test" width={invalid} height={1080} />
      `);

      const compositions = await remotionService.discoverCompositions();

      expect(compositions).toHaveLength(1);
      expect(compositions[0]?.width).toBe(1920); // Default value
      expect(compositions[0]?.height).toBe(1080);
    });
  });

  describe('compositionExists', () => {
    it('should return true when composition exists', async () => {
      // Mock discoverCompositions to return a specific composition
      const mockCompositions: Composition[] = [
        {
          id: 'Test-Composition',
          name: 'Test-Composition',
          durationInFrames: 300,
          fps: 30,
          width: 1920,
          height: 1080
        }
      ];

      jest.spyOn(remotionService, 'discoverCompositions').mockResolvedValue(mockCompositions);

      const exists = await remotionService.compositionExists('Test-Composition');

      expect(exists).toBe(true);
    });

    it('should return false when composition does not exist', async () => {
      const mockCompositions: Composition[] = [
        {
          id: 'Existing-Composition',
          name: 'Existing-Composition',
          durationInFrames: 300,
          fps: 30,
          width: 1920,
          height: 1080
        }
      ];

      jest.spyOn(remotionService, 'discoverCompositions').mockResolvedValue(mockCompositions);

      const exists = await remotionService.compositionExists('Non-Existent-Composition');

      expect(exists).toBe(false);
    });
  });

  describe('getCompositionInfo', () => {
    it('should return composition info when found', async () => {
      const mockCompositions: Composition[] = [
        {
          id: 'Test-Composition',
          name: 'Test-Composition',
          durationInFrames: 300,
          fps: 30,
          width: 1920,
          height: 1080
        }
      ];

      jest.spyOn(remotionService, 'discoverCompositions').mockResolvedValue(mockCompositions);

      const composition = await remotionService.getCompositionInfo('Test-Composition');

      expect(composition).toEqual(mockCompositions[0]);
    });

    it('should return null when composition not found', async () => {
      const mockCompositions: Composition[] = [];

      jest.spyOn(remotionService, 'discoverCompositions').mockResolvedValue(mockCompositions);

      const composition = await remotionService.getCompositionInfo('Non-Existent');

      expect(composition).toBeNull();
    });
  });
});
