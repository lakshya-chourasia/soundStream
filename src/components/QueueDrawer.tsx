import React, { useState } from 'react';
import { Track, Playlist } from '../types/player';
import { TrackCard } from './TrackCard';
import { ListMusic, Heart, FolderPlus, Trash2, Plus, Play } from 'lucide-react';

interface QueueDrawerProps {
  queue: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  favorites: Track[];
  playlists: Playlist[];
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (track: Track) => void;
  onClearQueue: () => void;
  onToggleFavorite: (track: Track) => void;
  onCreatePlaylist: (name: string) => void;
  onPlayPlaylist: (playlist: Playlist) => void;
  onDeletePlaylist: (id: string) => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  queue,
  currentTrack,
  isPlaying,
  favorites,
  playlists,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
  onToggleFavorite,
  onCreatePlaylist,
  onPlayPlaylist,
  onDeletePlaylist,
}) => {
  const [tab, setTab] = useState<'queue' | 'favorites' | 'playlists'>('queue');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    onCreatePlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setIsCreatingPlaylist(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 select-none">
      {/* Sub-header Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setTab('queue')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              tab === 'queue'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Up Next ({queue.length})</span>
          </button>

          <button
            onClick={() => setTab('favorites')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              tab === 'favorites'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favorites ({favorites.length})</span>
          </button>

          <button
            onClick={() => setTab('playlists')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              tab === 'playlists'
                ? 'bg-white text-black shadow-md'
                : 'bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Playlists ({playlists.length})</span>
          </button>
        </div>

        {tab === 'queue' && queue.length > 0 && (
          <button
            onClick={onClearQueue}
            className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-white transition-colors ml-auto sm:ml-0"
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
            <div className="py-16 text-center text-zinc-500">
              <p className="text-sm font-semibold text-zinc-300">Queue is empty</p>
              <p className="text-xs text-zinc-500 mt-1">
                Add tracks from discover or curated collections.
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
            <div className="py-16 text-center text-zinc-500">
              <Heart className="w-7 h-7 opacity-30 mx-auto mb-2 text-zinc-400" />
              <p className="text-sm font-semibold text-zinc-300">No favorite recordings saved</p>
              <p className="text-xs text-zinc-500 mt-1">
                Tag songs with the heart icon to catalog them in your library.
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

      {/* Tab 3: Custom Playlists */}
      {tab === 'playlists' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">Playlists Directory</span>
            {!isCreatingPlaylist && (
              <button
                onClick={() => setIsCreatingPlaylist(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-white text-black hover:bg-zinc-200 rounded-full shadow-sm transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Playlist</span>
              </button>
            )}
          </div>

          {isCreatingPlaylist && (
            <form onSubmit={handleCreatePlaylistSubmit} className="flex gap-2">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name..."
                autoFocus
                className="flex-1 px-4 py-2 text-xs font-medium rounded-full bg-[#18181b] border border-white/15 text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
              />
              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-zinc-200 rounded-full disabled:opacity-40"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingPlaylist(false)}
                className="px-3 py-2 text-xs font-medium text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
            </form>
          )}

          {playlists.length === 0 ? (
            <div className="py-16 text-center text-zinc-500">
              <p className="text-sm font-semibold text-zinc-300">No custom playlists yet</p>
              <p className="text-xs text-zinc-500 mt-1">
                Organize your listening sessions into custom collections.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="p-4 bg-[#121214] hover:bg-[#18181c] rounded-2xl flex items-center justify-between gap-3 shadow-md transition-all border border-white/10"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate">
                      {pl.name}
                    </h4>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">
                      {pl.tracks.length} {pl.tracks.length === 1 ? 'track' : 'tracks'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {pl.tracks.length > 0 && (
                      <button
                        onClick={() => onPlayPlaylist(pl)}
                        className="p-2 rounded-full bg-white text-black hover:bg-zinc-200 transition-colors"
                        title="Play playlist"
                        aria-label={`Play ${pl.name}`}
                      >
                        <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeletePlaylist(pl.id)}
                      className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                      title="Delete playlist"
                      aria-label={`Delete ${pl.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
