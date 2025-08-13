import { useState, useRef, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { useAudioRecording } from './useAudioRecording';
import { useToast } from './use-toast';

interface UseVoiceInputOptions {
  onTranscription?: (text: string, isFinal: boolean) => void;
  onStart?: () => void;
  onStop?: () => void;
  onError?: (error: string) => void;
  language?: string;
  contextPrompt?: string;
  autoStop?: boolean; // Automatically stop after silence
  silenceTimeout?: number; // Milliseconds of silence before auto-stop
  streaming?: boolean; // Enable streaming transcription
  streamingInterval?: number; // How often to transcribe in ms (default 2000)
}

export function useVoiceInput(options?: UseVoiceInputOptions) {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  
  const audioChunksRef = useRef<Blob[]>([]);
  const processedChunksRef = useRef<number>(0);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSoundTimeRef = useRef<number>(Date.now());
  const accumulatedTranscriptRef = useRef<string>('');
  
  // Transcription mutation
  const transcribeMutation = trpc.speech.transcribeAudio.useMutation({
    onSuccess: (result) => {
      const text = result.text.trim();
      if (!text) return;
      
      // For streaming, accumulate the transcript
      if (options?.streaming && isListening) {
        // This is an interim result
        setInterimTranscript(text);
        options?.onTranscription?.(text, false);
      } else {
        // This is the final result
        const finalText = accumulatedTranscriptRef.current 
          ? `${accumulatedTranscriptRef.current} ${text}` 
          : text;
        setTranscript(finalText);
        accumulatedTranscriptRef.current = finalText;
        options?.onTranscription?.(finalText, true);
      }
      setIsTranscribing(false);
    },
    onError: (error) => {
      const errorMessage = error.message || 'Failed to transcribe audio';
      console.error('Transcription error:', error);
      // Don't show toast for streaming errors while recording
      if (!isListening) {
        toast({
          title: 'Transcription Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
      options?.onError?.(errorMessage);
      setIsTranscribing(false);
    },
  });
  
  // Process audio chunks for streaming transcription
  const processStreamingChunks = useCallback(async () => {
    const unprocessedChunks = audioChunksRef.current.slice(processedChunksRef.current);
    if (unprocessedChunks.length === 0 || isTranscribing) return;
    
    setIsTranscribing(true);
    
    // Create a blob from unprocessed chunks
    const audioBlob = new Blob(unprocessedChunks, { type: 'audio/webm' });
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64Audio = base64data.split(',')[1];
      
      // Send for transcription with context about previous transcript
      const contextPrompt = options?.contextPrompt 
        ? `${options.contextPrompt}. Previous context: ${accumulatedTranscriptRef.current}`
        : `Previous context: ${accumulatedTranscriptRef.current}`;
      
      transcribeMutation.mutate({
        audioData: base64Audio,
        language: options?.language || 'en',
        prompt: contextPrompt,
      });
      
      // Mark these chunks as processed
      processedChunksRef.current = audioChunksRef.current.length;
    };
    reader.readAsDataURL(audioBlob);
  }, [isTranscribing, transcribeMutation, options?.contextPrompt, options?.language]);
  
  // Process all audio chunks for final transcription
  const processFinalAudio = useCallback(async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsTranscribing(true);
    
    // Combine all audio chunks for final transcription
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64Audio = base64data.split(',')[1];
      
      // Send for final transcription
      transcribeMutation.mutate({
        audioData: base64Audio,
        language: options?.language || 'en',
        prompt: options?.contextPrompt,
      });
    };
    reader.readAsDataURL(audioBlob);
  }, [transcribeMutation, options?.language, options?.contextPrompt]);
  
  // Audio recording hook
  const {
    isRecording,
    formattedTime,
    error: recordingError,
    startRecording: startAudioRecording,
    stopRecording: stopAudioRecording,
  } = useAudioRecording({
    timeSlice: 100, // Get chunks every 100ms
    onDataAvailable: (blob) => {
      if (blob.size === 0) return;
      
      // Store chunk
      audioChunksRef.current.push(blob);
      
      // Update last sound time (simple size-based detection)
      if (blob.size > 100) { // Threshold for "sound"
        lastSoundTimeRef.current = Date.now();
      }
      
      // Check for silence if auto-stop is enabled
      if (options?.autoStop && silenceTimerRef.current === null) {
        silenceTimerRef.current = setTimeout(() => {
          const silenceDuration = Date.now() - lastSoundTimeRef.current;
          if (silenceDuration >= (options.silenceTimeout || 2000)) {
            // Auto-stop after silence
            stopListening();
          }
          silenceTimerRef.current = null;
        }, options.silenceTimeout || 2000);
      }
    },
  });
  
  const startListening = useCallback(async () => {
    try {
      // Clear previous state
      audioChunksRef.current = [];
      processedChunksRef.current = 0;
      accumulatedTranscriptRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      setIsListening(true);
      lastSoundTimeRef.current = Date.now();
      
      // Start recording
      await startAudioRecording();
      options?.onStart?.();
      
      // Start streaming transcription if enabled
      if (options?.streaming) {
        const interval = options.streamingInterval || 2000;
        streamingTimerRef.current = setInterval(() => {
          processStreamingChunks();
        }, interval);
      }
      
      toast({
        title: 'Listening...',
        description: options?.streaming 
          ? 'Speak clearly - transcribing in real-time' 
          : 'Speak clearly into your microphone',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start recording';
      console.error('Failed to start recording:', error);
      toast({
        title: 'Microphone Error',
        description: errorMessage,
        variant: 'destructive',
      });
      options?.onError?.(errorMessage);
      setIsListening(false);
    }
  }, [startAudioRecording, toast, options, processStreamingChunks]);
  
  const stopListening = useCallback(async () => {
    if (!isRecording) return;
    
    // Clear timers
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }
    
    // Stop recording
    const audioBlob = await stopAudioRecording();
    setIsListening(false);
    setInterimTranscript('');
    options?.onStop?.();
    
    // Process the final audio
    if (audioChunksRef.current.length > 0 || audioBlob) {
      if (options?.streaming) {
        // For streaming, do a final transcription of all audio
        await processFinalAudio();
      } else {
        // For non-streaming, process all audio now
        await processFinalAudio();
      }
    } else {
      toast({
        title: 'No Audio',
        description: 'No audio was recorded. Please try again.',
        variant: 'destructive',
      });
    }
  }, [isRecording, stopAudioRecording, processFinalAudio, toast, options]);
  
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);
  
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    accumulatedTranscriptRef.current = '';
  }, []);
  
  return {
    // State
    isListening,
    isTranscribing,
    transcript,
    interimTranscript,
    recordingTime: formattedTime,
    error: recordingError,
    
    // Actions
    startListening,
    stopListening,
    toggleListening,
    clearTranscript,
    
    // Status
    isProcessing: isListening || isTranscribing,
  };
}