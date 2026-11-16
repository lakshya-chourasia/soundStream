import React from 'react';
import { Disc, Search, ListMusic } from 'lucide-react';
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#07080d]/95 backdrop-blur-2xl border-t border-white/10 pb-safe touch-manipulation select-none shadow-[0_-8px_30px_rgba(0,0,0,0.85)]"
      aria-label="Mobile Navigation"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-14">
        {/* 1. Now Playing / Player */}
        <button
          onClick={() => onSelectView('now-playing')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 rounded-xl transition-all ${
            activeView === 'now-playing'
              ? 'text-yellow-400 font-bold scale-105'
              : 'text-white/50 hover:text-white/80'
          }`}
          aria-label="Player"
        >
          <div className="relative">
            <Disc className={`w-5 h-5 ${activeView === 'now-playing' ? 'animate-spin-slow text-yellow-400' : ''}`} />
            {activeView === 'now-playing' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
            )}
          </div>
          <span className="text-[10px] tracking-wider mt-1 font-mono uppercase">Player</span>
        </button>

        {/* 2. Discover / Search */}
        <button
          onClick={() => onSelectView('discover')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 rounded-xl transition-all ${
            activeView === 'discover'
              ? 'text-yellow-400 font-bold scale-105'
              : 'text-white/50 hover:text-white/80'
          }`}
          aria-label="Search"
        >
          <div className="relative">
            <Search className="w-5 h-5" />
            {activeView === 'discover' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
            )}
          </div>
          <span className="text-[10px] tracking-wider mt-1 font-mono uppercase">Search</span>
        </button>

        {/* 3. Queue & Up Next */}
        <button
          onClick={() => onSelectView('queue')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 rounded-xl transition-all ${
            activeView === 'queue'
              ? 'text-yellow-400 font-bold scale-105'
              : 'text-white/50 hover:text-white/80'
          }`}
          aria-label="Queue & Library"
        >
          <div className="relative">
            <ListMusic className="w-5 h-5" />
            {queueCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 text-[8px] font-mono font-bold rounded-full bg-yellow-400 text-black">
                {queueCount > 99 ? '99+' : queueCount}
              </span>
            )}
            {activeView === 'queue' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
            )}
          </div>
          <span className="text-[10px] tracking-wider mt-1 font-mono uppercase">Queue</span>
        </button>
      </div>
    </nav>
  );
};

