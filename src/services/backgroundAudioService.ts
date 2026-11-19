/**
 * Melophile Background Audio Service
 * 
 * Enables uninterrupted background music playback on Android phones:
 * 1. Native MediaSession integration with lock-screen art & hardware controls.
 * 2. Silent audio bridge (AudioContext / HTML5 Audio) that holds Android OS Audio Focus.
 * 3. Page Visibility counter-pause handler that recovers playback if the mobile browser pauses YouTube iframe.
 * 
 * Completely guarded against missing Web APIs (safeguarding against black screen or reference errors).
 */

class BackgroundAudioService {
  private silentAudio: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private oscillatorNode: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private isArmed: boolean = false;
  private resumeCallback: (() => void) | null = null;

  constructor() {
    this.initSilentAudio();
    this.setupVisibilityListener();
  }

  private initSilentAudio() {
    if (typeof window === 'undefined' || typeof Audio === 'undefined') return;
    try {
      // 1-second silent WAV base64 loop
      const silentWavBase64 =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
      const audio = new Audio(silentWavBase64);
      audio.loop = true;
      audio.volume = 0.0001; // Audio track audible to Android OS audio manager, imperceptible to humans
      (audio as any).playsInline = true;
      (audio as any).setAttribute?.('playsinline', 'true');
      (audio as any).setAttribute?.('webkit-playsinline', 'true');
      this.silentAudio = audio;
    } catch (e) {
      console.warn('[BackgroundAudio] Init silent audio failed:', e);
    }
  }

  /**
   * Initializes a minimal inaudible Web Audio buffer when user interacts.
   * Android Chrome prioritizes active AudioContext when backgrounded.
   */
  private initWebAudio() {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.00001; // Inaudible
        gain.connect(this.audioContext.destination);
        this.gainNode = gain;

        const osc = this.audioContext.createOscillator();
        osc.frequency.value = 440;
        osc.connect(gain);
        osc.start();
        this.oscillatorNode = osc;
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
    } catch (err) {
      console.debug('[BackgroundAudio] WebAudio note:', err);
    }
  }

  /**
   * Automatically recover playback if mobile browser or OS visibility changes attempt to pause audio
   */
  private setupVisibilityListener() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // App or tab just went into background / phone screen locked
        if (this.isArmed && this.resumeCallback) {
          // Keep silent audio playing so OS does not revoke audio focus
          if (this.silentAudio && this.silentAudio.paused) {
            this.silentAudio.play().catch(() => {});
          }
          if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
          }

          // Counteract mobile browser visibility pause cascade
          [100, 300, 700, 1500, 2500].forEach((delay) => {
            setTimeout(() => {
              if (this.isArmed && this.resumeCallback) {
                this.resumeCallback();
              }
            }, delay);
          });
        }
      }
    });
  }

  /**
   * Register the YouTube player's play callback for auto-resumption when minimized
   */
  public registerResumeCallback(cb: () => void) {
    this.resumeCallback = cb;
  }

  /**
   * Arm the background audio bridge on user gesture (tap/play)
   */
  public arm() {
    this.isArmed = true;
    this.initWebAudio();

    if (this.silentAudio) {
      try {
        const p = this.silentAudio.play();
        if (p !== undefined) {
          p.catch((e) => {
            console.debug('[BackgroundAudio] Silent audio play waiting for gesture:', e);
          });
        }
      } catch {}
    }
  }

  public pause() {
    this.isArmed = false;
    if (this.silentAudio) {
      try {
        this.silentAudio.pause();
      } catch {}
    }
    if (this.audioContext && this.audioContext.state === 'running') {
      try {
        this.audioContext.suspend().catch(() => {});
      } catch {}
    }
  }

  /**
   * Sync native Android Notification & Lock Screen Media Player
   */
  public updateMediaSession({
    title,
    artist,
    album = 'Melophile',
    artwork,
    isPlaying,
    currentTime,
    duration,
    onPlay,
    onPause,
    onNext,
    onPrev,
    onSeek,
  }: {
    title: string;
    artist: string;
    album?: string;
    artwork?: string;
    isPlaying: boolean;
    currentTime?: number;
    duration?: number;
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrev: () => void;
    onSeek?: (time: number) => void;
  }) {
    if (typeof window === 'undefined') return;

    // Keep arm state in sync
    if (isPlaying) {
      this.arm();
    } else {
      this.pause();
    }

    // Safely check for MediaSession and MediaMetadata constructors
    if (!('mediaSession' in navigator) || typeof (window as any).MediaMetadata === 'undefined') {
      return;
    }

    try {
      const artworkList: MediaImage[] = [];
      if (artwork) {
        artworkList.push(
          { src: artwork, sizes: '96x96', type: 'image/jpeg' },
          { src: artwork, sizes: '128x128', type: 'image/jpeg' },
          { src: artwork, sizes: '192x192', type: 'image/jpeg' },
          { src: artwork, sizes: '256x256', type: 'image/jpeg' },
          { src: artwork, sizes: '512x512', type: 'image/jpeg' }
        );
      }

      navigator.mediaSession.metadata = new (window as any).MediaMetadata({
        title,
        artist,
        album,
        artwork: artworkList,
      });

      // Update native playback state
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      // Update position state for seekbar on Android Notification
      if (
        duration &&
        duration > 0 &&
        currentTime !== undefined &&
        'setPositionState' in navigator.mediaSession
      ) {
        try {
          navigator.mediaSession.setPositionState({
            duration: Math.max(duration, 1),
            playbackRate: 1,
            position: Math.min(currentTime, duration),
          });
        } catch {}
      }

      // Bind native hardware & lockscreen media action handlers
      navigator.mediaSession.setActionHandler('play', () => {
        this.arm();
        onPlay();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        this.pause();
        onPause();
      });

      navigator.mediaSession.setActionHandler('previoustrack', onPrev);
      navigator.mediaSession.setActionHandler('nexttrack', onNext);

      if (onSeek) {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            onSeek(details.seekTime);
          }
        });

        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          const step = details.seekOffset || 10;
          if (currentTime !== undefined) onSeek(currentTime + step);
        });

        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          const step = details.seekOffset || 10;
          if (currentTime !== undefined) onSeek(Math.max(0, currentTime - step));
        });
      }
    } catch (e) {
      console.warn('[BackgroundAudio] MediaSession update error:', e);
    }
  }
}

export const backgroundAudio = new BackgroundAudioService();

