import React, { useState, useRef, useEffect } from 'react';
import { ActiveView, ThemePreset } from '../types/player';
import { THEME_PRESETS } from '../utils/themeConfig';
import { Radio, Plus, Moon, Sun, Timer, Palette, Check } from 'lucide-react';

interface HeaderProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  queueCount: number;
  onOpenQuickImport: () => void;
  sleepTimerRemaining: number | null;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenSleepTimer: () => void;
  themePreset: ThemePreset;
  onChangeThemePreset: (preset: ThemePreset) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  queueCount,
  onOpenQuickImport,
  sleepTimerRemaining,
  isDarkMode,
  onToggleTheme,
  onOpenSleepTimer,
  themePreset,
  onChangeThemePreset,
}) => {
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const currentTheme = THEME_PRESETS[themePreset];

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
    };
    if (showThemeMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showThemeMenu]);

  return (
    <header className="flex items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 py-3.5 border-b border-white/[0.08] dark:border-white/[0.08] bg-white/75 dark:bg-black/50 backdrop-blur-xl sticky top-0 z-40">
      {/* Zone 1: Single text element Brand wordmark */}
      <button
        onClick={() => onSelectView('now-playing')}
        className="flex items-center gap-2.5 text-left text-zinc-900 dark:text-zinc-100 hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 group focus:outline-none"
        aria-label="Aura Minimalist Music Player Home"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 shadow-inner"
          style={{
            backgroundColor: `${currentTheme.accent}18`,
            borderColor: `${currentTheme.accent}35`,
            borderWidth: '1px',
            color: currentTheme.accent,
          }}
        >
          <Radio className="w-4 h-4" />
        </div>
        <span className="text-base font-semibold tracking-tight">Aura Sound</span>
      </button>

      {/* Zone 2: 4 single-line text navigation links */}
      <nav className="flex items-center gap-2 md:gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400" aria-label="Main Navigation">
        <button
          onClick={() => onSelectView('now-playing')}
          className={`py-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 text-xs md:text-sm font-medium`}
          style={
            activeView === 'now-playing'
              ? {
                  color: currentTheme.accent,
                  borderBottom: `2px solid ${currentTheme.accent}`,
                  fontWeight: 600,
                }
              : {}
          }
        >
          <span className="sm:hidden">Player</span>
          <span className="hidden sm:inline">Now Playing</span>
        </button>
        <button
          onClick={() => onSelectView('discover')}
          className={`py-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 text-xs md:text-sm font-medium`}
          style={
            activeView === 'discover'
              ? {
                  color: currentTheme.accent,
                  borderBottom: `2px solid ${currentTheme.accent}`,
                  fontWeight: 600,
                }
              : {}
          }
        >
          <span className="sm:hidden">Search</span>
          <span className="hidden sm:inline">Search & Browse</span>
        </button>
        <button
          onClick={() => onSelectView('genres')}
          className={`py-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 text-xs md:text-sm font-medium`}
          style={
            activeView === 'genres'
              ? {
                  color: currentTheme.accent,
                  borderBottom: `2px solid ${currentTheme.accent}`,
                  fontWeight: 600,
                }
              : {}
          }
        >
          <span className="sm:hidden">Vibes</span>
          <span className="hidden sm:inline">Curated Vibes</span>
        </button>
        <button
          onClick={() => onSelectView('queue')}
          className={`py-1 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 text-xs md:text-sm font-medium`}
          style={
            activeView === 'queue'
              ? {
                  color: currentTheme.accent,
                  borderBottom: `2px solid ${currentTheme.accent}`,
                  fontWeight: 600,
                }
              : {}
          }
        >
          <span>Queue</span>
          {queueCount > 0 && (
            <span className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
              ({queueCount})
            </span>
          )}
        </button>
      </nav>

      {/* Zone 3: 1 primary action + compact utilities */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Sleep Timer Active Indicator */}
        {sleepTimerRemaining !== null && (
          <button
            onClick={onOpenSleepTimer}
            className="flex items-center gap-1 px-2 py-1 text-xs font-mono tabular-nums rounded-md transition-colors whitespace-nowrap shrink-0"
            style={{
              color: currentTheme.accent,
              backgroundColor: `${currentTheme.accent}15`,
              borderColor: `${currentTheme.accent}30`,
              borderWidth: '1px',
            }}
            title="Sleep timer active"
            aria-label="Sleep timer settings"
          >
            <Timer className="w-3.5 h-3.5" />
            <span>{Math.ceil(sleepTimerRemaining / 60)}m</span>
          </button>
        )}

        {/* Theme Preset Selector Dropdown */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors flex items-center gap-1"
            title="Choose Aesthetic Theme"
            aria-label="Choose aesthetic theme"
          >
            <Palette className="w-4 h-4" />
            <div
              className="w-2.5 h-2.5 rounded-full shadow-xs"
              style={{ backgroundColor: currentTheme.accent }}
            />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 p-1.5 bg-zinc-900/95 border border-zinc-700/80 rounded-xl shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Aesthetic Themes
              </div>
              {Object.values(THEME_PRESETS).map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onChangeThemePreset(t.id);
                    setShowThemeMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    themePreset === t.id
                      ? 'bg-white/15 text-white font-medium'
                      : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: t.accent }}
                    />
                    <div className="truncate">
                      <span className="block truncate font-medium">{t.name}</span>
                      <span className="block truncate text-[10px] text-zinc-400">{t.tagline}</span>
                    </div>
                  </div>
                  {themePreset === t.id && (
                    <Check className="w-3.5 h-3.5 shrink-0 ml-1" style={{ color: t.accent }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Primary CTA: Add YouTube Link */}
        <button
          onClick={onOpenQuickImport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap shrink-0 text-zinc-950"
          style={{
            backgroundColor: currentTheme.accent,
          }}
          aria-label="Paste YouTube URL or Video ID"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">Add YouTube Link</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>
    </header>
  );
};
