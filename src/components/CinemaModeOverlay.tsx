import React, { useEffect, useRef } from 'react';
import { Track, StreamQuality } from '../types/player';
import { cleanTrackTitle, getFullSingerName, formatTime } from '../utils/playerUtils';
import { getQualityOption } from '../utils/qualityConfig';
import { RGBColor } from '../utils/colorUtils';
import { InteractiveCoverArt } from './InteractiveCoverArt';
import { ChevronDown, Disc, Film, Mic2, Minimize2, Loader2, Heart, Plus, Check } from 'lucide-react';

export type CinemaViewMode = 'poster' | 'video' | 'lyrics';

interface CinemaModeOverlayProps {
  currentTrack: Track;
  viewMode: CinemaViewMode;
  posterColor: RGBColor;
  isPlaying: boolean;
  duration: number;
  isCurrentFavorite: boolean;
  isCurrentInQueue: boolean;
  playbackQuality: StreamQuality;
  lyricsData: {
    plainLyrics: string | null;
    syncedLyrics: string | null;
    parsedLines: Array<{ time: number; text: string }>;
    instrumental?: boolean;
    quotaExceeded?: boolean;
    isLoading: boolean;
  };
  activeLyricIndex: number;
  lyricsContextLines: [string, string, string];
  onChangeViewMode: (mode: CinemaViewMode) => void;
  onClose: () => void;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleFavorite: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

export const CinemaModeOverlay: React.FC<CinemaModeOverlayProps> = ({
  currentTrack,
  viewMode,
  posterColor,
  isPlaying,
  duration,
  isCurrentFavorite,
  isCurrentInQueue,
  playbackQuality,
  lyricsData,
  activeLyricIndex,
  lyricsContextLines,
  onChangeViewMode,
  onClose,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onToggleFavorite,
  onAddToQueue,
}) => {
  const activeLineRef = useRef<HTMLButtonElement | null>(null);

  const { title: cleanTitle, artistFromTitle } = cleanTrackTitle(currentTrack.title);
  const artist = getFullSingerName(currentTrack.artist || artistFromTitle || '', cleanTitle);
  const effectiveDuration = duration > 0 ? duration : currentTrack.durationSec || 0;
  const activeQuality = getQualityOption(playbackQuality);

  useEffect(() => {
    if (viewMode === 'lyrics' && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricIndex, viewMode]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const [prevLyric, currentLyric, nextLyric] = lyricsContextLines;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Fullscreen player: ${cleanTitle}`}
      className="absolute inset-0 z-50 flex flex-col justify-between overflow-hidden select-none bg-[#09090B]"
    >
      {/* Multi-Layered Soft Ambient Artwork Aura */}
      <div
        className="absolute inset-0 opacity-28 pointer-events-none blur-[120px] transition-all duration-700"
        style={{
          background: `radial-gradient(circle at 35% 30%, rgb(${posterColor.r}, ${posterColor.g}, ${posterColor.b}) 0%, transparent 60%), radial-gradient(circle at 75% 70%, rgba(${posterColor.r}, ${posterColor.g}, ${posterColor.b}, 0.45) 0%, transparent 55%)`,
        }}
      />

      {/* ── TOP BAR ── */}
      <header
        className="relative z-10 w-full px-4 sm:px-8 h-16 flex items-center justify-between gap-4 shrink-0 bg-[#09090B]/70 backdrop-blur-xl border-b border-white/[0.07]"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        {/* Left: Collapse + Track Context */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg text-zinc-300 hover:text-white hover:bg-white/[0.07] flex items-center justify-center transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
            title="Exit Cinema Mode (Esc)"
            aria-label="Exit Cinema Mode"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-50 truncate leading-snug">{cleanTitle}</p>
            <p className="text-xs text-zinc-400 truncate leading-snug">{artist}</p>
          </div>
        </div>

        {/* Center/Right: Clean Segmented Mode Switcher */}
        <div
          role="tablist"
          aria-label="Cinema display mode"
          className="flex items-center gap-1 p-1 rounded-xl bg-[#141418]/90 border border-white/[0.08] shrink-0"
        >
          {(
            [
              { id: 'poster', label: 'Cover Art', Icon: Disc },
              { id: 'video', label: 'Video', Icon: Film },
              { id: 'lyrics', label: 'Lyrics', Icon: Mic2 },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = viewMode === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChangeViewMode(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                  active
                    ? 'bg-amber-400 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Desktop Exit Button */}
        <div className="hidden sm:flex items-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-3 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
            title="Exit Fullscreen (Esc)"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </header>

      {/* ── CENTER STAGE ── */}
      <div className="relative z-10 flex-1 w-full overflow-hidden flex flex-col justify-center">
        {viewMode === 'lyrics' && (
          <div
            className="w-full h-full overflow-y-auto no-scrollbar px-5 sm:px-14 md:px-20 lg:px-32 py-14 sm:py-20"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
              WebkitMaskImage:
                'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
            }}
          >
            <div className="max-w-3xl space-y-5 sm:space-y-7 select-text mx-auto w-full">
              {lyricsData.isLoading ? (
                <div className="flex items-center gap-3 text-amber-400 text-base sm:text-lg font-medium py-12">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading synchronized lyrics...</span>
                </div>
              ) : lyricsData.parsedLines.length > 0 ? (
                lyricsData.parsedLines.map((line, idx) => {
                  const isActive = idx === activeLyricIndex;
                  const isPast = activeLyricIndex >= 0 && idx < activeLyricIndex;
                  return (
                    <button
                      key={`${idx}-${line.time}`}
                      type="button"
                      ref={isActive ? activeLineRef : null}
                      onClick={() => onSeek(line.time)}
                      className={`group/line flex items-baseline gap-4 w-full text-left cursor-pointer transition-colors duration-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60`}
                    >
                      <span
                        className={`hidden sm:inline-block w-11 shrink-0 text-xs font-mono tabular-nums transition-opacity ${
                          isActive
                            ? 'text-amber-400 opacity-100'
                            : 'text-zinc-500 opacity-0 group-hover/line:opacity-100'
                        }`}
                      >
                        {formatTime(line.time)}
                      </span>
                      <span
                        className={`font-bold leading-snug transition-colors duration-200 ${
                          isActive
                            ? 'text-amber-300 text-2xl sm:text-4xl'
                            : isPast
                            ? 'text-zinc-500 hover:text-zinc-300 text-lg sm:text-2xl lg:text-3xl'
                            : 'text-zinc-300/80 hover:text-zinc-100 text-lg sm:text-2xl lg:text-3xl'
                        }`}
                      >
                        {line.text}
                      </span>
                    </button>
                  );
                })
              ) : lyricsData.plainLyrics ? (
                <div className="text-zinc-200 text-lg sm:text-2xl font-medium leading-relaxed whitespace-pre-line py-4">
                  {lyricsData.plainLyrics}
                </div>
              ) : (
                <div className="py-16 text-center space-y-3">
                  <p className="text-zinc-200 text-lg font-semibold">
                    {lyricsData.instrumental
                      ? 'Instrumental track — no vocal lyrics.'
                      : 'No synchronized lyrics available for this track.'}
                  </p>
                  <p className="text-zinc-400 text-sm max-w-md mx-auto">
                    {lyricsData.instrumental
                      ? 'Enjoy the instrumental soundscape. Switch to Cover Art or Video anytime.'
                      : lyricsData.quotaExceeded
                      ? 'Lyrics were not found in the lyrics catalog, and AI fallback daily quota is temporarily reached. Playback continues uninterrupted.'
                      : 'Playback continues uninterrupted. Switch to Cover Art or Video anytime.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onChangeViewMode('poster')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#18181D] hover:bg-[#222229] text-zinc-100 border border-white/[0.1] text-xs font-medium transition-colors cursor-pointer mt-2"
                  >
                    <Disc className="w-3.5 h-3.5 text-amber-400" />
                    <span>Show Cover Art</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'video' && (
          <div className="w-full h-full flex items-center justify-center px-3 sm:px-6 md:px-10 py-4">
            <div
              id="soundstream-cinema-video-container"
              className="w-full max-w-5xl max-h-full aspect-video rounded-2xl overflow-hidden bg-black/50 border border-white/[0.08]"
            />
          </div>
        )}

        {viewMode === 'poster' && (
          <div className="w-full h-full flex items-center justify-center p-5 sm:p-10 overflow-y-auto no-scrollbar">
            <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14">
              {/* Left: Interactive Wiggly Studio Album Artwork */}
              <InteractiveCoverArt
                title={cleanTitle}
                artist={artist}
                trackId={currentTrack.id}
                initialSrc={currentTrack.thumbnail}
                isPlaying={isPlaying}
                isFavorite={isCurrentFavorite}
                size="cinema"
                priority
                onTogglePlay={onTogglePlay}
                onPrev={onPrev}
                onNext={onNext}
                onToggleFavorite={() => onToggleFavorite(currentTrack)}
                className="w-60 sm:w-80 lg:w-[400px] shrink-0"
              />

              {/* Right: Editorial Track Details & Interactive 3-Line Lyrics Preview */}
              <div className="flex-1 min-w-0 max-w-lg text-center lg:text-left space-y-6">
                <div className="space-y-2">
                  <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-bold text-zinc-50 tracking-tight leading-tight text-balance">
                    {cleanTitle}
                  </h2>
                  <p className="text-base sm:text-lg text-zinc-300 font-medium">{artist}</p>
                </div>

                {/* Quick Track Actions */}
                <div className="flex items-center justify-center lg:justify-start gap-2.5">
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(currentTrack)}
                    className={`h-9 px-4 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isCurrentFavorite
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border-white/[0.1]'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isCurrentFavorite ? 'fill-current' : ''}`} />
                    <span>{isCurrentFavorite ? 'Saved to Liked' : 'Save to Liked'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddToQueue(currentTrack)}
                    className="h-9 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 border border-white/[0.1] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isCurrentInQueue ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-amber-400" />
                        <span>In Queue</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Queue</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live 3-Line Lyrics Preview (Click to open full Lyrics view) */}
                {currentLyric && (
                  <button
                    type="button"
                    onClick={() => onChangeViewMode('lyrics')}
                    className="w-full text-left rounded-xl p-4 bg-[#141418]/80 hover:bg-[#1a1a20]/90 border border-white/[0.08] hover:border-amber-500/35 transition-colors cursor-pointer space-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                  >
                    <div className="flex items-center justify-end pb-1">
                      <span className="text-[11px] font-medium text-amber-400">Open full view →</span>
                    </div>
                    {prevLyric && (
                      <p className="text-xs text-zinc-500 truncate">{prevLyric}</p>
                    )}
                    <p className="text-sm sm:text-base font-semibold text-amber-300 leading-snug line-clamp-2">
                      {currentLyric}
                    </p>
                    {nextLyric && (
                      <p className="text-xs text-zinc-400 truncate">{nextLyric}</p>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
