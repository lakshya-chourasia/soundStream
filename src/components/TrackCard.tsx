import React from 'react';
import { Track } from '../types/player';
import { Play, Pause, Plus, Check, Heart, Music } from 'lucide-react';
import { cleanTrackTitle } from '../utils/playerUtils';

interface TrackCardProps {
  track: Track;
  isCurrent: boolean;
  isPlaying: boolean;
  isQueued?: boolean;
  isFavorite?: boolean;
  onPlay: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onToggleFavorite?: (track: Track) => void;
  onRemoveFromQueue?: (track: Track) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({
  track,
  isCurrent,
  isPlaying,
  isQueued = false,
  isFavorite = false,
  onPlay,
  onAddToQueue,
  onToggleFavorite,
  onRemoveFromQueue,
}) => {
  const { title, artistFromTitle } = cleanTrackTitle(track.title);
  const displayArtist = artistFromTitle || track.artist || 'YouTube Artist';

  return (
    <div
      className={`group flex items-center justify-between gap-3 p-2.5 rounded-xl transition-all duration-150 ${
        isCurrent
          ? 'border shadow-xs'
          : 'hover:bg-zinc-100 dark:hover:bg-zinc-900/60 border border-transparent'
      }`}
      style={
        isCurrent
          ? {
              backgroundColor: 'color-mix(in srgb, var(--theme-accent, #f59e0b) 12%, transparent)',
              borderColor: 'color-mix(in srgb, var(--theme-accent, #f59e0b) 30%, transparent)',
            }
          : {}
      }
    >
      {/* Thumbnail + Play Overlay */}
      <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0 shadow-sm">
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Graceful CSS fallback
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : null}

        {/* Fallback icon container */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center bg-zinc-800 text-zinc-500">
          <Music className="w-5 h-5" />
        </div>

        {/* Play / Playing Button Overlay */}
        <button
          onClick={() => onPlay(track)}
          className={`absolute inset-0 flex items-center justify-center transition-all ${
            isCurrent
              ? 'bg-black/50 opacity-100'
              : 'bg-black/40 opacity-0 group-hover:opacity-100'
          }`}
          aria-label={isCurrent && isPlaying ? `Pause ${title}` : `Play ${title}`}
        >
          {isCurrent && isPlaying ? (
            <Pause className="w-5 h-5 fill-current" style={{ color: 'var(--theme-accent, #f59e0b)' }} />
          ) : (
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          )}
        </button>
      </div>

      {/* Info: Title & Unboxed Metadata */}
      <div className="flex-1 min-w-0 pr-1">
        <button
          onClick={() => onPlay(track)}
          className="text-left w-full focus:outline-none block"
        >
          <h4
            className={`text-sm font-medium truncate tracking-tight transition-colors ${
              isCurrent ? 'font-semibold' : 'text-zinc-900 dark:text-zinc-100'
            }`}
            style={isCurrent ? { color: 'var(--theme-accent, #f59e0b)' } : {}}
          >
            {title}
          </h4>
        </button>

        {/* Zero-Pill unboxed metadata with dot separators */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
          <span className="truncate max-w-[140px] md:max-w-[200px]">{displayArtist}</span>
          <span aria-hidden="true" className="opacity-50">·</span>
          <span className="font-mono tabular-nums shrink-0">{track.duration}</span>
          {track.views && (
            <>
              <span aria-hidden="true" className="opacity-50 hidden sm:inline">·</span>
              <span className="truncate hidden sm:inline text-[11px] opacity-80">{track.views}</span>
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(track)}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorite
                ? 'text-rose-500 dark:text-rose-400 hover:bg-rose-500/10'
                : 'text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60 opacity-0 group-hover:opacity-100 sm:opacity-70'
            }`}
            aria-label={isFavorite ? `Remove ${title} from favorites` : `Save ${title} to favorites`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {onRemoveFromQueue ? (
          <button
            onClick={() => onRemoveFromQueue(track)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            title="Remove from queue"
            aria-label={`Remove ${title} from queue`}
          >
            <span className="text-sm font-semibold leading-none">&times;</span>
          </button>
        ) : (
          <button
            onClick={() => onAddToQueue(track)}
            className={`p-1.5 rounded-lg transition-colors ${
              isQueued
                ? 'text-emerald-500 bg-emerald-500/10'
                : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/60 opacity-80 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
            title={isQueued ? 'In queue' : 'Add to queue'}
            aria-label={`Add ${title} to queue`}
          >
            {isQueued ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        )}
      </div>
    </div>
  );
};
