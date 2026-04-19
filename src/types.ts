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
  volumeBalance: number; // 0 = 100% main, 1 = 100% subliminal
  isLooping: boolean;
  delayMs: number;
}

export interface AppSettings {
  subliminal: SubliminalSettings;
  fadeInOut: boolean;
  syncPlayback: boolean;
}
