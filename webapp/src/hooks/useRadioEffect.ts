import { useRef, useCallback } from 'react';

interface RadioEffectOptions {
  // Bandpass filter frequencies for radio sound
  lowFrequency?: number;
  highFrequency?: number;
  // Distortion amount (0-100)
  distortion?: number;
  // Noise level (0-1)
  noiseLevel?: number;
  // Compression for radio dynamics
  compressionRatio?: number;
  compressionThreshold?: number;
}

interface RadioEffectNodes {
  source: MediaElementAudioSourceNode;
  noiseSource: AudioBufferSourceNode;
  noiseGain: GainNode;
}

export function useRadioEffect(options: RadioEffectOptions = {}) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseBufferRef = useRef<AudioBuffer | null>(null);
  const activeNodesRef = useRef<RadioEffectNodes | null>(null);

  // Initialize audio context lazily
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      // Handle vendor prefixes for AudioContext
      const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      } else {
        throw new Error('Web Audio API is not supported in this browser');
      }
    }
    return audioContextRef.current;
  }, []);

  // Create white noise buffer for background static
  const createNoiseBuffer = useCallback((audioContext: AudioContext): AudioBuffer => {
    if (noiseBufferRef.current) {
      return noiseBufferRef.current;
    }

    const bufferSize = audioContext.sampleRate * 2; // 2 seconds of noise
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    noiseBufferRef.current = buffer;
    return buffer;
  }, []);

  // Create distortion curve for waveshaping
  const makeDistortionCurve = useCallback((amount: number): Float32Array => {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }

    return curve;
  }, []);

  // Stop noise source
  const stopNoise = useCallback(() => {
    if (activeNodesRef.current) {
      try {
        // Stop and disconnect noise source
        activeNodesRef.current.noiseSource.stop();
        activeNodesRef.current.noiseSource.disconnect();
        activeNodesRef.current.noiseGain.disconnect();
      } catch {
        // Ignore errors if already stopped
      }
      activeNodesRef.current = null;
    }
  }, []);

  // Apply radio effects to an audio element
  const applyRadioEffect = useCallback(async (
    audioElement: HTMLAudioElement,
    customOptions?: RadioEffectOptions
  ): Promise<MediaElementAudioSourceNode> => {
    const {
      lowFrequency = 300,
      highFrequency = 3400,
      distortion = 20,
      noiseLevel = 0.02,
      compressionRatio = 12,
      compressionThreshold = -24
    } = { ...options, ...customOptions };

    const audioContext = getAudioContext();

    // Stop any existing noise source first
    stopNoise();

    // Create audio source from element
    const source = audioContext.createMediaElementSource(audioElement);

    // Create filters and effects
    const highpassFilter = audioContext.createBiquadFilter();
    highpassFilter.type = 'highpass';
    highpassFilter.frequency.value = lowFrequency;
    highpassFilter.Q.value = 0.7;

    const lowpassFilter = audioContext.createBiquadFilter();
    lowpassFilter.type = 'lowpass';
    lowpassFilter.frequency.value = highFrequency;
    lowpassFilter.Q.value = 0.7;

    // Add slight resonance peak for radio characteristic
    const bandpassFilter = audioContext.createBiquadFilter();
    bandpassFilter.type = 'peaking';
    bandpassFilter.frequency.value = 2000;
    bandpassFilter.Q.value = 2;
    bandpassFilter.gain.value = 6;

    // Waveshaper for distortion
    const waveshaper = audioContext.createWaveShaper();
    waveshaper.curve = makeDistortionCurve(distortion);
    waveshaper.oversample = '4x';

    // Compressor for radio dynamics
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.value = compressionThreshold;
    compressor.knee.value = 2;
    compressor.ratio.value = compressionRatio;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Create noise source for background static
    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = createNoiseBuffer(audioContext);
    noiseSource.loop = true;

    const noiseGain = audioContext.createGain();
    noiseGain.gain.value = noiseLevel;

    // Connect the audio chain
    source
      .connect(highpassFilter)
      .connect(lowpassFilter)
      .connect(bandpassFilter)
      .connect(waveshaper)
      .connect(compressor);

    // Mix in noise
    noiseSource.connect(noiseGain);
    noiseGain.connect(compressor);

    // Connect to output
    compressor.connect(audioContext.destination);

    // Start noise
    noiseSource.start();

    // Store active nodes for cleanup
    activeNodesRef.current = { source, noiseSource, noiseGain };

    // Listen for audio element ended event to stop noise
    const handleAudioEnded = () => {
      stopNoise();
    };
    
    audioElement.addEventListener('ended', handleAudioEnded);
    audioElement.addEventListener('pause', handleAudioEnded);

    return source;
  }, [getAudioContext, createNoiseBuffer, makeDistortionCurve, options, stopNoise]);

  // Process audio buffer directly (for pre-processing)
  const processAudioBuffer = useCallback(async (
    audioData: ArrayBuffer,
    customOptions?: RadioEffectOptions
  ): Promise<ArrayBuffer> => {
    const {
      lowFrequency = 300,
      highFrequency = 3400,
      distortion = 20,
      noiseLevel = 0.02,
      compressionRatio = 12,
      compressionThreshold = -24
    } = { ...options, ...customOptions };

    const audioContext = getAudioContext();

    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(audioData.slice(0));

    // Create offline context for processing
    const offlineContext = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    // Create buffer source
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    // Create filters and effects (same as above)
    const highpassFilter = offlineContext.createBiquadFilter();
    highpassFilter.type = 'highpass';
    highpassFilter.frequency.value = lowFrequency;
    highpassFilter.Q.value = 0.7;

    const lowpassFilter = offlineContext.createBiquadFilter();
    lowpassFilter.type = 'lowpass';
    lowpassFilter.frequency.value = highFrequency;
    lowpassFilter.Q.value = 0.7;

    const bandpassFilter = offlineContext.createBiquadFilter();
    bandpassFilter.type = 'peaking';
    bandpassFilter.frequency.value = 2000;
    bandpassFilter.Q.value = 2;
    bandpassFilter.gain.value = 6;

    const waveshaper = offlineContext.createWaveShaper();
    waveshaper.curve = makeDistortionCurve(distortion);
    waveshaper.oversample = '4x';

    const compressor = offlineContext.createDynamicsCompressor();
    compressor.threshold.value = compressionThreshold;
    compressor.knee.value = 2;
    compressor.ratio.value = compressionRatio;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    // Create noise
    const noiseBuffer = offlineContext.createBuffer(
      1,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = (Math.random() * 2 - 1) * noiseLevel;
    }

    const noiseSource = offlineContext.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const noiseGain = offlineContext.createGain();
    noiseGain.gain.value = 1;

    // Connect chain
    source
      .connect(highpassFilter)
      .connect(lowpassFilter)
      .connect(bandpassFilter)
      .connect(waveshaper)
      .connect(compressor)
      .connect(offlineContext.destination);

    noiseSource
      .connect(noiseGain)
      .connect(compressor);

    // Start sources
    source.start();
    noiseSource.start();

    // Render
    const processedBuffer = await offlineContext.startRendering();

    // Convert back to ArrayBuffer
    const length = processedBuffer.length * processedBuffer.numberOfChannels * 2;
    const outputBuffer = new ArrayBuffer(length);
    const view = new DataView(outputBuffer);

    let offset = 0;
    for (let i = 0; i < processedBuffer.length; i++) {
      for (let channel = 0; channel < processedBuffer.numberOfChannels; channel++) {
        const sample = processedBuffer.getChannelData(channel)[i];
        // Convert float to 16-bit PCM
        const s = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, s * 0x7FFF, true);
        offset += 2;
      }
    }

    return outputBuffer;
  }, [getAudioContext, makeDistortionCurve, options]);

  // Cleanup
  const cleanup = useCallback(() => {
    stopNoise();
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    noiseBufferRef.current = null;
  }, [stopNoise]);

  return {
    applyRadioEffect,
    processAudioBuffer,
    stopNoise,
    cleanup
  };
}