import React, { useState } from 'react';
import { Track } from '../types/player';
import { TrackCard } from './TrackCard';
import { ListMusic, Heart, Trash2 } from 'lucide-react';

interface QueueDrawerProps {
  queue: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  favorites: Track[];
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (track: Track) => void;
  onClearQueue: () => void;
  onToggleFavorite: (track: Track) => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  queue,
  currentTrack,
  isPlaying,
  favorites,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
  onToggleFavorite,
}) => {
  const [tab, setTab] = useState<'queue' | 'favorites'>('queue');

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Sub-header Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setTab('queue')}
            className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 font-mono ${
              tab === 'queue'
                ? 'bg-yellow-400 text-black font-black shadow-[0_0_12px_rgba(250,204,21,0.4)]'
                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Up Next ({queue.length})</span>
          </button>

          <button
            onClick={() => setTab('favorites')}
            className={`px-3.5 py-1.5 text-xs font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 font-mono ${
              tab === 'favorites'
                ? 'bg-yellow-400 text-black font-black shadow-[0_0_12px_rgba(250,204,21,0.4)]'
                : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/15'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favorites ({favorites.length})</span>
          </button>
        </div>

        {tab === 'queue' && queue.length > 0 && (
          <button
            onClick={onClearQueue}
            className="flex items-center gap-1 text-xs font-bold tracking-wider text-white/40 hover:text-rose-400 transition-colors ml-auto sm:ml-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Queue</span>
          </button>
        )}
      </div>

      {/* Tab 1: Queue */}
      {tab === 'queue' && (
        <div className="space-y-1">
          {queue.length === 0 ? (
            <div className="py-12 text-center text-white/40">
              <p className="text-sm font-bold text-white">Queue is empty</p>
              <p className="text-xs text-white/40 mt-1">
                Add tracks from discover or curated channels to sequence them.
              </p>
            </div>
          ) : (
            queue.map((track) => (
              <TrackCard
                key={`queue-${track.id}`}
                track={track}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                onPlay={onPlayTrack}
                onAddToQueue={() => {}}
                onRemoveFromQueue={onRemoveFromQueue}
                onToggleFavorite={onToggleFavorite}
                isFavorite={favorites.some((f) => f.id === track.id)}
              />
            ))
          )}
        </div>
      )}

      {/* Tab 2: Favorites */}
      {tab === 'favorites' && (
        <div className="space-y-1">
          {favorites.length === 0 ? (
            <div className="py-12 text-center text-white/40">
              <Heart className="w-8 h-8 stroke-[1.2] opacity-30 mx-auto mb-2 text-rose-400" />
              <p className="text-sm font-bold text-white">No favorite tracks saved</p>
              <p className="text-xs text-white/40 mt-1">
                Tag tracks with the heart icon to save them to your favorites.
              </p>
            </div>
          ) : (
            favorites.map((track) => (
              <TrackCard
                key={`fav-${track.id}`}
                track={track}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                onPlay={onPlayTrack}
                onAddToQueue={() => {}}
                onToggleFavorite={onToggleFavorite}
                isFavorite={true}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
