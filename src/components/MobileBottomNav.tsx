import React from 'react';
import { Disc, Search, Sparkles, ListMusic } from 'lucide-react';
import { ActiveView } from '../types/player';

interface MobileBottomNavProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  queueCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onSelectView,
  queueCount,
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#09090b]/95 backdrop-blur-2xl border-t border-white/10 pb-safe touch-manipulation select-none shadow-2xl"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-14">
        {/* 1. Now Playing / Player */}
        <button
          onClick={() => onSelectView('now-playing')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 rounded-xl transition-all ${
            activeView === 'now-playing'
              ? 'text-white font-bold scale-105'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label="Player"
        >
          <div className="relative">
            <Disc className={`w-5 h-5 ${activeView === 'now-playing' ? 'animate-spin-slow' : ''}`} />
            {activeView === 'now-playing' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-mono uppercase">Player</span>
        </button>

        {/* 2. Discover / Search */}
        <button
          onClick={() => onSelectView('discover')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 rounded-xl transition-all ${
            activeView === 'discover'
              ? 'text-white font-bold scale-105'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label="Search"
        >
          <div className="relative">
            <Search className="w-5 h-5" />
            {activeView === 'discover' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-mono uppercase">Search</span>
        </button>

        {/* 3. Curated Vibes */}
        <button
          onClick={() => onSelectView('genres')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 rounded-xl transition-all ${
            activeView === 'genres'
              ? 'text-white font-bold scale-105'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label="Curated Vibes"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5" />
            {activeView === 'genres' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-mono uppercase">Vibes</span>
        </button>

        {/* 4. Queue & Playlists */}
        <button
          onClick={() => onSelectView('queue')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 rounded-xl transition-all ${
            activeView === 'queue'
              ? 'text-white font-bold scale-105'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
          aria-label="Queue & Library"
        >
          <div className="relative">
            <ListMusic className="w-5 h-5" />
            {queueCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 text-[8px] font-mono font-bold rounded-full bg-white text-black">
                {queueCount > 99 ? '99+' : queueCount}
              </span>
            )}
            {activeView === 'queue' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-mono uppercase">Queue</span>
        </button>
      </div>
    </nav>
  );
};
