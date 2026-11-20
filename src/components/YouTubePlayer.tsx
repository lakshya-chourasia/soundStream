import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import { Track, StreamQuality } from '../types/player';

export interface YouTubePlayerHandle {
  play: () => void;
  pause: () => void;
  forceBackgroundResume: () => void;
  isActuallyPlaying: () => boolean;
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
  fadeDurationMs?: number;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onStateChange: (isPlaying: boolean, isBuffering: boolean) => void;
  onTrackEnded: () => void;
  onError: (errorMsg: string) => void;
  onPlaybackRestricted?: (track: Track, errorCode: number) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

const DEFAULT_FADE_MS = 500; // Smooth 0.5s audio fade in/out when foregrounded

export const YouTubePlayer = forwardRef<YouTubePlayerHandle, YouTubePlayerProps>(
  (
    {
      currentTrack,
      isPlaying,
      volume,
      playbackRate,
      playbackQuality = 'auto',
      isVideoVisible,
      fadeDurationMs = DEFAULT_FADE_MS,
      onTimeUpdate,
      onStateChange,
      onTrackEnded,
      onError,
      onPlaybackRestricted,
    },
    ref
  ) => {
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isApiReady, setIsApiReady] = useState<boolean>(
      () => !!(typeof window !== 'undefined' && window.YT && window.YT.Player)
    );
    const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);

    const lastLoadedIdRef = useRef<string | null>(null);
    const updateTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Always-fresh refs for callbacks & current props (prevents stale YT event closures)
    const currentTrackRef = useRef<Track | null>(currentTrack);
    currentTrackRef.current = currentTrack;

    const isPlayingPropRef = useRef<boolean>(isPlaying);
    isPlayingPropRef.current = isPlaying;

    const targetVolumeRef = useRef<number>(volume);
    targetVolumeRef.current = volume;

    const playbackQualityRef = useRef<StreamQuality>(playbackQuality);
    playbackQualityRef.current = playbackQuality;

    const fadeMsRef = useRef<number>(fadeDurationMs);
    fadeMsRef.current = fadeDurationMs;

    const callbacksRef = useRef({
      onTimeUpdate,
      onStateChange,
      onTrackEnded,
      onError,
      onPlaybackRestricted,
    });
    callbacksRef.current = {
      onTimeUpdate,
      onStateChange,
      onTrackEnded,
      onError,
      onPlaybackRestricted,
    };

    // Smooth audio fade & Android background resilience state
    const appliedVolumeRef = useRef<number>(volume);
    const fadeRafRef = useRef<number | null>(null);
    const fadeModeRef = useRef<'idle' | 'fading-in' | 'fading-out'>('idle');
    const transitionTokenRef = useRef<number>(0);
    const pendingFadeInRef = useRef<boolean>(false);
    const endFadeTriggeredForIdRef = useRef<string | null>(null);
    const isSoftPausingRef = useRef<boolean>(false);
    const isSwitchingTrackRef = useRef<boolean>(false);

    // Tracks explicit user playback intent vs. involuntary Android background pause
    const userIntentPlayingRef = useRef<boolean>(isPlaying);
    const bgPauseRecoveryCountRef = useRef<number>(0);
    const activeFadeFlushRef = useRef<(() => void) | null>(null);

    const isDocumentHidden = () => typeof document !== 'undefined' && document.hidden;

    const applyRawVolume = useCallback((vol: number) => {
      const clamped = Math.max(0, Math.min(100, Math.round(vol)));
      appliedVolumeRef.current = clamped;
      try {
        if (playerRef.current?.setVolume) {
          playerRef.current.setVolume(clamped);
        }
      } catch {}
    }, []);

    const cancelActiveFade = useCallback(() => {
      if (fadeRafRef.current !== null) {
        cancelAnimationFrame(fadeRafRef.current);
        fadeRafRef.current = null;
      }
      activeFadeFlushRef.current = null;
      fadeModeRef.current = 'idle';
      isSoftPausingRef.current = false;
    }, []);

