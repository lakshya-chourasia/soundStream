import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Track } from '../types/player';

export interface YouTubePlayerHandle {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

interface YouTubePlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  isVideoVisible: boolean;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onStateChange: (isPlaying: boolean, isBuffering: boolean) => void;
  onTrackEnded: () => void;
  onError: (errorMsg: string) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  (
    {
      currentTrack,
      isPlaying,
      volume,
      playbackRate,
      isVideoVisible,
      onTimeUpdate,
      onStateChange,
      onTrackEnded,
      onError,
    },
    ref
  ) => {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isApiReady, setIsApiReady] = useState<boolean>(false);
    const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
    const updateTimerRef = useRef<any>(null);

    // Expose imperative handle for instant seeks and controls
    useImperativeHandle(ref, () => ({
      play: () => {
        if (playerRef.current?.playVideo) {
          playerRef.current.playVideo();
        }
      },
      pause: () => {
        if (playerRef.current?.pauseVideo) {
          playerRef.current.pauseVideo();
        }
      },
      seekTo: (seconds: number) => {
        if (playerRef.current?.seekTo) {
          playerRef.current.seekTo(seconds, true);
        }
      },
      setVolume: (vol: number) => {
        if (playerRef.current?.setVolume) {
          playerRef.current.setVolume(vol);
        }
      },
      setPlaybackRate: (rate: number) => {
        if (playerRef.current?.setPlaybackRate) {
          playerRef.current.setPlaybackRate(rate);
        }
      },
      getCurrentTime: () => {
        return playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
      },
      getDuration: () => {
        return playerRef.current?.getDuration ? playerRef.current.getDuration() : 0;
      },
    }));

    // Step 1: Load YouTube IFrame API script
    useEffect(() => {
      if (window.YT && window.YT.Player) {
        setIsApiReady(true);
        return;
      }

      const existingScript = document.getElementById('youtube-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'youtube-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        setIsApiReady(true);
      };

      // Periodic check in case event already fired
      const interval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          setIsApiReady(true);
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }, []);

    // Step 2: Initialize YouTube Player instance
    useEffect(() => {
      if (!isApiReady || !containerRef.current || playerRef.current) return;

      const elementId = 'youtube-player-element';
      let element = document.getElementById(elementId);
      if (!element) {
        element = document.createElement('div');
        element.id = elementId;
        containerRef.current.appendChild(element);
      }

      try {
        playerRef.current = new window.YT.Player(elementId, {
          height: '100%',
          width: '100%',
          videoId: currentTrack?.id || '',
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 1, // Video controls available in video mode
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            fs: 1,
          },
          events: {
            onReady: (event: any) => {
              setIsPlayerReady(true);
              event.target.setVolume(volume);
              event.target.setPlaybackRate(playbackRate);
              if (isPlaying && currentTrack?.id) {
                event.target.playVideo();
              }
            },
            onStateChange: (event: any) => {
              // YT.PlayerState: -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 video cued
              const state = event.data;
              if (state === 1) {
                // PLAYING
                onStateChange(true, false);
              } else if (state === 2) {
                // PAUSED
                onStateChange(false, false);
              } else if (state === 3) {
                // BUFFERING
                onStateChange(isPlaying, true);
              } else if (state === 0) {
                // ENDED
                onStateChange(false, false);
                onTrackEnded();
              }
            },
            onError: (event: any) => {
              console.warn('YouTube Player error code:', event.data);
              let msg = 'Playback error occurred.';
              if (event.data === 101 || event.data === 150) {
                msg = 'Video playback is restricted by the content owner. Skipping to next track...';
              } else if (event.data === 100) {
                msg = 'Video not found or removed. Skipping to next track...';
              }
              onError(msg);
              // Gracefully advance after brief delay
              setTimeout(() => {
                onTrackEnded();
              }, 1200);
            },
          },
        });
      } catch (err) {
        console.error('Error creating YouTube player:', err);
      }

      return () => {
        if (playerRef.current?.destroy) {
          playerRef.current.destroy();
          playerRef.current = null;
        }
      };
    }, [isApiReady]);

    // Step 3: Handle track changes
    useEffect(() => {
      if (!isPlayerReady || !playerRef.current || !currentTrack) return;

      try {
        if (isPlaying) {
          playerRef.current.loadVideoById({
            videoId: currentTrack.id,
            startSeconds: 0,
          });
        } else {
          playerRef.current.cueVideoById({
            videoId: currentTrack.id,
            startSeconds: 0,
          });
        }
      } catch (err) {
        console.error('Error loading video by ID:', err);
      }
    }, [currentTrack?.id, isPlayerReady]);

    // Step 4: Handle play/pause sync
    useEffect(() => {
      if (!isPlayerReady || !playerRef.current) return;
      try {
        const state = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;
        if (isPlaying && state !== 1 && state !== 3) {
          playerRef.current.playVideo();
        } else if (!isPlaying && state === 1) {
          playerRef.current.pauseVideo();
        }
      } catch (err) {
        console.error('Error syncing play/pause:', err);
      }
    }, [isPlaying, isPlayerReady]);

    // Step 5: Handle volume change
    useEffect(() => {
      if (!isPlayerReady || !playerRef.current) return;
      try {
        playerRef.current.setVolume(volume);
      } catch {}
    }, [volume, isPlayerReady]);

    // Step 6: Handle playback rate change
    useEffect(() => {
      if (!isPlayerReady || !playerRef.current) return;
      try {
        playerRef.current.setPlaybackRate(playbackRate);
      } catch {}
    }, [playbackRate, isPlayerReady]);

    // Step 7: Time update ticker
    useEffect(() => {
      if (!isPlayerReady) return;

      updateTimerRef.current = setInterval(() => {
        if (playerRef.current && playerRef.current.getCurrentTime && playerRef.current.getDuration) {
          try {
            const cur = playerRef.current.getCurrentTime() || 0;
            const dur = playerRef.current.getDuration() || 0;
            onTimeUpdate(cur, dur);
          } catch {}
        }
      }, 250);

      return () => {
        if (updateTimerRef.current) {
          clearInterval(updateTimerRef.current);
        }
      };
    }, [isPlayerReady]);

    return (
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isVideoVisible
            ? 'relative w-full max-w-xl mx-auto aspect-video rounded-xl border border-zinc-800 shadow-2xl bg-black'
            : 'fixed -bottom-[9999px] -right-[9999px] w-64 h-36 opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isVideoVisible}
      >
        <div ref={containerRef} className="w-full h-full" />
      </div>
    );
  }
);

YouTubePlayer.displayName = 'YouTubePlayer';
