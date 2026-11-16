/**
 * Pure helper functions for YouTube music player logic
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  durationSec: number;
  views?: string;
  thumbnail: string;
}

/**
 * Format duration in seconds to standard mm:ss or hh:mm:ss format
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;

  if (hrs > 0) {
    const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
    return `${hrs}:${paddedMins}:${paddedSecs}`;
  }

  return `${mins}:${paddedSecs}`;
}

/**
 * Parse time string like "3:45" or "1:15:20" to total seconds
 */
export function parseDurationToSeconds(timeStr: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

/**
 * Extract YouTube 11-character video ID from URLs or raw IDs
 */
export function extractYouTubeId(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // If already an 11-char ID like 'dQw4w9WgXcQ'
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex covering standard watch URLs, short URLs, embeds, music.youtube.com, shorts
  const patterns = [
    /(?:v=|\/embed\/|\/watch\?v=|\/watch\?.+&v=)([^#&?]{11})/,
    /(?:youtu\.be\/)([^#&?]{11})/,
    /(?:youtube\.com\/shorts\/)([^#&?]{11})/,
    /(?:music\.youtube\.com\/watch\?v=)([^#&?]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Calculate next track index based on queue, shuffle, and repeat modes
 */
export type RepeatMode = 'off' | 'all' | 'one';

export function getNextTrackIndex(
  currentIndex: number,
  queueLength: number,
  repeatMode: RepeatMode,
  isShuffle: boolean,
  playedIndices: number[] = []
): number | null {
  if (queueLength <= 0) return null;
  if (queueLength === 1) {
    return repeatMode === 'off' ? (playedIndices.length > 0 ? null : 0) : 0;
  }

  if (repeatMode === 'one') {
    return currentIndex >= 0 ? currentIndex : 0;
  }

  if (isShuffle) {
    const available = [];
    for (let i = 0; i < queueLength; i++) {
      if (i !== currentIndex && !playedIndices.includes(i)) {
        available.push(i);
      }
    }

    if (available.length > 0) {
      const rand = Math.floor(Math.random() * available.length);
      return available[rand];
    }

    // If all have been played in shuffle:
    if (repeatMode === 'all') {
      const pool = [];
      for (let i = 0; i < queueLength; i++) {
        if (i !== currentIndex) pool.push(i);
      }
      return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : 0;
    }

    return null;
  }

  // Standard sequential playback
  if (currentIndex < queueLength - 1) {
    return currentIndex + 1;
  } else if (repeatMode === 'all') {
    return 0;
  }

  return null;
}

/**
 * Calculate previous track index
 */
export function getPrevTrackIndex(
  currentIndex: number,
  queueLength: number,
  currentTimeSec: number
): number {
  if (queueLength <= 0) return 0;
  // If track has been playing for > 3 seconds, replay from start
  if (currentTimeSec > 3) {
    return currentIndex;
  }
  return currentIndex > 0 ? currentIndex - 1 : queueLength - 1;
}

/**
 * Clean up YouTube video titles by removing boilerplate like "(Official Music Video)"
 */
export function cleanTrackTitle(rawTitle: string): { title: string; artistFromTitle?: string } {
  if (!rawTitle) return { title: 'Unknown Track' };

  let cleaned = rawTitle
    .replace(/\s*[\(\[]\s*(?:Official\s*(?:Music\s*)?)?(?:Video|Audio|Lyric\s*Video|HD|4K|Visualizer|Lyrics?)\s*[\)\]]/gi, '')
    .replace(/\s*\|.*$/, '')
    .trim();

  // If format is "Artist - Title"
  if (cleaned.includes(' - ')) {
    const parts = cleaned.split(' - ');
    if (parts.length >= 2) {
      const potentialArtist = parts[0].trim();
      const potentialTitle = parts.slice(1).join(' - ').trim();
      return { title: potentialTitle, artistFromTitle: potentialArtist };
    }
  }

  return { title: cleaned };
}

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

/**
 * Parses synchronized LRC lyrics string into array of timestamped lines
 */
export function parseLrcLyrics(lrcText: string): LyricLine[] {
  if (!lrcText || typeof lrcText !== 'string') return [];
  const lines = lrcText.split(/\r?\n/);
  const result: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let match;
    const timestamps: number[] = [];
    timeRegex.lastIndex = 0;
    while ((match = timeRegex.exec(trimmed)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, '0').slice(0, 3), 10) : 0;
      timestamps.push(min * 60 + sec + ms / 1000);
    }

    const text = trimmed.replace(timeRegex, '').trim();
    if (timestamps.length > 0 && text) {
      for (const time of timestamps) {
        result.push({ time, text });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

/**
 * Finds the index of the active lyric line for the current playback position
 */
export function findActiveLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  if (!lyrics || lyrics.length === 0) return -1;
  let activeIndex = -1;
  for (let i = 0; i < lyrics.length; i++) {
    // 0.25s anticipation offset for comfortable reading cadence
    if (currentTime >= lyrics[i].time - 0.25) {
      activeIndex = i;
    } else {
      break;
    }
  }
  return activeIndex;
}

/**
 * Generates dynamic genre/mood hashtag for any song based on its title, artist, and views
 */
export function getDynamicTrackTag(title: string, artist: string, views?: string): string {
  const text = `${title} ${artist}`.toLowerCase();
  if (text.includes('synth') || text.includes('retro') || text.includes('wave') || text.includes('80s') || text.includes('neon') || text.includes('midnight') || text.includes('timecop')) return '#SYNTHWAVE';
  if (text.includes('love') || text.includes('someone') || text.includes('heart') || text.includes('alone') || text.includes('kiss') || text.includes('relationship') || text.includes('adele')) return '#RELATIONSHIPS';
  if (text.includes('rock') || text.includes('roll') || text.includes('guitar') || text.includes('punk') || text.includes('metal') || text.includes('brightside') || text.includes('yellow') || text.includes('coldplay') || text.includes('arctic')) return '#ALT-ROCK';
  if (text.includes('chill') || text.includes('lofi') || text.includes('relax') || text.includes('sleep') || text.includes('ambient') || text.includes('resonance') || text.includes('home')) return '#CHILLOUT';
  if (text.includes('dance') || text.includes('club') || text.includes('edm') || text.includes('house') || text.includes('bass') || text.includes('despacito') || text.includes('calvin') || text.includes('marshmello')) return '#ELECTRONIC';
  if (text.includes('rap') || text.includes('hip hop') || text.includes('trap') || text.includes('drill')) return '#HIP-HOP';
  if (text.includes('acoustic') || text.includes('piano') || text.includes('unplugged') || text.includes('folk') || text.includes('bloom') || text.includes('paper kites')) return '#ACOUSTIC';
  if (text.includes('jazz') || text.includes('blues') || text.includes('soul')) return '#SOUL';
  if (views && (views.includes('B views') || views.includes('B'))) return '#GLOBAL-HIT';
  if (views && (views.includes('M views') || views.includes('M'))) return '#TRENDING';
  return '#NOW-PLAYING';
}