    /**
     * Smooth cosine-eased audio volume ramp over durationMs (default 500ms) when foregrounded.
     * When backgrounded (document.hidden === true on Android), skips rAF completely so
     * track switching, auto-next, and lock-screen controls NEVER freeze or mute!
     */
    const rampVolume = useCallback(
      (
        mode: 'fading-in' | 'fading-out',
        fromVol: number,
        toVol: number | 'target',
        durationMs: number,
        token: number,
        onComplete?: () => void
      ) => {
        if (fadeRafRef.current !== null) {
          cancelAnimationFrame(fadeRafRef.current);
          fadeRafRef.current = null;
        }
        activeFadeFlushRef.current = null;

        const resolvedEnd = () => (toVol === 'target' ? targetVolumeRef.current : toVol);
        const startVol = Math.max(0, Math.min(100, fromVol));

        // Backgrounded / screen-off OR very short fade: complete synchronously (rAF is throttled to 0 FPS!)
        if (isDocumentHidden() || durationMs <= 16 || Math.abs(resolvedEnd() - startVol) < 1) {
          fadeModeRef.current = 'idle';
          applyRawVolume(resolvedEnd());
          if (transitionTokenRef.current === token) {
            onComplete?.();
          }
          return;
        }

        fadeModeRef.current = mode;
        const startTime = performance.now();

        // Allow immediate flush if user locks Android screen mid-fade
        activeFadeFlushRef.current = () => {
          if (fadeRafRef.current !== null) {
            cancelAnimationFrame(fadeRafRef.current);
            fadeRafRef.current = null;
          }
          activeFadeFlushRef.current = null;
          fadeModeRef.current = 'idle';
          applyRawVolume(resolvedEnd());
          if (transitionTokenRef.current === token) {
            onComplete?.();
          }
        };

        const step = (now: number) => {
          if (transitionTokenRef.current !== token) {
            fadeRafRef.current = null;
            activeFadeFlushRef.current = null;
            return;
          }

          const progress = Math.min(1, (now - startTime) / durationMs);
          const eased = 0.5 - 0.5 * Math.cos(Math.PI * progress);
          const endVol = resolvedEnd();
          const nextVol = startVol + (endVol - startVol) * eased;

          applyRawVolume(nextVol);

          if (progress < 1) {
            fadeRafRef.current = requestAnimationFrame(step);
          } else {
            fadeRafRef.current = null;
            activeFadeFlushRef.current = null;
            fadeModeRef.current = 'idle';
            applyRawVolume(endVol);
            onComplete?.();
          }
        };

        fadeRafRef.current = requestAnimationFrame(step);
      },
      [applyRawVolume]
    );

