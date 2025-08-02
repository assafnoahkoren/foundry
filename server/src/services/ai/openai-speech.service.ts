import OpenAI, { toFile } from 'openai';
import { config } from '../../shared/config/config';
import type { SpeechAIService, SpeechTranscriptionResult } from './speech-ai.interface';

export class OpenAISpeechService implements SpeechAIService {
  private openai: OpenAI | null = null;

  constructor() {
    if (config.openai.apiKey) {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey,
      });
    }
  }

  async transcribeAudio(
    audioBuffer: Buffer,
    options?: {
      language?: string;
      prompt?: string;
      temperature?: number;
    }
  ): Promise<SpeechTranscriptionResult> {
    if (!this.openai) {
      throw new Error('OpenAI API key is not configured');
    }

    try {
      // Log buffer size for debugging
      console.log('Audio buffer size:', audioBuffer.length, 'bytes');
      
      // Use the toFile utility to convert buffer to file without saving to disk
      const file = await toFile(audioBuffer, 'audio.webm', {
        type: 'audio/webm',
      });

      const transcription = await this.openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language: options?.language,
        prompt: options?.prompt,
        temperature: options?.temperature ?? 0,
        response_format: 'json',
      });

      return {
        text: transcription.text,
        language: options?.language,
      };
    } catch (error) {
      console.error('OpenAI speech transcription error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to transcribe audio: ${error.message}`);
      }
      throw new Error('Failed to transcribe audio');
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!config.openai.apiKey;
  }
}

// Singleton instance
export const openAISpeechService = new OpenAISpeechService();