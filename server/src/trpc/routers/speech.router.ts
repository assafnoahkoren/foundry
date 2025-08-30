import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { openAISpeechService } from '../../services/ai/openai-speech.service';
import { elevenLabsService } from '../../services/ai/elevenlabs.service';

const transcribeAudioSchema = z.object({
  audioData: z.string(), // Base64 encoded audio data
  language: z.string().optional(),
  prompt: z.string().optional(),
});

// Transcribe audio to text
const transcribeAudioProcedure = protectedProcedure
  .input(transcribeAudioSchema)
  .mutation(async ({ input }) => {
    // Convert base64 to buffer
    // Remove data URL prefix if present (e.g., "data:audio/webm;base64,")
    const base64Data = input.audioData.includes(',') 
      ? input.audioData.split(',')[1] 
      : input.audioData;
    
    const audioBuffer = Buffer.from(base64Data, 'base64');
    
    console.log('Received audio data length:', input.audioData.length);
    console.log('Base64 data length after cleanup:', base64Data.length);
    console.log('Buffer size:', audioBuffer.length);
    
    return openAISpeechService.transcribeAudio(audioBuffer, {
      language: input.language,
      prompt: input.prompt,
    });
  });

// Text to speech schema
const textToSpeechSchema = z.object({
  text: z.string(),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional(),
  model: z.enum(['tts-1', 'tts-1-hd']).optional(),
  speed: z.number().min(0.25).max(4.0).optional(),
  format: z.enum(['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm']).optional(),
});

// Convert text to speech
const textToSpeechProcedure = protectedProcedure
  .input(textToSpeechSchema)
  .mutation(async ({ input }) => {
    try {
      // Generate speech using ElevenLabs and return as base64 data URL
      const audioBase64 = await elevenLabsService.textToSpeechBase64(input.text, {
        voice: input.voice,
        model: input.model,
        speed: input.speed,
        format: input.format,
      });
      
      return {
        audio: audioBase64,
        format: input.format || 'mp3',
      };
    } catch (error) {
      console.error('Error generating speech:', error);
      throw new Error('Failed to generate speech');
    }
  });

// Aviation radio transmission TTS schema
const radioTransmissionSchema = z.object({
  text: z.string(),
  role: z.enum(['pilot', 'atc']).optional().default('atc'),
});

// Generate aviation radio transmission audio
const generateRadioTransmissionProcedure = protectedProcedure
  .input(radioTransmissionSchema)
  .mutation(async ({ input }) => {
    try {
      const audioBase64 = await elevenLabsService.generateRadioTransmission(
        input.text,
        input.role
      );
      
      return {
        audio: audioBase64,
        format: 'mp3',
      };
    } catch (error) {
      console.error('Error generating radio transmission:', error);
      throw new Error('Failed to generate radio transmission audio');
    }
  });

// Compose the router
export const speechRouter = router({
  transcribeAudio: transcribeAudioProcedure,
  textToSpeech: textToSpeechProcedure,
  generateRadioTransmission: generateRadioTransmissionProcedure,
});