    // Flush any in-flight rAF fade the instant the Android screen locks or app backgrounds
    useEffect(() => {
      if (typeof document === 'undefined') return;
      const handleVisibility = () => {
        if (document.hidden) {
          if (activeFadeFlushRef.current) {
            activeFadeFlushRef.current();
          }
          if (userIntentPlayingRef.current && appliedVolumeRef.current < targetVolumeRef.current) {
            applyRawVolume(targetVolumeRef.current);
          }
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
      return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [applyRawVolume]);

    /**
     * Direct background resume used by Android visibility watchdog & involuntary-pause recovery.
     * Ensures full target volume immediately without rAF fade-from-zero glitches.
     */
    const forceBackgroundResume = useCallback(() => {
      if (!playerRef.current?.playVideo || !userIntentPlayingRef.current) return;
      try {
        cancelActiveFade();
        pendingFadeInRef.current = false;
        applyRawVolume(targetVolumeRef.current);
        const state = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;
        if (state !== 1 && state !== 3) {
          playerRef.current.playVideo();
        }
      } catch {}
    }, [applyRawVolume, cancelActiveFade]);

    const smoothPlay = useCallback(() => {
      if (!playerRef.current?.playVideo) return;
      userIntentPlayingRef.current = true;
      bgPauseRecoveryCountRef.current = 0;
      const token = ++transitionTokenRef.current;
      isSoftPausingRef.current = false;

      try {
        const state = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;
        if (isDocumentHidden()) {
          // Screen-off / lock-screen Play: resume immediately at full target volume
          cancelActiveFade();
          pendingFadeInRef.current = false;
          applyRawVolume(targetVolumeRef.current);
          if (state !== 1) {
            playerRef.current.playVideo();
          }
          return;
        }

        if (state === 1) {
          const ratio =
            targetVolumeRef.current > 0
              ? Math.max(0.2, 1 - appliedVolumeRef.current / targetVolumeRef.current)
              : 0;
          rampVolume('fading-in', appliedVolumeRef.current, 'target', fadeMsRef.current * ratio, token);
        } else {
          applyRawVolume(0);
          pendingFadeInRef.current = true;
          playerRef.current.playVideo();
        }
      } catch (e) {
        console.warn('YouTubePlayer smoothPlay error:', e);
      }
    }, [applyRawVolume, cancelActiveFade, rampVolume]);

    const smoothPause = useCallback(() => {
      userIntentPlayingRef.current = false;
      bgPauseRecoveryCountRef.current = 0;
      if (!playerRef.current?.pauseVideo) return;
      const state = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;

      if (state !== 1 || isDocumentHidden()) {
        cancelActiveFade();
        pendingFadeInRef.current = false;
        try {
          playerRef.current.pauseVideo();
        } catch {}
        return;
      }

      if (isSoftPausingRef.current) return;
      const token = ++transitionTokenRef.current;
      isSoftPausingRef.current = true;
      pendingFadeInRef.current = false;

      const currentVol = appliedVolumeRef.current;
      const targetVol = Math.max(1, targetVolumeRef.current);
      const proportionalMs = Math.max(80, Math.round(fadeMsRef.current * Math.min(1, currentVol / targetVol)));

      rampVolume('fading-out', currentVol, 0, proportionalMs, token, () => {
        isSoftPausingRef.current = false;
        try {
          playerRef.current?.pauseVideo?.();
        } catch (e) {
          console.warn('YouTubePlayer smoothPause error:', e);
        }
      });
    }, [cancelActiveFade, rampVolume]);

    const smoothSwitchTrack = useCallback(
      (nextVideoId: string, autoPlay: boolean) => {
        if (!playerRef.current) return;
        userIntentPlayingRef.current = autoPlay;
        bgPauseRecoveryCountRef.current = 0;
        const token = ++transitionTokenRef.current;
        isSoftPausingRef.current = false;
        isSwitchingTrackRef.current = true;
        endFadeTriggeredForIdRef.current = null;
        lastLoadedIdRef.current = nextVideoId;

        const quality = playbackQualityRef.current || 'hd1080';

        const performLoad = () => {
          if (transitionTokenRef.current !== token || !playerRef.current) return;
          isSwitchingTrackRef.current = false;
          try {
            const hidden = isDocumentHidden();
            if (autoPlay && playerRef.current.loadVideoById) {
              if (hidden) {
                // Background / screen-off track switch: load at full volume immediately
                pendingFadeInRef.current = false;
                applyRawVolume(targetVolumeRef.current);
              } else {
                // Foreground switch: fade in smoothly over 0.5s when PLAYING fires
                applyRawVolume(0);
                pendingFadeInRef.current = true;
              }
              playerRef.current.loadVideoById({
                videoId: nextVideoId,
                startSeconds: 0,
                suggestedQuality: quality,
              });
            } else if (playerRef.current.cueVideoById) {
              pendingFadeInRef.current = false;
              applyRawVolume(targetVolumeRef.current);
              playerRef.current.cueVideoById({
                videoId: nextVideoId,
                startSeconds: 0,
                suggestedQuality: quality,
              });
            }
            if (playerRef.current.setPlaybackQuality) {
              playerRef.current.setPlaybackQuality(quality);
            }
          } catch (err) {
            console.error('Error loading video by ID:', err);
          }
        };

        let playerState = -1;
        try {
          playerState = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;
        } catch {}

        // Only fade out via rAF when foregrounded; in background switch immediately so playback never stalls
        if (!isDocumentHidden() && autoPlay && playerState === 1 && appliedVolumeRef.current > 1) {
          const baseVol = Math.max(1, targetVolumeRef.current);
          const ratio = Math.min(1, appliedVolumeRef.current / baseVol);
          const fadeOutDuration = Math.max(100, Math.round(fadeMsRef.current * ratio));
          rampVolume('fading-out', appliedVolumeRef.current, 0, fadeOutDuration, token, performLoad);
        } else {
          cancelActiveFade();
          performLoad();
        }
      },
      [applyRawVolume, cancelActiveFade, rampVolume]
    );

    // Expose imperative handle for instant seeks, smooth controls, and Android background watchdog
    useImperativeHandle(
      ref,
      () => ({
        play: () => smoothPlay(),
        pause: () => smoothPause(),
        forceBackgroundResume: () => forceBackgroundResume(),
        isActuallyPlaying: () => {
          try {
            const st = playerRef.current?.getPlayerState ? playerRef.current.getPlayerState() : -1;
            return st === 1 || st === 3;
          } catch {
            return false;
          }
        },
        seekTo: (seconds: number) => {
          try {
            if (playerRef.current?.seekTo) {
              endFadeTriggeredForIdRef.current = null;
              playerRef.current.seekTo(seconds, true);
            }
          } catch (e) {
            console.warn('YouTubePlayer seekTo error:', e);
          }
        },
        setVolume: (vol: number) => {
          targetVolumeRef.current = vol;
          if (fadeModeRef.current !== 'fading-out') {
            applyRawVolume(vol);
          }
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
          smoothSwitchTrack(id, autoPlay);
        },
      }),
      [applyRawVolume, forceBackgroundResume, smoothPause, smoothPlay, smoothSwitchTrack]
    );

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

      const interval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          setIsApiReady(true);
          clearInterval(interval);
        }
      }, 100);

