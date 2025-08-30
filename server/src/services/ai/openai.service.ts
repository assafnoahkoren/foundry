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
        model: 'gpt-4o-mini',
        temperature: 0,
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

  async askLLMStructured<T>(
    question: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<T> {
    try {
      const completion = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that responds with valid JSON only.',
          },
          {
            role: 'user',
            content: question,
          },
        ],
        model: options?.model || 'gpt-4o-mini',
        temperature: options?.temperature ?? 0,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      try {
        return JSON.parse(response) as T;
      } catch {
        console.error('Failed to parse JSON response:', response);
        throw new Error('Invalid JSON response from OpenAI');
      }
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      
      if (error instanceof Error) {
        throw new Error(`Failed to get structured response from LLM: ${error.message}`);
      }
      
      throw new Error('Failed to get structured response from LLM');
    }
  }

  // TTS functionality is now handled by ElevenLabs service
  async textToSpeech(): Promise<Buffer> {
    throw new Error('TTS functionality has been moved to ElevenLabs service');
  }

  async textToSpeechBase64(): Promise<string> {
    throw new Error('TTS functionality has been moved to ElevenLabs service');
  }
}

// Export a singleton instance
export const openAiService = new OpenAiService();