export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  durationSec: number;
  views?: string;
  thumbnail: string;
}

export type RepeatMode = 'off' | 'all' | 'one';
export type VisualizerMode = 'spectrum' | 'wave' | 'aura' | 'minimal';
export type ActiveView = 'now-playing' | 'discover' | 'queue' | 'genres';
export type ThemePreset = 'obsidian' | 'midnight' | 'nordic' | 'braun' | 'emerald';

export interface ThemeConfig {
  id: ThemePreset;
  name: string;
  tagline: string;
  accent: string;
  accentSecondary: string;
  bgClass: string;
  cardClass: string;
  borderClass: string;
  textClass: string;
}

export interface GenreCollection {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
}

export interface Playlist {
  id: string;
  name: string;
  createdAt: number;
  tracks: Track[];
}
