import React, { useState, useRef, useEffect } from 'react';
import { Track, RepeatMode, StreamQuality } from '../types/player';
import { formatTime, cleanTrackTitle, getFullSingerName } from '../utils/playerUtils';
import { STREAM_QUALITY_OPTIONS, getQualityOption } from '../utils/qualityConfig';
import { ArtworkImage } from './ArtworkImage';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  Film,
  Mic2,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Check,
} from 'lucide-react';

interface UnifiedPlaybackBarProps {
  isCinemaMode: boolean;
  currentTrack: Track;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isVideoActive: boolean;
  isLyricsActive: boolean;
  isCurrentFavorite: boolean;
  playbackQuality: StreamQuality;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onChangeVolume: (volume: number) => void;
  onToggleFavorite: (track: Track) => void;
  onChangePlaybackQuality?: (quality: StreamQuality) => void;
  onToggleVideo: () => void;
  onToggleLyrics: () => void;
  onToggleCinema: () => void;
}

export const UnifiedPlaybackBar: React.FC<UnifiedPlaybackBarProps> = ({
  isCinemaMode,
  currentTrack,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  volume,
  repeatMode,
  isShuffle,
  isVideoActive,
  isLyricsActive,
  isCurrentFavorite,
  playbackQuality,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onToggleShuffle,
  onToggleRepeat,
  onChangeVolume,
  onToggleFavorite,
  onChangePlaybackQuality,
  onToggleVideo,
  onToggleLyrics,
  onToggleCinema,
}) => {
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);
  const qualityMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isQualityMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(e.target as Node)) {
        setIsQualityMenuOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsQualityMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isQualityMenuOpen]);

  const { title: cleanTitle, artistFromTitle } = cleanTrackTitle(currentTrack.title);
  const artist = getFullSingerName(currentTrack.artist || artistFromTitle || '', cleanTitle);
  const effectiveDuration = duration > 0 ? duration : currentTrack.durationSec || 240;
  const progressPercent =
    effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0;
  const volumePercent = Math.min(100, Math.max(0, volume));
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  const activeQuality = getQualityOption(playbackQuality);

  const repeatLabel =
    repeatMode === 'one' ? 'Repeat One' : repeatMode === 'all' ? 'Repeat Queue' : 'Repeat Off';

  return (
    <div className="shrink-0 z-[65] relative select-none">
      {/* ── MOBILE COMPACT MINI-PLAYER (Home Only, < md) ── */}
      {!isCinemaMode && (
        <div
          onClick={onToggleCinema}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onToggleCinema();
            }
          }}
          className="md:hidden flex items-center justify-between px-3.5 py-2 bg-[#0c0c0f]/95 backdrop-blur-xl border-t border-white/[0.08] cursor-pointer relative active:bg-[#18181D] transition-colors"
          aria-label={`Now playing ${cleanTitle} by ${artist}. Tap to expand player`}
        >
          {/* Thin Scrubber Track on Top Edge */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-white/[0.08]">
            <div
              className="h-full bg-amber-400 transition-[width] duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Track Thumbnail & Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#18181D] shrink-0 ring-1 ring-white/[0.1]">
              <ArtworkImage
                title={cleanTitle}
                artist={artist}
                trackId={currentTrack.id}
                initialSrc={currentTrack.thumbnail}
                alt={cleanTitle}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-50 truncate leading-snug">
                {cleanTitle}
              </p>
              <p className="text-[11px] text-zinc-400 truncate leading-snug">{artist}</p>
            </div>
          </div>

          {/* Mobile Quick Controls (>= 44px touch targets) */}
          <div
            className="flex items-center gap-0.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onToggleLyrics}
              className={`w-11 h-11 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isLyricsActive ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-100'
              }`}
              aria-label="Open synchronized lyrics"
              title="Synchronized Lyrics"
            >
              <Mic2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(currentTrack)}
              className={`w-11 h-11 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isCurrentFavorite ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-100'
              }`}
              aria-label={isCurrentFavorite ? 'Remove from favorites' : 'Save to favorites'}
              title={isCurrentFavorite ? 'Saved to favorites' : 'Save to favorites'}
            >
              <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className="w-11 h-11 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 flex items-center justify-center active:scale-95 transition-transform cursor-pointer shrink-0 ml-1"
              aria-label={isPlaying ? 'Pause' : 'Play'}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? (
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-zinc-950 text-zinc-950" />
              ) : (
                <Play className="w-4 h-4 fill-zinc-950 text-zinc-950 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── IDENTICAL PERSISTENT STUDIO PLAYBACK BAR (Home Desktop & Cinema Mode) ── */}
      <footer
        className={`${
          isCinemaMode
            ? 'flex flex-col md:flex-row pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] md:py-0 md:h-20 gap-3 md:gap-0'
            : 'hidden md:flex md:h-20'
        } w-full bg-[#0c0c0f]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 sm:px-6 items-center justify-between`}
      >
        {/* Left Zone: Track Info & Favorite (Identical across Home and Cinema) */}
        <div
          className={`flex items-center gap-3 ${
            isCinemaMode
              ? 'w-full md:w-[28%] md:min-w-[200px] md:max-w-[340px] justify-between md:justify-start'
              : 'w-[28%] min-w-[200px] max-w-[340px]'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onToggleCinema}
              className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#18181D] shrink-0 ring-1 ring-white/[0.08] cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
              title={isCinemaMode ? 'Return to Home Workspace' : 'Open Cinema Mode'}
              aria-label={isCinemaMode ? 'Return to Home Workspace' : 'Open Cinema Mode'}
            >
              <ArtworkImage
                title={cleanTitle}
                artist={artist}
                trackId={currentTrack.id}
                initialSrc={currentTrack.thumbnail}
                alt={cleanTitle}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </button>

            <div className="min-w-0 pr-1 text-left">
              <button
                type="button"
                onClick={onToggleCinema}
                className="block max-w-full text-left text-sm font-semibold text-zinc-50 hover:text-amber-400 truncate leading-snug cursor-pointer transition-colors focus-visible:outline-none focus-visible:text-amber-400"
                title={isCinemaMode ? 'Return to Home Workspace' : 'Open Cinema Mode'}
              >
                {cleanTitle}
              </button>
              <p className="text-xs text-zinc-400 truncate mt-0.5 leading-snug">{artist}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite(currentTrack)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
              isCurrentFavorite
                ? 'text-amber-400 hover:bg-white/[0.06]'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]'
            }`}
            title={isCurrentFavorite ? 'Remove from favorites' : 'Save to favorites'}
            aria-label={isCurrentFavorite ? 'Remove from favorites' : 'Save to favorites'}
          >
            <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center Zone: Transport Controls & Tactile Scrubber (Identical across Home and Cinema) */}
        <div className="w-full md:flex-1 md:max-w-xl md:px-6 flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              type="button"
              onClick={onToggleShuffle}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                isShuffle
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
              title={isShuffle ? 'Shuffle On' : 'Shuffle Off'}
              aria-label={isShuffle ? 'Disable shuffle' : 'Enable shuffle'}
              aria-pressed={isShuffle}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onPrev}
              className="w-9 h-9 rounded-lg text-zinc-200 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
              title="Previous track (P)"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 flex items-center justify-center active:scale-95 transition-transform cursor-pointer shrink-0 shadow-[0_6px_20px_-6px_rgba(245,158,11,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? (
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4.5 h-4.5 fill-zinc-950 text-zinc-950" />
              ) : (
                <Play className="w-4.5 h-4.5 fill-zinc-950 text-zinc-950 ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              className="w-9 h-9 rounded-lg text-zinc-200 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
              title="Next track (N)"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={onToggleRepeat}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                repeatMode !== 'off'
                  ? 'text-amber-400 bg-amber-500/10'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
              title={repeatLabel}
              aria-label={repeatLabel}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Precision Scrubber Timeline */}
          <div className="w-full flex items-center gap-2.5 group/scrubber select-none">
            <span className="text-[11px] font-mono tabular-nums text-zinc-400 min-w-[38px] text-right">
              {formatTime(currentTime)}
            </span>

            <div className="relative flex-1 flex items-center h-4">
              <div className="w-full h-1 group-hover/scrubber:h-1.5 bg-white/[0.14] rounded-full overflow-hidden relative pointer-events-none transition-[height] duration-150">
                <div
                  className="h-full bg-amber-400 group-hover/scrubber:bg-amber-300 rounded-full transition-colors"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md ring-2 ring-amber-400 opacity-0 group-hover/scrubber:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `calc(${progressPercent}% - 6px)` }}
              />

              <input
                type="range"
                min={0}
                max={effectiveDuration || 100}
                step={0.5}
                value={Math.min(currentTime, effectiveDuration || 100)}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label="Seek timeline"
              />
            </div>

            <span className="text-[11px] font-mono tabular-nums text-zinc-400 min-w-[38px]">
              {formatTime(effectiveDuration)}
            </span>
          </div>
        </div>

        {/* Right Zone: Quality, Video, Lyrics, Cinema Toggle & Volume (Identical across Home and Cinema) */}
        <div
          className={`${
            isCinemaMode
              ? 'flex w-full md:w-[28%] md:min-w-[210px] md:max-w-[340px] justify-between md:justify-end'
              : 'flex w-[28%] min-w-[210px] max-w-[340px] justify-end'
          } items-center gap-1.5`}
        >
          {/* Real Interactive Stream Quality Selector */}
          {onChangePlaybackQuality && (
            <div className="relative" ref={qualityMenuRef}>
              <button
                type="button"
                onClick={() => setIsQualityMenuOpen((o) => !o)}
                className={`h-8 px-2.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                  isQualityMenuOpen
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    : 'bg-[#18181D] hover:bg-[#202027] text-zinc-200 border-white/[0.08]'
                }`}
                title={`Stream quality: ${activeQuality.label}`}
                aria-label={`Stream quality: ${activeQuality.label}`}
                aria-expanded={isQualityMenuOpen}
                aria-haspopup="menu"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono tabular-nums text-[11px]">
                  {activeQuality.shortLabel}
                </span>
              </button>

              {isQualityMenuOpen && (
                <div
                  role="menu"
                  className="absolute bottom-11 left-0 md:left-auto md:right-0 w-60 rounded-xl bg-[#141418] border border-white/[0.1] shadow-2xl p-1.5 z-50"
                >
                  <div className="px-2.5 py-1.5 border-b border-white/[0.06] mb-1">
                    <p className="text-xs font-semibold text-zinc-200">Stream Quality</p>
                    <p className="text-[11px] text-zinc-500">YouTube player resolution preference</p>
                  </div>
                  {STREAM_QUALITY_OPTIONS.map((option) => {
                    const selected = option.id === activeQuality.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={selected}
                        onClick={() => {
                          onChangePlaybackQuality(option.id);
                          setIsQualityMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-start justify-between gap-2 transition-colors cursor-pointer ${
                          selected
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'text-zinc-200 hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-tight">{option.label}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
                            {option.detail}
                          </p>
                        </div>
                        {selected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Mode & Cinema Controls (Consistent slots in BOTH Home and Cinema Mode) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleVideo}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                isVideoActive
                  ? 'bg-amber-400 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
              title={isVideoActive ? 'Hide Video' : 'Watch Video'}
              aria-label={isVideoActive ? 'Hide video' : 'Watch video'}
              aria-pressed={isVideoActive}
            >
              <Film className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onToggleLyrics}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                isLyricsActive
                  ? 'bg-amber-400 text-zinc-950'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
              title={isLyricsActive ? 'Close Lyrics' : 'Synchronized Lyrics'}
              aria-label={isLyricsActive ? 'Close synchronized lyrics' : 'Open synchronized lyrics'}
              aria-pressed={isLyricsActive}
            >
              <Mic2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onToggleCinema}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                isCinemaMode
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/35'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
              title={isCinemaMode ? 'Exit Cinema Mode (Esc)' : 'Open Cinema Mode'}
              aria-label={isCinemaMode ? 'Exit Cinema Mode' : 'Open Cinema Mode'}
              aria-pressed={isCinemaMode}
            >
              {isCinemaMode ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Custom Tactile Volume Control (Matching Timeline Scrubber Precision) */}
          <div className="hidden lg:flex items-center gap-2 ml-1 group/volume">
            <button
              type="button"
              onClick={() => onChangeVolume(volume === 0 ? 80 : 0)}
              className="w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
              title={volume === 0 ? 'Unmute (M)' : `Mute (${volume}%) (M)`}
              aria-label={volume === 0 ? 'Unmute audio' : 'Mute audio'}
            >
              <VolumeIcon className="w-4 h-4" />
            </button>

            <div className="relative w-20 flex items-center h-4">
              <div className="w-full h-1 group-hover/volume:h-1.5 bg-white/[0.14] rounded-full overflow-hidden pointer-events-none transition-[height] duration-150">
                <div
                  className="h-full bg-zinc-200 group-hover/volume:bg-amber-400 rounded-full transition-colors"
                  style={{ width: `${volumePercent}%` }}
                />
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow ring-2 ring-amber-400 opacity-0 group-hover/volume:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `calc(${volumePercent}% - 5px)` }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => onChangeVolume(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                aria-label="Volume"
                title={`Volume: ${volume}%`}
              />
            </div>

            <span className="text-[10px] font-mono tabular-nums text-zinc-500 w-7 text-right">
              {volume}%
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
