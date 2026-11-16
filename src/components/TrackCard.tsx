import React from 'react';
import { Track } from '../types/player';
import { Play, Pause, Plus, Check, Heart, Music } from 'lucide-react';
import { cleanTrackTitle, getFullSingerName } from '../utils/playerUtils';
import { ArtworkImage } from './ArtworkImage';

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
          ? 'bg-yellow-400/10 border border-yellow-400/40 shadow-[0_0_20px_rgba(250,204,21,0.15)] ring-1 ring-yellow-400/30'
          : 'bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/15'
      }`}
    >
      {/* Thumbnail + Play Overlay */}
      <div className="relative w-12 h-12 md:w-13 md:h-13 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 shadow-inner">
        {/* Album artwork provided by Apple / iTunes Search API */}
        <ArtworkImage
          title={title}
          artist={displayArtist}
          trackId={track.id}
          initialSrc={track.thumbnail}
          alt={title}
          className="w-full h-full group-hover:scale-105 transition-transform duration-300"
        />

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
              <span className="w-1 bg-yellow-400 rounded-full animate-bar-1 h-3 shadow-[0_0_6px_#facc15]" />
              <span className="w-1 bg-yellow-400 rounded-full animate-bar-2 h-4 shadow-[0_0_8px_#facc15]" />
              <span className="w-1 bg-yellow-400 rounded-full animate-bar-3 h-2.5 shadow-[0_0_6px_#facc15]" />
            </div>
          ) : (
            <Play className="w-5 h-5 text-yellow-300 fill-yellow-300 ml-0.5 filter drop-shadow-[0_0_6px_rgba(250,204,21,0.7)]" />
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
                ? 'font-black text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]'
                : 'font-bold text-white group-hover:text-yellow-100'
            }`}
          >
            {title}
          </h4>
        </button>

        {/* Unboxed Metadata with dot separators */}
        <div className="flex items-center gap-1.5 text-xs text-white/50 mt-0.5 truncate font-mono">
          <span className="truncate max-w-[130px] md:max-w-[190px] text-white/70">{displayArtist}</span>
          <span aria-hidden="true" className="text-white/20 font-bold">•</span>
          <span className="font-mono font-bold tabular-nums text-white/50 shrink-0">{track.duration}</span>
          {track.isOfficial && (
            <>
              <span aria-hidden="true" className="text-white/20 font-bold">•</span>
              <span className="text-[9px] font-bold tracking-wider uppercase text-yellow-400">
                OFFICIAL
              </span>
            </>
          )}
          {track.views && (
            <>
              <span aria-hidden="true" className="text-white/20 font-bold hidden sm:inline">•</span>
              <span className="truncate hidden sm:inline text-[11px] font-medium text-white/40">{track.views}</span>
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
                ? 'text-rose-400 bg-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.35)]'
                : 'text-white/40 hover:text-rose-300 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 sm:opacity-70'
            }`}
            aria-label={isFavorite ? `Remove ${title} from favorites` : `Save ${title} to favorites`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}

        {onRemoveFromQueue ? (
          <button
            onClick={() => onRemoveFromQueue(track)}
            className="p-1.5 rounded-full text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
                ? 'text-yellow-400 bg-yellow-400/20 border border-yellow-400/40 shadow-[0_0_8px_rgba(250,204,21,0.25)]'
                : 'text-white/40 hover:text-yellow-300 hover:bg-yellow-400/10 opacity-80 sm:opacity-0 sm:group-hover:opacity-100'
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
