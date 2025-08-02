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
    const audioBuffer = Buffer.from(input.audioData, 'base64');
    
    return openAISpeechService.transcribeAudio(audioBuffer, {
      language: input.language,
      prompt: input.prompt,
    });
  });

// Compose the router
export const speechRouter = router({
  transcribeAudio: transcribeAudioProcedure,
});