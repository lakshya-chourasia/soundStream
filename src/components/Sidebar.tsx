import React from 'react';
import { ActiveView, Playlist, StreamQuality } from '../types/player';
import {
  Disc,
  Compass,
  Sparkles,
  ListMusic,
  PlusCircle,
  Moon,
} from 'lucide-react';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  queueCount: number;
  favoritesCount: number;
  playlists: Playlist[];
  onOpenQuickImport: () => void;
  sleepTimerRemaining: number | null;
  onOpenSleepTimer: () => void;
  playbackQuality: StreamQuality;
  isPlaying: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  queueCount,
  playlists,
  onOpenQuickImport,
  sleepTimerRemaining,
  onOpenSleepTimer,
  playbackQuality,
  isPlaying,
}) => {
  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-full bg-[#0a0a0c] border-r border-white/10 select-none shrink-0 z-30">
      {/* Brand Header */}
      <div className="p-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center">
            <Disc className={`w-4 h-4 text-white ${isPlaying ? 'animate-spin-slow' : ''}`} />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-white uppercase">
              SOUNDSTREAM
            </h1>
            <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">Audio Engine</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono font-medium tracking-widest uppercase text-zinc-500">
          Menu
        </div>

        {/* 1. Now Playing */}
        <button
          onClick={() => onSelectView('now-playing')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeView === 'now-playing'
              ? 'bg-white text-black font-bold shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Disc className={`w-4 h-4 ${activeView === 'now-playing' ? 'text-black' : 'text-zinc-400'}`} />
            <span>Now Playing</span>
          </div>
          {activeView === 'now-playing' && (
            <span className="w-1.5 h-1.5 rounded-full bg-black" />
          )}
        </button>

        {/* 2. Search & Discover */}
        <button
          onClick={() => onSelectView('discover')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeView === 'discover'
              ? 'bg-white text-black font-bold shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Compass className={`w-4 h-4 ${activeView === 'discover' ? 'text-black' : 'text-zinc-400'}`} />
            <span>Search & Discover</span>
          </div>
          {activeView === 'discover' && (
            <span className="w-1.5 h-1.5 rounded-full bg-black" />
          )}
        </button>

        {/* 3. Curated Vibes */}
        <button
          onClick={() => onSelectView('genres')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeView === 'genres'
              ? 'bg-white text-black font-bold shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Sparkles className={`w-4 h-4 ${activeView === 'genres' ? 'text-black' : 'text-zinc-400'}`} />
            <span>Curated Collections</span>
          </div>
          {activeView === 'genres' && (
            <span className="w-1.5 h-1.5 rounded-full bg-black" />
          )}
        </button>

        {/* 4. Queue & Library */}
        <button
          onClick={() => onSelectView('queue')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            activeView === 'queue'
              ? 'bg-white text-black font-bold shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
          }`}
        >
          <div className="flex items-center gap-3">
            <ListMusic className={`w-4 h-4 ${activeView === 'queue' ? 'text-black' : 'text-zinc-400'}`} />
            <span>Queue & Library</span>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
            activeView === 'queue' ? 'bg-black/20 text-black' : 'bg-white/10 text-white'
          }`}>
            {queueCount}
          </span>
        </button>
      </div>

      {/* Library & Quick Actions */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono font-medium tracking-widest uppercase text-zinc-500">
          Tools
        </div>

        <button
          onClick={onOpenQuickImport}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all text-left"
        >
          <PlusCircle className="w-4 h-4 text-zinc-300" />
          <span>Import YouTube Link</span>
        </button>

        <button
          onClick={onOpenSleepTimer}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <Moon className="w-4 h-4 text-zinc-300" />
            <span>Sleep Timer</span>
          </div>
          {sleepTimerRemaining !== null && (
            <span className="text-[10px] font-mono font-medium text-zinc-300">
              {Math.floor(sleepTimerRemaining / 60)}m left
            </span>
          )}
        </button>
      </div>

      {/* User Playlists List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 border-t border-white/10 min-h-0 space-y-1">
        <div className="flex items-center justify-between px-3 pb-1 text-[10px] font-mono font-medium tracking-widest uppercase text-zinc-500">
          <span>Playlists ({playlists.length})</span>
        </div>
        {playlists.length === 0 ? (
          <p className="px-3 text-xs text-zinc-600 italic py-1">No custom playlists</p>
        ) : (
          playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onSelectView('queue')}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/[0.05] truncate transition-colors text-left"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span className="truncate">{pl.name}</span>
              <span className="text-[10px] font-mono text-zinc-600 ml-auto">{pl.tracks.length}</span>
            </button>
          ))
        )}
      </div>

      {/* Audiophile Telemetry Footer Card */}
      <div className="p-4 border-t border-white/10 bg-black">
        <div className="p-3 rounded-xl border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pb-1.5 border-b border-white/10">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-white' : 'bg-zinc-600'}`} />
              Audio Output
            </span>
            <span className="font-semibold text-zinc-200">Lossless</span>
          </div>
          <div className="pt-1.5 flex items-center justify-between text-[11px] font-mono">
            <span className="text-white font-bold">24-Bit / 192 kHz</span>
            <span className="text-zinc-400 uppercase">{playbackQuality}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
