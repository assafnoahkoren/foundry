import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';
import { config } from '../../shared/config/config';
import type { AiService, TextToSpeechOptions } from './ai.service.interface';

export class ElevenLabsService implements AiService {
  private client: ElevenLabsClient;

  constructor() {
    if (!config.elevenlabs.apiKey) {
      console.error('❌ ElevenLabs API key is not configured');
      throw new Error('ElevenLabs API key is not configured');
    }

    console.log('🚀 Initializing ElevenLabs service with API key:', {
      keyLength: config.elevenlabs.apiKey.length,
      keyPrefix: config.elevenlabs.apiKey.substring(0, 8) + '...'
    });

    this.client = new ElevenLabsClient({
      apiKey: config.elevenlabs.apiKey,
    });

    console.log('✅ ElevenLabs service initialized successfully');
  }

  // This service only implements TTS, not LLM
  async askLLM(_question: string): Promise<string> {
    throw new Error('ElevenLabs service does not support LLM functionality. Use OpenAI service instead.');
  }

  async textToSpeech(text: string, options?: TextToSpeechOptions): Promise<Buffer> {
    try {
      // Map our generic voice options to ElevenLabs voice IDs
      const voiceId = this.getVoiceId(options?.voice);

      // Log the request details
      console.log('🎤 ElevenLabs TTS Request:', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''), // First 100 chars
        textLength: text.length,
        voiceId,
        voiceName: options?.voice || 'default (nova)',
        modelId: 'eleven_v3',
        options: {
          voice: options?.voice,
          model: options?.model,
          speed: options?.speed,
          format: options?.format
        }
      });

