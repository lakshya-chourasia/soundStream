import React from 'react';
import { GenreCollection, Track } from '../types/player';
import { TrackCard } from './TrackCard';
import { Play, Sparkles } from 'lucide-react';

interface CuratedVibesProps {
  genres: GenreCollection[];
  currentTrack: Track | null;
  isPlaying: boolean;
  favorites: Track[];
  onPlayTrack: (track: Track) => void;
  onPlayGenre: (genre: GenreCollection) => void;
  onAddToQueue: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
}

export const CuratedVibes: React.FC<CuratedVibesProps> = ({
  genres,
  currentTrack,
  isPlaying,
  favorites,
  onPlayTrack,
  onPlayGenre,
  onAddToQueue,
  onToggleFavorite,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="text-center max-w-xl mx-auto space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Curated Soundscapes</span>
        </h2>
        <p className="text-xs text-zinc-500">
          Hand-picked collections designed for deep focus, late-night coding, and tranquil relaxation.
        </p>
      </div>

      <div className="space-y-8">
        {genres.map((genre) => (
          <section
            key={genre.id}
            className="p-5 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl shadow-xs space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  {genre.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {genre.description}
                </p>
              </div>

              <button
                onClick={() => onPlayGenre(genre)}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-950 rounded-lg shadow-xs hover:opacity-90 transition-opacity shrink-0"
                style={{ backgroundColor: 'var(--theme-accent, #f59e0b)' }}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Collection</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {genre.tracks.map((track) => (
                <TrackCard
                  key={`curated-${genre.id}-${track.id}`}
                  track={track}
                  isCurrent={currentTrack?.id === track.id}
                  isPlaying={isPlaying && currentTrack?.id === track.id}
                  onPlay={onPlayTrack}
                  onAddToQueue={onAddToQueue}
                  onToggleFavorite={onToggleFavorite}
                  isFavorite={favorites.some((f) => f.id === track.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};
