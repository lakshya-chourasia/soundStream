import React, { useState } from 'react';
import { ActiveView } from '../types/player';
import { Plus, Timer, Search, Disc, Sparkles, Compass, ListMusic } from 'lucide-react';

interface HeaderProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  queueCount: number;
  onOpenQuickImport: () => void;
  sleepTimerRemaining: number | null;
  onOpenSleepTimer: () => void;
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  queueCount,
  onOpenQuickImport,
  sleepTimerRemaining,
  onOpenSleepTimer,
  onSearch,
}) => {
  const [query, setQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch?.(query.trim());
    onSelectView('discover');
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'now-playing':
        return { title: 'Now Playing', icon: Disc };
      case 'discover':
        return { title: 'Search & Discover', icon: Compass };
      case 'genres':
        return { title: 'Curated Collections', icon: Sparkles };
      case 'queue':
        return { title: `Queue (${queueCount})`, icon: ListMusic };
      default:
        return { title: 'SoundStream', icon: Disc };
    }
  };

  const currentViewObj = getViewTitle();
  const IconComponent = currentViewObj.icon;

  return (
    <header className="flex items-center justify-between gap-3 px-4 sm:px-8 py-3 pt-safe border-b border-white/10 bg-black/80 backdrop-blur-2xl shrink-0 z-20 select-none">
      {/* Left: View title breadcrumb (Desktop) or Brand Wordmark (Mobile) */}
      <div className="flex items-center gap-3">
        {/* Mobile Brand */}
        <button
          onClick={() => onSelectView('now-playing')}
          className="md:hidden flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center">
            <Disc className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold tracking-wider uppercase text-white">
            SoundStream
          </span>
        </button>

        {/* Desktop Active View Breadcrumb Indicator */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-white">
            <IconComponent className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
            {currentViewObj.title}
          </h2>
        </div>
      </div>

      {/* Middle: Fast Global Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, or paste YouTube link..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/10 focus:border-white/30 text-xs text-white placeholder-zinc-500 focus:outline-none transition-all shadow-inner"
          />
        </form>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick Import URL button */}
        <button
          onClick={onOpenQuickImport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white transition-all active:scale-95 shadow-sm"
          title="Import YouTube URL"
        >
          <Plus className="w-3.5 h-3.5 text-zinc-300" />
          <span className="hidden sm:inline">Import URL</span>
        </button>

        {/* Sleep Timer */}
        {sleepTimerRemaining !== null ? (
          <button
            onClick={onOpenSleepTimer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-full bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-all shadow-sm"
            title="Sleep timer active"
          >
            <Timer className="w-3.5 h-3.5 text-white" />
            <span>{Math.ceil(sleepTimerRemaining / 60)}m</span>
          </button>
        ) : (
          <button
            onClick={onOpenSleepTimer}
            className="p-2 text-zinc-400 hover:text-white rounded-full bg-white/[0.05] hover:bg-white/10 border border-white/10 transition-all"
            title="Set Sleep Timer"
          >
            <Timer className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
