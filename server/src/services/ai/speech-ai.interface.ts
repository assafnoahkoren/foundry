export interface SpeechTranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
  duration?: number;
}

export interface SpeechAIService {
  /**
   * Transcribe audio to text
   * @param audioBuffer - Audio data as Buffer
   * @param options - Optional configuration for transcription
   * @returns Transcribed text with metadata
   */
  transcribeAudio(
    audioBuffer: Buffer,
    options?: {
      language?: string;
      prompt?: string;
      temperature?: number;
    }
  ): Promise<SpeechTranscriptionResult>;

  /**
   * Check if the service is available
   */
  isAvailable(): Promise<boolean>;
}