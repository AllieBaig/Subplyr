import { useState, createContext, useContext, ReactNode, useEffect } from 'react';
import { Track, AppSettings } from './types';
import * as db from './db';

interface AudioContextType {
  tracks: Track[];
  subliminalTracks: Track[];
  addTrack: (file: File) => void;
  addSubliminalTrack: (file: File) => void;
  removeTrack: (id: string) => void;
  removeSubliminalTrack: (id: string) => void;
  
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateSubliminalSettings: (newSettings: Partial<AppSettings['subliminal']>) => void;
  updateBinauralSettings: (newSettings: Partial<AppSettings['binaural']>) => void;
  updateNatureSettings: (newSettings: Partial<AppSettings['nature']>) => void;
  updateNoiseSettings: (newSettings: Partial<AppSettings['noise']>) => void;
  exportAppData: () => Promise<void>;
  
  currentTrackIndex: number | null;
  setCurrentTrackIndex: (index: number | null) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  seekTo: (time: number) => void;
  seekRequest: number | null;
  clearSeekRequest: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [subliminalTracks, setSubliminalTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekRequest, setSeekRequest] = useState<number | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>({
    subliminal: {
      isEnabled: true,
      selectedTrackId: null,
      volume: 0.1,
      isLooping: true,
      delayMs: 0,
    },
    binaural: {
      isEnabled: false,
      leftFreq: 200,
      rightFreq: 210,
      volume: 0.05,
    },
    nature: {
      isEnabled: false,
      type: 'rain',
      volume: 0.5,
    },
    noise: {
      isEnabled: false,
      type: 'white',
      volume: 0.2,
    },
    fadeInOut: true,
    syncPlayback: true,
  });

  // Load from DB on mount
  useEffect(() => {
    async function loadData() {
      const savedSettings = await db.getSettings();
      if (savedSettings) setSettings(savedSettings);

      const savedTracks = await db.getTracks(false);
      const tracksWithUrls = savedTracks.map(t => ({
        ...t,
        url: URL.createObjectURL(t.blob)
      }));
      setTracks(tracksWithUrls);

      const savedSubTracks = await db.getTracks(true);
      const subTracksWithUrls = savedSubTracks.map(t => ({
        ...t,
        url: URL.createObjectURL(t.blob)
      }));
      setSubliminalTracks(subTracksWithUrls);
    }
    loadData();
  }, []);

  // Save settings when changed
  useEffect(() => {
    db.saveSettings(settings);
  }, [settings]);

  const addTrack = async (file: File) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newTrack: db.DBTrack = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ""),
      url: URL.createObjectURL(file), // temporary URL
      artist: 'Unknown Artist',
      blob: file
    };
    
    await db.saveTrack(newTrack, false);
    setTracks(prev => [...prev, newTrack]);
    if (currentTrackIndex === null) setCurrentTrackIndex(tracks.length);
  };

  const addSubliminalTrack = async (file: File) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newTrack: db.DBTrack = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ""),
      url: URL.createObjectURL(file), // temporary URL
      blob: file
    };
    
    await db.saveTrack(newTrack, true);
    setSubliminalTracks(prev => [...prev, newTrack]);
    if (!settings.subliminal.selectedTrackId) {
       updateSubliminalSettings({ selectedTrackId: newTrack.id });
    }
  };

  const removeTrack = async (id: string) => {
    await db.deleteTrack(id, false);
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  const removeSubliminalTrack = async (id: string) => {
    await db.deleteTrack(id, true);
    setSubliminalTracks(prev => prev.filter(t => t.id !== id));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateSubliminalSettings = (newSub: Partial<AppSettings['subliminal']>) => {
    setSettings(prev => ({
      ...prev,
      subliminal: { ...prev.subliminal, ...newSub }
    }));
  };

  const updateBinauralSettings = (newBin: Partial<AppSettings['binaural']>) => {
    setSettings(prev => ({
      ...prev,
      binaural: { ...prev.binaural, ...newBin }
    }));
  };

  const updateNatureSettings = (newNat: Partial<AppSettings['nature']>) => {
    setSettings(prev => ({
      ...prev,
      nature: { ...prev.nature, ...newNat }
    }));
  };

  const updateNoiseSettings = (newNoi: Partial<AppSettings['noise']>) => {
    setSettings(prev => ({
      ...prev,
      noise: { ...prev.noise, ...newNoi }
    }));
  };

  const exportAppData = async () => {
    const musicTracks = await db.getTracks(false);
    const subTracks = await db.getTracks(true);
    
    // Helper to convert Blob to base64 for JSON export
    const blobToBase64 = (blob: Blob): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    };

    const tracksData = await Promise.all(musicTracks.map(async t => ({
      ...t,
      blob: await blobToBase64(t.blob)
    })));

    const subTracksData = await Promise.all(subTracks.map(async t => ({
      ...t,
      blob: await blobToBase64(t.blob)
    })));

    const exportObject = {
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      tracks: tracksData,
      subliminalTracks: subTracksData,
      settings: settings
    };

    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `appdata_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const seekTo = (time: number) => {
    setSeekRequest(time);
    setCurrentTime(time);
  };

  const clearSeekRequest = () => setSeekRequest(null);

  return (
    <AudioContext.Provider value={{
      tracks,
      subliminalTracks,
      addTrack,
      addSubliminalTrack,
      removeTrack,
      removeSubliminalTrack,
      settings,
      updateSettings,
      updateSubliminalSettings,
      updateBinauralSettings,
      updateNatureSettings,
      updateNoiseSettings,
      exportAppData,
      currentTrackIndex,
      setCurrentTrackIndex,
      isPlaying,
      setIsPlaying,
      currentTime,
      setCurrentTime,
      duration,
      setDuration,
      seekTo,
      seekRequest,
      clearSeekRequest
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
