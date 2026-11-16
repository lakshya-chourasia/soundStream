export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  durationSec: number;
  views?: string;
  thumbnail: string;
  isOfficial?: boolean;
}

export type RepeatMode = 'off' | 'all' | 'one';
export type VisualizerMode = 'spectrum' | 'wave' | 'aura' | 'minimal';
export type PlayerStyle = 'wavy' | 'vinyl';
export type ActiveView = 'now-playing' | 'discover' | 'queue' | 'genres';
export type ThemePreset = 'aether' | 'spotify' | 'obsidian' | 'midnight' | 'amethyst' | 'emerald' | 'braun' | 'nordic';

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

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface LyricsData {
  track: string;
  artist: string;
  plainLyrics: string | null;
  syncedLyrics: string | null;
  parsedLines: LyricLine[];
  instrumental: boolean;
  notFound?: boolean;
}

export type CrossfadeDuration = 0 | 1 | 1.5 | 2 | 3;
export type StreamQuality = 'auto' | 'highres' | 'hd1080' | 'hd720' | 'large' | 'medium' | 'small';


