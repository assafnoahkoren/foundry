export interface TextToSpeechOptions {
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  model?: 'tts-1' | 'tts-1-hd';
  speed?: number; // 0.25 to 4.0
  format?: 'mp3' | 'opus' | 'aac' | 'flac' | 'wav' | 'pcm';
}

export interface AiService {
  /**
   * Ask the LLM a question and get a response
   * @param question The question to ask
   * @returns The LLM's response
   */
  askLLM(question: string): Promise<string>;

  /**
   * Convert text to speech
   * @param text The text to convert to speech
   * @param options Optional TTS configuration
   * @returns Audio data as Buffer
   */
  textToSpeech(text: string, options?: TextToSpeechOptions): Promise<Buffer>;

  /**
   * Convert text to speech and return as base64
   * @param text The text to convert to speech
   * @param options Optional TTS configuration
   * @returns Base64 encoded audio data
   */
  textToSpeechBase64(text: string, options?: TextToSpeechOptions): Promise<string>;
}