import React from 'react';
import { ActiveView, ThemePreset } from '../types/player';
import { Plus, Timer } from 'lucide-react';

interface HeaderProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  queueCount: number;
  onOpenQuickImport: () => void;
  sleepTimerRemaining: number | null;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onOpenSleepTimer: () => void;
  themePreset?: ThemePreset;
  onChangeThemePreset?: (preset: ThemePreset) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  queueCount,
  onOpenQuickImport,
  sleepTimerRemaining,
  onOpenSleepTimer,
}) => {
  return (
    <header className="flex items-center justify-between gap-2 px-3 sm:px-6 py-2 pt-safe border-b border-white/10 bg-[#08090c]/85 backdrop-blur-2xl shrink-0 z-40 relative">
      {/* Prismatic Top Spectral Ribbon */}
      <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 opacity-80" />

      {/* Brand: Uiverse Aether Wordmark */}
      <button
        onClick={() => onSelectView('now-playing')}
        className="flex items-center text-left hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 group focus:outline-none"
        aria-label="SoundStream Home"
      >
        <div className="flex flex-col">
          <span className="text-sm font-black tracking-widest uppercase text-white leading-none">
            SOUND<span className="bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">STREAM</span>
          </span>
          <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase font-semibold mt-0.5">
            AETHER <span className="font-serif italic text-pink-400 font-normal">audio</span>
          </span>
        </div>
      </button>

      {/* Desktop Segmented Editorial Navigation */}
      <div className="hidden md:flex items-center gap-2">
        <nav
          className="flex items-center p-1 rounded-full glass-panel text-xs font-bold"
          aria-label="Main Navigation"
        >
          {[
            { id: 'now-playing', label: 'DECK' },
            { id: 'discover', label: 'SEARCH' },
            { id: 'genres', label: 'CURATED' },
            { id: 'queue', label: `QUEUE${queueCount > 0 ? ` (${queueCount})` : ''}` },
          ].map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id as ActiveView)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full transition-all tracking-wider text-[11px] whitespace-nowrap font-mono font-bold ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500 via-pink-500 to-amber-400 text-white font-black shadow-[0_0_14px_rgba(236,72,153,0.5)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Utility Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Active Sleep Timer countdown pill */}
        {sleepTimerRemaining !== null ? (
          <button
            onClick={onOpenSleepTimer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded-full glass-panel border-pink-500/40 text-pink-300 hover:bg-pink-500/15 transition-colors shadow-[0_0_12px_rgba(236,72,153,0.3)]"
            title="Sleep timer active"
            aria-label="Sleep timer active"
          >
            <Timer className="w-3.5 h-3.5 text-pink-400" />
            <span>{Math.ceil(sleepTimerRemaining / 60)}M</span>
          </button>
        ) : (
          <button
            onClick={onOpenSleepTimer}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors hidden sm:flex items-center border border-transparent hover:border-white/10"
            title="Set Sleep Timer"
            aria-label="Set sleep timer"
          >
            <Timer className="w-4 h-4" />
          </button>
        )}

        {/* Primary CTA: Uiverse Aether Prismatic Button */}
        <button
          onClick={onOpenQuickImport}
          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-full glass-aether-button whitespace-nowrap"
          aria-label="Import YouTube URL"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span className="hidden sm:inline">IMPORT LINK</span>
          <span className="sm:hidden">IMPORT</span>
        </button>
      </div>
    </header>
  );
};
