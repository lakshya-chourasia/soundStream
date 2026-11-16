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
      className={`group relative flex items-center justify-between gap-3 p-2.5 rounded-2xl transition-all duration-150 ${
        isCurrent
          ? 'bg-white/[0.1] border border-white/30 shadow-lg'
          : 'bg-[#111114]/80 hover:bg-[#18181c] border border-white/[0.06] hover:border-white/15'
      }`}
    >
      {/* Thumbnail + Play Overlay */}
      <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 shadow-inner">
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : null}

        {/* Fallback icon container */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center bg-zinc-900 text-zinc-600">
          <Music className="w-5 h-5" />
        </div>

        {/* Play / Equalizer Overlay */}
        <button
          onClick={() => onPlay(track)}
          className={`absolute inset-0 flex items-center justify-center transition-all ${
            isCurrent
              ? 'bg-black/60 opacity-100'
              : 'bg-black/50 opacity-0 group-hover:opacity-100 backdrop-blur-[2px]'
          }`}
          aria-label={isCurrent && isPlaying ? `Pause ${title}` : `Play ${title}`}
        >
          {isCurrent && isPlaying ? (
            <div className="flex items-end gap-1 h-3.5">
              <span className="w-1 bg-white rounded-full animate-audio-bar-1 h-2.5" />
              <span className="w-1 bg-white rounded-full animate-audio-bar-2 h-3.5" />
              <span className="w-1 bg-white rounded-full animate-audio-bar-3 h-2" />
            </div>
          ) : (
            <Play className="w-5 h-5 text-white fill-white ml-0.5 filter drop-shadow-md" />
          )}
        </button>
      </div>

      {/* Info: Title & Editorial Typography */}
      <div className="flex-1 min-w-0 pr-1">
        <button
          onClick={() => onPlay(track)}
          className="text-left w-full focus:outline-none block"
        >
          <h4
            className={`text-sm truncate tracking-tight transition-colors ${
              isCurrent ? 'font-bold text-white' : 'font-semibold text-zinc-200 group-hover:text-white'
            }`}
          >
            {title}
          </h4>
        </button>

        {/* Metadata */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5 truncate font-mono">
          <span className="truncate max-w-[130px] md:max-w-[190px] text-zinc-300 font-sans font-normal">{displayArtist}</span>
          <span aria-hidden="true" className="text-zinc-600">•</span>
          <span className="font-mono text-zinc-400 shrink-0">{track.duration}</span>
          {track.isOfficial && (
            <>
              <span aria-hidden="true" className="text-zinc-600">•</span>
              <span className="text-[9px] font-semibold tracking-wider uppercase text-zinc-300 bg-white/10 border border-white/10 px-1.5 py-0.2 rounded-xs">
                Official
              </span>
            </>
          )}
          {track.views && (
            <>
              <span aria-hidden="true" className="text-zinc-600 hidden sm:inline">•</span>
              <span className="truncate hidden sm:inline text-[11px] text-zinc-500">{track.views}</span>
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(track)}
            className={`p-1.5 rounded-full transition-all ${
              isFavorite
                ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.7)]'
                : 'text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 sm:opacity-70'
            }`}
            aria-label={isFavorite ? `Remove ${title} from favorites` : `Save ${title} to favorites`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {onRemoveFromQueue ? (
          <button
            onClick={() => onRemoveFromQueue(track)}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white transition-colors"
            title="Remove from queue"
            aria-label={`Remove ${title} from queue`}
          >
            <span className="text-base font-bold leading-none">&times;</span>
          </button>
        ) : (
          <button
            onClick={() => onAddToQueue(track)}
            className={`p-1.5 rounded-full transition-all ${
              isQueued
                ? 'text-white bg-white/15'
                : 'text-zinc-500 hover:text-white hover:bg-white/10 opacity-80 sm:opacity-0 sm:group-hover:opacity-100'
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
