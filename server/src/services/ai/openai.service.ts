import OpenAI from 'openai';
import { config } from '../../shared/config/config';
import type { AiService } from './ai.service.interface';

export class OpenAiService implements AiService {
  private openai: OpenAI;

  constructor() {
    if (!config.openai.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    this.openai = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async askLLM(question: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: question,
          },
        ],
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return response;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to get response from LLM: ${error.message}`);
      }
      
      throw new Error('Failed to get response from LLM');
    }
  }
}

// Export a singleton instance
export const openAiService = new OpenAiService();