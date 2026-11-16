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
    <div className="w-full max-w-4xl mx-auto space-y-8 select-none">
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-white" />
          <span>Curated Collections</span>
        </h2>
        <p className="text-xs font-mono text-zinc-400">
          Hand-picked high-fidelity audio archives
        </p>
      </div>

      <div className="space-y-6">
        {genres.map((genre) => (
          <section
            key={genre.id}
            className="p-5 rounded-3xl bg-[#111114] border border-white/10 shadow-xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  {genre.name}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {genre.description}
                </p>
              </div>

              <button
                onClick={() => onPlayGenre(genre)}
                className="self-start sm:self-auto flex items-center gap-2 px-4 py-1.5 text-xs font-semibold bg-white text-black hover:bg-zinc-200 rounded-full shadow-sm transition-all shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
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
