import { openDB, IDBPDatabase } from 'idb';
import { Track, AppSettings } from './types';

const DB_NAME = 'subliminal-db';
const TRACKS_STORE = 'tracks';
const SUB_TRACKS_STORE = 'subliminal-tracks';
const SETTINGS_STORE = 'settings';

export interface DBTrack extends Track {
  blob: Blob;
}

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(TRACKS_STORE)) {
        db.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SUB_TRACKS_STORE)) {
        db.createObjectStore(SUB_TRACKS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
      }
    },
  });
}

export async function saveTrack(track: DBTrack, isSubliminal: boolean = false) {
  const db = await initDB();
  const store = isSubliminal ? SUB_TRACKS_STORE : TRACKS_STORE;
  await db.put(store, track);
}

export async function getTracks(isSubliminal: boolean = false): Promise<DBTrack[]> {
  const db = await initDB();
  const store = isSubliminal ? SUB_TRACKS_STORE : TRACKS_STORE;
  return db.getAll(store);
}

export async function deleteTrack(id: string, isSubliminal: boolean = false) {
  const db = await initDB();
  const store = isSubliminal ? SUB_TRACKS_STORE : TRACKS_STORE;
  await db.delete(store, id);
}

export async function saveSettings(settings: AppSettings) {
  const db = await initDB();
  await db.put(SETTINGS_STORE, settings, 'current');
}

export async function getSettings(): Promise<AppSettings | null> {
  const db = await initDB();
  return db.get(SETTINGS_STORE, 'current');
}
