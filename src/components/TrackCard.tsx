import React from 'react';
import { Track } from '../types/player';
import { Play, Pause, Plus, Check, Heart, Music } from 'lucide-react';
import { cleanTrackTitle, getFullSingerName } from '../utils/playerUtils';

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
  const rawArtist = track.artist || artistFromTitle || 'YouTube Artist';
  const displayArtist = getFullSingerName(rawArtist, title);

  return (
    <div
      className={`group relative flex items-center justify-between gap-3 p-2.5 rounded-xl transition-all duration-200 ${
        isCurrent
          ? 'glass-panel bg-[#141620] border-pink-500/50 shadow-[0_0_24px_rgba(236,72,153,0.25)] ring-1 ring-cyan-400/40'
          : 'glass-panel glass-panel-hover border-white/5 hover:border-pink-500/30'
      }`}
    >
      {/* Thumbnail + Play Overlay */}
      <div className="relative w-12 h-12 md:w-13 md:h-13 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 shadow-inner">
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
        <div className="absolute inset-0 -z-10 flex items-center justify-center bg-[#10121a] text-slate-500">
          <Music className="w-5 h-5" />
        </div>

        {/* Play / Equalizer Overlay */}
        <button
          onClick={() => onPlay(track)}
          className={`absolute inset-0 flex items-center justify-center transition-all ${
            isCurrent
              ? 'bg-black/75 opacity-100'
              : 'bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-[2px]'
          }`}
          aria-label={isCurrent && isPlaying ? `Pause ${title}` : `Play ${title}`}
        >
          {isCurrent && isPlaying ? (
            <div className="flex items-end gap-1 h-4">
              <span className="w-1 bg-[#38bdf8] rounded-full animate-audio-bar-1 h-3 shadow-[0_0_6px_#38bdf8]" />
              <span className="w-1 bg-[#ec4899] rounded-full animate-audio-bar-2 h-4 shadow-[0_0_8px_#ec4899]" />
              <span className="w-1 bg-[#f59e0b] rounded-full animate-audio-bar-3 h-2.5 shadow-[0_0_6px_#f59e0b]" />
            </div>
          ) : (
            <Play className="w-5 h-5 text-cyan-300 fill-cyan-300 ml-0.5 filter drop-shadow-[0_0_6px_rgba(56,189,248,0.7)]" />
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
              isCurrent
                ? 'font-black bg-gradient-to-r from-cyan-300 via-pink-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(236,72,153,0.3)]'
                : 'font-bold text-[#f4f5f8] group-hover:text-white'
            }`}
          >
            {title}
          </h4>
        </button>

        {/* Unboxed Metadata with dot separators */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5 truncate font-mono">
          <span className="truncate max-w-[130px] md:max-w-[190px] font-serif italic text-slate-300">{displayArtist}</span>
          <span aria-hidden="true" className="text-white/20 font-bold">•</span>
          <span className="font-mono font-bold tabular-nums text-slate-400 shrink-0">{track.duration}</span>
          {track.isOfficial && (
            <>
              <span aria-hidden="true" className="text-white/20 font-bold">•</span>
              <span className="text-[9px] font-black tracking-wider uppercase text-cyan-300 bg-cyan-500/15 border border-cyan-400/30 px-1.5 py-0.2 rounded-xs">
                OFFICIAL
              </span>
            </>
          )}
          {track.views && (
            <>
              <span aria-hidden="true" className="text-white/20 font-bold hidden sm:inline">•</span>
              <span className="truncate hidden sm:inline text-[11px] font-medium text-slate-500">{track.views}</span>
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
                ? 'text-pink-400 bg-pink-500/20 shadow-[0_0_8px_rgba(236,72,153,0.35)]'
                : 'text-slate-400 hover:text-pink-300 hover:bg-pink-500/10 opacity-0 group-hover:opacity-100 sm:opacity-70'
            }`}
            aria-label={isFavorite ? `Remove ${title} from favorites` : `Save ${title} to favorites`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {onRemoveFromQueue ? (
          <button
            onClick={() => onRemoveFromQueue(track)}
            className="p-1.5 rounded-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Remove from queue"
            aria-label={`Remove ${title} from queue`}
          >
            <span className="text-sm font-black leading-none">&times;</span>
          </button>
        ) : (
          <button
            onClick={() => onAddToQueue(track)}
            className={`p-1.5 rounded-full transition-all ${
              isQueued
                ? 'text-cyan-300 bg-cyan-500/20 border border-cyan-400/40 shadow-[0_0_8px_rgba(56,189,248,0.35)]'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 opacity-80 sm:opacity-0 sm:group-hover:opacity-100'
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
