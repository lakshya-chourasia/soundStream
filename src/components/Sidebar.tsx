import React from 'react';
import { ActiveView } from '../types/player';
import {
  Film,
  Radio,
  Music2,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  queueCount?: number;
  favoritesCount?: number;
  isVideoVisible: boolean;
  onToggleVideo: () => void;
  isLyricsOpen: boolean;
  onToggleLyrics: () => void;
  isVisualizerOpen: boolean;
  onToggleVisualizer: () => void;
  onOpenQuickImport?: () => void;
  sleepTimerRemaining?: number | null;
  onOpenSleepTimer?: () => void;
  isPlaying: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  isVideoVisible,
  onToggleVideo,
  isLyricsOpen,
  onToggleLyrics,
  isVisualizerOpen,
  onToggleVisualizer,
  isPlaying,
}) => {
  return (
    <aside className="hidden md:flex w-16 h-full bg-black/60 backdrop-blur-xl border-r border-white/10 flex-col items-center justify-between py-6 select-none shrink-0 z-40">
      {/* Top: Monogram Brand Logo */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => onSelectView('now-playing')}
          className="group flex items-center justify-center p-1.5 focus:outline-none"
          title="SoundStream Home"
        >
          <div className="flex items-center gap-0.5 text-white">
            <span className="w-1.5 h-6 bg-white rounded-xs transition-transform group-hover:scale-y-110" />
            <span className="font-display font-black text-2xl tracking-tighter leading-none ml-0.5">
              S
            </span>
          </div>
        </button>
      </div>

      {/* Center: Iconic Navigation Stack from Reference */}
      <div className="flex flex-col items-center gap-5 my-auto">
        {/* 1. Film / Video Reel Icon */}
        <button
          onClick={onToggleVideo}
          className={`rail-btn relative ${isVideoVisible ? 'active' : ''}`}
          title={isVideoVisible ? 'Hide Video' : 'Watch Official Video'}
          aria-label="Toggle Video"
        >
          <Film className="w-5 h-5" />
          {isVideoVisible && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-yellow-400 rounded-r-full" />
          )}
        </button>

        {/* 2. Broadcast / Podcast / Audio Waves Icon */}
        <button
          onClick={onToggleVisualizer}
          className={`rail-btn relative ${isVisualizerOpen ? 'active' : ''}`}
          title="Toggle Audio Visualizer"
          aria-label="Visualizer"
        >
          <Radio className="w-5 h-5" />
          {isVisualizerOpen && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-yellow-400 rounded-r-full" />
          )}
        </button>

        {/* 3. Music Note Icon (Now Playing / Queue) */}
        <button
          onClick={() => onSelectView('now-playing')}
          className={`rail-btn relative ${activeView === 'now-playing' ? 'active' : ''}`}
          title="Now Playing Player"
          aria-label="Now Playing"
        >
          <Music2 className="w-5 h-5" />
          {activeView === 'now-playing' && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-yellow-400 rounded-r-full" />
          )}
        </button>

        {/* 4. Book / Lyrics / Journal Icon */}
        <button
          onClick={onToggleLyrics}
          className={`rail-btn relative ${isLyricsOpen ? 'active' : ''}`}
          title="Synchronized Lyrics"
          aria-label="Lyrics"
        >
          <BookOpen className="w-5 h-5" />
          {isLyricsOpen && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-yellow-400 rounded-r-full" />
          )}
        </button>
      </div>

      {/* Bottom: Playback Activity Dot */}
      <div className="flex flex-col items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            isPlaying ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-white/20'
          }`}
          title={isPlaying ? 'Audio playing' : 'Audio paused'}
        />
      </div>
    </aside>
  );
};
