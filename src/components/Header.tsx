import React from 'react';
import { ActiveView } from '../types/player';
import { Search, Timer } from 'lucide-react';

interface HeaderProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  curatedGenres?: any[];
  selectedCollectionId?: string;
  onSelectCollection?: (genreId: string) => void;
  onOpenSleepTimer: () => void;
  sleepTimerRemaining: number | null;
  activeContextName?: string;
  onOpenQuickImport?: () => void;
  onOpenSearch?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  onOpenSleepTimer,
  sleepTimerRemaining,
}) => {
  return (
    <header className="h-14 sm:h-16 w-full flex items-center justify-between px-3 sm:px-8 bg-transparent select-none shrink-0 z-30">
      {/* ── LEFT SECTION: Brand Logo (!M) ── */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        <button
          onClick={() => onSelectView('now-playing')}
          className="flex items-center gap-2.5 focus:outline-none group cursor-pointer"
          title="Home"
        >
          <img
            src="/logo.png"
            alt="!M"
            className="h-7 w-auto object-contain select-none transition-transform group-hover:scale-105 drop-shadow-[0_0_10px_rgba(250,204,21,0.45)]"
          />
        </button>
      </div>

      {/* ── CENTER SECTION: EXACTLY ONE Dedicated Search & Discover Button ── */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => onSelectView(activeView === 'discover' ? 'now-playing' : 'discover')}
          className={`flex items-center gap-2 px-3.5 sm:px-5 py-1.5 rounded-full transition-all border text-xs font-semibold tracking-wide ${
            activeView === 'discover'
              ? 'bg-yellow-400/20 border-yellow-400/40 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.2)]'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'
          }`}
          title="Search & Discover music"
          data-testid="search-discover-btn"
        >
          <Search className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <span>Search & Discover</span>
        </button>
      </div>

      {/* ── RIGHT SECTION: Direct Sleep Timer Button Only ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSleepTimer}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
            sleepTimerRemaining !== null
              ? 'bg-yellow-400/15 border-yellow-400/35 text-yellow-300 hover:bg-yellow-400/25 shadow-[0_0_12px_rgba(250,204,21,0.2)]'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/75 hover:text-white'
          }`}
          title={sleepTimerRemaining !== null ? `Sleep timer active (${Math.ceil(sleepTimerRemaining / 60)}m left)` : 'Set sleep timer'}
          data-testid="sleep-timer-btn"
        >
          <Timer className={`w-3.5 h-3.5 ${sleepTimerRemaining !== null ? 'text-yellow-400 animate-pulse' : 'text-white/60'}`} />
          <span className="hidden sm:inline">Sleep Timer</span>
          {sleepTimerRemaining !== null && (
            <span className="font-mono text-[10px] bg-yellow-400/20 text-yellow-300 px-1.5 py-0.5 rounded-full font-bold">
              {Math.ceil(sleepTimerRemaining / 60)}m
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
