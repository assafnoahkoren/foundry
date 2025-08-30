import { useState, useEffect, useRef, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { useRadioEffect } from './useRadioEffect';

interface UseTextToSpeechOptions {
  text: string;
  role?: 'pilot' | 'atc';
  autoFetch?: boolean;
  onError?: (error: Error) => void;
  applyRadioEffect?: boolean;
}

interface UseTextToSpeechReturn {
  isLoading: boolean;
  isPlaying: boolean;
  audioUrl: string | null;
  error: Error | null;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  fetchAudio: () => Promise<void>;
}

export function useTextToSpeech({
  text,
  role = 'atc',
  autoFetch = true,
  onError,
  applyRadioEffect = true,
}: UseTextToSpeechOptions): UseTextToSpeechReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMountedRef = useRef(true);
  const radioEffectAppliedRef = useRef(false);
  
  const { applyRadioEffect: applyRadioEffectFn, stopNoise, cleanup: cleanupRadioEffect } = useRadioEffect({
    lowFrequency: 300,
    highFrequency: 3400,
    distortion: 15,
    noiseLevel: 0.008,  // Reduced from 0.015 for subtler background noise
    compressionRatio: 10,
    compressionThreshold: -20
  });
  
  // Mutation for generating radio transmission audio
  const generateAudioMutation = trpc.speech.generateRadioTransmission.useMutation({
    onSuccess: async (data) => {
      if (isMountedRef.current) {
        setAudioUrl(data.audio);
        setIsLoading(false);
        setError(null);
        
        // Preload audio
        if (data.audio && !audioRef.current) {
          const audio = new Audio(data.audio);
          audio.preload = 'auto';
          audioRef.current = audio;
          
          // Set up event listeners
          audio.addEventListener('ended', handleAudioEnded);
          audio.addEventListener('play', handleAudioPlay);
          audio.addEventListener('pause', handleAudioPause);
          audio.addEventListener('error', handleAudioError);
          
          // Apply radio effect if enabled
          if (applyRadioEffect && !radioEffectAppliedRef.current) {
            try {
              await applyRadioEffectFn(audio);
              radioEffectAppliedRef.current = true;
            } catch (err) {
              console.error('Failed to apply radio effect:', err);
              // Continue without the effect
            }
          }
        }
      }
    },
    onError: (err) => {
      if (isMountedRef.current) {
        const error = new Error(err.message || 'Failed to generate audio');
        setError(error);
        setIsLoading(false);
        onError?.(error);
      }
    },
  });
  
  // Event handlers
  const handleAudioEnded = useCallback(() => {
    if (isMountedRef.current) {
      setIsPlaying(false);
      // Stop radio noise when audio ends
      if (applyRadioEffect && radioEffectAppliedRef.current) {
        stopNoise();
      }
    }
  }, [applyRadioEffect, stopNoise]);
  
  const handleAudioPlay = useCallback(() => {
    if (isMountedRef.current) {
      setIsPlaying(true);
    }
  }, []);
  
  const handleAudioPause = useCallback(() => {
    if (isMountedRef.current) {
      setIsPlaying(false);
    }
  }, []);
  
  const handleAudioError = useCallback((e: Event) => {
    if (isMountedRef.current) {
      const target = e.target as HTMLAudioElement;
      const error = new Error(`Audio playback error: ${target.error?.message || 'Unknown error'}`);
      setError(error);
      setIsPlaying(false);
      onError?.(error);
    }
  }, [onError]);
  
  // Fetch audio
  const fetchAudio = useCallback(async () => {
    if (!text || isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await generateAudioMutation.mutateAsync({ text, role });
    } catch (err) {
      // Error is handled in mutation onError
      console.error('Failed to fetch audio:', err);
    }
  }, [text, role, isLoading, generateAudioMutation]);
  
  // Play audio
  const play = useCallback(async () => {
    if (!audioUrl && !isLoading) {
      await fetchAudio();
      return;
    }
    
    if (audioRef.current) {
      try {
        await audioRef.current.play();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to play audio');
        setError(error);
        onError?.(error);
      }
    } else if (audioUrl) {
      // Create audio element if it doesn't exist
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set up event listeners
      audio.addEventListener('ended', handleAudioEnded);
      audio.addEventListener('play', handleAudioPlay);
      audio.addEventListener('pause', handleAudioPause);
      audio.addEventListener('error', handleAudioError);
      
      // Apply radio effect if enabled and not already applied
      if (applyRadioEffect && !radioEffectAppliedRef.current) {
        try {
          await applyRadioEffectFn(audio);
          radioEffectAppliedRef.current = true;
        } catch (err) {
          console.error('Failed to apply radio effect:', err);
          // Continue without the effect
        }
      }
      
      try {
        await audio.play();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to play audio');
        setError(error);
        onError?.(error);
      }
    }
  }, [audioUrl, isLoading, fetchAudio, handleAudioEnded, handleAudioPlay, handleAudioPause, handleAudioError, onError, applyRadioEffect, applyRadioEffectFn]);
  
  // Pause audio
  const pause = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, []);
  
  // Stop audio
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      // Stop radio noise when stopping audio
      if (applyRadioEffect && radioEffectAppliedRef.current) {
        stopNoise();
      }
    }
  }, [applyRadioEffect, stopNoise]);
  
  // Auto-fetch audio on mount or text change
  useEffect(() => {
    if (autoFetch && text && !audioUrl && !isLoading) {
      fetchAudio();
    }
  }, [text, autoFetch]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      
      // Clean up audio element
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        audioRef.current.removeEventListener('play', handleAudioPlay);
        audioRef.current.removeEventListener('pause', handleAudioPause);
        audioRef.current.removeEventListener('error', handleAudioError);
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Clean up radio effect
      cleanupRadioEffect();
      radioEffectAppliedRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  return {
    isLoading,
    isPlaying,
    audioUrl,
    error,
    play,
    pause,
    stop,
    fetchAudio,
  };
}