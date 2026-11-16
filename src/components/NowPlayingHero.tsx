import React, { useState, useEffect } from 'react';
import { Track, RepeatMode, VisualizerMode, ThemeConfig, StreamQuality, PlayerStyle } from '../types/player';
import { formatTime, cleanTrackTitle, getDynamicTrackTag } from '../utils/playerUtils';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Sliders,
  ChevronRight,
  Radio,
  X,
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
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
  // Queue & Playlist props
  queue?: Track[];
  onPlayTrack?: (track: Track) => void;
  playlistName?: string;
  curatorName?: string;
  genreTag?: string;
  isLyricsOpen?: boolean;
  onToggleLyrics?: () => void;
  isVisualizerOpen?: boolean;
  onToggleVisualizer?: () => void;
}

export const NowPlayingHero: React.FC<NowPlayingHeroProps> = ({
  currentTrack,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  volume,
  repeatMode,
  isShuffle,
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
  onToggleVideo,
  onToggleFavorite,
  queue = [],
  onPlayTrack,
  playlistName,
  curatorName,
  genreTag,
  isLyricsOpen = false,
  onToggleLyrics,
  isVisualizerOpen = false,
  onToggleVisualizer,
}) => {
  const [isVolumePopoverOpen, setIsVolumePopoverOpen] = useState(false);
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

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
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="fixed -bottom-[9999px] -right-[9999px] w-64 h-36 opacity-0 pointer-events-none" aria-hidden="true">
          {videoSlot}
        </div>
        <div className="text-center text-white/50">
          <Play className="w-12 h-12 mx-auto mb-3 text-white/30" />
          <p className="text-sm font-semibold">Select a song to start playback</p>
        </div>
      </div>
    );
  }

  const { title, artistFromTitle } = cleanTrackTitle(currentTrack.title);
  const displayArtist = artistFromTitle || currentTrack.artist || 'Artist';
  const effectiveDuration = duration > 0 ? duration : currentTrack.durationSec || 240;
  const progressPercent = effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;

  // Fully dynamic attributes — updates automatically on EVERY song change
  const isCustomPlaylist = playlistName && !playlistName.includes('LOVE 2K20') && !playlistName.includes('Current Queue') && !playlistName.includes('Session');
  const headlineTitle = isCustomPlaylist ? playlistName : displayArtist.toUpperCase();
  const headlineCategory = isCustomPlaylist ? 'CURATED PLAYLIST' : 'ARTIST SPOTLIGHT';
  const dynamicCurator = curatorName && !curatorName.includes('Pharrell Williams') ? curatorName : displayArtist;
  const dynamicTag = genreTag && !genreTag.includes('#RELATIONSHIPS')
    ? genreTag
    : getDynamicTrackTag(title, displayArtist, currentTrack.views);
  const dynamicPlaylistLabel = isCustomPlaylist ? playlistName : `${displayArtist} Session`;
  const currentYear = new Date().getFullYear();
  const dynamicCopyright = `© ${currentYear} ${displayArtist} · Streamed via SoundStream Hi-Fi Engine · ${currentTrack.views ? `${currentTrack.views} · ` : ''}24-bit / 48kHz Master`;

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

  const totalMin = Math.round(
    queue.reduce((acc, t) => acc + (t.durationSec || 210), 0) / 60
  );

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* ── 1. CINEMATIC FULL-BLEED BACKGROUND ── */}
      <div
        className="cinematic-backdrop"
        style={{
          backgroundImage: `url(${currentTrack.thumbnail})`,
        }}
      />
      <div className="cinematic-overlay-gradient" />
      <div className="cinematic-vignette" />

      {/* ── 2. AUDIO VISUALIZER LAYER (Optional overlay) ── */}
      {isVisualizerOpen && (
        <div className="absolute inset-x-0 bottom-0 top-1/3 opacity-30 pointer-events-none z-[2]">
          <AudioVisualizer
            isPlaying={isPlaying}
            volume={volume}
            mode={visualizerMode}
            accentColor="#facc15"
            accentSecondary="#ffffff"
          />
        </div>
      )}

      {/* ── 3. VIDEO CONTAINER (Offscreen or Floating/Fullscreen) ── */}
      <div
        className={`transition-all duration-300 ${
          !isVideoVisible
            ? 'fixed -bottom-[9999px] -right-[9999px] w-64 h-36 opacity-0 pointer-events-none'
            : isVideoFullscreen
              ? 'fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4'
              : 'absolute top-6 right-6 md:right-12 w-80 md:w-96 aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/20 z-40 bg-black'
        }`}
        aria-hidden={!isVideoVisible}
      >
        <div className="relative w-full h-full" onClick={onTogglePlay} onDoubleClick={() => setIsVideoFullscreen(!isVideoFullscreen)}>
          {videoSlot}
          {isVideoVisible && (
            <div className="absolute top-3 right-3 flex items-center gap-2 z-50 pointer-events-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVideoFullscreen(!isVideoFullscreen);
                }}
                className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
                title={isVideoFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isVideoFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isVideoFullscreen) setIsVideoFullscreen(false);
                  onToggleVideo();
                }}
                className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all"
                title="Close Video"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── 4. MAIN TWO-COLUMN CINEMATIC CONTENT ── */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between px-6 sm:px-12 lg:px-16 pt-4 pb-8">
        <div className="flex-1 flex flex-col lg:flex-row items-stretch justify-between gap-8 lg:gap-16 min-h-0">

          {/* ══════════════════════════════════════════════════
              LEFT COLUMN: CURATED PLAYLIST (from Reference)
             ══════════════════════════════════════════════════ */}
          <div className="w-full lg:w-[420px] xl:w-[460px] flex flex-col justify-between shrink-0 min-h-0 pt-2 lg:pt-8">
            {/* Header info */}
            <div>
              <p className="font-display tracking-[0.25em] text-xs font-bold uppercase text-white/60 mb-1">
                {headlineCategory}
              </p>
              <h1 className="font-display font-black text-6xl sm:text-7xl lg:text-8xl tracking-tight uppercase text-white leading-none drop-shadow-md truncate">
                {headlineTitle}
              </h1>
            </div>

            {/* Track list (matches reference track items) */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 my-4 pr-2 min-h-0">
              {queue.slice(0, 7).map((track, idx) => {
                const isCurrent = track.id === currentTrack.id;
                const { title: t, artistFromTitle: a } = cleanTrackTitle(track.title);
                const itemArtist = a || track.artist || 'Artist';

                return (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => onPlayTrack?.(track)}
                    className={`ref-track-row group ${isCurrent ? 'ref-track-row active' : ''}`}
                  >
                    {/* Play / Pause / Equalizer indicator */}
                    <div className="w-6 shrink-0 flex items-center justify-center text-white/80 group-hover:text-white">
                      {isCurrent ? (
                        isPlaying ? (
                          <div className="flex items-end gap-0.5 h-3.5">
                            <span className="w-0.5 bg-yellow-400 rounded-full animate-bar-1" />
                            <span className="w-0.5 bg-yellow-400 rounded-full animate-bar-2" />
                            <span className="w-0.5 bg-yellow-400 rounded-full animate-bar-3" />
                          </div>
                        ) : (
                          <Pause className="w-4 h-4 fill-current" />
                        )
                      ) : (
                        <Play className="w-4 h-4 fill-current opacity-70 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>

                    {/* Small square thumbnail */}
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-black/40 shrink-0 border border-white/10 shadow-sm">
                      <img
                        src={track.thumbnail}
                        alt={t}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Title & Artist */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate leading-tight ${isCurrent ? 'text-white' : 'text-white/90'}`}>
                        {t}
                      </p>
                      <p className="text-xs text-white/50 truncate font-normal mt-0.5">
                        {itemArtist}
                      </p>
                    </div>

                    {/* Three dots options */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite();
                      }}
                      className="p-1 rounded-full text-white/40 hover:text-white transition-colors"
                      title="Options"
                      aria-label="Options"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Meta Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-white/50 font-normal">
              <span>
                {queue.length} songs · {totalMin} min
              </span>
              <span>by {dynamicCurator}</span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              RIGHT COLUMN: NOW PLAYING HERO (from Reference)
             ══════════════════════════════════════════════════ */}
          <div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col justify-between shrink-0 pt-2 lg:pt-8">

            {/* Top Right: PLAYLIST Label + Floating Album Art */}
            <div className="flex flex-col items-end">
              <div className="text-right mb-3">
                <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-white/40">
                  PLAYLIST
                </p>
                <p className="text-xs font-medium text-white/70 italic">
                  {dynamicPlaylistLabel}
                </p>
              </div>

              {/* Floating Album Art (High resolution portrait like Adele B&W in ref) */}
              <div className="relative group w-48 sm:w-56 md:w-64 aspect-square rounded-xl overflow-hidden shadow-2xl border border-white/15 bg-black/60">
                <img
                  src={currentTrack.thumbnail}
                  alt={title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Sub-artwork utility buttons (Expand video & Audio visualizer) */}
                <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-3 z-20">
                  <button
                    onClick={onToggleVideo}
                    className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white/80 hover:text-white flex items-center justify-center transition-all hover:scale-105"
                    title={isVideoVisible ? 'Hide Video' : 'Watch Official Video'}
                    aria-label="Toggle Video"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onToggleVisualizer}
                    className={`w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-105 ${
                      isVisualizerOpen ? 'text-yellow-400 border-yellow-400/50' : 'text-white/80 hover:text-white'
                    }`}
                    title="Audio Waves / Visualizer"
                    aria-label="Toggle Visualizer"
                  >
                    <Radio className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Center Right: Song Title + Yellow Genre Tag */}
            <div className="text-right my-auto py-4">
              <h2 className="font-display font-black text-4xl sm:text-5xl lg:text-6xl uppercase tracking-wide text-white leading-none drop-shadow-lg">
                {title}
              </h2>

              {/* Dynamic Genre Tag Badge */}
              <div className="mt-3 flex justify-end">
                <button
                  onClick={onToggleLyrics}
                  className="ref-genre-tag"
                  title="Synchronized lyrics & genre tags"
                >
                  <span>{dynamicTag}</span>
                  <ChevronRight className="w-3 h-3 stroke-[3]" />
                </button>
              </div>
            </div>

            {/* Bottom Right: Scrubber + Controls + Volume + Copyright */}
            <div className="w-full flex flex-col gap-4 mt-auto">

              {/* Synchronized Lyrics Overlay if toggled */}
              {isLyricsOpen && (
                <div className="w-full h-36 rounded-2xl bg-black/75 backdrop-blur-2xl border border-white/15 p-3 overflow-hidden animate-in">
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-white/10">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-yellow-400">
                      Synchronized Lyrics
                    </span>
                    <button
                      onClick={onToggleLyrics}
                      className="text-white/50 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="h-24 overflow-hidden">
                    <LyricsOverlay
                      currentTrack={currentTrack}
                      currentTime={currentTime}
                      onSeek={onSeek}
                      themeConfig={themeConfig}
                      onClose={() => onToggleLyrics?.()}
                    />
                  </div>
                </div>
              )}

              {/* Progress Slider (with white thumb at 2:30/4:45 like reference) */}
              <div className="w-full">
                <input
                  type="range"
                  min={0}
                  max={effectiveDuration || 100}
                  step={0.5}
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="ref-slider"
                  aria-label="Seek track"
                />
                <div className="flex justify-between items-center text-xs font-mono text-white/50 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(effectiveDuration)}</span>
                </div>
              </div>

              {/* Transport Controls (Repeat, Prev, Play/Pause Circle, Next, Shuffle) */}
              <div className="flex items-center justify-between px-2">
                {/* Repeat */}
                <button
                  onClick={onToggleRepeat}
                  className={`ref-icon-btn ${repeatMode !== 'off' ? 'active' : ''}`}
                  title={`Repeat: ${repeatMode}`}
                  aria-label="Repeat"
                >
                  {repeatMode === 'one' ? (
                    <Repeat1 className="w-5 h-5" />
                  ) : (
                    <Repeat className="w-5 h-5" />
                  )}
                </button>

                {/* Prev */}
                <button
                  onClick={onPrev}
                  className="ref-icon-btn"
                  title="Previous Track"
                  aria-label="Previous"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>

                {/* Play / Pause Circular Button */}
                <button
                  onClick={onTogglePlay}
                  className="ref-play-btn"
                  title={isPlaying ? 'Pause' : 'Play'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isBuffering ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                {/* Next */}
                <button
                  onClick={onNext}
                  className="ref-icon-btn"
                  title="Next Track"
                  aria-label="Next"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>

                {/* Shuffle */}
                <button
                  onClick={onToggleShuffle}
                  className={`ref-icon-btn ${isShuffle ? 'active' : ''}`}
                  title="Shuffle"
                  aria-label="Shuffle"
                >
                  <Shuffle className="w-5 h-5" />
                </button>
              </div>

              {/* VOLUME UP Pill Button (Matches Reference) */}
              <div className="flex flex-col items-center justify-center relative mt-1">
                <button
                  onClick={() => setIsVolumePopoverOpen(!isVolumePopoverOpen)}
                  className="volume-pill-btn"
                  title="Adjust Volume"
                >
                  <Volume2 className="w-4 h-4 text-white/80" />
                  <span>VOLUME {isMuted ? 'MUTED' : `${volume}%`}</span>
                </button>

                {/* Volume Slider Popover */}
                {isVolumePopoverOpen && (
                  <div className="absolute bottom-full mb-3 p-3 rounded-2xl bg-black/90 backdrop-blur-2xl border border-white/20 shadow-2xl flex items-center gap-3 w-56 z-50 animate-in">
                    <button onClick={toggleMute} className="text-white/80 hover:text-white">
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-400" />
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
                      className="ref-slider flex-1"
                      aria-label="Volume"
                    />
                    <span className="text-[10px] font-mono text-white/70 w-8 text-right">
                      {isMuted ? '0%' : `${volume}%`}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Copyright / Telemetry (Dynamic based on current track) */}
              <div className="text-right text-[10px] font-mono text-white/30 tracking-tight leading-normal mt-2">
                {dynamicCopyright}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
