import { useEffect, useRef } from 'react';
import { useAudio } from '../AudioContext';

export default function AudioEngine() {
  const { 
    tracks, 
    subliminalTracks, 
    currentTrackIndex, 
    isPlaying, 
    settings,
    setCurrentTime,
    setDuration,
    setIsPlaying
  } = useAudio();
  
  const { seekRequest, clearSeekRequest } = useAudio();
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const subAudioRef = useRef<HTMLAudioElement | null>(null);
  const delayTimeoutRef = useRef<number | null>(null);

  // Binaural Web Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const binauralGainRef = useRef<GainNode | null>(null);

  // Initialize Web Audio and Cleanup
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(console.error);
      }
    };
  }, []);

  const setupBinaural = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(console.error);
    }

    if (!leftOscRef.current || !rightOscRef.current) {
      // Create Nodes
      const leftOsc = ctx.createOscillator();
      const rightOsc = ctx.createOscillator();
      const merger = ctx.createChannelMerger(2);
      const gainNode = ctx.createGain();

      leftOsc.type = 'sine';
      rightOsc.type = 'sine';

      // Initial frequencies
      leftOsc.frequency.setValueAtTime(settings.binaural.leftFreq, ctx.currentTime);
      rightOsc.frequency.setValueAtTime(settings.binaural.rightFreq, ctx.currentTime);

      // Route: Left -> Channel 0, Right -> Channel 1 (Explicit Stereo)
      leftOsc.connect(merger, 0, 0);
      rightOsc.connect(merger, 0, 1);

      merger.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);

      leftOsc.start();
      rightOsc.start();

      leftOscRef.current = leftOsc;
      rightOscRef.current = rightOsc;
      binauralGainRef.current = gainNode;
    }
  };

  // Handle Seek Request
  useEffect(() => {
    if (seekRequest !== null && mainAudioRef.current) {
      mainAudioRef.current.currentTime = seekRequest;
      clearSeekRequest();
    }
  }, [seekRequest]);

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;
  const subTrack = subliminalTracks.find(t => t.id === settings.subliminal.selectedTrackId);

  // Initialize main audio
  useEffect(() => {
    const audio = new Audio();
    mainAudioRef.current = audio;
    
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, []);

  // Initialize subliminal audio
  useEffect(() => {
    const audio = new Audio();
    subAudioRef.current = audio;
    return () => audio.pause();
  }, []);

  // Handle Main Track Source Change
  useEffect(() => {
    if (mainAudioRef.current && currentTrack) {
      const wasPlaying = isPlaying;
      mainAudioRef.current.src = currentTrack.url;
      if (wasPlaying) {
        mainAudioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrack]);

  // Handle Play/Pause
  useEffect(() => {
    if (!mainAudioRef.current) return;

    if (isPlaying) {
      mainAudioRef.current.play().catch(e => {
        console.error("Playback error:", e);
        setIsPlaying(false);
      });
      
      // Start subliminal with delay
      if (settings.subliminal.isEnabled && subTrack && subAudioRef.current) {
        if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
        
        delayTimeoutRef.current = window.setTimeout(() => {
          if (subAudioRef.current && isPlaying) {
            subAudioRef.current.src = subTrack.url;
            subAudioRef.current.loop = settings.subliminal.isLooping;
            subAudioRef.current.play().catch(console.error);
          }
        }, settings.subliminal.delayMs);
      }
    } else {
      mainAudioRef.current.pause();
      if (subAudioRef.current) subAudioRef.current.pause();
      if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
    }
  }, [isPlaying, settings.subliminal.isEnabled, subTrack]);

  // Handle Binaural Playback and Fading
  useEffect(() => {
    if (isPlaying && settings.binaural.isEnabled) {
      setupBinaural();
      if (binauralGainRef.current && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const fadeTime = settings.fadeInOut ? 3 : 0.1;
        binauralGainRef.current.gain.setTargetAtTime(settings.binaural.volume, ctx.currentTime, fadeTime / 2);
      }
    } else {
      if (binauralGainRef.current && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const fadeTime = settings.fadeInOut ? 3 : 0.1;
        binauralGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, fadeTime / 2);
      }
    }
  }, [isPlaying, settings.binaural.isEnabled, settings.fadeInOut]);

  // Handle Binaural Frequency/Volume Updates
  useEffect(() => {
    if (leftOscRef.current && rightOscRef.current && audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      // Safety: Difference <= 30Hz
      const diff = Math.abs(settings.binaural.leftFreq - settings.binaural.rightFreq);
      let lFreq = settings.binaural.leftFreq;
      let rFreq = settings.binaural.rightFreq;
      
      if (diff > 30) {
        rFreq = lFreq + 30; // Force limit
      }

      leftOscRef.current.frequency.setTargetAtTime(lFreq, ctx.currentTime, 0.1);
      rightOscRef.current.frequency.setTargetAtTime(rFreq, ctx.currentTime, 0.1);
    }
    
    if (binauralGainRef.current && audioCtxRef.current && isPlaying && settings.binaural.isEnabled) {
      const ctx = audioCtxRef.current;
      binauralGainRef.current.gain.setTargetAtTime(settings.binaural.volume, ctx.currentTime, 0.1);
    }
  }, [settings.binaural.leftFreq, settings.binaural.rightFreq, settings.binaural.volume]);

  // Handle Volume Balance
  useEffect(() => {
    if (mainAudioRef.current) {
      // Music is 100% base layer
      mainAudioRef.current.volume = 1;
    }
    if (subAudioRef.current) {
      // Subliminal is subtle overlay
      subAudioRef.current.volume = settings.subliminal.volume;
    }
  }, [settings.subliminal.volume]);

  // Sync handles
  useEffect(() => {
    if (subAudioRef.current && subTrack) {
      subAudioRef.current.loop = settings.subliminal.isLooping;
    }
  }, [settings.subliminal.isLooping, subTrack]);

  return null;
}
