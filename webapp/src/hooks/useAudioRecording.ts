import { useState, useRef, useCallback } from 'react';

interface UseAudioRecordingOptions {
  onDataAvailable?: (blob: Blob) => void;
  mimeType?: string;
  audioBitsPerSecond?: number;
  timeSlice?: number; // How often to get data chunks in ms
}

export function useAudioRecording(options?: UseAudioRecordingOptions) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mimeTypeRef = useRef<string>('audio/webm');

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      
      // Determine the best supported mime type
      let mimeType = options?.mimeType;
      if (!mimeType) {
        // Try different mime types in order of preference
        const mimeTypes = [
          'audio/webm',
          'audio/webm;codecs=opus',
          'audio/ogg;codecs=opus',
          'audio/mp4',
        ];
        
        for (const type of mimeTypes) {
          if (MediaRecorder.isTypeSupported(type)) {
            mimeType = type;
            break;
          }
        }
        
        // Fallback to default if none supported
        if (!mimeType) {
          mimeType = 'audio/webm';
        }
      }
      
      console.log('Using mime type:', mimeType);
      mimeTypeRef.current = mimeType;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: options?.audioBitsPerSecond || 128000,
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          
          // For real-time processing, send chunks immediately
          if (options?.onDataAvailable) {
            const blob = new Blob([event.data], { type: mimeTypeRef.current });
            options.onDataAvailable(blob);
          }
        }
      };
      
      // Start recording with timeslice for real-time data
      const timeSlice = options?.timeSlice || 3000; // Default 3 seconds for good chunk size
      mediaRecorder.start(timeSlice);
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
    }
  }, [options]);

  const stopRecording = useCallback(() => {
    return new Promise<Blob | null>((resolve) => {
      if (!mediaRecorderRef.current || !streamRef.current) {
        resolve(null);
        return;
      }

      const mediaRecorder = mediaRecorderRef.current;
      
      mediaRecorder.onstop = () => {
        // Create final blob from all chunks
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        
        // Stop all tracks
        streamRef.current?.getTracks().forEach(track => track.stop());
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Reset state
        setIsRecording(false);
        mediaRecorderRef.current = null;
        streamRef.current = null;
        
        resolve(blob);
      };
      
      mediaRecorder.stop();
    });
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    isRecording,
    recordingTime,
    formattedTime: formatTime(recordingTime),
    error,
    startRecording,
    stopRecording,
  };
}