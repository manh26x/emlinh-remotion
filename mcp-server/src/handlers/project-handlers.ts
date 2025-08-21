import { CallToolResponse } from '../models/types';
import { logger } from '../utils/logger';
import { RemotionService } from '../services/remotion-service';

export class ProjectHandlers {
  constructor(private readonly remotionService: RemotionService) {}

  async handleValidateProject(): Promise<CallToolResponse> {
    try {
      const validation = await this.remotionService.validateProject();
      
      const status = validation.isValid ? '✅' : '❌';
      const statusText = validation.isValid ? 'Valid' : 'Invalid';
      
      const errorSection = validation.errors.length > 0 
        ? `\n\n**❌ Errors:**\n${validation.errors.map(e => `- ${e}`).join('\n')}`
        : '';
      
      const warningSection = validation.warnings.length > 0
        ? `\n\n**⚠️ Warnings:**\n${validation.warnings.map(w => `- ${w}`).join('\n')}`
        : '';
      
      const compositionSection = validation.compositions.length > 0
        ? `\n\n**🎬 Compositions Found:** ${validation.compositions.length}`
        : '\n\n**📋 No Compositions Found**';

      return {
        content: [
          {
            type: 'text',
            text: `${status} **Project Validation: ${statusText}**${errorSection}${warningSection}${compositionSection}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to validate project', { error: errorMessage });
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Project Validation Failed**\n\n${errorMessage}\n\nPlease check the project structure and ensure Remotion is properly configured.`,
          },
        ],
      };
    }
  }

  async handleListCompositions(): Promise<CallToolResponse> {
    try {
      // Validate project first
      const validation = await this.remotionService.validateProject();
      
      if (!validation.isValid) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ **Project Validation Failed**\n\n**Errors:**\n${validation.errors.map(e => `- ${e}`).join('\n')}\n\n**Warnings:**\n${validation.warnings.map(w => `- ${w}`).join('\n')}`,
            },
          ],
        };
      }

      // Discover compositions
      const compositions = await this.remotionService.discoverCompositions();
      
      if (compositions.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: '📋 **No Compositions Found**\n\nNo Remotion compositions were discovered in the project. Please ensure that:\n- The project has a valid `src` directory\n- Composition components are defined in `.tsx` files\n- Compositions have valid `id` attributes',
            },
          ],
        };
      }

      // Format composition list
      const compositionList = compositions.map(comp => {
        const durationInSeconds = Math.round(comp.durationInFrames / comp.fps * 100) / 100;
        return `**${comp.id}**\n- Resolution: ${comp.width}x${comp.height}\n- Duration: ${durationInSeconds}s (${comp.durationInFrames} frames)\n- FPS: ${comp.fps}`;
      }).join('\n\n');

      return {
        content: [
          {
            type: 'text',
            text: `🎬 **Available Compositions** (${compositions.length} found)\n\n${compositionList}\n\n**Warnings:**\n${validation.warnings.map(w => `- ${w}`).join('\n')}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to list compositions', { error: errorMessage });
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ **Error Listing Compositions**\n\n${errorMessage}\n\nPlease check the project structure and ensure Remotion is properly configured.`,
          },
        ],
      };
    }
  }
}
