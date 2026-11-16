import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Track, StreamQuality } from '../types/player';

export interface YouTubePlayerHandle {
  play: () => void;
  pause: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  setPlaybackQuality: (quality: StreamQuality) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  loadTrack: (trackOrId: string | Track, autoPlay?: boolean) => void;
}

interface YouTubePlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  playbackRate: number;
  playbackQuality?: StreamQuality;
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
      playbackQuality = 'auto',
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
    const [isApiReady, setIsApiReady] = useState<boolean>(() => !!(typeof window !== 'undefined' && window.YT && window.YT.Player));
    const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
    const lastLoadedIdRef = useRef<string | null>(null);
    const updateTimerRef = useRef<any>(null);

    // Expose imperative handle for instant seeks and controls
    useImperativeHandle(ref, () => ({
      play: () => {
        try {
          if (playerRef.current?.playVideo) {
            playerRef.current.playVideo();
          }
        } catch (e) {
          console.warn('YouTubePlayer play error:', e);
        }
      },
      pause: () => {
        try {
          if (playerRef.current?.pauseVideo) {
            playerRef.current.pauseVideo();
          }
        } catch (e) {
          console.warn('YouTubePlayer pause error:', e);
        }
      },
      seekTo: (seconds: number) => {
        try {
          if (playerRef.current?.seekTo) {
            playerRef.current.seekTo(seconds, true);
          }
        } catch (e) {
          console.warn('YouTubePlayer seekTo error:', e);
        }
      },
      setVolume: (vol: number) => {
        try {
          if (playerRef.current?.setVolume) {
            playerRef.current.setVolume(vol);
          }
        } catch {}
      },
      setPlaybackRate: (rate: number) => {
        try {
          if (playerRef.current?.setPlaybackRate) {
            playerRef.current.setPlaybackRate(rate);
          }
        } catch {}
      },
      setPlaybackQuality: (quality: StreamQuality) => {
        try {
          if (playerRef.current?.setPlaybackQuality) {
            playerRef.current.setPlaybackQuality(quality);
          }
        } catch {}
      },
      getCurrentTime: () => {
        try {
          return playerRef.current?.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
        } catch {
          return 0;
        }
      },
      getDuration: () => {
        try {
          return playerRef.current?.getDuration ? playerRef.current.getDuration() : 0;
        } catch {
          return 0;
        }
      },
      loadTrack: (trackOrId: string | Track, autoPlay = true) => {
        const id = typeof trackOrId === 'string' ? trackOrId : trackOrId.id;
        lastLoadedIdRef.current = id;
        try {
          if (!playerRef.current) return;
          if (autoPlay && playerRef.current.loadVideoById) {
            playerRef.current.loadVideoById({ videoId: id, startSeconds: 0 });
          } else if (playerRef.current.cueVideoById) {
            playerRef.current.cueVideoById({ videoId: id, startSeconds: 0 });
          }
        } catch (err) {
          console.warn('YouTubePlayer loadTrack error:', err);
        }
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

      const initialVideoId = currentTrack?.id || '8GW6sLrK40k';

      try {
        playerRef.current = new window.YT.Player(elementId, {
          height: '100%',
          width: '100%',
          videoId: initialVideoId,
          playerVars: {
            autoplay: isPlaying ? 1 : 0,
            controls: 0, // Pure video: eliminate YouTube control bar & overlays
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3, // Disable annotations and interactive cards
            disablekb: 1,
            playsinline: 1,
            enablejsapi: 1,
            fs: 0,
            autohide: 1,
            cc_load_policy: 0,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
          events: {
            onReady: (event: any) => {
              setIsPlayerReady(true);
              lastLoadedIdRef.current = initialVideoId;
              try {
                event.target.setVolume(volume);
                event.target.setPlaybackRate(playbackRate);
                if (isPlaying) {
                  event.target.playVideo();
                }
              } catch (e) {
                console.warn('onReady setup error:', e);
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
                onStateChange(true, true);
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
                msg = 'Playback is restricted on this video by the owner. Try another track or open on YouTube.';
              } else if (event.data === 100) {
                msg = 'Video not found or removed. Try another track.';
              } else if (event.data === 2) {
                msg = 'Invalid YouTube video ID.';
              }
              onError(msg);
              onStateChange(false, false);
            },
          },
        });
      } catch (err) {
        console.error('Error creating YouTube player:', err);
      }

      return () => {
        if (playerRef.current?.destroy) {
          try {
            playerRef.current.destroy();
          } catch {}
          playerRef.current = null;
        }
      };
    }, [isApiReady]);

    // Step 3: Handle track changes
    useEffect(() => {
      if (!isPlayerReady || !playerRef.current || !currentTrack?.id) return;
      if (lastLoadedIdRef.current === currentTrack.id) return;

      lastLoadedIdRef.current = currentTrack.id;
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
    }, [currentTrack?.id, isPlayerReady, isPlaying]);

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

    // Step 6.5: Handle playback quality change
    useEffect(() => {
      if (!isPlayerReady || !playerRef.current) return;
      try {
        if (playerRef.current.setPlaybackQuality) {
          playerRef.current.setPlaybackQuality(playbackQuality);
        }
      } catch {}
    }, [playbackQuality, isPlayerReady]);

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
        className="w-full h-full relative overflow-hidden select-none bg-black flex items-center justify-center pointer-events-none"
        aria-hidden={!isVideoVisible}
      >
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center pointer-events-none [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:object-contain"
        />
      </div>
    );
  }
);

YouTubePlayer.displayName = 'YouTubePlayer';
