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
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Sub-header Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
          <button
            onClick={() => setTab('queue')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              tab === 'queue'
                ? 'text-zinc-950 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
            style={tab === 'queue' ? { backgroundColor: 'var(--theme-accent, #f59e0b)' } : {}}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Up Next ({queue.length})</span>
          </button>

          <button
            onClick={() => setTab('favorites')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              tab === 'favorites'
                ? 'text-zinc-950 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
            style={tab === 'favorites' ? { backgroundColor: 'var(--theme-accent, #f59e0b)' } : {}}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favorites ({favorites.length})</span>
          </button>

          <button
            onClick={() => setTab('playlists')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              tab === 'playlists'
                ? 'text-zinc-950 font-semibold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
            style={tab === 'playlists' ? { backgroundColor: 'var(--theme-accent, #f59e0b)' } : {}}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Playlists ({playlists.length})</span>
          </button>
        </div>

        {tab === 'queue' && queue.length > 0 && (
          <button
            onClick={onClearQueue}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors ml-auto sm:ml-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Tab 1: Queue */}
      {tab === 'queue' && (
        <div className="space-y-1">
          {queue.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              <p className="text-sm">The queue is empty.</p>
              <p className="text-xs text-zinc-400 mt-1">
                Add songs from search or curated vibes to build your listening queue.
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
            <div className="py-12 text-center text-zinc-500">
              <Heart className="w-8 h-8 stroke-[1.2] opacity-30 mx-auto mb-2 text-rose-500" />
              <p className="text-sm">No favorite tracks yet.</p>
              <p className="text-xs text-zinc-400 mt-1">
                Click the heart icon on any track to save it to your personal favorites.
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
            <span className="text-xs text-zinc-500">Saved Playlists</span>
            {!isCreatingPlaylist && (
              <button
                onClick={() => setIsCreatingPlaylist(true)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-colors"
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
                placeholder="Playlist name (e.g. Focus Flow)..."
                autoFocus
                className="flex-1 px-3 py-1.5 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={!newPlaylistName.trim()}
                className="px-3 py-1.5 text-xs font-medium bg-amber-500 text-zinc-950 rounded-lg hover:bg-amber-400 disabled:opacity-40"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingPlaylist(false)}
                className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                Cancel
              </button>
            </form>
          )}

          {playlists.length === 0 ? (
            <div className="py-10 text-center text-zinc-500">
              <p className="text-sm">No playlists created.</p>
              <p className="text-xs text-zinc-400 mt-1">
                Create a playlist to organize your favorite sets and study vibes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="p-3.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                      {pl.name}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {pl.tracks.length} {pl.tracks.length === 1 ? 'track' : 'tracks'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {pl.tracks.length > 0 && (
                      <button
                        onClick={() => onPlayPlaylist(pl)}
                        className="p-2 rounded-lg bg-amber-500 text-zinc-950 hover:bg-amber-400 transition-colors"
                        title="Play playlist"
                        aria-label={`Play ${pl.name}`}
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeletePlaylist(pl.id)}
                      className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
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
