/**
 * Android Background Audio Service
 * 
 * Provides an active HTML5 silent audio bridge and MediaSession API binding.
 * On Android (Chrome / Brave / Firefox / Samsung Internet), an active HTML5 audio element
 * paired with navigator.mediaSession keeps the audio context alive when:
 * 1. The phone screen is locked.
 * 2. The user switches to another app (WhatsApp, Instagram, etc.).
 * 3. The browser tab is backgrounded.
 * 
 * Also exposes full system notification controls (Play/Pause, Next, Previous, Seek).
 */

class BackgroundAudioService {
  private silentAudio: HTMLAudioElement | null = null;
  private isArmed: boolean = false;

  constructor() {
    this.initSilentAudio();
  }

  private initSilentAudio() {
    if (typeof window === 'undefined') return;
    try {
      // 1-second silent stereo WAV base64 loop
      const silentWavBase64 =
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
      const audio = new Audio(silentWavBase64);
      audio.loop = true;
      audio.volume = 0.001; // Audible to Android audio focus manager, inaudible to human ear
      (audio as any).playsInline = true;
      this.silentAudio = audio;
    } catch (e) {
      console.warn('[BackgroundAudio] Init silent audio failed:', e);
    }
  }

  /**
   * Arm the background audio bridge on user gesture (tap/play)
   */
  public arm() {
    if (!this.silentAudio) return;
    try {
      const playPromise = this.silentAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.isArmed = true;
          })
          .catch((e) => {
            // Browser policy may require explicit user gesture
            console.debug('[BackgroundAudio] Autoplay pending user interaction:', e);
          });
      }
    } catch {}
  }

  public pause() {
    if (this.silentAudio) {
      try {
        this.silentAudio.pause();
      } catch {}
    }
  }

  /**
   * Sync native Android Notification & Lock Screen Media Player
   */
  public updateMediaSession({
    title,
    artist,
    album = 'SoundStream',
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
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      // Set metadata displayed on Android Lock Screen & Notification Shade
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

      navigator.mediaSession.metadata = new MediaMetadata({
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

      // If playing, keep silent audio loop active to retain Android audio focus
      if (isPlaying) {
        this.arm();
      } else {
        this.pause();
      }
    } catch (e) {
      console.warn('[BackgroundAudio] MediaSession update error:', e);
    }
  }
}

export const backgroundAudio = new BackgroundAudioService();
