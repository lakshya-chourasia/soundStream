import React from 'react';
import { GenreCollection, Track } from '../types/player';
import { TrackCard } from './TrackCard';
import { Play, Disc } from 'lucide-react';

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
      <div className="text-center max-w-xl mx-auto space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center justify-center gap-2">
          <Disc className="w-5 h-5 text-pink-400 animate-spin-slow" />
          <span className="drop-shadow-[0_0_14px_rgba(236,72,153,0.35)]">Curated Soundscapes</span>
        </h2>
        <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">
          UIVERSE AETHER // <span className="font-serif italic font-normal text-cyan-300">prismatic sound archives</span>
        </p>
      </div>

      <div className="space-y-6">
        {genres.map((genre) => (
          <section
            key={genre.id}
            className="p-5 glass-panel rounded-2xl border-white/10 shadow-xl space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 shadow-[0_0_8px_#ec4899]" />
                  {genre.name}
                </h3>
                <p className="text-xs font-serif italic text-slate-300 mt-0.5">
                  {genre.description}
                </p>
              </div>

              <button
                onClick={() => onPlayGenre(genre)}
                className="self-start sm:self-auto flex items-center gap-2 px-4 py-1.5 text-xs font-black uppercase tracking-wider glass-aether-button rounded-full shadow-sm transition-all shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
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
