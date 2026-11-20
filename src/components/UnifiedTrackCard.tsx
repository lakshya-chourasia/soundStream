import React from 'react';
import { Track } from '../types/player';
import { cleanTrackTitle, getFullSingerName, formatTime } from '../utils/playerUtils';
import { ArtworkImage } from './ArtworkImage';
import { Play, Pause, Plus, Check, Heart } from 'lucide-react';

interface UnifiedTrackCardProps {
  track: Track;
  variant?: 'card' | 'shelf';
  isCurrent: boolean;
  isPlaying: boolean;
  isFavorite: boolean;
  isInQueue: boolean;
  onPlay: (track: Track) => void;
  onTogglePlay: () => void;
  onAddToQueue: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
}

export const UnifiedTrackCard: React.FC<UnifiedTrackCardProps> = ({
  track,
  variant = 'card',
  isCurrent,
  isPlaying,
  isFavorite,
  isInQueue,
  onPlay,
  onTogglePlay,
  onAddToQueue,
  onToggleFavorite,
}) => {
  const { title: cleanTitle, artistFromTitle } = cleanTrackTitle(track.title);
  const artist = getFullSingerName(track.artist || artistFromTitle || '', cleanTitle);
  const durationLabel =
    track.duration && track.duration !== 'YouTube Track'
      ? track.duration
      : track.durationSec > 0
      ? formatTime(track.durationSec)
      : '';

  const handlePrimaryClick = () => {
    if (isCurrent) {
      onTogglePlay();
    } else {
      onPlay(track);
    }
  };

  if (variant === 'shelf') {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={handlePrimaryClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePrimaryClick();
          }
        }}
        className={`group flex items-center gap-3 p-2 pr-3 rounded-xl border transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
          isCurrent
            ? 'bg-[#1a160e] border-amber-500/45 shadow-[0_6px_24px_-12px_rgba(245,158,11,0.35)]'
            : 'bg-[#141418]/90 hover:bg-[#1b1b22] border-white/[0.06] hover:border-white/[0.14]'
        }`}
        aria-label={`${isCurrent && isPlaying ? 'Pause' : 'Play'} ${cleanTitle} by ${artist}`}
      >
        {/* Artwork + Play Overlay */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-[#0c0c0f] shrink-0 ring-1 ring-white/[0.08]">
          <ArtworkImage
            title={cleanTitle}
            artist={artist}
            trackId={track.id}
            initialSrc={track.thumbnail}
            alt={`${cleanTitle} by ${artist}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />

          <div
            className={`absolute inset-0 bg-black/55 flex items-center justify-center transition-opacity duration-150 ${
              isCurrent
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
            }`}
          >
            {isCurrent && isPlaying ? (
              <div className="flex items-end gap-[2px] h-3.5 group-hover:hidden">
                <span className="w-[2px] bg-amber-400 rounded-full animate-bar-1" />
                <span className="w-[2px] bg-amber-400 rounded-full animate-bar-2" />
                <span className="w-[2px] bg-amber-400 rounded-full animate-bar-3" />
              </div>
            ) : null}
            <span
              className={`${
                isCurrent && isPlaying ? 'hidden group-hover:flex' : 'flex'
              } w-7 h-7 rounded-full bg-amber-400 text-zinc-950 items-center justify-center shadow-md`}
            >
              {isCurrent && isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-zinc-950 text-zinc-950 ml-0.5" />
              )}
            </span>
          </div>
        </div>

        {/* Title & Artist */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold truncate leading-snug transition-colors ${
              isCurrent ? 'text-amber-400' : 'text-zinc-100 group-hover:text-white'
            }`}
          >
            {cleanTitle}
          </p>
          <p className="text-xs text-zinc-400 truncate mt-0.5 leading-snug">{artist}</p>
        </div>

        {/* Duration + Actions */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {durationLabel && (
            <span className="text-[11px] font-mono tabular-nums text-zinc-500 mr-1 hidden sm:inline">
              {durationLabel}
            </span>
          )}
          <button
            type="button"
            onClick={() => onAddToQueue(track)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ${
              isInQueue
                ? 'text-amber-400 hover:bg-white/[0.06]'
                : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/[0.06] sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100'
            }`}
            title={isInQueue ? 'In queue' : 'Add to queue'}
            aria-label={isInQueue ? `${cleanTitle} is in queue` : `Add ${cleanTitle} to queue`}
          >
            {isInQueue ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(track)}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ${
              isFavorite
                ? 'text-amber-400 hover:bg-white/[0.06]'
                : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/[0.06] sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            aria-label={isFavorite ? `Remove ${cleanTitle} from favorites` : `Save ${cleanTitle} to favorites`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handlePrimaryClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePrimaryClick();
        }
      }}
      className={`group relative rounded-xl p-3 border transition-all duration-150 cursor-pointer flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
        isCurrent
          ? 'bg-[#1a160e] border-amber-500/45 shadow-[0_10px_30px_-14px_rgba(245,158,11,0.3)]'
          : 'bg-[#141418]/90 hover:bg-[#1a1a21] border-white/[0.06] hover:border-white/[0.14]'
      }`}
      aria-label={`${isCurrent && isPlaying ? 'Pause' : 'Play'} ${cleanTitle} by ${artist}`}
    >
      {/* Artwork Container */}
      <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-[#0c0c0f] mb-3 ring-1 ring-white/[0.06]">
        <ArtworkImage
          title={cleanTitle}
          artist={artist}
          trackId={track.id}
          initialSrc={track.thumbnail}
          alt={`${cleanTitle} by ${artist}`}
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />

        {/* Measured Bottom Contrast Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-55 group-hover:opacity-80 transition-opacity duration-150 pointer-events-none" />

        {/* Live Equalizer Bars (Only when genuinely playing) */}
        {isCurrent && isPlaying && (
          <div
            className="absolute top-2.5 left-2.5 h-6 px-2 rounded-md bg-black/75 backdrop-blur-md flex items-center gap-1.5 ring-1 ring-amber-400/30"
            aria-label="Currently playing"
          >
            <div className="flex items-end gap-[2px] h-3">
              <span className="w-[2px] bg-amber-400 rounded-full animate-bar-1" />
              <span className="w-[2px] bg-amber-400 rounded-full animate-bar-2" />
              <span className="w-[2px] bg-amber-400 rounded-full animate-bar-3" />
            </div>
            <span className="text-[11px] font-medium text-amber-300 leading-none">Playing</span>
          </div>
        )}

        {/* Primary Play / Pause Trigger */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrimaryClick();
          }}
          className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.45)] transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
            isCurrent
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 group-focus-within:opacity-100 group-focus-within:translate-y-0'
          }`}
          aria-label={isCurrent && isPlaying ? `Pause ${cleanTitle}` : `Play ${cleanTitle}`}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-4 h-4 fill-zinc-950 text-zinc-950" />
          ) : (
            <Play className="w-4 h-4 fill-zinc-950 text-zinc-950 ml-0.5" />
          )}
        </button>
      </div>

      {/* Metadata & Quick Actions */}
      <div className="flex-1 flex flex-col justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <p
            className={`text-sm font-semibold truncate leading-snug transition-colors ${
              isCurrent ? 'text-amber-400' : 'text-zinc-100 group-hover:text-white'
            }`}
          >
            {cleanTitle}
          </p>
          <p className="text-xs text-zinc-400 truncate mt-0.5 leading-snug">{artist}</p>
        </div>

        {/* Clean Unboxed Footer Metadata + Subtle Affordances */}
        <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.05]">
          <span className="text-[11px] font-mono tabular-nums text-zinc-500">
            {durationLabel || '—'}
          </span>

          <div
            className="flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onAddToQueue(track)}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ${
                isInQueue
                  ? 'text-amber-400 hover:bg-white/[0.06]'
                  : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
              title={isInQueue ? 'In queue' : 'Add to queue'}
              aria-label={isInQueue ? `${cleanTitle} is in queue` : `Add ${cleanTitle} to queue`}
            >
              {isInQueue ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(track)}
              className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ${
                isFavorite
                  ? 'text-amber-400 hover:bg-white/[0.06]'
                  : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/[0.06]'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
              aria-label={isFavorite ? `Remove ${cleanTitle} from favorites` : `Save ${cleanTitle} to favorites`}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
