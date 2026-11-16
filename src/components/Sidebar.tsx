import React from 'react';
import { ActiveView, Playlist, StreamQuality } from '../types/player';
import {
  Disc,
  Compass,
  Sparkles,
  ListMusic,
  Heart,
  PlusCircle,
  Moon,
  Clock,
  Radio,
  Sliders,
  Music2,
  Volume2,
  ExternalLink,
  Layers,
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
  favoritesCount,
  playlists,
  onOpenQuickImport,
  sleepTimerRemaining,
  onOpenSleepTimer,
  playbackQuality,
  isPlaying,
}) => {
  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-full bg-[#07080d]/85 backdrop-blur-2xl border-r border-white/10 select-none shrink-0 z-30">
      {/* Brand Header */}
      <div className="p-6 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-pink-500 to-amber-400 p-0.5 shadow-[0_0_20px_rgba(236,72,153,0.45)]">
            <div className="w-full h-full bg-[#0a0c14] rounded-[14px] flex items-center justify-center">
              <Disc className={`w-5 h-5 text-pink-400 ${isPlaying ? 'animate-spin-slow' : ''}`} />
            </div>
          </div>
          <div>
            <h1 className="text-base font-black tracking-wider text-white flex items-center gap-1.5 uppercase">
              <span>SOUND</span>
              <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">STREAM</span>
            </h1>
            <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">AURA SOUND ENGINE</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">
          MENU
        </div>

        {/* 1. Now Playing */}
        <button
          onClick={() => onSelectView('now-playing')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeView === 'now-playing'
              ? 'bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent text-pink-400 border border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.15)] font-extrabold'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <Disc className={`w-4 h-4 ${activeView === 'now-playing' ? 'text-pink-400' : 'text-slate-400'}`} />
            <span>Now Playing</span>
          </div>
          {activeView === 'now-playing' && (
            <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_6px_#ec4899]" />
          )}
        </button>

        {/* 2. Search & Discover */}
        <button
          onClick={() => onSelectView('discover')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeView === 'discover'
              ? 'bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent text-cyan-300 border border-cyan-400/30 shadow-[0_0_15px_rgba(56,189,248,0.15)] font-extrabold'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <Compass className={`w-4 h-4 ${activeView === 'discover' ? 'text-cyan-400' : 'text-slate-400'}`} />
            <span>Search & Discover</span>
          </div>
          {activeView === 'discover' && (
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
          )}
        </button>

        {/* 3. Curated Vibes */}
        <button
          onClick={() => onSelectView('genres')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeView === 'genres'
              ? 'bg-gradient-to-r from-purple-500/20 via-purple-500/10 to-transparent text-purple-300 border border-purple-400/30 shadow-[0_0_15px_rgba(192,132,252,0.15)] font-extrabold'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <Sparkles className={`w-4 h-4 ${activeView === 'genres' ? 'text-purple-400' : 'text-slate-400'}`} />
            <span>Curated Vibes</span>
          </div>
          {activeView === 'genres' && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]" />
          )}
        </button>

        {/* 4. Queue & Playlists */}
        <button
          onClick={() => onSelectView('queue')}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeView === 'queue'
              ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent text-amber-300 border border-amber-400/30 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-extrabold'
              : 'text-slate-300 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <ListMusic className={`w-4 h-4 ${activeView === 'queue' ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>Queue & Library</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white font-bold">
            {queueCount}
          </span>
        </button>
      </div>

      {/* Library & Quick Actions */}
      <div className="px-3 py-3 border-t border-white/10 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">
          QUICK TOOLS
        </div>

        <button
          onClick={onOpenQuickImport}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left"
        >
          <PlusCircle className="w-4 h-4 text-cyan-400" />
          <span>Import YouTube URL</span>
        </button>

        <button
          onClick={onOpenSleepTimer}
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <Moon className="w-4 h-4 text-pink-400" />
            <span>Sleep Timer</span>
          </div>
          {sleepTimerRemaining !== null && (
            <span className="text-[10px] font-mono font-bold text-pink-400 animate-pulse">
              {Math.floor(sleepTimerRemaining / 60)}m left
            </span>
          )}
        </button>
      </div>

      {/* User Playlists List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 border-t border-white/10 min-h-0 space-y-1">
        <div className="flex items-center justify-between px-3 pb-1 text-[10px] font-mono font-bold tracking-widest uppercase text-slate-400">
          <span>PLAYLISTS ({playlists.length})</span>
        </div>
        {playlists.length === 0 ? (
          <p className="px-3 text-xs text-slate-500 italic py-1">No custom playlists yet</p>
        ) : (
          playlists.map((pl) => (
            <button
              key={pl.id}
              onClick={() => onSelectView('queue')}
              className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 truncate transition-colors text-left"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60" />
              <span className="truncate">{pl.name}</span>
              <span className="text-[10px] font-mono text-slate-500 ml-auto">{pl.tracks.length}</span>
            </button>
          ))
        )}
      </div>

      {/* Audiophile Telemetry Footer Card */}
      <div className="p-4 border-t border-white/10 bg-black/40">
        <div className="p-3 rounded-2xl glass-panel border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent shadow-lg">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-1.5 border-b border-white/10">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
              AUDIO ENGINE
            </span>
            <span className="font-bold text-pink-400">HI-RES</span>
          </div>
          <div className="pt-1.5 flex items-center justify-between text-[11px] font-mono">
            <span className="text-white font-bold">24-BIT / 192 KHZ</span>
            <span className="text-slate-400 uppercase">{playbackQuality}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
