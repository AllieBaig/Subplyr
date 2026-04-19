import { openDB, IDBPDatabase } from 'idb';
import { Track, AppSettings } from './types';

const DB_NAME = 'subliminal-db';
const TRACKS_STORE = 'tracks';
const SUB_TRACKS_STORE = 'subliminal-tracks';
const SETTINGS_STORE = 'settings';
const PLAYLISTS_STORE = 'playlists';

export interface DBTrack extends Track {
  blob: Blob;
}

export async function initDB() {
  try {
    return await openDB(DB_NAME, 2, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(TRACKS_STORE)) {
          db.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SUB_TRACKS_STORE)) {
          db.createObjectStore(SUB_TRACKS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE);
        }
        if (!db.objectStoreNames.contains(PLAYLISTS_STORE)) {
          db.createObjectStore(PLAYLISTS_STORE, { keyPath: 'id' });
        }
      },
    });
  } catch (err) {
    console.error("Critical IndexedDB initialization error:", err);
    throw new Error("Unable to start local database");
  }
}

export async function saveTrack(track: DBTrack, isSubliminal: boolean = false) {
  try {
    if (!track.id || !track.blob) throw new Error("Invalid track data");
    const db = await initDB();
    const store = isSubliminal ? SUB_TRACKS_STORE : TRACKS_STORE;
    await db.put(store, track);
  } catch (err) {
    console.error("Failed to save track:", err);
  }
}

export async function getTracks(isSubliminal: boolean = false): Promise<DBTrack[]> {
  try {
    const db = await initDB();
    const store = isSubliminal ? SUB_TRACKS_STORE : TRACKS_STORE;
    const tracks = await db.getAll(store);
    return Array.isArray(tracks) ? tracks : [];
  } catch (err) {
    console.error("Failed to retrieve tracks:", err);
    return [];
  }
}

export async function deleteTrack(id: string, isSubliminal: boolean = false) {
  try {
    const db = await initDB();
    const store = isSubliminal ? SUB_TRACKS_STORE : TRACKS_STORE;
    await db.delete(store, id);
  } catch (err) {
    console.error("Failed to delete track:", err);
  }
}

export async function saveSettings(settings: AppSettings) {
  try {
    const db = await initDB();
    await db.put(SETTINGS_STORE, settings, 'current');
  } catch (err) {
    console.error("Failed to save settings:", err);
  }
}

export async function getSettings(): Promise<AppSettings | null> {
  try {
    const db = await initDB();
    const settings = await db.get(SETTINGS_STORE, 'current');
    
    if (settings && typeof settings === 'object') {
      // Robust validation: check structure
      const hasSub = settings.subliminal && typeof settings.subliminal === 'object';
      const hasBin = settings.binaural && typeof settings.binaural === 'object';
      
      if (hasSub && hasBin && typeof settings.fadeInOut === 'boolean') {
        return settings;
      }
    }
    return null;
  } catch (err) {
    console.warn("Recovering from settings read failure:", err);
    return null; 
  }
}

export async function savePlaylist(playlist: any) {
  try {
    const db = await initDB();
    await db.put(PLAYLISTS_STORE, playlist);
  } catch (err) {
    console.error("Failed to save playlist:", err);
  }
}

export async function getPlaylists(): Promise<any[]> {
  try {
    const db = await initDB();
    return db.getAll(PLAYLISTS_STORE);
  } catch (err) {
    console.error("Failed to retrieve playlists:", err);
    return [];
  }
}

export async function deletePlaylist(id: string) {
  try {
    const db = await initDB();
    await db.delete(PLAYLISTS_STORE, id);
  } catch (err) {
    console.error("Failed to delete playlist:", err);
  }
}

export async function clearAllData() {
  try {
    const db = await initDB();
    const stores = [TRACKS_STORE, SUB_TRACKS_STORE, SETTINGS_STORE, PLAYLISTS_STORE];
    for (const store of stores) {
      await db.clear(store);
    }
  } catch (err) {
    console.error("Failed to clear all data:", err);
  }
}
