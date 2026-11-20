/**
 * Melophile Full Android Background Audio Engine
 *
 * Ensures uninterrupted background, screen-off, and lock-screen playback on Android:
 * 1. Real 30-second non-silent 16-bit PCM WAV Blob mounted as a DOM <audio> element
 *    (exceeds Chromium's 5s MediaSession threshold & silence detector so Android OS
 *    promotes the tab/PWA to a foreground media service with full Audio Focus).
 * 2. Web Locks API keepalive lock while playing so Android Chrome's Tab Freezer
 *    does not suspend or discard the page in the background.
 * 3. Decoupled Android MediaSession API (metadata, playbackState, throttled positionState,
 *    and lock-screen / Bluetooth / notification shade hardware action handlers).
 * 4. Visibility & background watchdog recovery that detects and counters involuntary
 *    mobile browser pauses when the screen turns off or the user switches apps.
 */

export interface MediaSessionMetadataInput {
  title: string;
  artist: string;
  album?: string;
  artwork?: string;
}

export interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
  onStop?: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
}

export interface BackgroundPlayerBridge {
  isActuallyPlaying: () => boolean;
  forceBackgroundResume: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
}

/**
 * Generates a valid 30-second mono 16-bit PCM WAV Blob URL containing an
 * imperceptible sub-audible 18 Hz dithered carrier (~ -67 dBFS at volume 0.02).
 * Satisfies Android Chromium's >= 5s duration & non-silent audio checks for
 * persistent OS MediaSession and Audio Focus ownership.
 */
