import React, { useState } from 'react';
import { Track, RepeatMode, VisualizerMode, ThemeConfig } from '../types/player';
import { AudioVisualizer } from './AudioVisualizer';
import { formatTime, cleanTrackTitle } from '../utils/playerUtils';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Video,
  VideoOff,
  Heart,
  Gauge,
  Disc,
  Radio,
} from 'lucide-react';

interface NowPlayingHeroProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  playbackRate: number;
  visualizerMode: VisualizerMode;
  isVideoVisible: boolean;
  isFavorite: boolean;
  themeConfig: ThemeConfig;
  videoSlot?: React.ReactNode;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onSkipBack5s: () => void;
  onSkipForward5s: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onChangeVolume: (volume: number) => void;
  onChangePlaybackRate: (rate: number) => void;
  onChangeVisualizerMode: (mode: VisualizerMode) => void;
  onToggleVideo: () => void;
  onToggleFavorite: () => void;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5];
const VISUALIZER_MODES: { mode: VisualizerMode; label: string }[] = [
  { mode: 'spectrum', label: 'Bars' },
  { mode: 'wave', label: 'Wave' },
  { mode: 'aura', label: 'Aura' },
  { mode: 'minimal', label: 'Dots' },
];

export const NowPlayingHero: React.FC<NowPlayingHeroProps> = ({
  currentTrack,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  volume,
  repeatMode,
  isShuffle,
  playbackRate,
  visualizerMode,
  isVideoVisible,
  isFavorite,
  themeConfig,
  videoSlot,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onSkipBack5s,
  onSkipForward5s,
  onToggleShuffle,
  onToggleRepeat,
  onChangeVolume,
  onChangePlaybackRate,
  onChangeVisualizerMode,
  onToggleVideo,
  onToggleFavorite,
}) => {
  const [isHoveringSeek, setIsHoveringSeek] = useState(false);
  const [seekHoverPercent, setSeekHoverPercent] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
        <Disc className="w-16 h-16 stroke-[1.2] opacity-30 mb-4 animate-spin-slow" />
        <p className="text-sm font-medium">No track currently loaded</p>
        <p className="text-xs text-zinc-400 mt-1">Select a track from discovery or paste a YouTube URL</p>
      </div>
    );
  }

  const { title, artistFromTitle } = cleanTrackTitle(currentTrack.title);
  const displayArtist = artistFromTitle || currentTrack.artist || 'YouTube Artist';
  const effectiveDuration = duration > 0 ? duration : currentTrack.durationSec || 0;
  const progressPercent = effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      onChangeVolume(prevVolume || 80);
    } else {
      setPrevVolume(volume);
      setIsMuted(true);
      onChangeVolume(0);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onSeek(val);
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      {/* Audio Engine Spec Badge */}
      <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider uppercase text-zinc-400 dark:text-zinc-500 mb-1">
        <span className="flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ backgroundColor: isPlaying ? themeConfig.accent : '#71717a' }}
          />
          {isPlaying ? 'Live Audio Stream' : 'Ready'}
        </span>
        <span aria-hidden="true" className="opacity-40">/</span>
        <span>24-bit 48kHz Direct</span>
        <span aria-hidden="true" className="opacity-40">/</span>
        <span className="text-zinc-400">{themeConfig.name}</span>
      </div>

      {/* Centerpiece: Either Video or Minimalist Vinyl Turntable Deck */}
      {isVideoVisible && videoSlot ? (
        <div className="w-full max-w-xl my-4">
          {videoSlot}
        </div>
      ) : (
        /* Vinyl Turntable Platter Deck with Tonearm */
        <div className="relative w-72 h-72 sm:w-88 sm:h-88 my-3 flex items-center justify-center">
          {/* Subtle Ambient Theme Reactive Glow */}
          <div
            className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-1000 ${
              isPlaying ? 'opacity-30' : 'opacity-10'
            }`}
            style={{ backgroundColor: themeConfig.accent }}
          />

          {/* Live Audio Visualizer Canvas Backdrop */}
          <div className="absolute inset-x-0 bottom-0 top-0 opacity-45 dark:opacity-35 pointer-events-none">
            <AudioVisualizer
              isPlaying={isPlaying}
              volume={volume}
              mode={visualizerMode}
              accentColor={themeConfig.accent}
              accentSecondary={themeConfig.accentSecondary}
            />
          </div>

          {/* Platter Base Ring */}
          <div className="relative z-10 w-64 h-64 sm:w-80 sm:h-80 rounded-full p-2 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-950 border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex items-center justify-center">
            {/* Vinyl Record with Anisotropic Specular Sheen */}
            <div
              className={`relative w-full h-full rounded-full vinyl-sheen p-2 flex items-center justify-center transition-transform duration-700 ${
                isPlaying ? 'scale-100' : 'scale-95'
              }`}
            >
              {/* Concentric Micro-Grooves */}
              <div className="absolute inset-3 rounded-full border border-white/[0.04] pointer-events-none" />
              <div className="absolute inset-6 rounded-full border border-white/[0.03] pointer-events-none" />
              <div className="absolute inset-9 rounded-full border border-white/[0.04] pointer-events-none" />
              <div className="absolute inset-13 rounded-full border border-white/[0.03] pointer-events-none" />
              <div className="absolute inset-17 rounded-full border border-white/[0.04] pointer-events-none" />
              <div className="absolute inset-21 rounded-full border border-white/[0.03] pointer-events-none" />

              {/* Album Center Label */}
              <div
                className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden border-2 border-zinc-950 shadow-inner ${
                  isPlaying ? 'animate-[spin_22s_linear_infinite]' : ''
                }`}
              >
                <img
                  src={currentTrack.thumbnail}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />

                {/* Vinyl Center Typography Overlay */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center pointer-events-none p-1">
                  <span className="text-[7px] tracking-widest uppercase font-mono text-white/80">33⅓ RPM</span>
                  <span className="text-[6px] tracking-wider uppercase font-mono text-white/60">HI-RES AUDIO</span>
                </div>

                {/* Spindle hole */}
                <div className="absolute inset-0 m-auto w-5 h-5 rounded-full bg-zinc-950 border border-zinc-700/80 shadow-md flex items-center justify-center">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: themeConfig.accent }}
                  />
                </div>
              </div>
            </div>

            {/* Slender Minimalist Tonearm with Stylus */}
            <div className="absolute -top-1 -right-1 w-20 h-28 pointer-events-none z-20 hidden sm:block">
              {/* Pivot Base */}
              <div className="absolute top-0 right-3 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-600 shadow-md flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-zinc-500" />
              </div>
              {/* Tonearm Wand */}
              <div
                className={`tonearm absolute top-2 right-5 w-1.5 h-24 rounded-full bg-gradient-to-b from-zinc-400 via-zinc-300 to-zinc-500 shadow-md ${
                  isPlaying ? 'tonearm-playing' : 'tonearm-paused'
                }`}
              >
                {/* Cartridge & Stylus Head */}
                <div
                  className="absolute bottom-0 -left-1 w-3.5 h-4.5 rounded-xs shadow-xs"
                  style={{ backgroundColor: themeConfig.accent }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Track Title and Artist (Zero-Pill Typographic Hierarchy) */}
      <div className="text-center w-full max-w-xl px-4 mt-2 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate max-w-full text-zinc-900 dark:text-zinc-50">
          {title}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium truncate">
          {displayArtist}
        </p>
      </div>

      {/* Scrubber & Timestamps */}
      <div className="w-full max-w-xl px-6 space-y-1">
        <div className="relative group">
          <input
            type="range"
            min={0}
            max={effectiveDuration || 100}
            step={0.5}
            value={currentTime}
            onChange={handleSeekChange}
            onMouseEnter={() => setIsHoveringSeek(true)}
            onMouseLeave={() => setIsHoveringSeek(false)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              setSeekHoverPercent(Math.max(0, Math.min(1, percent)));
            }}
            style={{
              background: `linear-gradient(to right, ${themeConfig.accent} ${progressPercent}%, rgba(161, 161, 170, 0.2) ${progressPercent}%)`,
            }}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
            aria-label="Seek track position"
          />

          {/* Hover Time Tooltip */}
          {isHoveringSeek && effectiveDuration > 0 && (
            <div
              className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 bg-zinc-900 text-[10px] font-mono tabular-nums text-zinc-200 rounded shadow pointer-events-none"
              style={{ left: `${seekHoverPercent * 100}%` }}
            >
              {formatTime(seekHoverPercent * effectiveDuration)}
            </div>
          )}
        </div>

        {/* Time Labels */}
        <div className="flex justify-between items-center text-xs font-mono tabular-nums text-zinc-400 dark:text-zinc-500 pt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{effectiveDuration > 0 ? formatTime(effectiveDuration) : 'Live Stream'}</span>
        </div>
      </div>

      {/* Main Tactile Controls Bar */}
      <div className="flex items-center justify-center gap-3 sm:gap-6 mt-3">
        {/* Shuffle */}
        <button
          onClick={onToggleShuffle}
          className={`p-2.5 rounded-full transition-colors ${
            isShuffle
              ? 'text-white'
              : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
          style={isShuffle ? { backgroundColor: `${themeConfig.accent}25`, color: themeConfig.accent } : {}}
          aria-label={isShuffle ? 'Disable shuffle' : 'Enable shuffle'}
        >
          <Shuffle className="w-4 h-4" />
        </button>

        {/* Skip Back 5s */}
        <button
          onClick={onSkipBack5s}
          className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full transition-colors hidden sm:block"
          aria-label="Rewind 5 seconds"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Prev Track */}
        <button
          onClick={onPrev}
          className="p-2.5 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-full transition-colors active:scale-95"
          aria-label="Previous track"
        >
          <SkipBack className="w-5 h-5 fill-current" />
        </button>

        {/* Primary Tactile Play / Pause Button */}
        <button
          onClick={onTogglePlay}
          className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full text-zinc-950 flex items-center justify-center active:scale-90 transition-all focus:outline-none"
          style={{
            backgroundColor: themeConfig.accent,
            boxShadow: `0 8px 24px ${themeConfig.accent}45`,
          }}
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
        >
          {isBuffering ? (
            <div className="w-6 h-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6 fill-zinc-950" />
          ) : (
            <Play className="w-6 h-6 fill-zinc-950 ml-0.5" />
          )}
        </button>

        {/* Next Track */}
        <button
          onClick={onNext}
          className="p-2.5 text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white rounded-full transition-colors active:scale-95"
          aria-label="Next track"
        >
          <SkipForward className="w-5 h-5 fill-current" />
        </button>

        {/* Skip Forward 5s */}
        <button
          onClick={onSkipForward5s}
          className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full transition-colors hidden sm:block"
          aria-label="Fast forward 5 seconds"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* Repeat Mode */}
        <button
          onClick={onToggleRepeat}
          className={`p-2.5 rounded-full transition-colors ${
            repeatMode !== 'off'
              ? 'text-white'
              : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
          style={repeatMode !== 'off' ? { backgroundColor: `${themeConfig.accent}25`, color: themeConfig.accent } : {}}
          aria-label={`Repeat mode: ${repeatMode}`}
        >
          {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
        </button>
      </div>

      {/* Secondary Utilities Strip */}
      <div className="w-full max-w-xl px-6 mt-6 pt-4 border-t border-white/[0.08] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Left: Volume Slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-500" />
            ) : volume < 50 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              if (isMuted) setIsMuted(false);
              onChangeVolume(Number(e.target.value));
            }}
            style={{
              background: `linear-gradient(to right, ${themeConfig.accent} ${isMuted ? 0 : volume}%, rgba(161, 161, 170, 0.2) ${isMuted ? 0 : volume}%)`,
            }}
            className="w-20 sm:w-24 h-1 rounded-lg appearance-none cursor-pointer"
            aria-label="Volume control"
          />
          <span className="font-mono tabular-nums text-[11px] text-zinc-400 w-7">
            {isMuted ? '0%' : `${volume}%`}
          </span>
        </div>

        {/* Right: Mode Switchers (Visualizer, Speed, Video, Favorite) */}
        <div className="flex items-center gap-2.5">
          {/* Favorite Toggle */}
          <button
            onClick={onToggleFavorite}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorite
                ? 'text-rose-500 bg-rose-500/10'
                : 'text-zinc-400 hover:text-rose-500 hover:bg-white/5'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Visualizer Mode Switcher */}
          <div className="flex items-center gap-0.5 bg-white/5 dark:bg-black/30 p-0.5 rounded-lg border border-white/[0.08]">
            {VISUALIZER_MODES.map((vm) => (
              <button
                key={vm.mode}
                onClick={() => onChangeVisualizerMode(vm.mode)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  visualizerMode === vm.mode
                    ? 'shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
                style={
                  visualizerMode === vm.mode
                    ? {
                        backgroundColor: `${themeConfig.accent}20`,
                        color: themeConfig.accent,
                        fontWeight: 600,
                      }
                    : {}
                }
                title={vm.label}
              >
                {vm.label}
              </button>
            ))}
          </div>

          {/* Speed Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 dark:bg-black/30 border border-white/[0.08] text-[11px] font-mono text-zinc-300 hover:border-white/20 transition-colors"
              aria-label="Playback speed"
            >
              <Gauge className="w-3 h-3 text-zinc-400" />
              <span>{playbackRate}x</span>
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-1.5 p-1 bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-xl z-30 flex flex-col gap-0.5">
                {SPEED_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      onChangePlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-2.5 py-1 text-left text-xs font-mono rounded ${
                      playbackRate === rate
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Video Toggle */}
          <button
            onClick={onToggleVideo}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors"
            style={
              isVideoVisible
                ? {
                    backgroundColor: `${themeConfig.accent}20`,
                    borderColor: `${themeConfig.accent}40`,
                    color: themeConfig.accent,
                  }
                : {
                    borderColor: 'rgba(255,255,255,0.08)',
                    color: '#a1a1aa',
                  }
            }
            aria-label={isVideoVisible ? 'Hide video dock' : 'Show video dock'}
          >
            {isVideoVisible ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isVideoVisible ? 'Video' : 'Audio'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
