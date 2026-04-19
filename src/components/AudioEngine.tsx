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
    setIsPlaying,
    playNext,
    playPrevious,
    seekTo
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

  // Noise & Nature Refs
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const natureAudioRef = useRef<HTMLAudioElement | null>(null);

  const NATURE_URLS = {
    rain: 'https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3',
    ocean: 'https://assets.mixkit.co/sfx/preview/mixkit-ocean-waves-loop-1196.mp3',
    forest: 'https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-loop-1210.mp3',
    wind: 'https://assets.mixkit.co/sfx/preview/mixkit-wind-whistle-loop-1159.mp3',
  };

  // iOS Background Audio & Media Session Setup
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined) seekTo(details.seekTime);
      });
    }

    return () => {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      }
    };
  }, [playNext, playPrevious, setIsPlaying, seekTo]);

  // Sync Media Session Metadata
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrackIndex !== null && tracks[currentTrackIndex]) {
      const track = tracks[currentTrackIndex];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.name,
        artist: track.artist || 'Unknown Artist',
        album: 'Subliminal Journey',
        artwork: [
          { src: track.artwork || 'https://picsum.photos/seed/music/512/512', sizes: '512x512', type: 'image/png' }
        ]
      });
    }
  }, [currentTrackIndex, tracks]);

  // Initialize Web Audio and Cleanup
  useEffect(() => {
    natureAudioRef.current = new Audio();
    natureAudioRef.current.loop = true;
    (natureAudioRef.current as any).playsInline = true;
    (natureAudioRef.current as any).webkitPlaysInline = true;

    // iOS Safari Audio Unlock Helper
    const unlockAudio = () => {
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      // Remove after first interaction
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);

    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(console.error);
      }
      if (natureAudioRef.current) {
        natureAudioRef.current.pause();
      }
      if (mainAudioRef.current?.src.startsWith('blob:')) {
        URL.revokeObjectURL(mainAudioRef.current.src);
      }
      if (subAudioRef.current?.src.startsWith('blob:')) {
        URL.revokeObjectURL(subAudioRef.current.src);
      }
    };
  }, []);

  const createNoiseBuffer = (type: 'white' | 'pink' | 'brown') => {
    if (!audioCtxRef.current) return null;
    const ctx = audioCtxRef.current;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      let b0, b1, b2, b3, b4, b5, b6;
      b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3102503;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= 0.11; // (roughly) apply gain
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const out = (lastOut + (0.02 * white)) / 1.02;
        lastOut = out;
        output[i] = out * 3.5; // (roughly) apply gain
      }
    }
    return buffer;
  };

  const setupNoise = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      
      if (!noiseGainRef.current) {
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.connect(ctx.destination);
        noiseGainRef.current = gain;
      }
    } catch (err) {
      console.error("Failed to setup noise context:", err);
    }
  };

  const setupBinaural = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;

      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
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
    } catch (err) {
      console.error("Binaural setup failed:", err);
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
    (audio as any).playsInline = true;
    (audio as any).webkitPlaysInline = true;
    mainAudioRef.current = audio;
    
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    const onError = (e: any) => {
      console.warn("Main Engine: Audio resource stall detected. Retrying state.", e);
      if (isPlaying) {
        setTimeout(() => audio.play().catch(() => {}), 1000);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('stalled', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('stalled', onError);
      audio.pause();
    };
  }, []);

  // Initialize subliminal audio
  useEffect(() => {
    const audio = new Audio();
    (audio as any).playsInline = true;
    (audio as any).webkitPlaysInline = true;
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

  // Handle Play/Pause and MediaSession State
  useEffect(() => {
    if (!mainAudioRef.current) return;

    if (isPlaying) {
      mainAudioRef.current.play().catch(e => {
        console.error("Playback error:", e);
        setIsPlaying(false);
      });
      
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      
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
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
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

  // Handle Noise Layer
  useEffect(() => {
    if (isPlaying && settings.noise.isEnabled) {
      setupNoise();
      const ctx = audioCtxRef.current!;
      
      // Stop old noise if type changed
      if (noiseNodeRef.current) {
        noiseNodeRef.current.stop();
        noiseNodeRef.current = null;
      }

      const buffer = createNoiseBuffer(settings.noise.type);
      const source = ctx.createBufferSource();
      source.buffer = buffer!;
      source.loop = true;
      source.connect(noiseGainRef.current!);
      source.start();
      noiseNodeRef.current = source;

      const fadeTime = settings.fadeInOut ? 3 : 0.1;
      noiseGainRef.current!.gain.setTargetAtTime(settings.noise.volume, ctx.currentTime, fadeTime / 2);
    } else {
      if (noiseGainRef.current && audioCtxRef.current) {
        const ctx = audioCtxRef.current;
        const fadeTime = settings.fadeInOut ? 3 : 0.1;
        noiseGainRef.current.gain.setTargetAtTime(0, ctx.currentTime, fadeTime / 2);
        
        const timer = setTimeout(() => {
           if (!settings.noise.isEnabled && noiseNodeRef.current) {
             noiseNodeRef.current.stop();
             noiseNodeRef.current = null;
           }
        }, fadeTime * 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [isPlaying, settings.noise.isEnabled, settings.noise.type]);

  // Handle Nature Layer
  useEffect(() => {
    if (isPlaying && settings.nature.isEnabled && natureAudioRef.current) {
      const audio = natureAudioRef.current;
      audio.src = NATURE_URLS[settings.nature.type];
      audio.volume = settings.nature.volume;
      audio.play().catch(console.error);
    } else {
      if (natureAudioRef.current) {
        natureAudioRef.current.pause();
      }
    }
  }, [isPlaying, settings.nature.isEnabled, settings.nature.type]);

  useEffect(() => {
    if (natureAudioRef.current) {
      natureAudioRef.current.volume = settings.nature.volume;
    }
  }, [settings.nature.volume]);

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
