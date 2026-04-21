import { useEffect, useRef, useMemo } from 'react';
import { useAudio } from '../AudioContext';
import { NATURE_SOUNDS } from '../constants';

export default function AudioEngine() {
  const { 
    tracks, 
    subliminalTracks, 
    currentTrackIndex, 
    isPlaying, 
    settings,
    playlists,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    playNext,
    playPrevious,
    seekTo,
    currentPlaybackList
  } = useAudio();
  
  const { seekRequest, clearSeekRequest } = useAudio();
  const mainAudioRef = useRef<HTMLAudioElement | null>(null);
  const subAudioRef = useRef<HTMLAudioElement | null>(null);
  const delayTimeoutRef = useRef<number | null>(null);
  const subPlaylistIndexRef = useRef<number>(0);

  // Binaural Web Audio Refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const binauralGainRef = useRef<GainNode | null>(null);
  
  // Audio Tools Refs
  const mainSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const subSourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const toolGainRef = useRef<GainNode | null>(null);
  const toolCompressorRef = useRef<DynamicsCompressorNode | null>(null);

  // Noise & Nature Refs
  const noiseNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const natureAudioRef = useRef<HTMLAudioElement | null>(null);

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

  const currentTrack = currentTrackIndex !== null ? currentPlaybackList[currentTrackIndex] : null;
  // Unified sourcing: Check both lists for the subliminal track
  const subTrack = useMemo(() => {
    // If playlist mode is on, we derive track from the selected playlist and our internal index
    if (settings.subliminal.isPlaylistMode && settings.subliminal.sourcePlaylistId) {
      const playlist = playlists.find(p => p.id === settings.subliminal.sourcePlaylistId);
      if (playlist && playlist.trackIds.length > 0) {
        // Ensure index is within bounds
        const trackId = playlist.trackIds[subPlaylistIndexRef.current % playlist.trackIds.length];
        return tracks.find(t => t.id === trackId);
      }
    }
    
    return subliminalTracks.find(t => t.id === settings.subliminal.selectedTrackId) || 
           tracks.find(t => t.id === settings.subliminal.selectedTrackId);
  }, [subliminalTracks, tracks, settings.subliminal.selectedTrackId, settings.subliminal.isPlaylistMode, settings.subliminal.sourcePlaylistId, playlists]);

  // Reset Subliminal Index on mode/playlist change
  useEffect(() => {
    subPlaylistIndexRef.current = 0;
  }, [settings.subliminal.sourcePlaylistId, settings.subliminal.isPlaylistMode]);

  // Initialize main audio element
  useEffect(() => {
    const audio = new Audio();
    (audio as any).playsInline = true;
    (audio as any).webkitPlaysInline = true;
    mainAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      mainAudioRef.current = null;
    };
  }, []);

  // Sync state and duration from main audio
  useEffect(() => {
    const audio = mainAudioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, [setCurrentTime, setDuration]);

  // Handle track ending and errors
  useEffect(() => {
    const audio = mainAudioRef.current;
    if (!audio) return;

    const onEnded = () => {
      console.log("AudioEngine: Track ended, advancing...");
      if (settings.loop === 'one') {
        if (mainAudioRef.current) {
          mainAudioRef.current.currentTime = 0;
          mainAudioRef.current.play().catch(console.error);
        }
      } else {
        playNext(true);
      }
    };

    let errorCount = 0;
    const onError = (e: any) => {
      console.warn("Main Engine: Audio resource stall or error detected.", e);
      if (isPlaying) {
        errorCount++;
        if (errorCount > 2) {
          console.error("Main Engine: Multiple playback errors. Skipping to next.");
          errorCount = 0;
          playNext(true);
          return;
        }
        setTimeout(() => {
          if (isPlaying && mainAudioRef.current) {
            mainAudioRef.current.play().catch(() => {});
          }
        }, 1000);
      }
    };

    const handleStalled = () => {
      console.warn("Main Engine: Playback stalled.");
      if (isPlaying) {
        setTimeout(() => {
          if (isPlaying && mainAudioRef.current && mainAudioRef.current.paused) {
             mainAudioRef.current.play().catch(() => {});
          }
        }, 1500);
      }
    };

    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [playNext, isPlaying]);

  // Initialize subliminal audio
  useEffect(() => {
    const audio = new Audio();
    (audio as any).playsInline = true;
    (audio as any).webkitPlaysInline = true;
    subAudioRef.current = audio;
    
    const onEnded = () => {
      if (settings.subliminal.isPlaylistMode && settings.subliminal.sourcePlaylistId) {
        const playlist = playlists.find(p => p.id === settings.subliminal.sourcePlaylistId);
        if (playlist && playlist.trackIds.length > 0) {
          // Skip missing tracks in playlist
          let found = false;
          let attempts = 0;
          while (!found && attempts < playlist.trackIds.length) {
            subPlaylistIndexRef.current = (subPlaylistIndexRef.current + 1) % playlist.trackIds.length;
            const nextTrackId = playlist.trackIds[subPlaylistIndexRef.current];
            const nextTrack = tracks.find(t => t.id === nextTrackId);
            if (nextTrack && !nextTrack.isMissing) {
              if (isPlaying) {
                audio.src = nextTrack.url;
                audio.play().catch(console.error);
              }
              found = true;
            }
            attempts++;
          }
        }
      }
    };

    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.pause();
    };
  }, [settings.subliminal.isPlaylistMode, settings.subliminal.sourcePlaylistId, playlists, tracks, isPlaying]);

  const setupAudioTools = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      
      if (!toolGainRef.current) {
        toolGainRef.current = ctx.createGain();
        toolCompressorRef.current = ctx.createDynamicsCompressor();
        
        // Setup Compressor as a Limiter for Normalization
        const comp = toolCompressorRef.current;
        comp.threshold.setValueAtTime(settings.audioTools.normalizeTargetDb !== null ? settings.audioTools.normalizeTargetDb : 0, ctx.currentTime);
        comp.knee.setValueAtTime(0, ctx.currentTime);
        comp.ratio.setValueAtTime(20, ctx.currentTime);
        comp.attack.setValueAtTime(0.003, ctx.currentTime);
        comp.release.setValueAtTime(0.25, ctx.currentTime);
        
        toolGainRef.current.connect(comp);
        comp.connect(ctx.destination);
      }
      
      if (mainAudioRef.current && !mainSourceRef.current) {
        mainSourceRef.current = ctx.createMediaElementSource(mainAudioRef.current);
        mainSourceRef.current.connect(toolGainRef.current);
      }
      
      if (subAudioRef.current && !subSourceRef.current) {
        subSourceRef.current = ctx.createMediaElementSource(subAudioRef.current);
        subSourceRef.current.connect(toolGainRef.current);
      }
    } catch (err) {
      console.error("Audio tools setup failed:", err);
    }
  };

  // Handle Audio Tools Real-time Updates
  useEffect(() => {
    if (audioCtxRef.current && toolGainRef.current && toolCompressorRef.current) {
      const ctx = audioCtxRef.current;
      // Convert dB to linear gain: Math.pow(10, db / 20)
      const gainValue = Math.pow(10, settings.audioTools.gainDb / 20);
      toolGainRef.current.gain.setTargetAtTime(gainValue, ctx.currentTime, 0.1);
      
      const targetDb = settings.audioTools.normalizeTargetDb !== null ? settings.audioTools.normalizeTargetDb : 0;
      toolCompressorRef.current.threshold.setTargetAtTime(targetDb, ctx.currentTime, 0.1);
    }
  }, [settings.audioTools.gainDb, settings.audioTools.normalizeTargetDb]);

  // Handle Main Track Source Change
  useEffect(() => {
    if (mainAudioRef.current && currentTrack) {
      if (currentTrack.isMissing) {
        mainAudioRef.current.pause();
        mainAudioRef.current.src = "";
        setIsPlaying(false);
        return;
      }
      const wasPlaying = isPlaying;
      mainAudioRef.current.src = currentTrack.url;
      if (wasPlaying) {
        mainAudioRef.current.play().catch(console.error);
      }
    } else if (mainAudioRef.current && !currentTrack) {
      mainAudioRef.current.pause();
      mainAudioRef.current.src = "";
    }
  }, [currentTrack]);

  // Handle Play/Pause and MediaSession State
  useEffect(() => {
    if (!mainAudioRef.current) return;

    if (isPlaying) {
      if (currentTrack?.isMissing) {
        setIsPlaying(false);
        return;
      }
      setupAudioTools();
      mainAudioRef.current.play().catch(e => {
        console.error("Playback error:", e);
        setIsPlaying(false);
      });
      
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      
      // Start subliminal with delay
      if (settings.subliminal.isEnabled && subTrack && subAudioRef.current && !subTrack.isMissing) {
        if (delayTimeoutRef.current) clearTimeout(delayTimeoutRef.current);
        
        delayTimeoutRef.current = window.setTimeout(() => {
          if (subAudioRef.current && isPlaying) {
            subAudioRef.current.src = subTrack.url;
            subAudioRef.current.loop = settings.subliminal.isPlaylistMode ? false : settings.subliminal.isLooping;
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
      const sound = NATURE_SOUNDS.find(s => s.id === settings.nature.type);
      if (sound) {
        audio.src = sound.url;
        audio.volume = settings.nature.volume;
        audio.play().catch(console.error);
      }
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
      mainAudioRef.current.volume = settings.mainVolume;
    }
    if (subAudioRef.current) {
      subAudioRef.current.volume = settings.subliminal.volume;
    }
  }, [settings.mainVolume, settings.subliminal.volume, currentTrack]);

  // Handle Playback Rate
  useEffect(() => {
    if (mainAudioRef.current) {
      mainAudioRef.current.playbackRate = settings.playbackRate;
    }
  }, [settings.playbackRate, currentTrack]);

  // Sync Subliminal with Main Track if enabled
  useEffect(() => {
    if (isPlaying && settings.syncPlayback && settings.subliminal.isEnabled && mainAudioRef.current && subAudioRef.current && !settings.subliminal.isPlaylistMode) {
      const syncInterval = setInterval(() => {
        if (mainAudioRef.current && subAudioRef.current && subAudioRef.current.readyState >= 2) {
          const mainTime = mainAudioRef.current.currentTime;
          const subTime = subAudioRef.current.currentTime;
          const duration = subAudioRef.current.duration;
          
          if (duration > 0) {
             const targetTime = mainTime % duration;
             const diff = Math.abs(targetTime - subTime);
             
             // Only sync if they drift by more than 0.5s to avoid stutter
             if (diff > 0.5) {
               subAudioRef.current.currentTime = targetTime;
             }
          }
        }
      }, 2000);
      return () => clearInterval(syncInterval);
    }
  }, [isPlaying, settings.syncPlayback, settings.subliminal.isEnabled, settings.subliminal.isPlaylistMode]);

  // Handle Subliminal Looping State
  useEffect(() => {
    if (subAudioRef.current) {
      subAudioRef.current.loop = settings.subliminal.isPlaylistMode ? false : settings.subliminal.isLooping;
    }
  }, [settings.subliminal.isLooping, settings.subliminal.isPlaylistMode]);

  return null;
}
