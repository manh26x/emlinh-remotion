import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import {
  IScriptService,
  Script,
  ScriptOptions,
  ScriptTemplate,
  ScriptTone,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  TTSError,
  TTSErrorCode
} from '../models/tts-types.js';

export class ScriptService implements IScriptService {
  private readonly templates: Map<string, ScriptTemplate>;
  private readonly maxWords = 2000;
  private readonly minWords = 50;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  async generateScript(topic: string, options?: ScriptOptions): Promise<Script> {
    try {
      logger.info('Generating script', { topic, options });

      if (!topic || topic.trim().length === 0) {
        throw new TTSError(
          'Topic is required for script generation',
          TTSErrorCode.SCRIPT_GENERATION_FAILED
        );
      }

      const templateName = options?.template || 'general';
      const template = this.getTemplate(templateName);
      
      if (!template) {
        throw new TTSError(
          `Template not found: ${templateName}`,
          TTSErrorCode.SCRIPT_GENERATION_FAILED,
          { template: templateName }
        );
      }

      const maxWords = Math.min(options?.maxWords || 500, this.maxWords);
      const tone = options?.tone || 'professional';
      const language = options?.language || 'vi';
      
      const content = this.generateContent(topic, template, tone, language, maxWords);
      
      const scriptId = uuidv4();
      const script: Script = {
        id: scriptId,
        topic,
        content,
        wordCount: this.countWords(content),
        estimatedDuration: this.estimateDuration(content),
        template: templateName,
        tone,
        language,
        createdAt: new Date()
      };

      logger.info('Script generated successfully', {
        scriptId,
        wordCount: script.wordCount,
        estimatedDuration: script.estimatedDuration
      });

      return script;

    } catch (error) {
      logger.logError('Script Generation Failed', error as Error);
      
      if (error instanceof TTSError) {
        throw error;
      }

      throw new TTSError(
        'Script generation failed',
        TTSErrorCode.SCRIPT_GENERATION_FAILED,
        { topic, error: (error as Error).message }
      );
    }
  }

