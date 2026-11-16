import React, { useState } from 'react';
import { Track, RepeatMode } from '../types/player';
import { formatTime, cleanTrackTitle } from '../utils/playerUtils';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  Video,
  Mic2,
  ListMusic,
  Maximize2,
} from 'lucide-react';

interface PlayerBottomBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isFavorite: boolean;
  isVideoVisible: boolean;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (time: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onChangeVolume: (volume: number) => void;
  onToggleFavorite: () => void;
  onToggleVideo: () => void;
  onToggleLyrics?: () => void;
  onExpandNowPlaying: () => void;
  onToggleQueue: () => void;
}

export const PlayerBottomBar: React.FC<PlayerBottomBarProps> = ({
  currentTrack,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  volume,
  repeatMode,
  isShuffle,
  isFavorite,
  isVideoVisible,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  onChangeVolume,
  onToggleFavorite,
  onToggleVideo,
  onToggleLyrics,
  onExpandNowPlaying,
  onToggleQueue,
}) => {
  const [isHoveringSeek, setIsHoveringSeek] = useState(false);
  const [seekHoverPercent, setSeekHoverPercent] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);

  if (!currentTrack) return null;

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

  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-2xl border-t border-white/10 select-none shadow-2xl">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 h-20 md:h-22 flex items-center justify-between gap-4">
        {/* Left: Track Thumbnail, Title, Artist, and Favorite */}
        <div className="flex items-center gap-3.5 min-w-0 w-1/4 max-w-xs shrink-0">
          <div
            onClick={onExpandNowPlaying}
            className="group relative w-12 h-12 md:w-13 md:h-13 rounded-xl overflow-hidden cursor-pointer shadow-md shrink-0 border border-white/10 bg-black"
          >
            <img
              src={currentTrack.thumbnail}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Maximize2 className="w-4 h-4 text-white drop-shadow-md" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <button
              onClick={onExpandNowPlaying}
              className="text-left w-full focus:outline-none block"
            >
              <h4 className="text-xs md:text-sm font-bold text-white truncate hover:underline transition-colors">
                {title}
              </h4>
            </button>
            <p className="text-[11px] md:text-xs font-normal text-zinc-400 truncate mt-0.5">
              {displayArtist}
            </p>
          </div>

          <button
            onClick={onToggleFavorite}
            className={`p-1.5 rounded-full transition-colors shrink-0 ${
              isFavorite
                ? 'text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                : 'text-zinc-500 hover:text-white'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-label="Favorite"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Center: Main Controls & Scrubber */}
        <div className="flex-1 max-w-2xl flex flex-col items-center justify-center gap-1 px-2">
          {/* Buttons Row */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Shuffle */}
            <button
              onClick={onToggleShuffle}
              className={`p-1.5 rounded-full transition-colors ${
                isShuffle ? 'text-white font-bold' : 'text-zinc-500 hover:text-white'
              }`}
              title="Shuffle"
              aria-label="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Prev */}
            <button
              onClick={onPrev}
              className="codepen-btn-circle w-8 h-8 md:w-9 md:h-9 rounded-full text-zinc-300 hover:text-white"
              title="Previous Track"
              aria-label="Previous"
            >
              <SkipBack className="w-4 h-4 fill-white" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={onTogglePlay}
              className="codepen-btn-circle w-11 h-11 md:w-12 md:h-12 rounded-full text-white shadow-lg bg-white/10 hover:bg-white/20 border border-white/20"
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-white" />
              ) : (
                <Play className="w-5 h-5 fill-white ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              className="codepen-btn-circle w-8 h-8 md:w-9 md:h-9 rounded-full text-zinc-300 hover:text-white"
              title="Next Track"
              aria-label="Next"
            >
              <SkipForward className="w-4 h-4 fill-white" />
            </button>

            {/* Repeat */}
            <button
              onClick={onToggleRepeat}
              className={`p-1.5 rounded-full transition-colors ${
                repeatMode !== 'off'
                  ? 'text-white font-bold'
                  : 'text-zinc-500 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
              aria-label="Repeat"
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Scrubber Progress Row */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[10px] font-mono tabular-nums text-zinc-500 w-9 text-right">
              {formatTime(currentTime)}
            </span>

            <div className="flex-1 relative group/seek">
              <input
                type="range"
                min={0}
                max={effectiveDuration || 100}
                step={0.5}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                onMouseEnter={() => setIsHoveringSeek(true)}
                onMouseLeave={() => setIsHoveringSeek(false)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percent = (e.clientX - rect.left) / rect.width;
                  setSeekHoverPercent(Math.max(0, Math.min(1, percent)));
                }}
                style={{
                  background: `linear-gradient(to right, #ffffff 0%, #ffffff ${progressPercent}%, rgba(255, 255, 255, 0.15) ${progressPercent}%)`,
                }}
                className="w-full h-1 rounded-full appearance-none cursor-pointer group-hover/seek:h-1.5 transition-all"
                aria-label="Seek track"
              />
              {isHoveringSeek && effectiveDuration > 0 && (
                <div
                  className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-black border border-white/20 text-[10px] font-mono text-white pointer-events-none shadow-md"
                  style={{ left: `${seekHoverPercent * 100}%` }}
                >
                  {formatTime(seekHoverPercent * effectiveDuration)}
                </div>
              )}
            </div>

            <span className="text-[10px] font-mono tabular-nums text-zinc-500 w-9">
              {effectiveDuration > 0 ? formatTime(effectiveDuration) : 'Live'}
            </span>
          </div>
        </div>

        {/* Right: Video, Lyrics, Queue, Volume */}
        <div className="hidden sm:flex items-center justify-end gap-3 w-1/4 max-w-xs shrink-0 text-zinc-400">
          {/* Watch Video Toggle */}
          <button
            onClick={onToggleVideo}
            className={`p-2 rounded-xl transition-all ${
              isVideoVisible
                ? 'bg-white/15 text-white border border-white/20'
                : 'hover:text-white hover:bg-white/[0.05]'
            }`}
            title={isVideoVisible ? 'Hide Video' : 'Watch Video'}
            aria-label="Toggle Video"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Synchronized Lyrics Toggle */}
          {onToggleLyrics && (
            <button
              onClick={onToggleLyrics}
              className="p-2 rounded-xl hover:text-white hover:bg-white/[0.05] transition-all"
              title="Lyrics"
              aria-label="Lyrics"
            >
              <Mic2 className="w-4 h-4" />
            </button>
          )}

          {/* Queue Drawer Toggle */}
          <button
            onClick={onToggleQueue}
            className="p-2 rounded-xl hover:text-white hover:bg-white/[0.05] transition-all"
            title="Open Queue"
            aria-label="Queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <button
              onClick={toggleMute}
              className="hover:text-white transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-zinc-500" />
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
              className="w-18 md:w-24 h-1 appearance-none cursor-pointer accent-white bg-white/20 rounded-full"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