function createKeepaliveWavUrl(durationSec = 30, sampleRate = 8000): string | null {
  try {
    const numSamples = durationSec * sampleRate;
    const dataByteLength = numSamples * 2;
    const buffer = new ArrayBuffer(44 + dataByteLength);
    const view = new DataView(buffer);

    const writeStr = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeStr(0, 'RIFF');
    view.setUint32(4, 36 + dataByteLength, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // 16-bit samples
    writeStr(36, 'data');
    view.setUint32(40, dataByteLength, true);

    // Imperceptible 18 Hz sub-audible carrier (amplitude 18 out of 32767)
    const freq = 18;
    const twoPiF = 2 * Math.PI * freq;
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.round(Math.sin((twoPiF * i) / sampleRate) * 18);
      view.setInt16(44 + i * 2, sample, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('[BackgroundAudio] WAV carrier generation failed:', err);
    return null;
  }
}

class BackgroundAudioService {
  private anchorAudio: HTMLAudioElement | null = null;
  private anchorBlobUrl: string | null = null;
  private audioContext: AudioContext | null = null;
  private isArmed = false;
  private shouldBePlaying = false;

  private bridge: BackgroundPlayerBridge | null = null;
  private handlers: MediaSessionHandlers | null = null;
  private handlersBound = false;

  private lastMetadataKey = '';
  private lastPositionSyncMs = 0;
  private recoveryTimeouts: number[] = [];
  private backgroundWatchdogId: number | null = null;

  // Web Locks keepalive so Android Chrome does not freeze the tab while playing
  private releaseWebLock: (() => void) | null = null;
  private webLockActive = false;

  // Optional Screen Wake Lock
  private wakeLockSentinel: any = null;
  private keepAwakeDesired = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAnchorAudio();
      this.setupLifecycleListeners();
    }
  }

  private initAnchorAudio() {
    if (typeof document === 'undefined' || this.anchorAudio) return;
    try {
      const blobUrl = createKeepaliveWavUrl(30, 8000);
      if (!blobUrl) return;
      this.anchorBlobUrl = blobUrl;

      const audio = document.createElement('audio');
      audio.src = blobUrl;
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.02; // Audible to Chromium silence detector, inaudible to humans (-67 dBFS)
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.setAttribute('aria-hidden', 'true');
      audio.setAttribute('data-melophile-anchor', 'true');
      audio.style.position = 'fixed';
      audio.style.width = '1px';
      audio.style.height = '1px';
      audio.style.opacity = '0.001';
      audio.style.pointerEvents = 'none';
      audio.style.bottom = '0';
      audio.style.left = '0';

      // If Android briefly pauses the anchor (e.g. notification ducking), resume it
      audio.addEventListener('pause', () => {
        if (this.shouldBePlaying && this.isArmed) {
          setTimeout(() => {
            if (this.shouldBePlaying && this.anchorAudio?.paused) {
              this.anchorAudio.play().catch(() => {});
            }
          }, 120);
        }
      });

      const mount = () => {
        if (document.body && !audio.isConnected) {
          document.body.appendChild(audio);
        }
      };
      if (document.body) {
        mount();
      } else {
        document.addEventListener('DOMContentLoaded', mount, { once: true });
      }

      this.anchorAudio = audio;
    } catch (e) {
      console.warn('[BackgroundAudio] Init anchor audio failed:', e);
    }
  }

  private ensureAudioContext() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx({ latencyHint: 'playback' });
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.00005;
        gain.connect(this.audioContext.destination);

        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 18;
        osc.connect(gain);
        osc.start();

        // Auto-recover after Android audio focus interruption (phone call, GPS prompt)
        this.audioContext.addEventListener('statechange', () => {
          if (
            this.shouldBePlaying &&
            this.audioContext &&
            (this.audioContext.state === 'suspended' ||
              (this.audioContext.state as string) === 'interrupted')
          ) {
            this.audioContext.resume().catch(() => {});
            this.triggerImmediateRecovery();
          }
        });
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
    } catch {}
  }

  private acquireWebLock() {
    if (this.webLockActive) return;
    if (typeof navigator === 'undefined' || !('locks' in navigator)) return;

    this.webLockActive = true;
    try {
      (navigator as any).locks
        .request('melophile-android-bg-audio', () => {
          return new Promise<void>((resolve) => {
            this.releaseWebLock = resolve;
            if (!this.shouldBePlaying) {
              this.webLockActive = false;
              this.releaseWebLock = null;
              resolve();
            }
          });
        })
        .catch(() => {
          this.webLockActive = false;
          this.releaseWebLock = null;
        });
    } catch {
      this.webLockActive = false;
    }
  }

  private dropWebLock() {
    this.webLockActive = false;
    if (this.releaseWebLock) {
      try {
        this.releaseWebLock();
      } catch {}
      this.releaseWebLock = null;
    }
  }

  private clearRecoveryTimers() {
    for (const id of this.recoveryTimeouts) {
      window.clearTimeout(id);
    }
    this.recoveryTimeouts = [];
  }

  private stopWatchdog() {
    if (this.backgroundWatchdogId !== null) {
      window.clearInterval(this.backgroundWatchdogId);
      this.backgroundWatchdogId = null;
    }
  }

  private startBackgroundWatchdog() {
    this.stopWatchdog();
    if (!this.shouldBePlaying) return;

    this.backgroundWatchdogId = window.setInterval(() => {
      if (!this.shouldBePlaying) {
        this.stopWatchdog();
        return;
      }

      // Keep anchor audio + AudioContext alive
      if (this.anchorAudio && this.anchorAudio.paused) {
        this.anchorAudio.play().catch(() => {});
      }
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      // If hidden and YouTube got involuntarily paused, resume it
      if (document.hidden && this.bridge && !this.bridge.isActuallyPlaying()) {
        this.bridge.forceBackgroundResume();
      }

      // Keep lock-screen timeline accurate while screen is locked
      if (document.hidden && this.bridge) {
        const cur = this.bridge.getCurrentTime();
        const dur = this.bridge.getDuration();
        if (dur > 0) {
          this.updatePositionState(cur, dur, 1, true);
        }
      }
    }, 2200);
  }

  private triggerImmediateRecovery() {
    if (!this.shouldBePlaying) return;

    if (this.anchorAudio && this.anchorAudio.paused) {
      this.anchorAudio.play().catch(() => {});
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }

    this.clearRecoveryTimers();
    const delays = [60, 180, 420, 900, 1750, 3100];
    for (const delay of delays) {
      const id = window.setTimeout(() => {
        if (!this.shouldBePlaying) return;
        if (this.anchorAudio?.paused) {
          this.anchorAudio.play().catch(() => {});
        }
        if (this.bridge && !this.bridge.isActuallyPlaying()) {
          this.bridge.forceBackgroundResume();
        }
      }, delay);
      this.recoveryTimeouts.push(id);
    }
  }

  private setupLifecycleListeners() {
    if (typeof document === 'undefined') return;

    const onHidden = () => {
      if (!this.shouldBePlaying) return;
      this.triggerImmediateRecovery();
      this.startBackgroundWatchdog();
    };

    const onVisible = () => {
      this.clearRecoveryTimers();
      this.stopWatchdog();
      if (this.shouldBePlaying) {
        if (this.anchorAudio?.paused) {
          this.anchorAudio.play().catch(() => {});
        }
        if (this.audioContext?.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
        if (this.keepAwakeDesired) {
          this.acquireWakeLock();
        }
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        onHidden();
      } else {
        onVisible();
      }
    });

    window.addEventListener('pagehide', () => {
      if (this.shouldBePlaying) {
        onHidden();
      }
    });

    window.addEventListener('blur', () => {
      if (this.shouldBePlaying && document.hidden) {
        onHidden();
      }
    });

    // Chromium Page Lifecycle API: resume anchor if browser attempts freeze
    document.addEventListener('resume', () => {
      if (this.shouldBePlaying) {
        this.triggerImmediateRecovery();
      }
    });

    // Native Android Notification Mini Player action listener
    (window as any).__melophileMediaAction = (action: string) => {
      if (action === 'toggle') {
        if (this.shouldBePlaying) {
          this.handlers?.onPause();
        } else {
          this.handlers?.onPlay();
        }
      } else if (action === 'play') {
        this.handlers?.onPlay();
      } else if (action === 'pause') {
        this.handlers?.onPause();
      } else if (action === 'next') {
        this.handlers?.onNext();
      } else if (action === 'prev') {
        this.handlers?.onPrev();
      }
    };
  }

  public registerPlayerBridge(bridge: BackgroundPlayerBridge) {
    this.bridge = bridge;
  }

  /**
   * Call synchronously inside click/tap Play handlers so Android Chrome
   * unlocks the 30-second audio anchor and AudioContext on the user gesture.
   */
  public armFromUserGesture() {
    this.isArmed = true;
    this.shouldBePlaying = true;
    this.initAnchorAudio();
    this.ensureAudioContext();
    this.acquireWebLock();

    if (this.anchorAudio) {
      try {
        if (this.anchorAudio.paused) {
          const p = this.anchorAudio.play();
          if (p) p.catch(() => {});
        }
      } catch {}
    }

    if (this.keepAwakeDesired) {
      this.acquireWakeLock();
    }
  }

  public disarm() {
    this.shouldBePlaying = false;
    this.isArmed = false;
    this.clearRecoveryTimers();
    this.stopWatchdog();
    this.dropWebLock();
    this.releaseWakeLock();

    if (this.anchorAudio) {
      try {
        this.anchorAudio.pause();
      } catch {}
    }
    if (this.audioContext && this.audioContext.state === 'running') {
      try {
        this.audioContext.suspend().catch(() => {});
      } catch {}
    }
  }

  public async setKeepScreenAwake(enabled: boolean): Promise<boolean> {
    this.keepAwakeDesired = enabled;
    if (enabled && this.shouldBePlaying) {
      return this.acquireWakeLock();
    }
    this.releaseWakeLock();
    return false;
  }

  private async acquireWakeLock(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return false;
    try {
      if (this.wakeLockSentinel) return true;
      this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      this.wakeLockSentinel.addEventListener('release', () => {
        this.wakeLockSentinel = null;
      });
      return true;
    } catch {
      return false;
    }
  }

  private releaseWakeLock() {
    if (this.wakeLockSentinel) {
      try {
        this.wakeLockSentinel.release().catch(() => {});
      } catch {}
      this.wakeLockSentinel = null;
    }
  }

  /**
   * Update Android Lock Screen & Notification Shade track artwork & info.
   * Only runs when metadata actually changes (never flickers on time ticks).
   */
  public updateMetadata({ title, artist, album = 'Melophile', artwork }: MediaSessionMetadataInput) {
    if (typeof window === 'undefined') return;
    if (!('mediaSession' in navigator) || typeof (window as any).MediaMetadata === 'undefined') {
      return;
    }

    const key = `${title}|${artist}|${album}|${artwork || ''}`;
    if (key === this.lastMetadataKey) return;
    this.lastMetadataKey = key;

    try {
      const origin = window.location.origin;
      const artworkList: MediaImage[] = [];

      if (artwork) {
        const mime = artwork.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
        artworkList.push(
          { src: artwork, sizes: '96x96', type: mime },
          { src: artwork, sizes: '128x128', type: mime },
          { src: artwork, sizes: '192x192', type: mime },
          { src: artwork, sizes: '256x256', type: mime },
          { src: artwork, sizes: '384x384', type: mime },
          { src: artwork, sizes: '512x512', type: mime }
        );
      }

      // Guaranteed local PNG fallback so Android lock screen always displays crisp branding
      artworkList.push(
        { src: `${origin}/pwa-192x192.png`, sizes: '192x192', type: 'image/png' },
        { src: `${origin}/pwa-512x512.png`, sizes: '512x512', type: 'image/png' }
      );

      navigator.mediaSession.metadata = new (window as any).MediaMetadata({
        title: title || 'Melophile',
        artist: artist || 'Melophile Studio',
        album,
        artwork: artworkList,
      });

      // Forward to Android native notification mini player
      if (typeof (window as any).AndroidMediaBridge !== 'undefined' && (window as any).AndroidMediaBridge.updateTrack) {
        (window as any).AndroidMediaBridge.updateTrack(title || 'Melophile', artist || '', artwork || '', this.shouldBePlaying);
      }
    } catch (e) {
      console.warn('[BackgroundAudio] MediaSession metadata error:', e);
    }
  }

  /**
   * Sync playback state between React state, Android MediaSession, and the 30s audio anchor.
   */
  public updatePlaybackState(isPlaying: boolean) {
    if (isPlaying) {
      this.armFromUserGesture();
    } else {
      this.disarm();
    }

    try {
      if (typeof (window as any).AndroidMediaBridge !== 'undefined' && (window as any).AndroidMediaBridge.updateTrack) {
        const parts = this.lastMetadataKey.split('|');
        const title = parts[0] || 'Melophile';
        const artist = parts[1] || '';
        const artwork = parts[3] || '';
        (window as any).AndroidMediaBridge.updateTrack(title, artist, artwork, isPlaying);
      }
    } catch {}

    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      } catch {}
    }
  }

  /**
   * Sync lock-screen scrub bar position (throttled to prevent Android notification thrashing).
   */
  public updatePositionState(
    currentTime: number,
    duration: number,
    playbackRate = 1,
    force = false
  ) {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    if (!('setPositionState' in navigator.mediaSession)) return;
    if (!Number.isFinite(duration) || duration <= 0) return;

    const now = Date.now();
    if (!force && now - this.lastPositionSyncMs < 1500) return;
    this.lastPositionSyncMs = now;

    try {
      const safeDuration = Math.max(1, duration);
      const safePosition = Math.max(0, Math.min(currentTime, safeDuration));
      navigator.mediaSession.setPositionState({
        duration: safeDuration,
        playbackRate: playbackRate > 0 ? playbackRate : 1,
        position: safePosition,
      });
    } catch {}
  }

  /**
   * Bind native Android lock-screen, Bluetooth headset, and Android Auto controls.
   * Safe to call whenever callbacks refresh — action handlers read from `this.handlers`.
   */
  public setActionHandlers(handlers: MediaSessionHandlers) {
    this.handlers = handlers;
    if (this.handlersBound) return;
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    this.handlersBound = true;

    const safeBind = (action: MediaSessionAction, fn: MediaSessionActionHandler | null) => {
      try {
        navigator.mediaSession.setActionHandler(action, fn);
      } catch {}
    };

    safeBind('play', () => {
      this.armFromUserGesture();
      this.handlers?.onPlay();
    });

    safeBind('pause', () => {
      this.disarm();
      this.handlers?.onPause();
    });

    safeBind('stop', () => {
      this.disarm();
      if (this.handlers?.onStop) {
        this.handlers.onStop();
      } else {
        this.handlers?.onPause();
      }
    });

    safeBind('previoustrack', () => {
      this.armFromUserGesture();
      this.handlers?.onPrev();
    });

    safeBind('nexttrack', () => {
      this.armFromUserGesture();
      this.handlers?.onNext();
    });

    safeBind('seekto', (details) => {
      if (details.seekTime !== undefined && this.handlers) {
        this.handlers.onSeek(Math.max(0, details.seekTime));
        const dur = this.bridge?.getDuration() || 0;
        if (dur > 0) {
          this.updatePositionState(details.seekTime, dur, 1, true);
        }
      }
    });

    safeBind('seekforward', (details) => {
      if (!this.handlers) return;
      const step = details.seekOffset || 10;
      const cur = this.bridge?.getCurrentTime() || 0;
      const dur = this.bridge?.getDuration() || 0;
      const next = dur > 0 ? Math.min(dur, cur + step) : cur + step;
      this.handlers.onSeek(next);
    });

    safeBind('seekbackward', (details) => {
      if (!this.handlers) return;
      const step = details.seekOffset || 10;
      const cur = this.bridge?.getCurrentTime() || 0;
      this.handlers.onSeek(Math.max(0, cur - step));
    });
  }
}

export const backgroundAudio = new BackgroundAudioService();