  validateScript(script: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check length
    if (script.trim().length === 0) {
      errors.push({
        field: 'content',
        value: script,
        constraint: 'required',
        message: 'Script content cannot be empty'
      });
    }

    const wordCount = this.countWords(script);
    
    if (wordCount < this.minWords) {
      errors.push({
        field: 'wordCount',
        value: wordCount,
        constraint: `min:${this.minWords}`,
        message: `Script must have at least ${this.minWords} words`
      });
    }

    if (wordCount > this.maxWords) {
      errors.push({
        field: 'wordCount',
        value: wordCount,
        constraint: `max:${this.maxWords}`,
        message: `Script cannot exceed ${this.maxWords} words`
      });
    }

    // Check for very long sentences (readability)
    const sentences = script.split(/[.!?]+/);
    const longSentences = sentences.filter(s => s.trim().split(/\s+/).length > 30);
    
    if (longSentences.length > 0) {
      warnings.push({
        field: 'readability',
        message: `Found ${longSentences.length} very long sentences. Consider breaking them down for better TTS pronunciation.`
      });
    }

    // Check for special characters that might affect TTS
    const problematicChars = /[<>{}[\]]/g;
    if (problematicChars.test(script)) {
      warnings.push({
        field: 'characters',
        message: 'Script contains special characters that might affect TTS quality.'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getTemplates(): ScriptTemplate[] {
    return Array.from(this.templates.values());
  }

  getTemplate(name: string): ScriptTemplate | undefined {
    return this.templates.get(name);
  }

  private initializeTemplates(): void {
    const templates: ScriptTemplate[] = [
      {
        name: 'general',
        description: 'General purpose script template',
        structure: [
          'Introduction (20%)',
          'Main Content (60%)',
          'Conclusion (20%)'
        ],
        defaultTone: 'professional',
        estimatedWordsPerMinute: 160
      },
      {
        name: 'educational',
        description: 'Educational content template',
        structure: [
          'Hook/Question (10%)',
          'Background/Context (20%)',
          'Main Explanation (50%)',
          'Examples (15%)',
          'Summary (5%)'
        ],
        defaultTone: 'educational',
        estimatedWordsPerMinute: 150
      },
      {
        name: 'marketing',
        description: 'Marketing and promotional content',
        structure: [
          'Attention Grabber (15%)',
          'Problem Statement (25%)',
          'Solution Presentation (40%)',
          'Call to Action (20%)'
        ],
        defaultTone: 'entertaining',
        estimatedWordsPerMinute: 170
      },
      {
        name: 'storytelling',
        description: 'Narrative and storytelling format',
        structure: [
          'Setting the Scene (20%)',
          'Rising Action (40%)',
          'Climax (25%)',
          'Resolution (15%)'
        ],
        defaultTone: 'casual',
        estimatedWordsPerMinute: 160
      },
      {
        name: 'technical',
        description: 'Technical explanation template',
        structure: [
          'Overview (15%)',
          'Technical Details (50%)',
          'Implementation (25%)',
          'Conclusion (10%)'
        ],
        defaultTone: 'professional',
        estimatedWordsPerMinute: 140
      }
    ];

    templates.forEach(template => {
      this.templates.set(template.name, template);
    });
  }

  private generateContent(
    topic: string, 
    template: ScriptTemplate, 
    tone: ScriptTone, 
    language: string, 
    maxWords: number
  ): string {
    // This is a simplified content generation
    // In a real implementation, you might use AI APIs or more sophisticated templates
    
    const sections = this.generateSections(topic, template, tone, language, maxWords);
    return sections.join('\n\n');
  }

  private generateSections(
    topic: string,
    template: ScriptTemplate,
    tone: ScriptTone,
    language: string,
    maxWords: number
  ): string[] {
    const sections: string[] = [];
    const wordsPerSection = Math.floor(maxWords / template.structure.length);

    for (let i = 0; i < template.structure.length; i++) {
      const sectionName = template.structure[i];
      const content = this.generateSectionContent(
        topic, 
        sectionName, 
        tone, 
        language, 
        wordsPerSection,
        i === 0, // isFirst
        i === template.structure.length - 1 // isLast
      );
      sections.push(content);
    }

    return sections;
  }

  private generateSectionContent(
    topic: string,
    sectionName: string,
    tone: ScriptTone,
    language: string,
    targetWords: number,
    isFirst: boolean,
    isLast: boolean
  ): string {
    // Generate content based on section type, tone and target word count
    const isVietnamese = language === 'vi';
    const isFormal = tone === 'professional' || tone === 'educational';
    
    if (isFirst) {
      // Introduction section
      const greeting = isVietnamese ? 
        (isFormal ? 'Xin chào và chào mừng' : 'Chào các bạn') :
        (isFormal ? 'Hello and welcome' : 'Hey everyone');
      
      if (isVietnamese) {
        return `${greeting} bạn đến với video về ${topic}. Hôm nay chúng ta sẽ cùng nhau khám phá ${sectionName || 'chủ đề này'}. ${topic} là một chủ đề rất thú vị với khoảng ${targetWords} từ để tìm hiểu.`;
      } else {
        return `${greeting} to this video about ${topic}. Today we're exploring ${sectionName || 'this topic'}. ${topic} is a fascinating subject with approximately ${targetWords} words to cover.`;
      }
    }

    if (isLast) {
      // Conclusion section
      if (isVietnamese) {
        return `Như vậy, chúng ta đã cùng nhau tìm hiểu về ${topic} qua phần ${sectionName}. Hy vọng ${targetWords} từ này đã cung cấp thông tin hữu ích. Cảm ơn bạn đã theo dõi video ${isFormal ? 'và hẹn gặp lại' : 'nhé'}!`;
      } else {
        return `So we have explored ${topic} through the ${sectionName} section. I hope these ${targetWords} words provided useful information. Thank you for watching ${isFormal ? 'and see you next time' : 'everyone'}!`;
      }
    }

    // Main content sections
    const contentStyle = isFormal ? 'cần hiểu rằng' : 'thật thú vị khi';
    if (isVietnamese) {
      return `Trong phần ${sectionName}, khi nói về ${topic}, chúng ta ${contentStyle} đây là một lĩnh vực quan trọng. Với khoảng ${targetWords} từ, chúng ta sẽ khám phá các khía cạnh cơ bản và nâng cao của ${topic}.`;
    } else {
      return `In the ${sectionName} section, when discussing ${topic}, we ${isFormal ? 'need to understand that' : 'find it interesting that'} this is an important field. With approximately ${targetWords} words, we'll explore the basic and advanced aspects of ${topic}.`;
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private estimateDuration(text: string): number {
    const wordCount = this.countWords(text);
    const wordsPerMinute = 160; // Average speaking rate
    return Math.ceil((wordCount / wordsPerMinute) * 60); // seconds
  }
}
