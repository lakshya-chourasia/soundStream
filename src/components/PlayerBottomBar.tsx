import React, { useState } from 'react';
import { Track, RepeatMode } from '../types/player';
import { formatTime, cleanTrackTitle, getFullSingerName } from '../utils/playerUtils';
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
import { ArtworkImage } from './ArtworkImage';

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
  const [isMuted, setIsMuted] = useState(false);
  const [prevVol, setPrevVol] = useState(volume);

  if (!currentTrack) return null;

  const { title, artistFromTitle } = cleanTrackTitle(currentTrack.title);
  const rawArtist = currentTrack.artist || artistFromTitle || 'YouTube Artist';
  const displayArtist = getFullSingerName(rawArtist, title);
  const effectiveDuration = duration > 0 ? duration : currentTrack.durationSec || 0;
  const progressPercent = effectiveDuration > 0
    ? Math.min(100, (currentTime / effectiveDuration) * 100)
    : 0;

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      onChangeVolume(prevVol || 70);
    } else {
      setPrevVol(volume);
      setIsMuted(true);
      onChangeVolume(0);
    }
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 select-none bg-[#0a0c10]/95 backdrop-blur-2xl border-t border-white/10">
      {/* Progress bar — Spotify dark gray track, white fill, green on hover */}
      <div className="seek-group relative h-1 bg-[#4d4d4d] group cursor-pointer">
        <div
          className="absolute inset-y-0 left-0 bg-white group-hover:bg-[#1db954] transition-colors pointer-events-none rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
        <input
          type="range"
          min={0}
          max={effectiveDuration || 100}
          step={0.5}
          value={currentTime}
          onChange={(e) => onSeek(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          aria-label="Seek"
        />
        {/* Visible thumb on hover */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md"
          style={{ left: `calc(${progressPercent}% - 6px)` }}
        />
      </div>

      {/* Main bar */}
      <div className="flex items-center px-4 h-[72px] gap-2 md:gap-0">

        {/* ── LEFT: Track Info ────────────────────── */}
        <div className="flex items-center gap-3 w-[30%] min-w-0">
          {currentTrack.thumbnail ? (
            <div
              className="relative w-14 h-14 rounded shrink-0 cursor-pointer group overflow-hidden bg-[#282828]"
              onClick={onExpandNowPlaying}
            >
              {/* Album artwork provided by Apple / iTunes Search API */}
              <ArtworkImage
                title={title}
                artist={displayArtist}
                trackId={currentTrack.id}
                initialSrc={currentTrack.thumbnail}
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-14 h-14 rounded bg-[#282828] shrink-0 flex items-center justify-center">
              <svg className="w-5 h-5 text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <button
              onClick={onExpandNowPlaying}
              className="text-left w-full block"
            >
              <p className="text-sm font-semibold text-white truncate hover:underline">
                {title}
              </p>
            </button>
            <p className="text-xs text-zinc-400 truncate mt-0.5">{displayArtist}</p>
          </div>

          <button
            onClick={onToggleFavorite}
            className={`icon-btn w-8 h-8 shrink-0 ${isFavorite ? 'active' : ''}`}
            aria-label={isFavorite ? 'Remove from liked' : 'Save to liked songs'}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* ── CENTER: Controls ─────────────────────── */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1 px-4">
          <div className="flex items-center gap-4 md:gap-5">
            {/* Shuffle */}
            <button
              onClick={onToggleShuffle}
              className={`icon-btn w-8 h-8 ${isShuffle ? 'active' : ''}`}
              aria-label="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            {/* Prev */}
            <button
              onClick={onPrev}
              className="icon-btn w-8 h-8 hover:text-white"
              aria-label="Previous"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Play / Pause */}
            <button
              onClick={onTogglePlay}
              className="play-btn w-8 h-8 md:w-9 md:h-9 shrink-0"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-black text-black" />
              ) : (
                <Play className="w-4 h-4 fill-black text-black ml-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              className="icon-btn w-8 h-8 hover:text-white"
              aria-label="Next"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            {/* Repeat */}
            <button
              onClick={onToggleRepeat}
              className={`icon-btn w-8 h-8 ${repeatMode !== 'off' ? 'active' : ''}`}
              aria-label={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-4 h-4" />
              ) : (
                <Repeat className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Time display (small screens hide this) */}
          <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-zinc-400 tabular-nums">
            <span className="w-8 text-right">{formatTime(currentTime)}</span>
            <span className="text-zinc-600">·</span>
            <span className="w-8">{effectiveDuration > 0 ? formatTime(effectiveDuration) : '–:––'}</span>
          </div>
        </div>

        {/* ── RIGHT: Volume + Toggles ──────────────── */}
        <div className="hidden sm:flex items-center justify-end gap-2 w-[30%]">
          {/* Video */}
          <button
            onClick={onToggleVideo}
            className={`icon-btn w-8 h-8 ${isVideoVisible ? 'active' : ''}`}
            aria-label="Toggle video"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Lyrics */}
          {onToggleLyrics && (
            <button
              onClick={onToggleLyrics}
              className="icon-btn w-8 h-8"
              aria-label="Lyrics"
            >
              <Mic2 className="w-4 h-4" />
            </button>
          )}

          {/* Queue */}
          <button
            onClick={onToggleQueue}
            className="icon-btn w-8 h-8"
            aria-label="Open queue"
          >
            <ListMusic className="w-4 h-4" />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1.5 ml-2">
            <button
              onClick={toggleMute}
              className="icon-btn w-8 h-8"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              <VolumeIcon className="w-4 h-4" />
            </button>
            <div className="seek-group relative flex items-center w-24">
              <div className="w-full h-1 rounded-full bg-[#4d4d4d] overflow-hidden">
                <div
                  className="h-full bg-white group-hover:bg-[#1db954] transition-colors"
                  style={{ width: `${isMuted ? 0 : volume}%` }}
                />
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `calc(${isMuted ? 0 : volume}% - 6px)` }}
              />
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  if (isMuted) setIsMuted(false);
                  onChangeVolume(Number(e.target.value));
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full"
                aria-label="Volume"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
