import React from 'react';
import { Disc, Search, Sparkles, ListMusic, Radio } from 'lucide-react';
import { ActiveView } from '../types/player';

interface MobileBottomNavProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onPlayHindiRadio: () => void;
  isRadioPlaying: boolean;
  queueCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onSelectView,
  onPlayHindiRadio,
  isRadioPlaying,
  queueCount,
}) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07080d]/90 backdrop-blur-2xl border-t border-white/10 pb-safe touch-manipulation select-none shadow-[0_-8px_30px_rgba(0,0,0,0.85)]"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-14">
        {/* 1. Now Playing / Player */}
        <button
          onClick={() => onSelectView('now-playing')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 rounded-xl transition-all ${
            activeView === 'now-playing'
              ? 'text-pink-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Player"
        >
          <div className="relative">
            <Disc className={`w-5 h-5 ${activeView === 'now-playing' ? 'animate-spin-slow' : ''}`} />
            {activeView === 'now-playing' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-mono uppercase">Player</span>
        </button>

        {/* 2. Discover / Search */}
        <button
          onClick={() => onSelectView('discover')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 rounded-xl transition-all ${
            activeView === 'discover'
              ? 'text-cyan-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Search"
        >
          <div className="relative">
            <Search className="w-5 h-5" />
            {activeView === 'discover' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-mono uppercase">Search</span>
        </button>

        {/* 3. Live Radio Quick Launch Center Tab */}
        <button
          onClick={onPlayHindiRadio}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 group"
          aria-label="Tune Live Hindi Radio"
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
              isRadioPlaying
                ? 'bg-gradient-to-tr from-amber-500 via-pink-500 to-cyan-400 text-white shadow-[0_0_16px_rgba(245,158,11,0.6)] animate-pulse'
                : 'glass-panel text-amber-300 border-amber-400/40 hover:scale-105 active:scale-95'
            }`}
          >
            <Radio className="w-4 h-4 text-white" />
          </div>
          <span className="text-[9px] tracking-tight mt-0.5 font-mono uppercase font-black text-amber-300">
            {isRadioPlaying ? 'LIVE ON' : 'RADIO'}
          </span>
        </button>

        {/* 4. Curated Vibes */}
        <button
          onClick={() => onSelectView('genres')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 rounded-xl transition-all ${
            activeView === 'genres'
              ? 'text-purple-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Curated Vibes"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5" />
            {activeView === 'genres' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-mono uppercase">Vibes</span>
        </button>

        {/* 5. Queue & Playlists */}
        <button
          onClick={() => onSelectView('queue')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 rounded-xl transition-all ${
            activeView === 'queue'
              ? 'text-pink-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Queue & Library"
        >
          <div className="relative">
            <ListMusic className="w-5 h-5" />
            {queueCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 text-[8px] font-mono font-bold rounded-full bg-pink-500 text-white">
                {queueCount > 99 ? '99+' : queueCount}
              </span>
            )}
            {activeView === 'queue' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_#ec4899]" />
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1 font-mono uppercase">Queue</span>
        </button>
      </div>
    </nav>
  );
};

