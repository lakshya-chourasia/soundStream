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
  accentColor = '#ec4899',
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
      className="fixed bottom-14 md:bottom-0 inset-x-0 z-30 bg-[#08090c]/95 border-t border-white/10 backdrop-blur-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.9)] transition-all"
    >
      {/* Mini Scrubber Line */}
      <div className="relative w-full h-1 bg-white/5 cursor-pointer group">
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
          className="h-full bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 shadow-[0_0_10px_#ec4899] transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Track Info (clickable to expand) */}
        <button
          onClick={onExpand}
          className="flex items-center gap-3 min-w-0 text-left group focus:outline-none flex-1 sm:flex-initial"
        >
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 shadow-inner">
            <img
              src={currentTrack.thumbnail}
              alt={title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="min-w-0 pr-2">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
              {title}
            </h4>
            <p className="text-[11px] font-serif italic text-slate-300 truncate">
              {displayArtist}
            </p>
          </div>
        </button>

        {/* Center Playback Controls */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <button
            onClick={onPrev}
            className="p-1.5 text-slate-400 hover:text-cyan-300 transition-colors active:scale-95"
            aria-label="Previous track"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={onTogglePlay}
            className="glass-aether-button w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isBuffering ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4 fill-white text-white" />
            ) : (
              <Play className="w-4 h-4 fill-white text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="p-1.5 text-slate-400 hover:text-cyan-300 transition-colors active:scale-95"
            aria-label="Next track"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* Right: Time, Volume & Expand View */}
        <div className="hidden sm:flex items-center gap-4 shrink-0">
          <span className="text-xs font-mono font-medium tabular-nums text-slate-400">
            {formatTime(currentTime)} / {effectiveDuration > 0 ? formatTime(effectiveDuration) : 'LIVE'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeVolume(volume === 0 ? 80 : 0)}
              className="text-slate-400 hover:text-pink-300"
              aria-label="Toggle mute"
            >
              {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => onChangeVolume(parseInt(e.target.value, 10))}
              className="w-16 h-1 bg-white/10 accent-pink-500 rounded-lg appearance-none cursor-pointer"
              aria-label="Volume slider"
            />
          </div>

          <button
            onClick={onExpand}
            className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-full transition-colors"
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
