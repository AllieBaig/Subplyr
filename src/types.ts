export interface Track {
  id: string;
  name: string;
  url: string;
  artist?: string;
  artwork?: string;
  createdAt: number;
  lastPlayedAt?: number;
  isMissing?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}

export type SortOption = 'date' | 'alphabetical' | 'recent';
export type GroupOption = 'none' | 'day' | 'week' | 'month' | 'alphabetical' | 'minutes' | 'numbers';
export type AnimationStyle = 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'random' | 'off';

export interface SubliminalSettings {
  isEnabled: boolean;
  selectedTrackId: string | null;
  volume: number; // 0 to 0.3
  isLooping: boolean;
  delayMs: number;
  isPlaylistMode: boolean;
  sourcePlaylistId: string | null;
  gainDb: number;
}

export interface BinauralSettings {
  isEnabled: boolean;
  leftFreq: number;
  rightFreq: number;
  volume: number;
}

export interface NatureSettings {
  isEnabled: boolean;
  type: 'rain' | 'ocean' | 'forest' | 'wind' | 'fire' | 'stream';
  volume: number;
}

export interface NoiseSettings {
  isEnabled: boolean;
  type: 'white' | 'pink' | 'brown';
  volume: number;
}

export interface DidgeridooSettings {
  isEnabled: boolean;
  volume: number;
  gainDb: number;
  playbackRate: number;
  isLooping: boolean;
}

export interface PureHzSettings {
  isEnabled: boolean;
  frequency: number;
  volume: number;
  isLooping: boolean;
}

export interface AudioTools {
  gainDb: number;
  normalizeTargetDb: number | null;
}

export interface PlaylistMemory {
  trackId: string;
  position: number;
  timestamp: number;
}

export interface VersionEntry {
  version: string;
  date: string;
  changes: {
    added?: string[];
    improved?: string[];
    fixed?: string[];
  };
}

export type Theme = 'light' | 'dark';
export type DarkModeStyle = 'soft-purple' | 'soft-blue';

export interface AppSettings {
  subliminal: SubliminalSettings;
  binaural: BinauralSettings;
  nature: NatureSettings;
  noise: NoiseSettings;
  didgeridoo: DidgeridooSettings;
  pureHz: PureHzSettings;
  audioTools: AudioTools;
  mainVolume: number;
  playbackRate: number;
  fadeInOut: boolean;
  syncPlayback: boolean;
  library: {
    sort: SortOption;
    group: GroupOption;
    groupByMinutes: boolean;
  };
  appearance: {
    theme: Theme;
    followSystem: boolean;
    darkModeStyle: DarkModeStyle;
  };
  miniMode: boolean;
  hiddenLayersPosition: 'top' | 'bottom';
  loop: 'none' | 'one' | 'all';
  shuffle: boolean;
  playlistMemory: Record<string, PlaylistMemory>;
  menuPosition: 'top' | 'bottom';
  bigTouchMode: boolean;
  animationStyle: AnimationStyle;
  subliminalExpanded: boolean;
  showArtwork: boolean;
  displayAlwaysOn: boolean;
  visibility: {
    audioLayers: boolean;
    appControl: boolean;
  };
  sleepTimer: {
    isEnabled: boolean;
    minutes: number;
    remainingSeconds: number | null;
  };
  versionHistory: VersionEntry[];
}
