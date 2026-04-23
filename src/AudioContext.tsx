import { useState, createContext, useContext, ReactNode, useEffect, useMemo, useCallback, useRef } from 'react';
import { Track, AppSettings, Playlist, SortOption, GroupOption, VersionEntry } from './types';
import * as db from './db';
import { APP_HISTORY, CURRENT_VERSION } from './constants/history';
import { useModal } from './components/SafeModal';

interface AudioContextType {
  tracks: Track[];
  subliminalTracks: Track[];
  playlists: Playlist[];
  addTrack: (file: File, targetPlaylistId?: string) => Promise<string | null>;
  addSubliminalTrack: (file: File) => void;
  removeTrack: (id: string) => void;
  removeSubliminalTrack: (id: string) => void;
  
  createPlaylist: (name: string, initialTrackIds?: string[]) => Promise<string>;
  deletePlaylist: (id: string) => Promise<void>;
  addTrackToPlaylist: (trackId: string, playlistId: string) => Promise<void>;
  addTracksToPlaylist: (trackIds: string[], playlistId: string) => Promise<void>;
  removeTrackFromPlaylist: (trackId: string, playlistId: string) => Promise<void>;
  removeTracksFromPlaylist: (trackIds: string[], playlistId: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  
  playingPlaylistId: string | null;
  setPlayingPlaylistId: (id: string | null) => void;
  resumePlaylist: (id: string) => void;
  
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateSubliminalSettings: (newSettings: Partial<AppSettings['subliminal']>) => void;
  updateBinauralSettings: (newSettings: Partial<AppSettings['binaural']>) => void;
  updateNatureSettings: (newSettings: Partial<AppSettings['nature']>) => void;
  updateNoiseSettings: (newSettings: Partial<AppSettings['noise']>) => void;
  updateLibrarySettings: (newSettings: Partial<AppSettings['library']>) => void;
  updateAppearanceSettings: (newSettings: Partial<AppSettings['appearance']>) => void;
  updateVisibilitySettings: (newSettings: Partial<AppSettings['visibility']>) => void;
  updateAudioTools: (newSettings: Partial<AppSettings['audioTools']>) => void;
  exportAppData: () => Promise<void>;
  importAppData: (file: File) => Promise<void>;
  relinkTrack: (trackId: string, file: File, isSubliminal: boolean) => Promise<void>;
  
  currentTrackIndex: number | null;
  setCurrentTrackIndex: (index: number | null) => void;
  currentPlaybackList: Track[];
  playNext: (isAutoEnded?: boolean) => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  
  seekTo: (time: number) => void;
  seekRequest: number | null;
  clearSeekRequest: () => void;
  isLoading: boolean;
  initError: string | null;
  
  swStatus: 'active' | 'waiting' | 'installing' | 'none';
  swSupported: boolean;
  resetServiceWorker: () => Promise<void>;
  clearCacheStorage: () => Promise<void>;
  clearDatabase: () => Promise<void>;
  fullAppReset: () => Promise<void>;
  
  toast: string | null;
  showToast: (message: string) => void;
  resetUISettings: () => void;
  clearAppCache: () => void;
  updateSleepTimer: (newSettings: Partial<AppSettings['sleepTimer']>) => void;
  activeTabRequest: string | null;
  clearTabRequest: () => void;
  navigateTo: (tab: string) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const modal = useModal();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [subliminalTracks, setSubliminalTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const playlistsRef = useRef<Playlist[]>([]);
  useEffect(() => { playlistsRef.current = playlists; }, [playlists]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [playingPlaylistId, setPlayingPlaylistId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seekRequest, setSeekRequest] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTabRequest, setActiveTabRequest] = useState<string | null>(null);

  const navigateTo = (tab: string) => setActiveTabRequest(tab);
  const clearTabRequest = () => setActiveTabRequest(null);

  const currentPlaybackList = useMemo(() => {
    if (playingPlaylistId) {
      const playlist = playlists.find(p => p.id === playingPlaylistId);
      if (playlist) {
        return playlist.trackIds.map(tid => tracks.find(t => t.id === tid)).filter(Boolean) as Track[];
      }
    }
    return tracks;
  }, [playingPlaylistId, playlists, tracks]);

  const currentTrack = useMemo(() => {
    if (currentTrackIndex === null) return null;
    return currentPlaybackList[currentTrackIndex] || null;
  }, [currentTrackIndex, currentPlaybackList]);

  // Auto-track last played
  const lastUpdateRef = useRef<{ id: string, time: number } | null>(null);

  useEffect(() => {
    if (currentTrack?.id && isPlaying) {
      const now = Date.now();
      const lastUpdate = lastUpdateRef.current;
      
      // Only update if it's a new track OR if more than 5 minutes have passed (for long loops)
      if (!lastUpdate || lastUpdate.id !== currentTrack.id || (now - lastUpdate.time > 5 * 60 * 1000)) {
        lastUpdateRef.current = { id: currentTrack.id, time: now };
        
        setTracks(prev => {
          const updated = prev.map(t => t.id === currentTrack.id ? { ...t, lastPlayedAt: now } : t);
          const target = updated.find(t => t.id === currentTrack.id);
          if (target) {
            db.saveTrack(target as db.DBTrack, false);
          }
          return updated;
        });
      }
    }
  }, [currentTrack?.id, isPlaying]);

  const [swStatus, setSwStatus] = useState<'active' | 'waiting' | 'installing' | 'none'>('none');
  const swSupported = 'serviceWorker' in navigator;

  // Monitor Service Worker Status
  useEffect(() => {
    if (!swSupported) return;
    
    // Defensive: Version Check & Cache Busting
    const lastVersion = localStorage.getItem('app_version');
    if (lastVersion && lastVersion !== CURRENT_VERSION) {
      console.warn("System Update: Version mismatch detected. Stabilizing environment.");
      localStorage.clear(); // Clear transient UI state
      localStorage.setItem('app_version', CURRENT_VERSION);
      window.location.reload();
      return;
    }
    localStorage.setItem('app_version', CURRENT_VERSION);

    const updateStatus = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (!registration) {
          setSwStatus('none');
          console.log('[SW] No registration found');
          return;
        }

        if (registration.installing) {
          setSwStatus('installing');
        } else if (registration.waiting) {
          setSwStatus('waiting');
        } else if (registration.active) {
          setSwStatus('active');
        }

        // Listen for changes
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  setSwStatus('waiting');
                } else {
                  setSwStatus('active');
                }
              }
            };
          }
        };
      } catch (err) {
        console.error('[SW] Status check failed:', err);
      }
    };

    updateStatus();
    
    // Also listen to controller change
    navigator.serviceWorker.addEventListener('controllerchange', updateStatus);

    const interval = setInterval(updateStatus, 5000);
    return () => {
      clearInterval(interval);
      navigator.serviceWorker.removeEventListener('controllerchange', updateStatus);
    };
  }, [swSupported]);

  const resetServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return;
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const reg of registrations) {
      await reg.unregister();
    }
    showToast("Service workers deactivated");
  };

  const clearCacheStorage = async () => {
    if (!('caches' in window)) return;
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      await caches.delete(name);
    }
    showToast("Cache storage cleared");
  };

  const clearDatabase = async () => {
    if (!(await modal.confirm({ 
      title: "Clear Database", 
      subtitle: "This will delete all your tracks and playlists. This action cannot be undone.",
      confirmLabel: "Delete Everything",
      isDestructive: true 
    }))) return;
    try {
      await db.clearAllData();
      showToast("All data cleared. Refreshing tracks...");
      // Update local state
      setTracks([]);
      setSubliminalTracks([]);
      setPlaylists([]);
    } catch (e) {
      console.error(e);
      showToast("Failed to clear some data");
    }
  };

  const fullAppReset = async () => {
    if (!(await modal.confirm({ 
      title: "Factory Reset", 
      subtitle: "This will unregister service worker, clear cache, and delete all music/settings. The app will then reload.",
      confirmLabel: "Perform Reset",
      isDestructive: true 
    }))) return;
    try {
      await resetServiceWorker();
      await clearCacheStorage();
      await db.clearAllData();
      localStorage.clear();
      sessionStorage.clear();
      showToast("System reset complete. Reloading...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) {
      console.error(e);
      showToast("Reset encountered issues. Refresh app manually.");
    }
  };

  const DEFAULT_SETTINGS: AppSettings = {
    subliminal: {
      isEnabled: true,
      selectedTrackId: null,
      volume: 0.1,
      isLooping: true,
      delayMs: 0,
      isPlaylistMode: false,
      sourcePlaylistId: null,
      gainDb: 0,
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
    audioTools: {
      gainDb: 0,
      normalizeTargetDb: null,
    },
    mainVolume: 1.0,
    playbackRate: 1.0,
    fadeInOut: true,
    syncPlayback: true,
    library: {
      sort: 'recent',
      group: 'alphabetical',
      groupByMinutes: false,
    },
    appearance: {
      theme: 'light',
      followSystem: true,
      darkModeStyle: 'soft-purple',
    },
    miniMode: false,
    hiddenLayersPosition: 'bottom',
    loop: 'none',
    shuffle: false,
    playlistMemory: {},
    menuPosition: 'bottom',
    bigTouchMode: false,
    animationStyle: 'slide-up',
    subliminalExpanded: false,
    showArtwork: true,
    displayAlwaysOn: false,
    visibility: {
      audioLayers: true,
      appControl: true
    },
    sleepTimer: {
      isEnabled: false,
      minutes: 30,
      remainingSeconds: null
    },
    versionHistory: APP_HISTORY
  };
  
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const validateAudioFile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      // Basic extension check for iOS where MIME might be missing or incorrect
      const ext = file.name.split('.').pop()?.toLowerCase();
      const iOSCompatibleExts = ['mp3', 'm4a', 'aac', 'wav', 'mp4', 'm4p', 'm4b', 'aiff'];
      
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      let timeoutId: any;
      let resolved = false;
      
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('error', onError);
        URL.revokeObjectURL(url);
        audio.src = '';
      };

      const onCanPlay = () => {
        if (resolved) return;
        resolved = true;
        cleanup();
        resolve(true);
      };

      const onError = () => {
        if (resolved) return;
        resolved = true;
        cleanup();
        // If Audio() fails but it's a known extension, we might still want to allow it
        // as a fallback for some complex container formats or iOS quirks
        if (ext && iOSCompatibleExts.includes(ext)) {
          resolve(true);
        } else {
          resolve(false);
        }
      };

      audio.addEventListener('canplaythrough', onCanPlay);
      audio.addEventListener('error', onError);
      
      // Set a timeout of 3 seconds for validation
      timeoutId = setTimeout(() => {
        if (resolved) return;
        resolved = true;
        cleanup();
        // Fallback to extension if validation hangs
        if (ext && iOSCompatibleExts.includes(ext)) {
          resolve(true);
        } else {
          resolve(false);
        }
      }, 3000);

      audio.src = url;
      audio.load();
    });
  };

  // Load from DB on mount
  useEffect(() => {
    let isMounted = true;
    
    // Safety: 10s absolute timeout for startup
    const startupGuard = setTimeout(() => {
      if (isMounted && isLoading) {
        setInitError("Environment synchronization delay. Attempting system recovery.");
        setIsLoading(false);
      }
    }, 10000);

    async function loadData() {
      try {
        const savedSettings = await db.getSettings();
        if (isMounted) {
          if (savedSettings) {
            // Always sync history from source on load to ensure AI updates are visible
            setSettings({ 
              ...savedSettings, 
              versionHistory: APP_HISTORY 
            });
          } else {
            console.log("No settings found, using defaults");
          }
        }

        const savedTracks = await db.getTracks(false);
        if (isMounted) {
          const tracksWithUrls = (savedTracks || []).map(t => {
            if (t.blob) {
              return { ...t, url: URL.createObjectURL(t.blob), isMissing: false };
            }
            return { ...t, url: '', isMissing: true };
          });
          setTracks(tracksWithUrls);
        }

        const savedSubTracks = await db.getTracks(true);
        if (isMounted) {
          const subTracksWithUrls = (savedSubTracks || []).map(t => {
            if (t.blob) {
              return { ...t, url: URL.createObjectURL(t.blob), isMissing: false };
            }
            return { ...t, url: '', isMissing: true };
          });
          setSubliminalTracks(subTracksWithUrls);
        }

        const savedPlaylists = await db.getPlaylists();
        if (isMounted) {
          setPlaylists(Array.isArray(savedPlaylists) ? savedPlaylists : []);
        }

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
          clearTimeout(startupGuard);
        }
      }
    }
    loadData();
    return () => { 
      isMounted = false; 
      clearTimeout(startupGuard); 
      // Memory Safety: Revoke all object URLs on cleanup
      tracks.forEach(t => { if (t.url.startsWith('blob:')) URL.revokeObjectURL(t.url); });
      subliminalTracks.forEach(t => { if (t.url.startsWith('blob:')) URL.revokeObjectURL(t.url); });
    };
  }, []);

  // Save settings when changed
  useEffect(() => {
    db.saveSettings(settings);
  }, [settings]);

  // Theme Manager
  useEffect(() => {
    const applyTheme = () => {
      const { theme, followSystem, darkModeStyle } = settings.appearance;
      let targetTheme = theme;

      if (followSystem) {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        targetTheme = isDark ? 'dark' : 'light';
      }

      if (targetTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', darkModeStyle);
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    };

    applyTheme();

    if (settings.appearance.followSystem) {
      const matcher = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      matcher.addEventListener('change', listener);
      return () => matcher.removeEventListener('change', listener);
    }
  }, [settings.appearance]);

  const addTrack = async (file: File, targetPlaylistId?: string) => {
    const isValid = await validateAudioFile(file);
    if (!isValid) {
      showToast(`Unable to use "${file.name}". Format may be unsupported or corrupted.`);
      return null;
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
    
    if (targetPlaylistId) {
      await addTrackToPlaylist(id, targetPlaylistId);
    }
    
    if (currentTrackIndex === null) setCurrentTrackIndex(0);
    return id;
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

  const updateAppearanceSettings = (newApp: Partial<AppSettings['appearance']>) => {
    setSettings(prev => ({
      ...prev,
      appearance: { ...prev.appearance, ...newApp }
    }));
  };

  const updateVisibilitySettings = (newVisibility: Partial<AppSettings['visibility']>) => {
    setSettings(prev => ({
      ...prev,
      visibility: { ...prev.visibility, ...newVisibility }
    }));
  };

  const updateAudioTools = (newTools: Partial<AppSettings['audioTools']>) => {
    setSettings(prev => ({
      ...prev,
      audioTools: { ...prev.audioTools, ...newTools }
    }));
  };

  const updateSleepTimer = (newSleep: Partial<AppSettings['sleepTimer']>) => {
    setSettings(prev => ({
      ...prev,
      sleepTimer: { ...prev.sleepTimer, ...newSleep }
    }));
  };

  const createPlaylist = async (name: string, initialTrackIds: string[] = []) => {
    const playlistId = Math.random().toString(36).substr(2, 9);
    const playlist: Playlist = {
      id: playlistId,
      name,
      trackIds: initialTrackIds,
      createdAt: Date.now()
    };
    await db.savePlaylist(playlist);
    setPlaylists(prev => [...prev, playlist]);
    showToast(`Created playlist "${name}"`);
    return playlistId;
  };

  const deletePlaylist = async (id: string) => {
    await db.deletePlaylist(id);
    setPlaylists(prev => prev.filter(p => p.id !== id));
  };

  const addTracksToPlaylist = async (trackIds: string[], playlistId: string) => {
    let finalUpdated: Playlist | null = null;
    
    setPlaylists(prev => {
      const playlist = prev.find(p => p.id === playlistId);
      if (!playlist) return prev;
      
      const newIds = trackIds.filter(id => !playlist.trackIds.includes(id));
      if (newIds.length === 0) return prev;
      
      finalUpdated = { ...playlist, trackIds: [...playlist.trackIds, ...newIds] };
      return prev.map(p => p.id === playlistId ? finalUpdated! : p);
    });

    if (finalUpdated) {
      await db.savePlaylist(finalUpdated);
      showToast(`Added ${trackIds.length} track${trackIds.length > 1 ? 's' : ''} to playlist`);
    }
  };

  const addTrackToPlaylist = async (trackId: string, playlistId: string) => {
    await addTracksToPlaylist([trackId], playlistId);
  };

  const removeTrackFromPlaylist = async (trackId: string, playlistId: string) => {
    await removeTracksFromPlaylist([trackId], playlistId);
  };

  const removeTracksFromPlaylist = async (trackIds: string[], playlistId: string) => {
    let finalUpdated: Playlist | null = null;
    
    setPlaylists(prev => {
      const playlist = prev.find(p => p.id === playlistId);
      if (!playlist) return prev;
      finalUpdated = { ...playlist, trackIds: playlist.trackIds.filter(id => !trackIds.includes(id)) };
      return prev.map(p => p.id === playlistId ? finalUpdated! : p);
    });

    if (finalUpdated) {
      await db.savePlaylist(finalUpdated);
    }
  };

  const renamePlaylist = async (id: string, name: string) => {
    const playlist = playlists.find(p => p.id === id);
    if (!playlist) return;
    const updated = { ...playlist, name };
    await db.savePlaylist(updated);
    setPlaylists(prev => prev.map(p => p.id === id ? updated : p));
    showToast(`Playlist renamed to "${name}"`);
  };

  const resumePlaylist = (playlistId: string) => {
    const memory = settings.playlistMemory[playlistId];
    const playlist = playlists.find(p => p.id === playlistId);
    
    if (playlist && playlist.trackIds.length > 0) {
      let trackIndex = 0;
      let position = 0;
      
      if (memory) {
        const foundIndex = playlist.trackIds.indexOf(memory.trackId);
        if (foundIndex !== -1) {
          trackIndex = foundIndex;
          position = memory.position;
        }
      }
      
      setPlayingPlaylistId(playlistId);
      setCurrentTrackIndex(trackIndex);
      if (position > 0) {
        setTimeout(() => seekTo(position), 100);
      }
      setIsPlaying(true);
      showToast(memory ? `Resuming "${playlist.name}"` : `Playing "${playlist.name}"`);
    }
  };

  const exportAppData = async () => {
    const musicTracks = await db.getTracks(false);
    const subTracks = await db.getTracks(true);
    
    // No base64 - only metadata
    const tracksData = musicTracks.map(({ blob, ...t }) => t);
    const subTracksData = subTracks.map(({ blob, ...t }) => t);

    const exportObject = {
      version: "2.0.0", // Bump version for reference-based
      exportedAt: new Date().toISOString(),
      tracks: tracksData,
      subliminalTracks: subTracksData,
      playlists: playlists,
      settings: settings
    };

    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `mindful_backup_${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Export complete - Metadata only");
  };

  const importAppData = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.tracks || !data.settings) {
        throw new Error("Invalid backup file format");
      }

      // 1. Save Settings
      await db.saveSettings(data.settings);
      setSettings(data.settings);

      // 2. Save Tracks Metadata (but check for existing blobs)
      const existingTracks = await db.getTracks(false);
      const existingSubTracks = await db.getTracks(true);

      const importedTracks = await Promise.all(data.tracks.map(async (t: any) => {
        const existing = existingTracks.find(et => et.id === t.id);
        const trackToSave = { ...t, blob: existing?.blob || null };
        await db.saveTrack(trackToSave as any, false);
        return { 
          ...t, 
          url: existing?.blob ? URL.createObjectURL(existing.blob) : '', 
          isMissing: !existing?.blob 
        };
      }));

      const importedSubTracks = await Promise.all((data.subliminalTracks || []).map(async (t: any) => {
        const existing = existingSubTracks.find(et => et.id === t.id);
        const trackToSave = { ...t, blob: existing?.blob || null };
        await db.saveTrack(trackToSave as any, true);
        return { 
          ...t, 
          url: existing?.blob ? URL.createObjectURL(existing.blob) : '', 
          isMissing: !existing?.blob 
        };
      }));

      // 3. Save Playlists
      if (data.playlists) {
        for (const p of data.playlists) {
          await db.savePlaylist(p);
        }
        setPlaylists(data.playlists);
      }

      setTracks(importedTracks);
      setSubliminalTracks(importedSubTracks);
      showToast("Import successful. Some files may need relinking.");
    } catch (err) {
      console.error("Import failed:", err);
      showToast("Failed to import backup");
    }
  };

  const relinkTrack = async (trackId: string, file: File, isSubliminal: boolean) => {
    try {
      const isValid = await validateAudioFile(file);
      if (!isValid) {
        showToast("Invalid audio file");
        return;
      }

      const list = isSubliminal ? subliminalTracks : tracks;
      const track = list.find(t => t.id === trackId);
      if (!track) return;

      const updatedTrack = { ...track, blob: file, isMissing: false, url: URL.createObjectURL(file) };
      await db.saveTrack(updatedTrack as any, isSubliminal);
      
      if (isSubliminal) {
        setSubliminalTracks(prev => prev.map(t => t.id === trackId ? updatedTrack : t));
      } else {
        setTracks(prev => prev.map(t => t.id === trackId ? updatedTrack : t));
      }
      
      showToast(`Linked "${file.name}" to "${track.name}"`);
    } catch (err) {
      console.error("Relink failed:", err);
      showToast("Failed to relink file");
    }
  };

  const seekTo = (time: number) => {
    setSeekRequest(time);
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

  const toggleShuffle = () => {
    updateSettings({ shuffle: !settings.shuffle });
    showToast(settings.shuffle ? "Shuffle off" : "Shuffle on");
  };

  const toggleLoop = () => {
    const modes: AppSettings['loop'][] = ['none', 'all', 'one'];
    const next = modes[(modes.indexOf(settings.loop) + 1) % modes.length];
    updateSettings({ loop: next });
    showToast(`Loop: ${next.toUpperCase()}`);
  };

  const playNext = useCallback((isAutoEnded = false) => {
    const list = currentPlaybackList;
    if (list.length === 0) return;
    
    if (isAutoEnded && settings.loop === 'one' && currentTrackIndex !== null) {
      // Loop one: just restart the same track
      setSeekRequest(0);
      setIsPlaying(true);
      return;
    }

    let nextIndex: number;
    
    if (settings.shuffle) {
      nextIndex = Math.floor(Math.random() * list.length);
    } else {
      const isLastTrack = currentTrackIndex === null || currentTrackIndex >= list.length - 1;
      
      // If we reached the end and loop is none, stop
      if (isAutoEnded && settings.loop === 'none' && isLastTrack) {
        setIsPlaying(false);
        return;
      }

      nextIndex = isLastTrack ? 0 : currentTrackIndex + 1;
    }

    let attempts = 0;
    while (list[nextIndex]?.isMissing && attempts < list.length) {
      nextIndex = (nextIndex + 1) % list.length;
      attempts++;
    }

    if (list[nextIndex] && !list[nextIndex].isMissing) {
      setCurrentTrackIndex(nextIndex);
      setIsPlaying(true);
    } else {
      showToast("No playable tracks found");
      setIsPlaying(false);
    }
  }, [currentPlaybackList, settings.loop, settings.shuffle, currentTrackIndex]);

  const playPrevious = useCallback(() => {
    const list = currentPlaybackList;
    if (list.length === 0) return;
    
    let prevIndex: number;
    if (settings.shuffle) {
      prevIndex = Math.floor(Math.random() * list.length);
    } else {
      prevIndex = currentTrackIndex === null || currentTrackIndex === 0 ? list.length - 1 : currentTrackIndex - 1;
    }

    let attempts = 0;
    while (list[prevIndex]?.isMissing && attempts < list.length) {
      prevIndex = prevIndex === 0 ? list.length - 1 : prevIndex - 1;
      attempts++;
    }

    if (list[prevIndex] && !list[prevIndex].isMissing) {
      setCurrentTrackIndex(prevIndex);
      setIsPlaying(true);
    } else {
      showToast("No playable tracks found");
      setIsPlaying(false);
    }
  }, [currentPlaybackList, settings.shuffle, currentTrackIndex]);

  // Display Always ON (Wake Lock)
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if (!settings.displayAlwaysOn || !isPlaying) return;
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('[WakeLock] Active');
        }
      } catch (err) {
        console.warn('[WakeLock] Failed:', err);
      }
    };

    const releaseWakeLock = async () => {
      if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
        console.log('[WakeLock] Released');
      }
    };

    if (settings.displayAlwaysOn && isPlaying) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [settings.displayAlwaysOn, isPlaying]);

  // Sleep Timer logic
  useEffect(() => {
    let interval: any = null;

    if (settings.sleepTimer.isEnabled && isPlaying) {
      // Initialize remaining seconds if not set
      if (settings.sleepTimer.remainingSeconds === null) {
        setSettings(prev => ({
          ...prev,
          sleepTimer: {
            ...prev.sleepTimer,
            remainingSeconds: prev.sleepTimer.minutes * 60
          }
        }));
      }

      interval = setInterval(() => {
        setSettings(prev => {
          if (!prev.sleepTimer.isEnabled || !isPlaying) return prev;
          
          const rem = prev.sleepTimer.remainingSeconds;
          if (rem === null) return prev;

          if (rem <= 1) {
            clearInterval(interval);
            setTimeout(() => {
              setIsPlaying(false);
              showToast("Sleep timer: Playback stopped");
            }, 0);
            return {
              ...prev,
              sleepTimer: {
                ...prev.sleepTimer,
                isEnabled: false,
                remainingSeconds: null
              }
            };
          }

          return {
            ...prev,
            sleepTimer: {
              ...prev.sleepTimer,
              remainingSeconds: rem - 1
            }
          };
        });
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [settings.sleepTimer.isEnabled, isPlaying]);

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
      addTracksToPlaylist,
      removeTrackFromPlaylist,
      settings,
      updateSettings,
      updateSubliminalSettings,
      updateBinauralSettings,
      updateNatureSettings,
      updateNoiseSettings,
      updateLibrarySettings,
      updateAppearanceSettings,
      updateVisibilitySettings,
      updateAudioTools,
      exportAppData,
      importAppData,
      relinkTrack,
      removeTracksFromPlaylist,
      renamePlaylist,
      playingPlaylistId,
      setPlayingPlaylistId,
      resumePlaylist,
      currentTrackIndex,
      setCurrentTrackIndex,
      currentPlaybackList,
      playNext,
      playPrevious,
      toggleShuffle,
      toggleLoop,
      isPlaying,
      setIsPlaying,
      seekTo,
      seekRequest,
      clearSeekRequest,
      isLoading,
      initError,
      swStatus,
      swSupported,
      resetServiceWorker,
      clearCacheStorage,
      clearDatabase,
      fullAppReset,
      toast,
      showToast,
      resetUISettings,
      clearAppCache,
      updateSleepTimer,
      activeTabRequest,
      clearTabRequest,
      navigateTo
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
