import React from 'react';
import { Track } from '../types/player';
import { Play, Pause, SkipBack, SkipForward, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { formatTime, cleanTrackTitle } from '../utils/playerUtils';

interface MiniPlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  accentColor?: string;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onChangeVolume: (volume: number) => void;
  onExpand: () => void;
}

export const MiniPlayerBar: React.FC<MiniPlayerBarProps> = ({
  currentTrack,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  volume,
  accentColor = '#f59e0b',
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onChangeVolume,
  onExpand,
}) => {
  if (!currentTrack) return null;

  const { title, artistFromTitle } = cleanTrackTitle(currentTrack.title);
  const displayArtist = artistFromTitle || currentTrack.artist || 'YouTube Artist';
  const effectiveDuration = duration > 0 ? duration : currentTrack.durationSec || 0;
  const progressPercent = effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;

  return (
    <aside
      aria-label="Audio playback controls"
      className="fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shadow-xl transition-all"
    >
      {/* Mini Scrubber Line */}
      <div className="relative w-full h-1 bg-zinc-200 dark:bg-zinc-800 cursor-pointer group">
        <input
          type="range"
          min={0}
          max={effectiveDuration || 100}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Seek track"
        />
        <div
          className="h-full transition-colors"
          style={{ width: `${progressPercent}%`, backgroundColor: accentColor }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Track Info (clickable to expand) */}
        <button
          onClick={onExpand}
          className="flex items-center gap-3 min-w-0 text-left group focus:outline-none flex-1 sm:flex-initial"
        >
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 border border-zinc-700/40">
            <img
              src={currentTrack.thumbnail}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="min-w-0 pr-2">
            <h4 className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:opacity-80 transition-opacity">
              {title}
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
              {displayArtist}
            </p>
          </div>
        </button>

        {/* Center Playback Controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            onClick={onPrev}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
            aria-label="Previous track"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-full text-zinc-950 flex items-center justify-center transition-transform active:scale-90 shadow-md"
            style={{ backgroundColor: accentColor }}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isBuffering ? (
              <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-zinc-950" />
            ) : (
              <Play className="w-4 h-4 fill-zinc-950 ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
            aria-label="Next track"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Right: Time, Volume & Expand View */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <span className="text-xs font-mono tabular-nums text-zinc-400">
            {formatTime(currentTime)} / {effectiveDuration > 0 ? formatTime(effectiveDuration) : 'Live'}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onChangeVolume(volume === 0 ? 80 : 0)}
              className="text-zinc-400 hover:text-zinc-200"
              aria-label="Toggle mute"
            >
              {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => onChangeVolume(Number(e.target.value))}
              className="w-16 h-1 rounded appearance-none cursor-pointer"
              aria-label="Mini player volume"
            />
          </div>

          <button
            onClick={onExpand}
            className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Expand to Full Player"
            aria-label="Expand player"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
