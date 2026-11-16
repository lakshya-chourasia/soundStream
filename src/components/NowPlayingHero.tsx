import React, { useState, useEffect, useRef } from 'react';
import { Track, RepeatMode, VisualizerMode, ThemeConfig, StreamQuality, PlayerStyle } from '../types/player';
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
  Mic2,
  Blend,
  Sliders,
  Waves,
  Activity,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { LyricsOverlay } from './LyricsOverlay';

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
  playbackQuality: StreamQuality;
  visualizerMode: VisualizerMode;
  playerStyle?: PlayerStyle;
  onTogglePlayerStyle?: () => void;
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
  onChangePlaybackQuality: (quality: StreamQuality) => void;
  onChangeVisualizerMode: (mode: VisualizerMode) => void;
  onToggleVideo: () => void;
  onToggleFavorite: () => void;
  crossfadeDuration: number;
  onChangeCrossfadeDuration: (duration: number) => void;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5];
const QUALITY_OPTIONS: { id: StreamQuality; label: string; bitrate: string }[] = [
  { id: 'auto', label: 'Auto Stream', bitrate: 'Adaptive Bitrate' },
  { id: 'hd1080', label: 'Master Studio (1080p)', bitrate: '320 kbps Hi-Fi' },
  { id: 'hd720', label: 'High Fidelity (720p)', bitrate: '256 kbps Direct' },
  { id: 'large', label: 'Standard Clean (480p)', bitrate: '160 kbps Balanced' },
  { id: 'medium', label: 'Mobile Saver (360p)', bitrate: '128 kbps Light' },
  { id: 'small', label: 'Bandwidth Saver (240p)', bitrate: '64 kbps Minimal' },
];

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
  playbackQuality,
  visualizerMode,
  playerStyle = 'wavy',
  onTogglePlayerStyle,
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
  onChangePlaybackQuality,
  onChangeVisualizerMode,
  onToggleVideo,
  onToggleFavorite,
  crossfadeDuration,
  onChangeCrossfadeDuration,
}) => {
  const [isHoveringSeek, setIsHoveringSeek] = useState(false);
  const [seekHoverPercent, setSeekHoverPercent] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showCrossfadeMenu, setShowCrossfadeMenu] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);

  // Keyboard shortcut: Escape exits fullscreen
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVideoFullscreen) {
        setIsVideoFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isVideoFullscreen]);

  if (!currentTrack) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500">
        <div className="fixed -bottom-[9999px] -right-[9999px] w-64 h-36 opacity-0 pointer-events-none" aria-hidden="true">
          {videoSlot}
        </div>
        <Disc className="w-16 h-16 stroke-[1.2] opacity-30 mb-4 animate-spin-slow text-emerald-400" />
        <p className="text-sm font-medium">No track currently loaded</p>
        <p className="text-xs text-zinc-400 mt-1">Select a track from discovery or paste a YouTube URL</p>
      </div>
    );
  }

  const { title, artistFromTitle } = cleanTrackTitle(currentTrack.title);
  const displayArtist = artistFromTitle || currentTrack.artist || 'YouTube Artist';
  const effectiveDuration = duration > 0 ? duration : currentTrack.durationSec || 0;
  const progressPercent = effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;

  const currentQualityObj = QUALITY_OPTIONS.find((q) => q.id === playbackQuality) || QUALITY_OPTIONS[0];

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
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-between h-full min-h-0 select-none">
      {/* Spec Badge & Stream Quality Pill Indicator (Uiverse Telemetry Badge) */}
      <div className="flex items-center gap-2 sm:gap-3 text-[10px] font-mono font-bold tracking-widest uppercase mb-1 px-3 py-0.5 rounded-full glass-panel border border-white/10 shrink-0">
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span
            className={`w-2 h-2 rounded-full inline-block ${isPlaying ? 'bg-gradient-to-r from-cyan-400 to-pink-500 shadow-[0_0_8px_#ec4899]' : 'bg-slate-600'}`}
          />
          {isPlaying ? 'OPTICAL REFRACTION' : 'STANDBY'}
        </span>
        <span aria-hidden="true" className="text-white/20">|</span>
        <span className="text-slate-300">{currentQualityObj.bitrate}</span>
        <span aria-hidden="true" className="text-white/20">|</span>
        <span className="bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-300 bg-clip-text text-transparent font-black">24-BIT / 192 KHZ</span>
      </div>

      {/* Video Container (ALWAYS permanently mounted so audio never stops or drops out) */}
      <div
        className={`transition-all duration-300 ${!isVideoVisible
            ? 'fixed -bottom-[9999px] -right-[9999px] w-64 h-36 opacity-0 pointer-events-none'
            : isVideoFullscreen
              ? 'fixed inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-2 sm:p-6 select-none animate-in fade-in duration-200'
              : 'relative w-full max-w-3xl sm:max-w-4xl mx-auto my-2 aspect-video rounded-2xl overflow-hidden glass-panel shadow-[0_0_50px_rgba(236,72,153,0.3)] bg-black border border-white/20 select-none group shrink min-h-0'
          }`}
        aria-hidden={!isVideoVisible}
      >
        <div
          className={`relative w-full h-full flex items-center justify-center ${isVideoFullscreen
              ? 'max-w-7xl max-h-[90vh] aspect-video rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.95)] border border-white/20'
              : ''
            }`}
        >
          {/* Native Video Slot (100% fit, zero zoom/crop) */}
          <div
            className="w-full h-full cursor-pointer flex items-center justify-center"
            onClick={onTogglePlay}
            onDoubleClick={() => setIsVideoFullscreen(!isVideoFullscreen)}
          >
            {videoSlot}
          </div>

          {/* Video Controls: Only Resize and Close (X) buttons, no text, no extra options */}
          {isVideoVisible && (
            <div className="absolute top-3 right-3 z-30 flex items-center gap-2 pointer-events-auto">
              {/* Fullscreen / Fit-to-screen Toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVideoFullscreen(!isVideoFullscreen);
                }}
                className="p-2 rounded-xl glass-panel bg-black/60 border border-white/20 text-slate-200 hover:text-white hover:border-pink-400/50 hover:bg-white/10 transition-all active:scale-95 shadow-lg backdrop-blur-md"
                title={isVideoFullscreen ? 'Exit Fullscreen' : 'Maximize'}
                aria-label={isVideoFullscreen ? 'Exit fullscreen' : 'Maximize'}
              >
                {isVideoFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close Video button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isVideoFullscreen) setIsVideoFullscreen(false);
                  onToggleVideo();
                }}
                className="p-2 rounded-xl glass-panel bg-black/60 border border-white/20 text-slate-300 hover:text-white hover:border-pink-400/50 hover:bg-white/10 transition-all active:scale-95 shadow-lg backdrop-blur-md"
                title="Close Video"
                aria-label="Close video"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lyrics Overlay Centerpiece (When lyrics are toggled on in audio mode) */}
      {!isVideoVisible && isLyricsOpen && (
        <div className="w-full flex-1 min-h-0 my-1 overflow-hidden">
          <LyricsOverlay
            currentTrack={currentTrack}
            currentTime={currentTime}
            onSeek={onSeek}
            themeConfig={themeConfig}
            onClose={() => setIsLyricsOpen(false)}
          />
        </div>
      )}

      {/* Centerpiece: Wavy Fluid Orb vs Optical Turntable Platter Deck */}
      {!isVideoVisible && !isLyricsOpen && (
        playerStyle === 'wavy' ? (
          /* WAVY FLUID SOUND ENGINE MODE */
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 my-1 flex items-center justify-center shrink-0">
            {/* Ambient Multi-Ring Wave Ripples */}
            <div
              className={`absolute inset-0 rounded-full border border-cyan-400/40 transition-all duration-1000 ${
                isPlaying ? 'scale-125 opacity-60 animate-[wavyRotate_12s_linear_infinite]' : 'scale-100 opacity-20'
              }`}
            />
            <div
              className={`absolute -inset-2 rounded-full border border-pink-500/40 transition-all duration-1000 ${
                isPlaying ? 'scale-115 opacity-50 animate-[wavyRotate2_16s_linear_infinite]' : 'scale-100 opacity-15'
              }`}
            />
            <div
              className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-700 ${
                isPlaying ? 'opacity-70' : 'opacity-20'
              } bg-gradient-to-tr from-cyan-500 via-pink-500 to-amber-500`}
            />

            {/* Live Audio Visualizer Canvas Backdrop */}
            <div className="absolute inset-x-0 bottom-0 top-0 opacity-60 pointer-events-none">
              <AudioVisualizer
                isPlaying={isPlaying}
                volume={volume}
                mode={visualizerMode}
                accentColor="#38bdf8"
                accentSecondary="#ec4899"
              />
            </div>

            {/* Organic Fluid Wave Centerpiece with Artwork */}
            <div
              className={`relative z-10 w-28 h-28 sm:w-34 sm:h-34 md:w-40 md:h-40 rounded-full p-1.5 shadow-[0_0_35px_rgba(236,72,153,0.5)] transition-transform duration-500 ${
                isPlaying ? 'scale-105' : 'scale-95'
              }`}
            >
              {/* Spinning Wave Ring Border */}
              <div
                className={`absolute inset-0 rounded-full border-2 border-dashed border-cyan-300/70 ${
                  isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''
                }`}
              />
              <div
                className={`absolute inset-1 rounded-full border border-pink-400/60 ${
                  isPlaying ? 'animate-[spin_15s_linear_infinite_reverse]' : ''
                }`}
              />

              {/* Album Art with Floating Reflection */}
              <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/50 shadow-inner group">
                <img
                  src={currentTrack.thumbnail}
                  alt={title}
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-transform duration-1000 ${
                    isPlaying ? 'scale-110' : 'scale-100'
                  }`}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col items-center justify-end pb-1.5 pointer-events-none">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-[8px] font-mono font-bold tracking-widest uppercase text-cyan-300">WAVE ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Aether Optical Turntable Platter Deck with Tonearm */
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 my-1 flex items-center justify-center shrink-0">
            {/* Subtle Ambient Prismatic Chromatic Glow */}
            <div
              className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-1000 ${isPlaying ? 'opacity-40' : 'opacity-10'
                } bg-gradient-to-tr from-cyan-500 via-pink-500 to-amber-500`}
            />

            {/* Live Audio Visualizer Canvas Backdrop */}
            <div className="absolute inset-x-0 bottom-0 top-0 opacity-45 pointer-events-none">
              <AudioVisualizer
                isPlaying={isPlaying}
                volume={volume}
                mode={visualizerMode}
                accentColor="#38bdf8"
                accentSecondary="#ec4899"
              />
            </div>

            {/* Platter Base Ring: Matte Charcoal Surface with Prismatic Rim Light */}
            <div className="relative z-10 w-34 h-34 sm:w-42 sm:h-42 md:w-48 md:h-48 rounded-full p-1.5 bg-gradient-to-tr from-[#0d0e14] via-[#141620] to-[#1c1f2c] border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.9),0_0_20px_rgba(236,72,153,0.2)] ring-1 ring-cyan-400/20 flex items-center justify-center">
              {/* Vinyl Record with Anisotropic Specular Sheen */}
              <div
                className={`relative w-full h-full rounded-full vinyl-sheen p-1 flex items-center justify-center transition-transform duration-700 ${isPlaying ? 'scale-100' : 'scale-95'
                  }`}
              >
                {/* Concentric Micro-Grooves */}
                <div className="absolute inset-1.5 rounded-full border border-white/5 pointer-events-none" />
                <div className="absolute inset-3 rounded-full border border-white/10 pointer-events-none" />
                <div className="absolute inset-5 rounded-full border border-pink-400/10 pointer-events-none" />
                <div className="absolute inset-7 rounded-full border border-cyan-400/10 pointer-events-none" />
                <div className="absolute inset-9 rounded-full border border-amber-400/10 pointer-events-none" />

                {/* Album Center Label (Clean Glass Typography) */}
                <div
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-white/30 shadow-inner ${isPlaying ? 'animate-[spin_22s_linear_infinite]' : ''
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

                  {/* Center Typography Overlay */}
                  <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center pointer-events-none p-1">
                    <span className="text-[7px] tracking-widest uppercase font-mono font-black text-cyan-300">33⅓ RPM</span>
                    <span className="text-[6px] tracking-wider uppercase font-serif italic text-pink-300">Aether Prism</span>
                  </div>

                  {/* Spindle hole */}
                  <div className="absolute inset-0 m-auto w-3.5 h-3.5 rounded-full bg-[#08090c] border border-white/30 shadow-md flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 shadow-[0_0_8px_#ec4899]" />
                  </div>
                </div>
              </div>

              {/* Tonearm with Prismatic Stylus Head */}
              <div className="absolute -top-1 -right-1 w-12 h-18 pointer-events-none z-20 hidden sm:block">
                {/* Pivot Base */}
                <div className="absolute top-0 right-1.5 w-3.5 h-3.5 rounded-full bg-[#141620] border border-white/20 shadow-md flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-pink-400 shadow-[0_0_8px_#ec4899]" />
                </div>
                {/* Tonearm Wand */}
                <div
                  className={`tonearm absolute top-1.5 right-3 w-1 h-16 rounded-full bg-gradient-to-b from-[#ffffff] via-[#ec4899] to-[#0ea5e9] shadow-md ${isPlaying ? 'tonearm-playing' : 'tonearm-paused'
                    }`}
                >
                  {/* Cartridge & Stylus Head */}
                  <div className="absolute bottom-0 -left-1 w-2.5 h-3 rounded-xs shadow-xs bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {/* Track Title and Artist: Editorial Typography Pairing (Bold Grotesque + Italic Serif) */}
      <div className="text-center w-full max-w-xl px-4 my-0.5 shrink-0">
        <h2 className="text-lg sm:text-xl font-black tracking-tight truncate max-w-full text-white uppercase drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
          {title}
        </h2>
        <div className="flex items-center justify-center gap-2 mt-0.5">
          <p className="text-xs sm:text-sm font-serif italic text-slate-300 truncate">
            {displayArtist}
          </p>
        </div>
      </div>

      {/* Scrubber & Timestamps */}
      <div className="w-full max-w-xl px-4 space-y-0.5 my-0.5 shrink-0">
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
              background: `linear-gradient(to right, #0ea5e9 0%, #ec4899 ${progressPercent}%, rgba(255, 255, 255, 0.08) ${progressPercent}%)`,
            }}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            aria-label="Seek track position"
          />

          {/* Hover Time Tooltip */}
          {isHoveringSeek && effectiveDuration > 0 && (
            <div
              className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 glass-panel text-[10px] font-mono font-bold tabular-nums text-pink-300 rounded shadow-xl pointer-events-none"
              style={{ left: `${seekHoverPercent * 100}%` }}
            >
              {formatTime(seekHoverPercent * effectiveDuration)}
            </div>
          )}
        </div>

        {/* Time Labels */}
        <div className="flex justify-between items-center text-[10px] font-mono font-bold tabular-nums text-slate-400">
          <span>{formatTime(currentTime)}</span>
          <span>{effectiveDuration > 0 ? formatTime(effectiveDuration) : 'LIVE SIGNAL'}</span>
        </div>
      </div>

      {/* Main Glass Transport Buttons Bar */}
      <div className="flex items-center justify-center gap-2.5 sm:gap-4 my-1 shrink-0">
        {/* Shuffle */}
        <button
          onClick={onToggleShuffle}
          className={`p-1.5 rounded-full transition-all ${isShuffle
              ? 'bg-pink-500/20 text-pink-400 ring-1 ring-pink-500/50 shadow-[0_0_12px_rgba(236,72,153,0.45)]'
              : 'text-slate-400 hover:text-cyan-300'
            }`}
          aria-label={isShuffle ? 'Disable shuffle' : 'Enable shuffle'}
        >
          <Shuffle className="w-3.5 h-3.5" />
        </button>

        {/* Skip Back 5s */}
        <button
          onClick={onSkipBack5s}
          className="p-1 text-slate-400 hover:text-cyan-300 rounded-full transition-colors hidden sm:block"
          aria-label="Rewind 5 seconds"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Prev Track */}
        <button
          onClick={onPrev}
          className="p-1.5 text-slate-300 hover:text-white rounded-full transition-colors active:scale-90"
          aria-label="Previous track"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>

        {/* Primary Glass Play / Pause Button (Uiverse Aether Chromatic Gradient) */}
        <button
          onClick={onTogglePlay}
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full glass-aether-button flex items-center justify-center active:scale-95 transition-all focus:outline-none"
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
        >
          {isBuffering ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 fill-white text-white" />
          ) : (
            <Play className="w-5 h-5 fill-white text-white ml-0.5" />
          )}
        </button>

        {/* Next Track */}
        <button
          onClick={onNext}
          className="p-1.5 text-slate-300 hover:text-white rounded-full transition-colors active:scale-90"
          aria-label="Next track"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>

        {/* Skip Forward 5s */}
        <button
          onClick={onSkipForward5s}
          className="p-1 text-slate-400 hover:text-cyan-300 rounded-full transition-colors hidden sm:block"
          aria-label="Fast forward 5 seconds"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>

        {/* Repeat Mode */}
        <button
          onClick={onToggleRepeat}
          className={`p-1.5 rounded-full transition-all ${repeatMode !== 'off'
              ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-400/50 shadow-[0_0_12px_rgba(56,189,248,0.45)]'
              : 'text-slate-400 hover:text-cyan-300'
            }`}
          aria-label={`Repeat mode: ${repeatMode}`}
        >
          {repeatMode === 'one' ? <Repeat1 className="w-3.5 h-3.5" /> : <Repeat className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Secondary Utilities Strip (Optimized for Mobile Swipe & Desktop Row) */}
      <div className="w-full max-w-xl px-2 sm:px-4 mt-0.5 pt-1 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs shrink-0">
        {/* Left: Volume Slider */}
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-2 px-1">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-cyan-300 transition-colors p-1"
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
                background: `linear-gradient(to right, #ec4899 ${isMuted ? 0 : volume}%, rgba(255, 255, 255, 0.08) ${isMuted ? 0 : volume}%)`,
              }}
              className="w-24 sm:w-24 h-1 rounded-full appearance-none cursor-pointer"
              aria-label="Volume control"
            />
            <span className="font-mono font-bold tabular-nums text-[10px] text-pink-300 w-7">
              {isMuted ? '0%' : `${volume}%`}
            </span>
          </div>

          {/* Quick Favorite on mobile header */}
          <button
            onClick={onToggleFavorite}
            className={`p-1.5 rounded-full border transition-all sm:hidden ${isFavorite
                ? 'text-pink-400 bg-pink-500/20 border-pink-400/50 shadow-[0_0_10px_rgba(236,72,153,0.35)]'
                : 'glass-panel text-slate-400 hover:text-pink-400'
              }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Right: Mode Switchers (Smooth horizontal swipeable pills on mobile) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full w-full sm:w-auto py-0.5 px-1 shrink-0">
          {/* Player Style Switcher: Wavy vs Turntable Deck */}
          {onTogglePlayerStyle && (
            <button
              onClick={onTogglePlayerStyle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-wider transition-all ${playerStyle === 'wavy'
                  ? 'bg-gradient-to-r from-cyan-500 via-pink-500 to-amber-400 text-white border-white/30 shadow-[0_0_14px_rgba(236,72,153,0.5)]'
                  : 'glass-panel text-slate-300 hover:text-white hover:border-cyan-400/40'
                }`}
              title={playerStyle === 'wavy' ? 'Switch to Turntable Mode' : 'Switch to Wavy Player Mode'}
              aria-label="Toggle Player Style"
            >
              <Waves className="w-3.5 h-3.5" />
              <span>{playerStyle === 'wavy' ? 'WAVY ON' : 'WAVY OFF'}</span>
            </button>
          )}

          {/* Quality Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowQualityMenu(!showQualityMenu);
                setShowCrossfadeMenu(false);
                setShowSpeedMenu(false);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-panel text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 hover:border-pink-400/50 hover:text-white transition-all shadow-sm"
              title="Stream Audio & Video Quality"
              aria-label="Stream quality"
            >
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span>{playbackQuality.toUpperCase()}</span>
            </button>
            {showQualityMenu && (
              <div className="absolute bottom-full right-0 mb-1.5 p-1.5 glass-panel rounded-xl shadow-2xl z-40 flex flex-col gap-1 min-w-[200px] border border-white/20">
                <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-slate-400 px-2 py-0.5">STREAM QUALITY</span>
                {QUALITY_OPTIONS.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      onChangePlaybackQuality(q.id);
                      setShowQualityMenu(false);
                    }}
                    className={`px-3 py-1.5 text-left text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-between ${playbackQuality === q.id
                        ? 'bg-gradient-to-r from-cyan-500 via-pink-500 to-amber-400 text-white font-extrabold shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    <span>{q.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lyrics Toggle Button */}
          <button
            onClick={() => {
              if (isVideoVisible) onToggleVideo();
              setIsLyricsOpen(!isLyricsOpen);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-wider transition-all ${isLyricsOpen && !isVideoVisible
                ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white border-white/30 shadow-[0_0_14px_rgba(236,72,153,0.5)]'
                : 'glass-panel text-slate-300 hover:text-white hover:border-pink-400/40'
              }`}
            title={isLyricsOpen ? 'Return to Turntable' : 'View Lyrics'}
            aria-label={isLyricsOpen ? 'Hide lyrics overlay' : 'Show lyrics overlay'}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>LYRICS</span>
          </button>

          {/* Crossfade Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowCrossfadeMenu(!showCrossfadeMenu);
                setShowQualityMenu(false);
                setShowSpeedMenu(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full glass-panel text-[11px] font-mono font-bold uppercase tracking-wider text-slate-300 hover:border-pink-400/40 hover:text-white transition-colors"
              title="Audio crossfade duration between tracks"
              aria-label="Crossfade duration"
            >
              <Blend className="w-3 h-3 text-pink-400" />
              <span>{crossfadeDuration === 0 ? 'FADE: OFF' : `${crossfadeDuration}S`}</span>
            </button>
            {showCrossfadeMenu && (
              <div className="absolute bottom-full right-0 mb-1.5 p-1.5 glass-panel rounded-xl shadow-2xl z-40 flex flex-col gap-1 min-w-[140px] border border-white/20">
                <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-slate-400 px-2 py-0.5">CROSSFADE</span>
                {[0, 1, 1.5, 2, 3].map((dur) => (
                  <button
                    key={dur}
                    onClick={() => {
                      onChangeCrossfadeDuration(dur);
                      setShowCrossfadeMenu(false);
                    }}
                    className={`px-2.5 py-1 text-left text-xs font-mono font-bold rounded-lg ${crossfadeDuration === dur
                        ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-extrabold shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {dur === 0 ? 'OFF (INSTANT)' : `${dur} SECONDS`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Favorite Toggle */}
          <button
            onClick={onToggleFavorite}
            className={`p-2 rounded-full border transition-all ${isFavorite
                ? 'text-pink-400 bg-pink-500/20 border-pink-400/50 shadow-[0_0_12px_rgba(236,72,153,0.35)]'
                : 'glass-panel text-slate-400 hover:text-pink-400 hover:border-pink-400/40'
              }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>

          {/* Visualizer Mode Switcher */}
          <div className="flex items-center gap-0.5 glass-panel p-0.5 rounded-full border border-white/10">
            {VISUALIZER_MODES.map((vm) => (
              <button
                key={vm.mode}
                onClick={() => onChangeVisualizerMode(vm.mode)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${visualizerMode === vm.mode
                    ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white shadow-xs font-black'
                    : 'text-slate-400 hover:text-white'
                  }`}
                title={vm.label}
              >
                {vm.label}
              </button>
            ))}
          </div>

          {/* Speed Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSpeedMenu(!showSpeedMenu);
                setShowQualityMenu(false);
                setShowCrossfadeMenu(false);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full glass-panel text-[11px] font-mono font-bold text-slate-300 hover:border-pink-400/40 hover:text-white transition-colors"
              aria-label="Playback speed"
            >
              <Gauge className="w-3 h-3 text-cyan-400" />
              <span>{playbackRate}X</span>
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-1.5 p-1.5 glass-panel rounded-xl shadow-2xl z-40 flex flex-col gap-1 border border-white/20">
                {SPEED_OPTIONS.map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      onChangePlaybackRate(rate);
                      setShowSpeedMenu(false);
                    }}
                    className={`px-2.5 py-1 text-left text-xs font-mono font-bold rounded-lg ${playbackRate === rate
                        ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-extrabold shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                        : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                  >
                    {rate}X
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Video Toggle */}
          <button
            onClick={() => {
              if (isLyricsOpen) setIsLyricsOpen(false);
              onToggleVideo();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-wider transition-all ${isVideoVisible
                ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white border-white/30 shadow-[0_0_14px_rgba(236,72,153,0.5)]'
                : 'glass-panel text-slate-300 hover:text-white hover:border-pink-400/40'
              }`}
            aria-label={isVideoVisible ? 'Hide video dock' : 'Show video dock'}
          >
            {isVideoVisible ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isVideoVisible ? 'VIDEO ON' : 'AUDIO ONLY'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
