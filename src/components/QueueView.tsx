import React from 'react';
import { Track } from '../types/player';
import { cleanTrackTitle, getFullSingerName, formatTime } from '../utils/playerUtils';
import { ArtworkImage } from './ArtworkImage';
import { Play, Pause, Heart, Trash2, ListMusic, Shuffle, Compass } from 'lucide-react';

interface QueueViewProps {
  currentTrack: Track | null;
  queue: Track[];
  favorites: Track[];
  isPlaying: boolean;
  isShuffle: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onToggleFavorite: (track: Track) => void;
  onRemoveFromQueue?: (track: Track) => void;
  onClearQueue?: () => void;
  onToggleShuffle: () => void;
  onBrowseHome: () => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  currentTrack,
  queue,
  favorites,
  isPlaying,
  isShuffle,
  onPlayTrack,
  onTogglePlay,
  onToggleFavorite,
  onRemoveFromQueue,
  onClearQueue,
  onToggleShuffle,
  onBrowseHome,
}) => {
  const currentIndex = currentTrack ? queue.findIndex((t) => t.id === currentTrack.id) : -1;

  // Separate currently playing track from upcoming tracks in logical playback order
  const upNextTracks = React.useMemo(() => {
    if (!currentTrack) return queue;
    if (currentIndex === -1) return queue;
    const afterCurrent = queue.slice(currentIndex + 1);
    const beforeCurrent = queue.slice(0, currentIndex);
    return [...afterCurrent, ...beforeCurrent];
  }, [queue, currentTrack, currentIndex]);

  const isFavorite = (id: string) => favorites.some((f) => f.id === id);

  const renderTrackRow = (track: Track, indexLabel: string, isNowPlayingRow: boolean) => {
    const { title: cleanTitle, artistFromTitle } = cleanTrackTitle(track.title);
    const artist = getFullSingerName(track.artist || artistFromTitle || '', cleanTitle);
    const fav = isFavorite(track.id);
    const durationLabel =
      track.duration && track.duration !== 'YouTube Track'
        ? track.duration
        : track.durationSec > 0
        ? formatTime(track.durationSec)
        : '—';

    return (
      <div
        key={`${isNowPlayingRow ? 'now' : 'up'}-${track.id}-${indexLabel}`}
        onClick={() => (isNowPlayingRow ? onTogglePlay() : onPlayTrack(track))}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (isNowPlayingRow) onTogglePlay();
            else onPlayTrack(track);
          }
        }}
        className={`group flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl border transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
          isNowPlayingRow
            ? 'bg-[#1a1710] border-amber-500/40'
            : 'bg-transparent hover:bg-white/[0.04] border-transparent hover:border-white/[0.06]'
        }`}
      >
        {/* Index / Equalizer Column */}
        <div className="w-7 flex items-center justify-center shrink-0">
          {isNowPlayingRow && isPlaying ? (
            <div className="flex items-end gap-[2px] h-3.5" aria-label="Playing">
              <span className="w-[2px] bg-amber-400 rounded-full animate-bar-1" />
              <span className="w-[2px] bg-amber-400 rounded-full animate-bar-2" />
              <span className="w-[2px] bg-amber-400 rounded-full animate-bar-3" />
            </div>
          ) : (
            <span
              className={`text-xs font-mono tabular-nums ${
                isNowPlayingRow ? 'text-amber-400 font-semibold' : 'text-zinc-500 group-hover:hidden'
              }`}
            >
              {indexLabel}
            </span>
          )}
          {!isNowPlayingRow && (
            <Play className="w-3.5 h-3.5 text-zinc-100 fill-zinc-100 hidden group-hover:block" />
          )}
        </div>

        {/* Artwork */}
        <div className="w-11 h-11 rounded-lg overflow-hidden bg-[#0c0c0f] border border-white/[0.08] shrink-0">
          <ArtworkImage
            title={cleanTitle}
            artist={artist}
            trackId={track.id}
            initialSrc={track.thumbnail}
            alt={cleanTitle}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Title & Artist */}
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-semibold truncate leading-snug ${
              isNowPlayingRow ? 'text-amber-400' : 'text-zinc-100 group-hover:text-white'
            }`}
          >
            {cleanTitle}
          </p>
          <p className="text-xs text-zinc-400 truncate mt-0.5">{artist}</p>
        </div>

        {/* Duration */}
        <span className="text-xs font-mono tabular-nums text-zinc-500 hidden sm:inline shrink-0 mr-1">
          {durationLabel}
        </span>

        {/* Row Actions */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {isNowPlayingRow && (
            <button
              type="button"
              onClick={onTogglePlay}
              className="w-8 h-8 rounded-lg text-amber-400 hover:bg-amber-400/15 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause current track' : 'Resume current track'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => onToggleFavorite(track)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ${
              fav ? 'text-amber-400 hover:bg-white/[0.06]' : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/[0.06]'
            }`}
            title={fav ? 'Remove from favorites' : 'Save to favorites'}
            aria-label={fav ? `Remove ${cleanTitle} from favorites` : `Save ${cleanTitle} to favorites`}
          >
            <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
          </button>

          {!isNowPlayingRow && onRemoveFromQueue && (
            <button
              type="button"
              onClick={() => onRemoveFromQueue(track)}
              className="w-8 h-8 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-400"
              title="Remove from queue"
              aria-label={`Remove ${cleanTitle} from queue`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-zinc-50 tracking-tight text-balance">
            Playback Queue
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 flex items-center gap-2">
            <span className="font-mono tabular-nums">{queue.length}</span>
            <span>{queue.length === 1 ? 'track in session' : 'tracks in session'}</span>
            <span aria-hidden="true">·</span>
            <span>{isShuffle ? 'Shuffle active' : 'Sequential order'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleShuffle}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
              isShuffle
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : 'bg-[#18181D] text-zinc-300 hover:text-white border-white/[0.08] hover:border-white/[0.16]'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>{isShuffle ? 'Shuffle On' : 'Shuffle Off'}</span>
          </button>

          {onClearQueue && upNextTracks.length > 0 && (
            <button
              type="button"
              onClick={onClearQueue}
              className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-300 hover:text-rose-300 bg-[#18181D] hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/30 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/70"
            >
              Clear Up Next
            </button>
          )}
        </div>
      </div>

      {/* Now Playing Section */}
      {currentTrack && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-zinc-400 tracking-wide px-1">Now Playing</h3>
          {renderTrackRow(currentTrack, '00', true)}
        </div>
      )}

      {/* Up Next Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-zinc-400 tracking-wide">
            Up Next{' '}
            <span className="font-mono tabular-nums text-zinc-500 ml-1">({upNextTracks.length})</span>
          </h3>
        </div>

        {upNextTracks.length === 0 ? (
          <div className="rounded-xl border border-white/[0.07] bg-[#141418] px-6 py-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto text-zinc-400">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">No upcoming tracks in your queue</p>
              <p className="text-xs text-zinc-400 mt-1">
                Add songs from Home, Search, or your Library to build a continuous session.
              </p>
            </div>
            <button
              type="button"
              onClick={onBrowseHome}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Browse Tracks</span>
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {upNextTracks.map((track, i) =>
              renderTrackRow(track, String(i + 1).padStart(2, '0'), false)
            )}
          </div>
        )}
      </div>
    </section>
  );
};
