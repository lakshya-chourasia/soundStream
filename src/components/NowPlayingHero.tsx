import React, { useState, useEffect, useRef } from 'react';
import { Track, RepeatMode, VisualizerMode, ThemeConfig, StreamQuality, PlayerStyle } from '../types/player';
import { formatTime, cleanTrackTitle, getDynamicTrackTag, getFullSingerName } from '../utils/playerUtils';
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
  Radio,
  X,
  GripHorizontal,
  BookOpen,
  Sparkles,
  ListMusic,
  Plus,
  Film,
} from 'lucide-react';
import { AudioVisualizer } from './AudioVisualizer';
import { LyricsOverlay } from './LyricsOverlay';
import { ArtworkImage } from './ArtworkImage';

interface NowPlayingHeroProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  visualizerMode: VisualizerMode;
  isVideoVisible: boolean;
  themeConfig: ThemeConfig;
  videoSlot?: React.ReactNode;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onChangeVolume: (volume: number) => void;
  onToggleVideo: () => void;
  queue?: Track[];
  onPlayTrack?: (track: Track) => void;
  genreTag?: string;
  isLyricsOpen?: boolean;
  onToggleLyrics?: () => void;
  isVisualizerOpen?: boolean;
  onToggleVisualizer?: () => void;
  recommendations?: Track[];
  isRecommendationsLoading?: boolean;
  onRefreshRecommendations?: () => void;
  onAddToQueue?: (track: Track) => void;
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
  queue = [],
  onPlayTrack,
  genreTag,
  isLyricsOpen = false,
  onToggleLyrics,
  isVisualizerOpen = false,
  onToggleVisualizer,
  recommendations = [],
  isRecommendationsLoading = false,
  onRefreshRecommendations,
  onAddToQueue,
}) => {
  const [leftListTab, setLeftListTab] = useState<'recommendations' | 'queue'>('recommendations');
  const [mobileHeroTab, setMobileHeroTab] = useState<'player' | 'tracklist'>('player');
  const [isVideoFullscreen, setIsVideoFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

  // ── Movable Video Player: Dynamic Sizing & Dragging ──
  const MIN_VIDEO_W = 280;
  const getMaxVideoW = () => Math.min(800, typeof window !== 'undefined' ? window.innerWidth - 30 : 800);

  const [videoWidth, setVideoWidth] = useState<number>(440);
  const [videoPos, setVideoPos] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== 'undefined' ? Math.max(20, window.innerWidth - 480) : 700,
    y: 76,
  }));
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isResizingVideo, setIsResizingVideo] = useState(false);

  const videoDragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });
  const videoResizeStartRef = useRef<{ startX: number; startW: number }>({
    startX: 0,
    startW: 440,
  });

  // ── Movable Synchronized Lyrics: Positioning & Dragging ──
  const [lyricsPos, setLyricsPos] = useState<{ x: number; y: number }>(() => ({
    x: typeof window !== 'undefined' ? Math.max(20, Math.min(80, window.innerWidth - 460)) : 80,
    y: 110,
  }));
  const [lyricsSize, setLyricsSize] = useState<{ w: number; h: number }>({ w: 420, h: 480 });
  const [isDraggingLyrics, setIsDraggingLyrics] = useState(false);
  const [isResizingLyrics, setIsResizingLyrics] = useState(false);

  const lyricsDragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0,
  });
  const lyricsResizeStartRef = useRef<{ startX: number; startY: number; startW: number; startH: number }>({
    startX: 0,
    startY: 0,
    startW: 420,
    startH: 480,
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVideoFullscreen) {
        setIsVideoFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isVideoFullscreen]);

  // ── Video Drag & Resize Handlers ──
  const handleMouseDownVideoDrag = (e: React.MouseEvent) => {
    if (isVideoFullscreen) return;
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setIsDraggingVideo(true);
    videoDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: videoPos.x,
      posY: videoPos.y,
    };
  };

  const handleTouchStartVideoDrag = (e: React.TouchEvent) => {
    if (isVideoFullscreen || e.touches.length === 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDraggingVideo(true);
    const touch = e.touches[0];
    videoDragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      posX: videoPos.x,
      posY: videoPos.y,
    };
  };

  const handleMouseDownVideoResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingVideo(true);
    videoResizeStartRef.current = {
      startX: e.clientX,
      startW: videoWidth,
    };
  };

  const handleTouchStartVideoResize = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 0) return;
    setIsResizingVideo(true);
    videoResizeStartRef.current = {
      startX: e.touches[0].clientX,
      startW: videoWidth,
    };
  };

  // ── Lyrics Drag & Resize Handlers ──
  const handleMouseDownLyricsDrag = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    setIsDraggingLyrics(true);
    lyricsDragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: lyricsPos.x,
      posY: lyricsPos.y,
    };
  };

  const handleTouchStartLyricsDrag = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    setIsDraggingLyrics(true);
    lyricsDragStartRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      posX: lyricsPos.x,
      posY: lyricsPos.y,
    };
  };

  const handleMouseDownLyricsResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingLyrics(true);
    lyricsResizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: lyricsSize.w,
      startH: lyricsSize.h,
    };
  };

  const handleTouchStartLyricsResize = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length === 0) return;
    setIsResizingLyrics(true);
    lyricsResizeStartRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      startW: lyricsSize.w,
      startH: lyricsSize.h,
    };
  };

  // ── Global Drag & Resize Mouse/Touch Listeners ──
  useEffect(() => {
    if (!isDraggingVideo && !isResizingVideo && !isDraggingLyrics && !isResizingLyrics) return;

    const handleMouseMove = (e: MouseEvent) => {
      // 1. Dragging Video
      if (isDraggingVideo) {
        const deltaX = e.clientX - videoDragStartRef.current.startX;
        const deltaY = e.clientY - videoDragStartRef.current.startY;
        const videoH = Math.round((videoWidth * 9) / 16) + 38;
        const maxX = Math.max(10, window.innerWidth - videoWidth - 10);
        const maxY = Math.max(10, window.innerHeight - videoH - 10);

        setVideoPos({
          x: Math.max(10, Math.min(maxX, videoDragStartRef.current.posX + deltaX)),
          y: Math.max(10, Math.min(maxY, videoDragStartRef.current.posY + deltaY)),
        });
      }

      // 2. Resizing Video
      if (isResizingVideo) {
        const deltaX = e.clientX - videoResizeStartRef.current.startX;
        const maxLimit = getMaxVideoW();
        const nextW = Math.max(MIN_VIDEO_W, Math.min(maxLimit, videoResizeStartRef.current.startW + deltaX));
        setVideoWidth(nextW);

        // Adjust position if resizing causes overflow
        setVideoPos((prev) => ({
          ...prev,
          x: Math.min(prev.x, Math.max(10, window.innerWidth - nextW - 10)),
        }));
      }

      // 3. Dragging Lyrics
      if (isDraggingLyrics) {
        const deltaX = e.clientX - lyricsDragStartRef.current.startX;
        const deltaY = e.clientY - lyricsDragStartRef.current.startY;
        const maxX = Math.max(10, window.innerWidth - lyricsSize.w - 10);
        const maxY = Math.max(10, window.innerHeight - lyricsSize.h - 10);

        setLyricsPos({
          x: Math.max(10, Math.min(maxX, lyricsDragStartRef.current.posX + deltaX)),
          y: Math.max(10, Math.min(maxY, lyricsDragStartRef.current.posY + deltaY)),
        });
      }

      // 4. Resizing Lyrics
      if (isResizingLyrics) {
        const deltaX = e.clientX - lyricsResizeStartRef.current.startX;
        const deltaY = e.clientY - lyricsResizeStartRef.current.startY;
        const nextW = Math.max(280, Math.min(680, lyricsResizeStartRef.current.startW + deltaX));
        const nextH = Math.max(260, Math.min(760, lyricsResizeStartRef.current.startH + deltaY));
        setLyricsSize({ w: nextW, h: nextH });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      const touch = e.touches[0];

      if (isDraggingVideo) {
        const deltaX = touch.clientX - videoDragStartRef.current.startX;
        const deltaY = touch.clientY - videoDragStartRef.current.startY;
        const videoH = Math.round((videoWidth * 9) / 16) + 38;
        const maxX = Math.max(10, window.innerWidth - videoWidth - 10);
        const maxY = Math.max(10, window.innerHeight - videoH - 10);

        setVideoPos({
          x: Math.max(10, Math.min(maxX, videoDragStartRef.current.posX + deltaX)),
          y: Math.max(10, Math.min(maxY, videoDragStartRef.current.posY + deltaY)),
        });
      }

      if (isResizingVideo) {
        const deltaX = touch.clientX - videoResizeStartRef.current.startX;
        const maxLimit = getMaxVideoW();
        const nextW = Math.max(MIN_VIDEO_W, Math.min(maxLimit, videoResizeStartRef.current.startW + deltaX));
        setVideoWidth(nextW);
      }

      if (isDraggingLyrics) {
        const deltaX = touch.clientX - lyricsDragStartRef.current.startX;
        const deltaY = touch.clientY - lyricsDragStartRef.current.startY;
        const maxX = Math.max(10, window.innerWidth - lyricsSize.w - 10);
        const maxY = Math.max(10, window.innerHeight - lyricsSize.h - 10);

        setLyricsPos({
          x: Math.max(10, Math.min(maxX, lyricsDragStartRef.current.posX + deltaX)),
          y: Math.max(10, Math.min(maxY, lyricsDragStartRef.current.posY + deltaY)),
        });
      }

      if (isResizingLyrics) {
        const deltaX = touch.clientX - lyricsResizeStartRef.current.startX;
        const deltaY = touch.clientY - lyricsResizeStartRef.current.startY;
        const nextW = Math.max(280, Math.min(680, lyricsResizeStartRef.current.startW + deltaX));
        const nextH = Math.max(260, Math.min(760, lyricsResizeStartRef.current.startH + deltaY));
        setLyricsSize({ w: nextW, h: nextH });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingVideo(false);
      setIsResizingVideo(false);
      setIsDraggingLyrics(false);
      setIsResizingLyrics(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingVideo, isResizingVideo, isDraggingLyrics, isResizingLyrics, videoWidth, lyricsSize]);

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

  // Pure realtime values based on currently playing track
  const { title, artistFromTitle } = cleanTrackTitle(currentTrack.title);
  const rawArtist = currentTrack.artist || artistFromTitle || 'Artist';
  const displayArtist = getFullSingerName(rawArtist, title);
  const effectiveDuration = duration > 0 ? duration : currentTrack.durationSec || 240;
  const headlineTitle = displayArtist.toUpperCase();

  const dynamicTag = genreTag && !genreTag.includes('#RELATIONSHIPS')
    ? genreTag
    : getDynamicTrackTag(title, displayArtist, currentTrack.views);

  const currentYear = new Date().getFullYear();
  const dynamicCopyright = `© ${currentYear} ${displayArtist} · Streamed via Melophile Hi-Fi Engine · ${currentTrack.views ? `${currentTrack.views} · ` : ''}24-bit / 48kHz Master`;

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

  const displayedTracks = leftListTab === 'recommendations'
    ? (recommendations.length > 0 ? recommendations : queue.filter((t) => t.id !== currentTrack.id))
    : queue.slice(0, 8);

  const isInteracting = isDraggingVideo || isResizingVideo || isDraggingLyrics || isResizingLyrics;

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {/* ── 1. CINEMATIC FULL-BLEED BACKGROUND (Updates in Real Time) ── */}
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

      {/* ── 3. FULLSCREEN DRAG/RESIZE TRANSPARENT BACKDROP OVERLAY ── */}
      {isInteracting && (
        <div
          className="fixed inset-0 z-[99999] select-none"
          style={{ cursor: isResizingVideo || isResizingLyrics ? 'se-resize' : 'grabbing' }}
        />
      )}

      {/* ── 4. MOVABLE & RESIZABLE VIDEO PLAYER (Scales up to maximum limit) ── */}
      <div
        className={`transition-shadow ${
          !isVideoVisible
            ? 'fixed -bottom-[9999px] -right-[9999px] w-64 h-36 opacity-0 pointer-events-none'
            : isVideoFullscreen
              ? 'fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4'
              : `fixed rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/20 z-50 bg-black`
        }`}
        style={
          isVideoVisible && !isVideoFullscreen
            ? {
                left: `${videoPos.x}px`,
                top: `${videoPos.y}px`,
                width: `${videoWidth}px`,
              }
            : undefined
        }
        aria-hidden={!isVideoVisible}
      >
        {/* Draggable Header Handle Bar */}
        {isVideoVisible && !isVideoFullscreen && (
          <div
            onMouseDown={handleMouseDownVideoDrag}
            onTouchStart={handleTouchStartVideoDrag}
            className="w-full h-9 px-3 bg-black/90 backdrop-blur-xl border-b border-white/15 flex items-center justify-between cursor-grab active:cursor-grabbing select-none z-50 text-white/80 hover:text-white"
            title="Drag to reposition video player"
          >
            <div className="flex items-center gap-2 pointer-events-none text-white/40">
              <GripHorizontal className="w-4 h-4" />
            </div>

            {/* Window Controls: Close Button Only */}
            <div
              className="flex items-center gap-1.5 z-20"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleVideo();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg hover:bg-rose-500/20 text-white/70 hover:text-rose-400 transition-colors cursor-pointer"
                title="Close Video"
                aria-label="Close Video"
                data-testid="close-video-btn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Video Frame */}
        <div
          className={`relative w-full ${isVideoFullscreen ? 'w-full h-full max-w-5xl aspect-video' : 'aspect-video'}`}
          onClick={onTogglePlay}
          onDoubleClick={() => setIsVideoFullscreen(!isVideoFullscreen)}
        >
          {videoSlot}
          {isVideoVisible && isVideoFullscreen && (
            <div className="absolute top-4 right-4 flex items-center gap-2 z-50 pointer-events-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsVideoFullscreen(false);
                  onToggleVideo();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="p-2 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white hover:bg-rose-500/20 transition-all cursor-pointer"
                title="Close Video"
                aria-label="Close Video"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Corner Resize Handle at Bottom-Right */}
        {isVideoVisible && !isVideoFullscreen && (
          <div
            onMouseDown={handleMouseDownVideoResize}
            onTouchStart={handleTouchStartVideoResize}
            className="absolute bottom-1 right-1 w-5 h-5 cursor-se-resize flex items-center justify-center text-white/40 hover:text-yellow-400 z-50 bg-black/70 rounded-tl-md backdrop-blur-md transition-colors"
            title={`Drag to resize video (Limit: ${getMaxVideoW()}px)`}
          >
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 6 6">
              <path d="M6 6H4v-2h2v2zM6 2H4V0h2v2zM2 6H0v-2h2v2z" />
            </svg>
          </div>
        )}
      </div>

      {/* ── 5. MOVABLE & RESIZABLE SYNCHRONIZED LYRICS CARD ── */}
      {isLyricsOpen && (
        <div
          className="fixed z-40 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] border border-white/20 transition-shadow animate-in"
          style={{
            left: `${lyricsPos.x}px`,
            top: `${lyricsPos.y}px`,
            width: `${lyricsSize.w}px`,
            height: `${lyricsSize.h}px`,
          }}
        >
          <LyricsOverlay
            currentTrack={currentTrack}
            currentTime={currentTime}
            onSeek={onSeek}
            themeConfig={themeConfig}
            onClose={() => onToggleLyrics?.()}
            onMouseDownHeader={handleMouseDownLyricsDrag}
            onTouchStartHeader={handleTouchStartLyricsDrag}
            onMouseDownResize={handleMouseDownLyricsResize}
            onTouchStartResize={handleTouchStartLyricsResize}
          />
        </div>
      )}

      {/* ── 6. MAIN RESPONSIVE CINEMATIC CONTENT ── */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between px-4 sm:px-10 lg:px-16 pt-2 sm:pt-4 pb-6 sm:pb-8">
        {/* Mobile View Tab Switcher (< lg) */}
        <div className="lg:hidden flex items-center justify-center p-1 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 mx-auto mb-3 w-full max-w-xs shrink-0 z-20">
          <button
            data-testid="mobile-nowplaying-btn"
            onClick={() => setMobileHeroTab('player')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mobileHeroTab === 'player'
                ? 'bg-yellow-400 text-black font-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Now Playing
          </button>
          <button
            data-testid="mobile-upnext-btn"
            onClick={() => setMobileHeroTab('tracklist')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
              mobileHeroTab === 'tracklist'
                ? 'bg-yellow-400 text-black font-black shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Up Next ({queue.length})
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row items-stretch justify-between gap-6 lg:gap-16 min-h-0">

          {/* ══════════════════════════════════════════════════
              LEFT COLUMN: NOW PLAYING HEADLINE & TRACKLIST
             ══════════════════════════════════════════════════ */}
          <div className={`w-full lg:w-[420px] xl:w-[460px] flex-col justify-between shrink-0 min-h-0 pt-2 lg:pt-8 ${
            mobileHeroTab === 'tracklist' ? 'flex' : 'hidden lg:flex'
          }`}>
            {/* Header info (Realtime Updates, fluid non-truncated typography) */}
            <div>
              <p className="font-display tracking-[0.25em] text-xs font-bold uppercase text-white/50 mb-1">
                NOW PLAYING
              </p>
              <h1 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl xl:text-5.5xl tracking-tight uppercase text-white leading-[0.95] drop-shadow-md break-words">
                {headlineTitle}
              </h1>
            </div>

            {/* Recommendations & Queue Header Switcher */}
            <div className="flex items-center justify-between mt-3 mb-1.5 px-0.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLeftListTab('recommendations')}
                  className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                    leftListTab === 'recommendations'
                      ? 'bg-yellow-400 text-black font-black shadow-[0_0_12px_rgba(250,204,21,0.35)]'
                      : 'text-white/60 hover:text-white bg-white/10'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>RECOMMENDED</span>
                </button>
                <button
                  onClick={() => setLeftListTab('queue')}
                  className={`text-[10px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 ${
                    leftListTab === 'queue'
                      ? 'bg-yellow-400 text-black font-black shadow-[0_0_12px_rgba(250,204,21,0.35)]'
                      : 'text-white/60 hover:text-white bg-white/10'
                  }`}
                >
                  <ListMusic className="w-3 h-3" />
                  <span>UP NEXT ({queue.length})</span>
                </button>
              </div>

              {leftListTab === 'recommendations' && onRefreshRecommendations && (
                <button
                  onClick={onRefreshRecommendations}
                  disabled={isRecommendationsLoading}
                  className="flex items-center gap-1 text-[10px] font-mono font-bold text-white/50 hover:text-yellow-400 transition-colors px-2 py-0.5 rounded-lg hover:bg-white/10"
                  title="Shuffle fresh random recommendations"
                >
                  <Shuffle className={`w-3 h-3 ${isRecommendationsLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">RANDOMIZE</span>
                </button>
              )}
            </div>

            {/* Track list */}
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-1.5 my-2 pr-2 min-h-0">
              {displayedTracks.map((track, idx) => {
                const isCurrent = track.id === currentTrack.id;
                const { title: t, artistFromTitle: a } = cleanTrackTitle(track.title);
                const rawItemArtist = track.artist || a || 'Artist';
                const itemArtist = getFullSingerName(rawItemArtist, t);

                return (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => {
                      onPlayTrack?.(track);
                      setMobileHeroTab('player');
                    }}
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
                      {/* Album artwork provided by Apple / iTunes Search API */}
                      <ArtworkImage
                        title={t}
                        artist={itemArtist}
                        trackId={track.id}
                        initialSrc={track.thumbnail}
                        alt={t}
                        className="w-full h-full group-hover:scale-105 transition-transform duration-300"
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

                    {/* Quick Add to Queue Button */}
                    {onAddToQueue && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToQueue(track);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-white/20 text-white/60 hover:text-white transition-all shrink-0"
                        title="Add to Up Next queue"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Meta Stats */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs text-white/50 font-normal">
              <span>
                {leftListTab === 'recommendations'
                  ? `${displayedTracks.length} recommendations`
                  : `${queue.length} songs · ${totalMin} min`}
              </span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════
              RIGHT COLUMN: NOW PLAYING HERO / PLAYER CONSOLE
             ══════════════════════════════════════════════════ */}
          <div className={`w-full lg:w-[480px] xl:w-[520px] flex-col justify-between shrink-0 pt-2 lg:pt-8 ${
            mobileHeroTab === 'player' ? 'flex' : 'hidden lg:flex'
          }`}>

            {/* Top / Center: Floating Album Art */}
            <div className="flex flex-col items-center lg:items-end">
              <div className="relative group w-44 sm:w-56 md:w-64 aspect-square rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/15 bg-black/60">
                {/* Album artwork provided by Apple / iTunes Search API */}
                <ArtworkImage
                  title={title}
                  artist={displayArtist}
                  trackId={currentTrack.id}
                  initialSrc={currentTrack.thumbnail}
                  alt={title}
                  priority
                  className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                />

                {/* Sub-artwork utility buttons (Expand video & Audio visualizer & Lyrics) */}
                <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2.5 z-20">
                  <button
                    onClick={onToggleVideo}
                    className={`w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-105 ${
                      isVideoVisible ? 'text-yellow-400 border-yellow-400/50 bg-black/90' : 'text-white/80 hover:text-white'
                    }`}
                    title={isVideoVisible ? 'Hide Video' : 'Open Movable Video'}
                    aria-label="Toggle Video"
                  >
                    <Film className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onToggleVisualizer}
                    className={`w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-105 ${
                      isVisualizerOpen ? 'text-yellow-400 border-yellow-400/50 bg-black/90' : 'text-white/80 hover:text-white'
                    }`}
                    title="Audio Waves / Visualizer"
                    aria-label="Toggle Visualizer"
                  >
                    <Radio className="w-3.5 h-3.5" />
                  </button>
                  {onToggleLyrics && (
                    <button
                      onClick={onToggleLyrics}
                      className={`w-8 h-8 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center transition-all hover:scale-105 ${
                        isLyricsOpen ? 'text-yellow-400 border-yellow-400/50 bg-black/90' : 'text-white/80 hover:text-white'
                      }`}
                      title="Synchronized Lyrics"
                      aria-label="Toggle Lyrics"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Song Title + Artist (All small unwanted text below music name removed) */}
            <div className="text-center lg:text-right my-auto py-3">
              <h2 className="font-display font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-wide text-white leading-tight drop-shadow-lg line-clamp-2">
                {title}
              </h2>
              <p className="text-sm sm:text-base font-semibold text-white/80 mt-1">
                {displayArtist}
              </p>
            </div>

            {/* Bottom: Scrubber + Controls + Inline Volume */}
            <div className="w-full flex flex-col gap-3.5 mt-auto">

              {/* Progress Slider with Colored Line up to the Slider Thumb */}
              <div className="w-full">
                {(() => {
                  const progressPercent = effectiveDuration > 0
                    ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
                    : 0;

                  return (
                    <input
                      type="range"
                      min={0}
                      max={effectiveDuration || 100}
                      step={0.5}
                      value={currentTime}
                      onChange={(e) => onSeek(parseFloat(e.target.value))}
                      className="ref-slider"
                      style={{
                        '--track-bg': `linear-gradient(to right, #facc15 0%, #facc15 ${progressPercent}%, rgba(255, 255, 255, 0.25) ${progressPercent}%, rgba(255, 255, 255, 0.25) 100%)`,
                      } as React.CSSProperties}
                      aria-label="Seek track"
                    />
                  );
                })()}
                <div className="flex justify-between items-center text-xs font-mono text-white/50 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(effectiveDuration)}</span>
                </div>
              </div>

              {/* Transport Controls (Repeat, Prev, Big Circular Play/Pause, Next, Shuffle) */}
              <div className="flex items-center justify-between px-2 sm:px-6">
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

              {/* Inline Volume Control Bar with Colored Line */}
              <div className="flex items-center justify-center gap-3 px-4 py-2 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 max-w-xs mx-auto w-full">
                <button
                  onClick={toggleMute}
                  className="text-white/70 hover:text-white transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
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
                  style={{
                    '--track-bg': `linear-gradient(to right, #facc15 0%, #facc15 ${isMuted ? 0 : volume}%, rgba(255, 255, 255, 0.25) ${isMuted ? 0 : volume}%, rgba(255, 255, 255, 0.25) 100%)`,
                  } as React.CSSProperties}
                  aria-label="Volume"
                />
                <span className="text-[10px] font-mono text-white/70 w-8 text-right">
                  {isMuted ? '0%' : `${volume}%`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
