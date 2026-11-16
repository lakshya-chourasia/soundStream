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
        return { title: 'Now Playing', icon: Disc, color: 'text-pink-400' };
      case 'discover':
        return { title: 'Search & Discover', icon: Compass, color: 'text-cyan-400' };
      case 'genres':
        return { title: 'Curated Vibes', icon: Sparkles, color: 'text-purple-400' };
      case 'queue':
        return { title: `Queue (${queueCount})`, icon: ListMusic, color: 'text-amber-400' };
      default:
        return { title: 'SoundStream', icon: Disc, color: 'text-pink-400' };
    }
  };

  const currentViewObj = getViewTitle();
  const IconComponent = currentViewObj.icon;

  return (
    <header className="flex items-center justify-between gap-3 px-4 sm:px-8 py-3 pt-safe border-b border-white/10 bg-[#07080d]/80 backdrop-blur-2xl shrink-0 z-20 select-none">
      {/* Left: View title breadcrumb (Desktop) or Brand Wordmark (Mobile) */}
      <div className="flex items-center gap-3">
        {/* Mobile Brand */}
        <button
          onClick={() => onSelectView('now-playing')}
          className="md:hidden flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-pink-500 to-amber-400 p-0.5 shadow-md">
            <div className="w-full h-full bg-[#0a0c14] rounded-[10px] flex items-center justify-center">
              <Disc className="w-4 h-4 text-pink-400" />
            </div>
          </div>
          <span className="text-sm font-black tracking-wider uppercase text-white">
            SOUND<span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">STREAM</span>
          </span>
        </button>

        {/* Desktop Active View Breadcrumb Indicator */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className={`p-1.5 rounded-xl bg-white/5 border border-white/10 ${currentViewObj.color}`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-black uppercase tracking-wider text-white">
            {currentViewObj.title}
          </h2>
        </div>
      </div>

      {/* Middle: Fast Global Search Bar */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, or paste YouTube link..."
            className="w-full pl-10 pr-4 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.09] focus:bg-white/[0.12] border border-white/15 focus:border-cyan-400/50 text-xs text-white placeholder-slate-400 focus:outline-none transition-all shadow-inner"
          />
        </form>
      </div>

      {/* Right: Quick Action Buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Quick Import URL button */}
        <button
          onClick={onOpenQuickImport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-semibold text-slate-200 hover:text-white transition-all active:scale-95 shadow-sm"
          title="Import YouTube URL"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Import URL</span>
        </button>

        {/* Sleep Timer */}
        {sleepTimerRemaining !== null ? (
          <button
            onClick={onOpenSleepTimer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-full bg-pink-500/20 border border-pink-500/40 text-pink-300 hover:bg-pink-500/30 transition-all shadow-[0_0_12px_rgba(236,72,153,0.3)] animate-pulse"
            title="Sleep timer active"
          >
            <Timer className="w-3.5 h-3.5 text-pink-400" />
            <span>{Math.ceil(sleepTimerRemaining / 60)}M</span>
          </button>
        ) : (
          <button
            onClick={onOpenSleepTimer}
            className="p-2 text-slate-300 hover:text-white rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            title="Set Sleep Timer"
          >
            <Timer className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
