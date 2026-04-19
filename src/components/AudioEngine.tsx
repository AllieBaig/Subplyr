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

  // Handle Volume Balance
  useEffect(() => {
    if (mainAudioRef.current) {
      // 0 volumeBalance = 100% main, 1 volumeBalance = 100% subliminal
      // However the user says "Keep subliminal low volume" and "volume balance slider (not decibels)"
      // Typical balance: 
      // Main volume = (1 - volumeBalance)
      // Sub volume = volumeBalance
      mainAudioRef.current.volume = 1 - settings.subliminal.volumeBalance;
    }
    if (subAudioRef.current) {
      subAudioRef.current.volume = settings.subliminal.volumeBalance;
    }
  }, [settings.subliminal.volumeBalance]);

  // Sync handles
  useEffect(() => {
    if (subAudioRef.current && subTrack) {
      subAudioRef.current.loop = settings.subliminal.isLooping;
    }
  }, [settings.subliminal.isLooping, subTrack]);

  return null;
}
