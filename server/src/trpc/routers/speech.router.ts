import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { openAISpeechService } from '../../services/ai/openai-speech.service';

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

// Compose the router
export const speechRouter = router({
  transcribeAudio: transcribeAudioProcedure,
});