      return () => clearInterval(interval);
    }, []);

    // Step 2: Initialize YouTube Player instance (zero-unmount architecture)
    useEffect(() => {
      if (!isApiReady || !containerRef.current || playerRef.current) return;

      const elementId = 'youtube-player-element';
      let element = document.getElementById(elementId);
      if (!element) {
        element = document.createElement('div');
        element.id = elementId;
        containerRef.current.appendChild(element);
      }

      const initialVideoId = currentTrackRef.current?.id || '8GW6sLrK40k';

      try {
        playerRef.current = new window.YT.Player(elementId, {
          height: '100%',
          width: '100%',
          videoId: initialVideoId,
          playerVars: {
            autoplay: isPlayingPropRef.current ? 1 : 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
            fs: 0,
            autohide: 1,
            cc_load_policy: 0,
          },
          events: {
            onReady: (event: any) => {
              setIsPlayerReady(true);
              lastLoadedIdRef.current = initialVideoId;
              try {
                // Ensure the underlying iframe carries full Android media permissions
                const iframe = event.target.getIframe?.();
                if (iframe) {
                  iframe.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture');
                  iframe.setAttribute('playsinline', '1');
                }
                applyRawVolume(
                  isPlayingPropRef.current && !isDocumentHidden() ? 0 : targetVolumeRef.current
                );
                event.target.setPlaybackRate(playbackRate);
                if (event.target.setPlaybackQuality) {
                  event.target.setPlaybackQuality(playbackQualityRef.current || 'hd1080');
                }
                if (isPlayingPropRef.current) {
                  userIntentPlayingRef.current = true;
                  pendingFadeInRef.current = !isDocumentHidden();
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
                bgPauseRecoveryCountRef.current = 0;
                if (isDocumentHidden()) {
                  pendingFadeInRef.current = false;
                  applyRawVolume(targetVolumeRef.current);
                } else if (pendingFadeInRef.current || appliedVolumeRef.current < targetVolumeRef.current) {
                  pendingFadeInRef.current = false;
                  const token = ++transitionTokenRef.current;
                  rampVolume('fading-in', appliedVolumeRef.current, 'target', fadeMsRef.current, token);
                }
                callbacksRef.current.onStateChange(true, false);
              } else if (state === 2) {
                // PAUSED
                if (isDocumentHidden() && userIntentPlayingRef.current && !isSoftPausingRef.current) {
                  // Android Chrome forcibly paused the hidden iframe — fight back and keep MediaSession alive!
                  if (bgPauseRecoveryCountRef.current < 8) {
                    bgPauseRecoveryCountRef.current += 1;
                    const attempt = bgPauseRecoveryCountRef.current;
                    const delay = attempt === 1 ? 60 : attempt === 2 ? 200 : 500;
                    window.setTimeout(() => {
                      if (userIntentPlayingRef.current) {
                        try {
                          applyRawVolume(targetVolumeRef.current);
                          playerRef.current?.playVideo?.();
                        } catch {}
                      }
                    }, delay);
                  }
                  return;
                }
                if (!isSoftPausingRef.current) {
                  callbacksRef.current.onStateChange(false, false);
                }
              } else if (state === 3) {
                // BUFFERING
                callbacksRef.current.onStateChange(true, true);
              } else if (state === 0) {
                // ENDED — works reliably even when Android screen is locked
                cancelActiveFade();
                if (!isDocumentHidden()) {
                  callbacksRef.current.onStateChange(false, false);
                }
                callbacksRef.current.onTrackEnded();
              }
            },
            onError: (event: any) => {
              const activeTrack = currentTrackRef.current;
              console.warn('YouTube Player error code:', event.data, 'for video:', activeTrack?.id);
              cancelActiveFade();
              if (event.data === 101 || event.data === 150 || event.data === 100) {
                if (activeTrack && callbacksRef.current.onPlaybackRestricted) {
                  callbacksRef.current.onPlaybackRestricted(activeTrack, event.data);
                  return;
                }
              }
              let msg = 'Playback error occurred.';
              if (event.data === 101 || event.data === 150) {
                msg = 'Playback restricted on this video by the owner.';
              } else if (event.data === 100) {
                msg = 'Video not found or removed.';
              } else if (event.data === 2) {
                msg = 'Invalid YouTube video ID.';
              }
              callbacksRef.current.onError(msg);
              callbacksRef.current.onStateChange(false, false);
            },
          },
        });
      } catch (err) {
        console.error('Error creating YouTube player:', err);
      }

      return () => {
        cancelActiveFade();
        if (playerRef.current?.destroy) {
          try {
            playerRef.current.destroy();
          } catch {}
          playerRef.current = null;
        }
      };
    }, [isApiReady, applyRawVolume, cancelActiveFade, rampVolume]);

    // Step 3: Smooth 0.5s fade-out -> switch -> 0.5s fade-in on track change (instant in background)
    useEffect(() => {
      if (!isPlayerReady || !playerRef.current || !currentTrack?.id) return;
      if (lastLoadedIdRef.current === currentTrack.id) return;
      smoothSwitchTrack(currentTrack.id, isPlayingPropRef.current);
    }, [currentTrack?.id, isPlayerReady, smoothSwitchTrack]);

    // Step 4: Smooth 0.5s play/pause sync (skip while track-switch fade-out is in progress)
    useEffect(() => {
      userIntentPlayingRef.current = isPlaying;
      if (!isPlayerReady || !playerRef.current || isSwitchingTrackRef.current) return;
      try {
        const state = playerRef.current.getPlayerState ? playerRef.current.getPlayerState() : -1;
        if (isPlaying && state !== 1 && state !== 3 && !pendingFadeInRef.current) {
          smoothPlay();
        } else if (!isPlaying && state === 1 && !isSoftPausingRef.current) {
          smoothPause();
        }
      } catch (err) {
        console.error('Error syncing play/pause:', err);
      }
    }, [isPlaying, isPlayerReady, smoothPause, smoothPlay]);

    // Step 5: Live volume slider sync (never fights active fade-out)
    useEffect(() => {
      if (!isPlayerReady || !playerRef.current) return;
      if (fadeModeRef.current === 'idle') {
        applyRawVolume(volume);
      }
    }, [volume, isPlayerReady, applyRawVolume]);

    // Step 6: Playback rate change
    useEffect(() => {
      if (!isPlayerReady || !playerRef.current) return;
      try {
        playerRef.current.setPlaybackRate(playbackRate);
      } catch {}
    }, [playbackRate, isPlayerReady]);

    // Step 6.5: Playback quality change
    useEffect(() => {
      if (!isPlayerReady || !playerRef.current) return;
      try {
        if (playerRef.current.setPlaybackQuality) {
          playerRef.current.setPlaybackQuality(playbackQuality);
        }
      } catch {}
    }, [playbackQuality, isPlayerReady]);

    // Step 7: Time update ticker + foreground smooth 0.5s end-of-track pre-fade
    useEffect(() => {
      if (!isPlayerReady) return;

      updateTimerRef.current = setInterval(() => {
        if (playerRef.current?.getCurrentTime && playerRef.current?.getDuration) {
          try {
            const cur = playerRef.current.getCurrentTime() || 0;
            const dur = playerRef.current.getDuration() || 0;
            callbacksRef.current.onTimeUpdate(cur, dur);

            // Smooth 0.5s end-of-song fade-out when foregrounded (skipped when hidden so background track switch stays crisp)
            const activeId = currentTrackRef.current?.id;
            const remaining = dur - cur;
            if (
              !isDocumentHidden() &&
              activeId &&
              dur > 6 &&
              remaining > 0.05 &&
              remaining <= fadeMsRef.current / 1000 + 0.12 &&
              isPlayingPropRef.current &&
              fadeModeRef.current === 'idle' &&
              endFadeTriggeredForIdRef.current !== activeId
            ) {
              endFadeTriggeredForIdRef.current = activeId;
              const token = ++transitionTokenRef.current;
              rampVolume(
                'fading-out',
                appliedVolumeRef.current,
                0,
                Math.max(120, Math.round(remaining * 1000)),
                token
              );
            }
          } catch {}
        }
      }, 150);

      return () => {
        if (updateTimerRef.current) {
          clearInterval(updateTimerRef.current);
          updateTimerRef.current = null;
        }
      };
    }, [isPlayerReady, rampVolume]);

    return (
      <div
        className="w-full h-full relative overflow-hidden select-none bg-black flex items-center justify-center pointer-events-none"
        aria-hidden={!isVideoVisible}
      >
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center pointer-events-none scale-[1.45] origin-[50%_46%] [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:object-cover"
        />
      </div>
    );
  }
);

YouTubePlayer.displayName = 'YouTubePlayer';
