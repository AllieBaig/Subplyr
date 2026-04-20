export interface Track {
  id: string;
  name: string;
  url: string;
  artist?: string;
  artwork?: string;
  createdAt: number;
  isMissing?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}

export type SortOption = 'date' | 'alphabetical' | 'recent';
export type GroupOption = 'none' | 'day' | 'week' | 'month';

export interface SubliminalSettings {
  isEnabled: boolean;
  selectedTrackId: string | null;
  volume: number; // 0 to 0.3
  isLooping: boolean;
  delayMs: number;
  isPlaylistMode: boolean;
  sourcePlaylistId: string | null;
}

export interface BinauralSettings {
  isEnabled: boolean;
  leftFreq: number;
  rightFreq: number;
  volume: number;
}

export interface NatureSettings {
  isEnabled: boolean;
  type: 'rain' | 'ocean' | 'forest' | 'wind';
  volume: number;
}

export interface NoiseSettings {
  isEnabled: boolean;
  type: 'white' | 'pink' | 'brown';
  volume: number;
}

export interface AudioTools {
  gainDb: number;
  normalizeTargetDb: number | null;
}

export interface AppSettings {
  subliminal: SubliminalSettings;
  binaural: BinauralSettings;
  nature: NatureSettings;
  noise: NoiseSettings;
  audioTools: AudioTools;
  mainVolume: number;
  playbackRate: number;
  fadeInOut: boolean;
  syncPlayback: boolean;
  library: {
    sort: SortOption;
    group: GroupOption;
  };
  miniMode: boolean;
}
