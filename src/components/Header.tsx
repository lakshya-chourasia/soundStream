import React, { useState } from 'react';
import { ActiveView, GenreCollection } from '../types/player';
import {
  ChevronDown,
  BookmarkPlus,
  User,
  Search,
  Bell,
} from 'lucide-react';

interface HeaderProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  curatedGenres: GenreCollection[];
  selectedCollectionId: string;
  onSelectCollection: (genreId: string) => void;
  onOpenSleepTimer: () => void;
  sleepTimerRemaining: number | null;
  onOpenSearch: () => void;
  activeContextName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  curatedGenres,
  selectedCollectionId,
  onSelectCollection,
  onOpenSleepTimer,
  sleepTimerRemaining,
  onOpenSearch,
  activeContextName,
}) => {
  const [isMoodDropdownOpen, setIsMoodDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const currentCollection = curatedGenres.find((g) => g.id === selectedCollectionId);
  const moodName = activeContextName
    ? activeContextName.split(' ')[0]
    : (currentCollection ? currentCollection.name.split(' ')[0] : 'MUSIC');

  return (
    <header className="h-16 w-full flex items-center justify-between px-6 sm:px-8 bg-transparent select-none shrink-0 z-30">
      {/* ── LEFT SECTION: Mood Dropdown + Bookmark + Discover ── */}
      <div className="flex items-center gap-5 sm:gap-7">
        {/* Mood / Collection Dropdown (e.g. LOVE ⌵) */}
        <div className="relative">
          <button
            onClick={() => setIsMoodDropdownOpen(!isMoodDropdownOpen)}
            className="flex items-center gap-1.5 text-xs font-black tracking-widest uppercase text-white/90 hover:text-white transition-colors"
          >
            <span>{moodName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/70" />
          </button>

          {isMoodDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-56 p-1.5 rounded-xl bg-black/90 backdrop-blur-2xl border border-white/15 shadow-2xl z-50 animate-in">
              <div className="px-3 py-2 text-[10px] font-mono font-bold tracking-widest text-white/40 uppercase border-b border-white/10">
                Curated Moods & Channels
              </div>
              <div className="py-1 max-h-60 overflow-y-auto no-scrollbar">
                {curatedGenres.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => {
                      onSelectCollection(genre.id);
                      setIsMoodDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-lg transition-colors ${
                      genre.id === selectedCollectionId
                        ? 'bg-yellow-400/20 text-yellow-300 font-bold'
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <span className="truncate">{genre.name}</span>
                    <span className="text-[10px] text-white/40 font-mono ml-2">
                      {genre.tracks?.length || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Saved Library / Queue Bookmark Icon */}
        <button
          onClick={() => onSelectView('queue')}
          className="ref-icon-btn p-1 text-white/70 hover:text-white"
          title="Saved Library & Queue"
          aria-label="Library"
        >
          <BookmarkPlus className="w-4 h-4" />
        </button>
      </div>

      {/* ── RIGHT SECTION: User Profile + Search & Discover + Notifications ── */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-white/80 hover:text-white transition-colors"
          >
            <div className="w-6 h-6 rounded-full border border-white/40 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-white/80" />
            </div>
            <span className="hidden md:inline">AUDIOPHILE</span>
            <ChevronDown className="w-3 h-3 text-white/50" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 p-1.5 rounded-xl bg-black/90 backdrop-blur-2xl border border-white/15 shadow-2xl z-50 animate-in">
              <button
                onClick={() => {
                  onOpenSleepTimer();
                  setIsUserMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-lg text-white/80 hover:bg-white/10"
              >
                <span>Sleep Timer</span>
                {sleepTimerRemaining !== null && (
                  <span className="text-yellow-400 font-mono text-[10px]">
                    {Math.ceil(sleepTimerRemaining / 60)}m
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Unified Search & Discover Button */}
        <button
          onClick={onOpenSearch}
          className={`ref-icon-btn p-1.5 transition-all ${
            activeView === 'discover'
              ? 'text-yellow-400 bg-white/15 border border-yellow-400/30'
              : 'text-white/70 hover:text-white'
          }`}
          title="Search & Discover"
          aria-label="Search and Discover"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications / Queue Badge */}
        <button
          onClick={() => onSelectView('queue')}
          className="relative ref-icon-btn p-1 text-white/70 hover:text-white"
          title="Queue & Notifications"
          aria-label="Queue"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white/20 border border-white/30 text-[9px] font-mono font-bold flex items-center justify-center text-white">
            0
          </span>
        </button>
      </div>
    </header>
  );
};
