export interface Track {
  id: string;
  name: string;
  url: string;
  artist?: string;
  artwork?: string;
}

export interface SubliminalSettings {
  isEnabled: boolean;
  selectedTrackId: string | null;
  volume: number; // 0 to 0.3 (as per 30% limit)
  isLooping: boolean;
  delayMs: number;
}

export interface AppSettings {
  subliminal: SubliminalSettings;
  binaural: BinauralSettings;
  fadeInOut: boolean;
  syncPlayback: boolean;
}

export interface BinauralSettings {
  isEnabled: boolean;
  leftFreq: number;
  rightFreq: number;
  volume: number; // 0 to 1, but should be kept low
}
