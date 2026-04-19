import { useState, createContext, useContext, ReactNode, useEffect, useMemo } from 'react';
import { Track, AppSettings, Playlist, SortOption, GroupOption } from './types';
import * as db from './db';

interface AudioContextType {
  tracks: Track[];
  subliminalTracks: Track[];
  playlists: Playlist[];
  addTrack: (file: File) => void;
  addSubliminalTrack: (file: File) => void;
  removeTrack: (id: string) => void;
  removeSubliminalTrack: (id: string) => void;
  
  createPlaylist: (name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (trackId: string, playlistId: string) => Promise<void>;
  removeTrackFromPlaylist: (trackId: string, playlistId: string) => Promise<void>;
  
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateSubliminalSettings: (newSettings: Partial<AppSettings['subliminal']>) => void;
  updateBinauralSettings: (newSettings: Partial<AppSettings['binaural']>) => void;
  updateNatureSettings: (newSettings: Partial<AppSettings['nature']>) => void;
  updateNoiseSettings: (newSettings: Partial<AppSettings['noise']>) => void;
  updateLibrarySettings: (newSettings: Partial<AppSettings['library']>) => void;
  exportAppData: () => Promise<void>;
  
  currentTrackIndex: number | null;
  setCurrentTrackIndex: (index: number | null) => void;
  playNext: () => void;
  playPrevious: () => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  seekTo: (time: number) => void;
  seekRequest: number | null;
  clearSeekRequest: () => void;
  isLoading: boolean;
  initError: string | null;
  
  toast: string | null;
  showToast: (message: string) => void;
  resetUISettings: () => void;
  clearAppCache: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [subliminalTracks, setSubliminalTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekRequest, setSeekRequest] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const DEFAULT_SETTINGS: AppSettings = {
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
    library: {
      sort: 'recent',
      group: 'none'
    },
    miniMode: false
  };
  
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const validateAudioFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      
      const cleanup = () => {
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('error', onError);
        URL.revokeObjectURL(url);
      };

      const onCanPlay = () => {
        cleanup();
        resolve(true);
      };

      const onError = () => {
        cleanup();
        resolve(false);
      };

      audio.addEventListener('canplaythrough', onCanPlay);
      audio.addEventListener('error', onError);
      audio.src = url;
      audio.load();
      
      // Safety timeout for validation
      setTimeout(() => {
        cleanup();
        resolve(false);
      }, 5000);
    });
  };

  // Load from DB on mount
  useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted && isLoading) {
        setInitError("Application initialization is taking longer than expected. Please try refreshing.");
        setIsLoading(false);
      }
    }, 5000);

    async function loadData() {
      try {
        const savedSettings = await db.getSettings();
        if (isMounted && savedSettings) setSettings(savedSettings);

        const savedTracks = await db.getTracks(false);
        if (isMounted) {
          const tracksWithUrls = savedTracks.map(t => ({
            ...t,
            url: URL.createObjectURL(t.blob)
          }));
          setTracks(tracksWithUrls);
        }

        const savedSubTracks = await db.getTracks(true);
        if (isMounted) {
          const subTracksWithUrls = savedSubTracks.map(t => ({
            ...t,
            url: URL.createObjectURL(t.blob)
          }));
          setSubliminalTracks(subTracksWithUrls);
        }

        const savedPlaylists = await db.getPlaylists();
        if (isMounted) setPlaylists(savedPlaylists);

        // Check for shared files from Share Target
        const urlParams = new URLSearchParams(window.location.search);
        const sharedCount = urlParams.get('shared-count');
        if (sharedCount) {
          const count = parseInt(sharedCount);
          const cache = await caches.open('shared-files');
          
          for (let i = 0; i < count; i++) {
            const cacheKey = `/shared-files/temp-${i}`;
            const response = await cache.match(cacheKey);
            if (response) {
              const blob = await response.blob();
              const filename = decodeURIComponent(response.headers.get('x-filename') || `shared-track-${i}.mp3`);
              
              // Create a proper File object for addTrack
              const file = new File([blob], filename, { type: blob.type });
              await addTrack(file);
              await cache.delete(cacheKey);
            }
          }
          // Clean up URL
          window.history.replaceState({}, document.title, "/");
          showToast(`Successfully imported ${count} shared track${count > 1 ? 's' : ''}`);
        }
      } catch (err) {
        console.warn("Defensive Load Trace:", err);
        if (isMounted) setInitError("Database sync issue. We're attempting recovery.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
          clearTimeout(timeoutId);
        }
      }
    }
    loadData();
    return () => { 
      isMounted = false; 
      clearTimeout(timeoutId); 
      // Memory Safety: Revoke all object URLs on cleanup
      tracks.forEach(t => { if (t.url.startsWith('blob:')) URL.revokeObjectURL(t.url); });
      subliminalTracks.forEach(t => { if (t.url.startsWith('blob:')) URL.revokeObjectURL(t.url); });
    };
  }, []);

  // Save settings when changed
  useEffect(() => {
    db.saveSettings(settings);
  }, [settings]);

  const addTrack = async (file: File) => {
    const isValid = await validateAudioFile(file);
    if (!isValid) {
      showToast(`Unable to use "${file.name}". Format may be unsupported or corrupted.`);
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    const newTrack: db.DBTrack = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ""),
      url: URL.createObjectURL(file), // temporary URL
      artist: 'Unknown Artist',
      blob: file,
      createdAt: Date.now()
    };
    
    await db.saveTrack(newTrack, false);
    setTracks(prev => [...prev, newTrack]);
    if (currentTrackIndex === null) setCurrentTrackIndex(0);
  };

  const addSubliminalTrack = async (file: File) => {
    const isValid = await validateAudioFile(file);
    if (!isValid) {
      showToast(`Unsupported format: "${file.name}"`);
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    const newTrack: db.DBTrack = {
      id,
      name: file.name.replace(/\.[^/.]+$/, ""),
      url: URL.createObjectURL(file), // temporary URL
      blob: file,
      createdAt: Date.now()
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

  const updateLibrarySettings = (newLib: Partial<AppSettings['library']>) => {
    setSettings(prev => ({
      ...prev,
      library: { ...prev.library, ...newLib }
    }));
  };

  const createPlaylist = async (name: string) => {
    const playlist: Playlist = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      trackIds: [],
      createdAt: Date.now()
    };
    await db.savePlaylist(playlist);
    setPlaylists(prev => [...prev, playlist]);
    showToast(`Created playlist "${name}"`);
  };

  const deletePlaylist = async (id: string) => {
    await db.deletePlaylist(id);
    setPlaylists(prev => prev.filter(p => p.id !== id));
  };

  const addTrackToPlaylist = async (trackId: string, playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    if (playlist.trackIds.includes(trackId)) {
      showToast("Already in playlist");
      return;
    }
    const updated = { ...playlist, trackIds: [...playlist.trackIds, trackId] };
    await db.savePlaylist(updated);
    setPlaylists(prev => prev.map(p => p.id === playlistId ? updated : p));
    showToast("Added to playlist");
  };

  const removeTrackFromPlaylist = async (trackId: string, playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    const updated = { ...playlist, trackIds: playlist.trackIds.filter(id => id !== trackId) };
    await db.savePlaylist(updated);
    setPlaylists(prev => prev.map(p => p.id === playlistId ? updated : p));
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

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const resetUISettings = () => {
    // Preserve track selection if it exists
    const newSettings = { 
      ...DEFAULT_SETTINGS,
      subliminal: {
        ...DEFAULT_SETTINGS.subliminal,
        selectedTrackId: settings.subliminal.selectedTrackId
      }
    };
    setSettings(newSettings);
    showToast("UI settings reset to default");
  };

  const clearAppCache = () => {
    // Clear localStorage (non-destructive to IndexedDB)
    localStorage.clear();
    // Clear any temporary session data
    sessionStorage.clear();
    showToast("Cache cleared successfully");
  };

  const playNext = () => {
    if (tracks.length === 0) return;
    const nextIndex = currentTrackIndex === null || currentTrackIndex >= tracks.length - 1 ? 0 : currentTrackIndex + 1;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (tracks.length === 0) return;
    const prevIndex = currentTrackIndex === null || currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
  };

  return (
    <AudioContext.Provider value={{
      tracks,
      subliminalTracks,
      playlists,
      addTrack,
      addSubliminalTrack,
      removeTrack,
      removeSubliminalTrack,
      createPlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      settings,
      updateSettings,
      updateSubliminalSettings,
      updateBinauralSettings,
      updateNatureSettings,
      updateNoiseSettings,
      updateLibrarySettings,
      exportAppData,
      currentTrackIndex,
      setCurrentTrackIndex,
      playNext,
      playPrevious,
      isPlaying,
      setIsPlaying,
      currentTime,
      setCurrentTime,
      duration,
      setDuration,
      seekTo,
      seekRequest,
      clearSeekRequest,
      isLoading,
      initError,
      toast,
      showToast,
      resetUISettings,
      clearAppCache
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