      // Generate speech using ElevenLabs
      const audioStream = await this.client.textToSpeech.convert(voiceId, {
        text,
        modelId: 'eleven_v3', // Using the latest v3 model for best quality
      });

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }

      const audioBuffer = Buffer.concat(chunks);
      console.log('✅ ElevenLabs TTS Response: Audio generated successfully', {
        bufferSize: audioBuffer.length,
        bufferSizeKB: (audioBuffer.length / 1024).toFixed(2) + ' KB'
      });

      return audioBuffer;
    } catch (error) {
      console.error('Error calling ElevenLabs TTS API:', error);

      if (error instanceof Error) {
        throw new Error(`Failed to generate speech: ${error.message}`);
      }

      throw new Error('Failed to generate speech');
    }
  }

  async textToSpeechBase64(text: string, options?: TextToSpeechOptions): Promise<string> {
    try {
      const audioBuffer = await this.textToSpeech(text, options);

      // Convert Buffer to base64 with appropriate data URL prefix
      const base64 = audioBuffer.toString('base64');

      return `data:audio/mpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error generating base64 speech:', error);

      if (error instanceof Error) {
        throw new Error(`Failed to generate base64 speech: ${error.message}`);
      }

      throw new Error('Failed to generate base64 speech');
    }
  }

  /**
   * Generate speech optimized for aviation radio transmissions
   * Uses specific voice and settings for clarity
   */
  async generateRadioTransmission(
    text: string,
    role: 'pilot' | 'atc' = 'atc'
  ): Promise<string> {
    // Pre-process text for better TTS pronunciation of aviation terms
    const processedText = this.preprocessAviationText(text);

    console.log('✈️ ElevenLabs Aviation TTS Request:', {
      originalText: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      processedText: processedText.substring(0, 100) + (processedText.length > 100 ? '...' : ''),
      originalLength: text.length,
      processedLength: processedText.length,
      role,
      modelId: 'eleven_v3'
    });

    try {
      // Use a more professional voice for aviation
      const voiceId = role === 'atc'
        ? '21m00Tcm4TlvDq8ikWAM' // Rachel - clear female voice
        : 'pNInz6obpgDQGcFmaJgB'; // Adam - clear male voice

      console.log('✈️ Using voice:', {
        voiceId,
        voiceDescription: role === 'atc' ? 'Rachel - ATC voice' : 'Adam - Pilot voice'
      });

      // Generate speech with aviation-optimized settings
      const audioStream = await this.client.textToSpeech.convert(voiceId, {
        text: processedText,
        modelId: 'eleven_v3', // Using the latest v3 model for best quality
      });

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of audioStream) {
        chunks.push(Buffer.from(chunk));
      }

      const audioBuffer = Buffer.concat(chunks);
      const base64 = audioBuffer.toString('base64');

      console.log('✅ Aviation TTS Response: Audio generated successfully', {
        bufferSize: audioBuffer.length,
        bufferSizeKB: (audioBuffer.length / 1024).toFixed(2) + ' KB',
        base64Length: base64.length
      });

      return `data:audio/mpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error generating radio transmission:', error);

      if (error instanceof Error) {
        throw new Error(`Failed to generate radio transmission: ${error.message}`);
      }

      throw new Error('Failed to generate radio transmission');
    }
  }

  /**
   * Pre-process aviation text for better TTS pronunciation
   */
  private preprocessAviationText(text: string): string {
    // Convert common aviation abbreviations to phonetic pronunciation with hyphens
    const replacements: Record<string, string> = {
      'FL': 'flight level',
      'QNH': 'Q-N-H',
      'ILS': 'I-L-S',
      'VOR': 'V-O-R',
      'DME': 'D-M-E',
      'ATC': 'A-T-C',
      'IFR': 'I-F-R',
      'VFR': 'V-F-R',
      'ATIS': 'A-T-I-S',
      'RNAV': 'R-NAV',
      'TCAS': 'T-CAS',
      'GPWS': 'G-P-W-S',
      'APU': 'A-P-U',
      'FMS': 'F-M-S',
      'CDU': 'C-D-U',
      'EICAS': 'E-I-CAS',
      'ECAM': 'E-CAM',
      // Numbers should be pronounced individually in aviation
      '0': 'zero',
      '1': 'one',
      '2': 'two',
      '3': 'tree', // Aviation pronunciation for 3
      '4': 'four',
      '5': 'five',
      '6': 'six',
      '7': 'seven',
      '8': 'eight',
      '9': 'niner', // Aviation pronunciation for 9
      // Add pauses for better clarity
      ',': ', ',
      '.': '. ',
    };

    let processed = text;
    const changes: string[] = [];

    // Process callsigns (e.g., "EL AL 321" -> "E-L A-L tree two one")
    // Match patterns like "EL AL 321" or "BAW123" 
    processed = processed.replace(/\b([A-Z]{2,3})\s*([A-Z]{2,3})?\s*(\d+)\b/g, (match, p1, p2, p3) => {
      let result = '';

      // Process first part (airline code)
      if (p1) {
        result += p1.split('').join('-');
      }

      // Process second part if exists
      if (p2) {
        result += ' ' + p2.split('').join('-');
      }

      // Process numbers
      if (p3) {
        const numbers = p3.split('').map((d: string) => replacements[d] || d).join(' ');
        result += ' ' + numbers;
      }

      if (result !== match) {
        changes.push(`${match} → ${result}`);
      }

      return result;
    });

    // Replace individual numbers with aviation pronunciation
    processed = processed.replace(/(\d)/g, (match) => {
      const replacement = replacements[match] || match;
      if (replacement !== match) {
        changes.push(`${match} → ${replacement}`);
      }
      return replacement;
    });

    // Replace abbreviations with hyphenated versions
    for (const [abbr, pronunciation] of Object.entries(replacements)) {
      if (abbr.length > 1) { // Skip single digits already processed
        const regex = new RegExp(`\\b${abbr}\\b`, 'g');
        const before = processed;
        processed = processed.replace(regex, pronunciation);
        if (before !== processed) {
          changes.push(`${abbr} → ${pronunciation}`);
        }
      }
    }

    // Process runway designations (e.g., "27L" -> "two seven left")
    processed = processed.replace(/\b(\d{1,2})([LRC])\b/g, (match, numbers, letter) => {
      const nums = numbers.split('').map((d: string) => replacements[d] || d).join(' ');
      const side = letter === 'L' ? 'left' : letter === 'R' ? 'right' : 'center';
      const result = `${nums} ${side}`;
      changes.push(`${match} → ${result}`);
      return result;
    });

    // Process taxiway designations (e.g., "A4" -> "alpha four")
    const phoneticAlphabet: Record<string, string> = {
      'A': 'alpha', 'B': 'bravo', 'C': 'charlie', 'D': 'delta',
      'E': 'echo', 'F': 'foxtrot', 'G': 'golf', 'H': 'hotel',
      'I': 'india', 'J': 'juliet', 'K': 'kilo', 'L': 'lima',
      'M': 'mike', 'N': 'november', 'O': 'oscar', 'P': 'papa',
      'Q': 'quebec', 'R': 'romeo', 'S': 'sierra', 'T': 'tango',
      'U': 'uniform', 'V': 'victor', 'W': 'whiskey', 'X': 'x-ray',
      'Y': 'yankee', 'Z': 'zulu'
    };

    processed = processed.replace(/\b([A-Z])(\d+)\b/g, (match, letter, number) => {
      const phonetic = phoneticAlphabet[letter] || letter;
      const nums = number.split('').map((d: string) => replacements[d] || d).join(' ');
      const result = `${phonetic} ${nums}`;
      changes.push(`${match} → ${result}`);
      return result;
    });

    if (changes.length > 0) {
      console.log('📝 Aviation text preprocessing changes:', changes);
    }

    return processed;
  }

  /**
   * Map generic voice names to ElevenLabs voice IDs
   */
  private getVoiceId(voice?: string): string {
    // Default voices mapping
    const voiceMap: Record<string, string> = {
      'alloy': '21m00Tcm4TlvDq8ikWAM', // Rachel
      'echo': 'yoZ06aMxZJJ28mfd3POQ', // Sam
      'fable': 'MF3mGyEYCl7XYWbV9V6O', // Emily
      'onyx': 'pNInz6obpgDQGcFmaJgB', // Adam
      'nova': '21m00Tcm4TlvDq8ikWAM', // Rachel (default for ATC)
      'shimmer': 'jsCqWAovK2LkecY7zXl4', // Domi
    };

    return voiceMap[voice || 'nova'] || voiceMap['nova'];
  }
}

// Export a singleton instance
export const elevenLabsService = new ElevenLabsService();