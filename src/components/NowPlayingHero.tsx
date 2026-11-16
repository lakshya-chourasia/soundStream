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
  Heart,
  Mic2,
  Maximize2,
  Minimize2,
  X,
  Sliders,
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

const QUALITY_OPTIONS: { id: StreamQuality; label: string; bitrate: string }[] = [
  { id: 'auto', label: 'Auto Stream', bitrate: 'Adaptive Bitrate' },
  { id: 'hd1080', label: 'Master Studio (1080p)', bitrate: '320 kbps Hi-Fi' },
  { id: 'hd720', label: 'High Fidelity (720p)', bitrate: '256 kbps Direct' },
  { id: 'large', label: 'Standard Clean (480p)', bitrate: '160 kbps Balanced' },
  { id: 'medium', label: 'Mobile Saver (360p)', bitrate: '128 kbps Light' },
  { id: 'small', label: 'Bandwidth Saver (240p)', bitrate: '64 kbps Minimal' },
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
  playbackQuality,
  visualizerMode,
  isVideoVisible,
  isFavorite,
  themeConfig,
  videoSlot,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onToggleShuffle,
  onToggleRepeat,
  onChangeVolume,
  onChangePlaybackQuality,
  onToggleVideo,
  onToggleFavorite,
}) => {
  const [isHoveringSeek, setIsHoveringSeek] = useState(false);
  const [seekHoverPercent, setSeekHoverPercent] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [showVolumeMenu, setShowVolumeMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
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
        <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center mb-4">
          <Play className="w-6 h-6 text-zinc-600 ml-1" />
        </div>
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
    <div className="w-full flex flex-col items-center justify-center min-h-0 select-none py-2 px-3">
      {/* Offscreen / Fullscreen Video Container (Maintains audio continuously) */}
      <div
        className={`transition-all duration-300 ${
          !isVideoVisible
            ? 'fixed -bottom-[9999px] -right-[9999px] w-64 h-36 opacity-0 pointer-events-none'
            : isVideoFullscreen
              ? 'fixed inset-0 z-50 bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-2 sm:p-6 select-none animate-in fade-in duration-200'
              : 'relative w-full max-w-2xl sm:max-w-3xl mx-auto my-2 aspect-video rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-black border border-white/20 select-none group shrink min-h-0'
        }`}
        aria-hidden={!isVideoVisible}
      >
        <div
          className={`relative w-full h-full flex items-center justify-center ${
            isVideoFullscreen
              ? 'max-w-7xl max-h-[90vh] aspect-video rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.95)] border border-white/20'
              : ''
          }`}
        >
          <div
            className="w-full h-full cursor-pointer flex items-center justify-center"
            onClick={onTogglePlay}
            onDoubleClick={() => setIsVideoFullscreen(!isVideoFullscreen)}
          >
            {videoSlot}
          </div>

          {/* Video Overlay Buttons (Only Resize & Close, no text) */}
          {isVideoVisible && (
            <div className="absolute top-3 right-3 z-30 flex items-center gap-2 pointer-events-auto">
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

      {/* Main Glass Player Card (Ivan Odintsov Design) */}
      {!isVideoVisible && (
        <div className="codepen-player w-[350px] sm:w-[400px] h-[440px] sm:h-[460px] mx-auto shadow-2xl relative select-none flex flex-col justify-between">
          {/* Background image & gradient blend layers */}
          <div
            className="absolute inset-0 bg-bottom bg-cover pointer-events-none transition-all duration-700"
            style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
          >
            {/* Top & Bottom gradient shadows for crisp typography and button contrast */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/35 to-black/85" />
            <div className="absolute inset-0 bg-black/20 mix-blend-soft-light" />
          </div>

          {/* Subtle audio visualizer aura in the background */}
          <div className="absolute inset-x-0 bottom-24 top-28 opacity-25 pointer-events-none">
            <AudioVisualizer
              isPlaying={isPlaying}
              volume={volume}
              mode={visualizerMode}
              accentColor="#ffffff"
              accentSecondary="#ec4899"
            />
          </div>

          {/* Lyrics Overlay inside Card if toggled */}
          {isLyricsOpen ? (
            <div className="relative z-20 w-full h-full p-4 flex flex-col backdrop-blur-xl bg-black/85">
              <div className="flex items-center justify-between pb-2 border-b border-white/15">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-pink-400">Synchronized Lyrics</span>
                <button
                  onClick={() => setIsLyricsOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden pt-2">
                <LyricsOverlay
                  currentTrack={currentTrack}
                  currentTime={currentTime}
                  onSeek={onSeek}
                  themeConfig={themeConfig}
                  onClose={() => setIsLyricsOpen(false)}
                />
              </div>
            </div>
          ) : (
            <div className="relative z-10 w-full h-full flex flex-col justify-between">
              {/* Top Section */}
              <div className="p-6 pb-2">
                {/* Top Controls Bar */}
                <div className="flex items-center justify-between text-white/80">
                  {/* Left: Quick Actions (Favorite, Video, Lyrics) */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onToggleFavorite}
                      className={`transition-colors p-1 rounded-full ${
                        isFavorite ? 'text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : 'hover:text-white'
                      }`}
                      title={isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                      aria-label="Favorite"
                    >
                      <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={onToggleVideo}
                      className="hover:text-white transition-colors p-1"
                      title="Watch HD Video"
                      aria-label="Watch video"
                    >
                      <Video className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setIsLyricsOpen(true)}
                      className="hover:text-white transition-colors p-1"
                      title="Show Lyrics"
                      aria-label="Lyrics"
                    >
                      <Mic2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Right: Volume & Quality */}
                  <div className="flex items-center gap-3 relative">
                    <div className="relative">
                      <button
                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                        className="text-[11px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all text-white/90"
                        title="Stream Quality"
                      >
                        {playbackQuality.toUpperCase()}
                      </button>
                      {showQualityMenu && (
                        <div className="absolute top-full right-0 mt-2 p-1.5 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/20 shadow-2xl z-50 flex flex-col gap-1 min-w-[170px]">
                          {QUALITY_OPTIONS.map((q) => (
                            <button
                              key={q.id}
                              onClick={() => {
                                onChangePlaybackQuality(q.id);
                                setShowQualityMenu(false);
                              }}
                              className={`px-3 py-1.5 text-left text-xs font-mono font-bold rounded-xl transition-all ${
                                playbackQuality === q.id ? 'bg-pink-500 text-white font-black' : 'text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              {q.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Volume Slider Popover */}
                    <div className="relative">
                      <button
                        onClick={() => setShowVolumeMenu(!showVolumeMenu)}
                        className="hover:text-white transition-colors p-1"
                        aria-label="Volume"
                      >
                        {isMuted || volume === 0 ? (
                          <VolumeX className="w-5 h-5 text-rose-400" />
                        ) : volume < 50 ? (
                          <Volume1 className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </button>
                      {showVolumeMenu && (
                        <div className="absolute top-full right-0 mt-2 p-3 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/20 shadow-2xl z-50 flex items-center gap-2 w-44">
                          <button onClick={toggleMute} className="text-white">
                            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
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
                            className="w-full h-1 appearance-none cursor-pointer accent-pink-500 bg-white/20 rounded-full"
                          />
                          <span className="text-[10px] font-mono text-white/80 w-6 text-right">
                            {isMuted ? '0' : volume}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Song Meta Typography */}
                <div className="text-center mt-6 px-2">
                  <h2 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate">
                    {title}
                  </h2>
                  <p className="text-sm sm:text-base font-light text-white/80 mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)] truncate">
                    {displayArtist}
                  </p>
                </div>
              </div>

              {/* Middle Scrubber Bar */}
              <div className="px-6 mb-2">
                <div className="relative group/seek">
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
                      background: `linear-gradient(to right, #ffffff 0%, #ffffff ${progressPercent}%, rgba(255, 255, 255, 0.25) ${progressPercent}%)`,
                    }}
                    className="w-full h-1 sm:h-1.5 rounded-full appearance-none cursor-pointer transition-all"
                    aria-label="Seek track"
                  />
                  {isHoveringSeek && effectiveDuration > 0 && (
                    <div
                      className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 border border-white/20 text-[10px] font-mono text-white pointer-events-none shadow-md"
                      style={{ left: `${seekHoverPercent * 100}%` }}
                    >
                      {formatTime(seekHoverPercent * effectiveDuration)}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono font-medium text-white/70 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{effectiveDuration > 0 ? formatTime(effectiveDuration) : 'Live'}</span>
                </div>
              </div>

              {/* Bottom Controls Bar (Odintsov Glass Design) */}
              <div className="codepen-player-bottom relative h-20 w-full px-5 flex items-center justify-between overflow-hidden">
                {/* Blurred controls background from thumbnail */}
                <div
                  className="absolute inset-0 bg-bottom bg-cover pointer-events-none filter blur-xl opacity-30 scale-125"
                  style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
                />

                {/* Repeat Button */}
                <button
                  onClick={onToggleRepeat}
                  className={`relative z-10 transition-colors p-2 text-white/80 hover:text-white ${
                    repeatMode !== 'off' ? 'text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]' : ''
                  }`}
                  title={`Repeat: ${repeatMode}`}
                  aria-label="Repeat"
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
                </button>

                {/* Prev Track Button */}
                <button
                  onClick={onPrev}
                  className="codepen-btn-circle relative z-10 w-10 h-10 rounded-full text-white/90 hover:text-white"
                  title="Previous Track"
                  aria-label="Previous"
                >
                  <SkipBack className="w-4 h-4 fill-white" />
                </button>

                {/* Main Play / Pause Button */}
                <button
                  onClick={onTogglePlay}
                  className="codepen-btn-circle relative z-10 w-14 h-14 rounded-full text-white shadow-2xl"
                  title={isPlaying ? 'Pause' : 'Play'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isBuffering ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6 fill-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  )}
                </button>

                {/* Next Track Button */}
                <button
                  onClick={onNext}
                  className="codepen-btn-circle relative z-10 w-10 h-10 rounded-full text-white/90 hover:text-white"
                  title="Next Track"
                  aria-label="Next"
                >
                  <SkipForward className="w-4 h-4 fill-white" />
                </button>

                {/* Shuffle Button */}
                <button
                  onClick={onToggleShuffle}
                  className={`relative z-10 transition-colors p-2 text-white/80 hover:text-white ${
                    isShuffle ? 'text-pink-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]' : ''
                  }`}
                  title="Shuffle"
                  aria-label="Shuffle"
                >
                  <Shuffle className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
