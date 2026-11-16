import React, { useState } from 'react';
import { ActiveView, GenreCollection } from '../types/player';
import {
  ChevronDown,
  BookmarkPlus,
  Compass,
  Plus,
  User,
  Search,
  Bell,
  Sparkles,
  Music,
} from 'lucide-react';

interface HeaderProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  curatedGenres: GenreCollection[];
  selectedCollectionId: string;
  onSelectCollection: (genreId: string) => void;
  onOpenQuickImport: () => void;
  onOpenSleepTimer: () => void;
  sleepTimerRemaining: number | null;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  curatedGenres,
  selectedCollectionId,
  onSelectCollection,
  onOpenQuickImport,
  onOpenSleepTimer,
  sleepTimerRemaining,
  onOpenSearch,
}) => {
  const [isMoodDropdownOpen, setIsMoodDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const currentCollection = curatedGenres.find((g) => g.id === selectedCollectionId) || curatedGenres[0];
  const moodName = currentCollection ? currentCollection.name.split(' ')[0] : 'LOVE';

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
                Curated Moods & Playlists
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

        {/* Bookmark Icon */}
        <button
          onClick={() => onSelectView('queue')}
          className="ref-icon-btn p-1 text-white/70 hover:text-white"
          title="Saved Library"
          aria-label="Library"
        >
          <BookmarkPlus className="w-4 h-4" />
        </button>

        {/* Discover Pill Button */}
        <button
          onClick={() => {
            if (activeView === 'discover') {
              onSelectView('now-playing');
            } else {
              onSelectView('discover');
            }
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase transition-all ${
            activeView === 'discover'
              ? 'bg-white/20 text-white border border-white/30'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`}
          title="Search & Discover"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>DISCOVER</span>
        </button>
      </div>

      {/* ── CENTER SECTION: (+) ADD A STORY / IMPORT URL ── */}
      <div className="flex items-center justify-center">
        <button
          onClick={onOpenQuickImport}
          className="add-story-btn group"
          title="Add YouTube Track or Playlist URL"
        >
          <div className="w-5 h-5 rounded-full border border-yellow-400 flex items-center justify-center text-yellow-400 group-hover:bg-yellow-400 group-hover:text-black transition-colors">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="text-white/90 group-hover:text-white">ADD A TRACK</span>
        </button>
      </div>

      {/* ── RIGHT SECTION: User Profile + Search + Notifications ── */}
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
              <button
                onClick={() => {
                  onSelectView('queue');
                  setIsUserMenuOpen(false);
                }}
                className="w-full px-3 py-2 text-left text-xs rounded-lg text-white/80 hover:bg-white/10"
              >
                Playlists & History
              </button>
            </div>
          )}
        </div>

        {/* Search Icon */}
        <button
          onClick={onOpenSearch}
          className="ref-icon-btn p-1 text-white/70 hover:text-white"
          title="Search Music"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Notifications / Collection Badge */}
        <button
          onClick={() => onSelectView('queue')}
          className="relative ref-icon-btn p-1 text-white/70 hover:text-white"
          title="Notifications & Queue"
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
