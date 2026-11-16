import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Track, RepeatMode, VisualizerMode, ActiveView, GenreCollection, Playlist, ThemePreset, StreamQuality, PlayerStyle } from './types/player';
import { THEME_PRESETS } from './utils/themeConfig';
import { Header } from './components/Header';
import { NowPlayingHero } from './components/NowPlayingHero';
import { SearchBar } from './components/SearchBar';
import { TrackCard } from './components/TrackCard';
import { QueueDrawer } from './components/QueueDrawer';
import { CuratedVibes } from './components/CuratedVibes';
import { MiniPlayerBar } from './components/MiniPlayerBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { YouTubePlayer, YouTubePlayerHandle } from './components/YouTubePlayer';
import { QuickImportModal } from './components/QuickImportModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { NodesBackground } from './components/NodesBackground';
import { getNextTrackIndex, getPrevTrackIndex, extractYouTubeId } from './utils/playerUtils';
import { Music2, Compass, AlertCircle, Info } from 'lucide-react';

const DEFAULT_INITIAL_TRACK: Track = {
  id: '8GW6sLrK40k',
  title: 'Resonance',
  artist: 'HOME',
  duration: '3:32',
  durationSec: 212,
  views: '140M views',
  thumbnail: 'https://i.ytimg.com/vi/8GW6sLrK40k/hqdefault.jpg',
};

export default function App() {
  const playerRef = useRef<YouTubePlayerHandle | null>(null);

  // Core Player State
  const [currentTrack, setCurrentTrack] = useState<Track>(DEFAULT_INITIAL_TRACK);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('aura_volume');
    return saved !== null ? Number(saved) : 85;
  });
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [playbackQuality, setPlaybackQuality] = useState<StreamQuality>(() => {
    const saved = localStorage.getItem('soundstream_quality') as StreamQuality;
    return saved || 'auto';
  });
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('spectrum');
  const [playerStyle, setPlayerStyle] = useState<PlayerStyle>(() => {
    const saved = localStorage.getItem('soundstream_player_style') as PlayerStyle;
    return saved === 'vinyl' ? 'vinyl' : 'wavy';
  });
  const [isVideoVisible, setIsVideoVisible] = useState<boolean>(false);
  const [crossfadeDuration, setCrossfadeDuration] = useState<number>(() => {
    const saved = localStorage.getItem('aura_crossfade');
    return saved !== null ? Number(saved) : 1.5;
  });

  // Persist Quality
  useEffect(() => {
    localStorage.setItem('soundstream_quality', playbackQuality);
  }, [playbackQuality]);

  // Persist Player Style
  useEffect(() => {
    localStorage.setItem('soundstream_player_style', playerStyle);
  }, [playerStyle]);

  // Navigation & Modals State
  const [activeView, setActiveView] = useState<ActiveView>('now-playing');
  const [isQuickImportOpen, setIsQuickImportOpen] = useState<boolean>(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Playlists, Favorites, and Queue
  const [queue, setQueue] = useState<Track[]>([DEFAULT_INITIAL_TRACK]);
  const [playedHistory, setPlayedHistory] = useState<number[]>([]);
  const [favorites, setFavorites] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem('aura_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = localStorage.getItem('aura_playlists');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Discovery & Genres
  const [genres, setGenres] = useState<GenreCollection[]>([]);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGenreFilter, setActiveGenreFilter] = useState<string | null>(null);

  // Theme State
  const [themePreset, setThemePreset] = useState<ThemePreset>(() => {
    const saved = localStorage.getItem('aura_theme_preset') as ThemePreset;
    return saved && THEME_PRESETS[saved] ? saved : 'obsidian';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('aura_theme');
    return saved ? saved === 'dark' : true;
  });

  const currentTheme = THEME_PRESETS[themePreset];

  // Update Theme CSS Variables
  useEffect(() => {
    localStorage.setItem('aura_theme_preset', themePreset);
    document.documentElement.style.setProperty('--theme-accent', currentTheme.accent);
    document.documentElement.style.setProperty('--theme-accent-secondary', currentTheme.accentSecondary);
  }, [themePreset, currentTheme]);

  // Sleep Timer Countdown
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Sync Dark Mode with document.documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('aura_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('aura_theme', 'light');
    }
  }, [isDarkMode]);

  // Persist Volume
  useEffect(() => {
    localStorage.setItem('aura_volume', volume.toString());
  }, [volume]);

  // Persist Crossfade Duration
  useEffect(() => {
    localStorage.setItem('aura_crossfade', crossfadeDuration.toString());
  }, [crossfadeDuration]);

  // Persist Favorites
  useEffect(() => {
    localStorage.setItem('aura_favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Persist Playlists
  useEffect(() => {
    localStorage.setItem('aura_playlists', JSON.stringify(playlists));
  }, [playlists]);

  // Sleep Timer Tick
  useEffect(() => {
    if (sleepTimerRemaining === null) return;
    if (sleepTimerRemaining <= 0) {
      setIsPlaying(false);
      setSleepTimerRemaining(null);
      showToast('Sleep timer reached. Audio playback paused.');
      return;
    }

    const timer = setInterval(() => {
      setSleepTimerRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerRemaining]);

  // Fetch Initial Curated Soundscapes
  useEffect(() => {
    fetch('/api/curated')
      .then((res) => res.json())
      .then((data) => {
        if (data.genres) {
          setGenres(data.genres);
          // Set initial track if none selected yet
          if (!currentTrack && data.featured && data.featured.length > 0) {
            setCurrentTrack(data.featured[0]);
            setQueue(data.featured);
          }
          // Seed search results with first genre tracks initially
          if (data.genres[0]?.tracks) {
            setSearchResults(data.genres[0].tracks);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load curated tracks:', err);
      });
  }, []);

  // Search YouTube
  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    setIsSearching(true);
    setSearchQuery(q);
    setActiveView('discover');

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(data.tracks || []);
    } catch (err: any) {
      console.error(err);
      showToast('Unable to complete YouTube search right now.');
    } finally {
      setIsSearching(false);
    }
  };

  // Genre Filter Selection
  const handleSelectGenreFilter = (genreId: string) => {
    setActiveGenreFilter(genreId);
    const found = genres.find((g) => g.id === genreId);
    if (found) {
      setSearchResults(found.tracks);
      setActiveView('discover');
    } else {
      handleSearch(`${genreId} music`);
    }
  };

  // Synchronous Play/Pause on direct user gesture
  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (next) {
        playerRef.current?.play();
      } else {
        playerRef.current?.pause();
      }
      return next;
    });
  }, []);

  // Crossfade Track Switcher (fades out active track, loads new track at 0 volume, fades in to target volume)
  const isCrossfadingRef = useRef<boolean>(false);
  const crossfadeTimerRef = useRef<any>(null);

  const performTrackSwitch = useCallback(
    (targetTrack: Track, autoPlay = true) => {
      // If crossfade is 0 (off), or player is not currently playing, switch instantly
      if (crossfadeDuration <= 0 || !isPlaying || !autoPlay) {
        if (crossfadeTimerRef.current) {
          clearInterval(crossfadeTimerRef.current);
          isCrossfadingRef.current = false;
        }
        playerRef.current?.setVolume(volume);
        setCurrentTrack(targetTrack);
        setIsPlaying(autoPlay);
        setCurrentTime(0);
        playerRef.current?.loadTrack(targetTrack, autoPlay);
        return;
      }

      // If already mid-crossfade, clear pending timer
      if (crossfadeTimerRef.current) {
        clearInterval(crossfadeTimerRef.current);
      }

      isCrossfadingRef.current = true;
      const initialVol = volume;
      const totalMs = crossfadeDuration * 1000;
      const halfMs = totalMs / 2;
      const steps = 10;
      const stepInterval = Math.max(20, Math.floor(halfMs / steps));
      let outStep = 0;

      // Phase 1: Smooth Fade-Out
      crossfadeTimerRef.current = setInterval(() => {
        outStep++;
        const factor = Math.max(0, 1 - outStep / steps);
        const currentStepVol = Math.round(initialVol * factor);
        playerRef.current?.setVolume(currentStepVol);

        if (outStep >= steps) {
          clearInterval(crossfadeTimerRef.current);

          // Phase 2: Switch track at volume 0
          playerRef.current?.setVolume(0);
          setCurrentTrack(targetTrack);
          setCurrentTime(0);
          setIsPlaying(true);
          playerRef.current?.loadTrack(targetTrack, true);

          // Phase 3: Smooth Fade-In
          let inStep = 0;
          crossfadeTimerRef.current = setInterval(() => {
            inStep++;
            const inFactor = Math.min(1, inStep / steps);
            const inVol = Math.round(initialVol * inFactor);
            playerRef.current?.setVolume(inVol);

            if (inStep >= steps) {
              clearInterval(crossfadeTimerRef.current);
              playerRef.current?.setVolume(initialVol);
              isCrossfadingRef.current = false;
            }
          }, stepInterval);
        }
      }, stepInterval);
    },
    [crossfadeDuration, isPlaying, volume]
  );

  // Play a Track
  const handlePlayTrack = useCallback(
    (track: Track) => {
      performTrackSwitch(track, true);

      // If track not already in queue, add it
      setQueue((prevQueue) => {
        if (!prevQueue.some((t) => t.id === track.id)) {
          return [...prevQueue, track];
        }
        return prevQueue;
      });
    },
    [performTrackSwitch]
  );

  // Direct play from YouTube URL or ID
  const handleDirectPlay = async (urlOrId: string) => {
    const videoId = extractYouTubeId(urlOrId) || urlOrId;
    try {
      const res = await fetch(`/api/resolve?urlOrId=${encodeURIComponent(videoId)}`);
      const data = await res.json();
      const track: Track = {
        id: videoId,
        title: data.title || 'YouTube Track',
        artist: data.artist || 'YouTube',
        duration: data.duration || '--:--',
        durationSec: 0,
        thumbnail: data.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      };
      handlePlayTrack(track);
      setActiveView('now-playing');
      showToast(`Loaded: ${track.title}`);
    } catch {
      const fallbackTrack: Track = {
        id: videoId,
        title: 'YouTube Track',
        artist: 'YouTube',
        duration: '--:--',
        durationSec: 0,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      };
      handlePlayTrack(fallbackTrack);
      setActiveView('now-playing');
    }
  };

  // Play Full Genre Collection
  const handlePlayGenre = (genre: GenreCollection) => {
    if (genre.tracks.length === 0) return;
    setQueue(genre.tracks);
    handlePlayTrack(genre.tracks[0]);
    setActiveView('now-playing');
    showToast(`Playing collection: ${genre.name}`);
  };

  // Advance to Next Track
  const handleNext = useCallback(() => {
    if (queue.length === 0) return;

    const currentIdx = queue.findIndex((t) => t.id === currentTrack?.id);
    const nextIdx = getNextTrackIndex(
      currentIdx,
      queue.length,
      repeatMode,
      isShuffle,
      playedHistory
    );

    if (nextIdx !== null && queue[nextIdx]) {
      if (currentIdx >= 0) {
        setPlayedHistory((prev) => [...prev, currentIdx]);
      }
      handlePlayTrack(queue[nextIdx]);
    } else {
      setIsPlaying(false);
      showToast('Queue finished.');
    }
  }, [queue, currentTrack, repeatMode, isShuffle, playedHistory, handlePlayTrack]);

  // Previous Track
  const handlePrev = useCallback(() => {
    if (queue.length === 0) return;
    const currentIdx = queue.findIndex((t) => t.id === currentTrack?.id);
    const prevIdx = getPrevTrackIndex(currentIdx, queue.length, currentTime);

    if (prevIdx === currentIdx) {
      playerRef.current?.seekTo(0);
      setCurrentTime(0);
    } else if (queue[prevIdx]) {
      handlePlayTrack(queue[prevIdx]);
    }
  }, [queue, currentTrack, currentTime, handlePlayTrack]);

  // Queue Operations
  const handleAddToQueue = (track: Track) => {
    setQueue((prev) => {
      if (prev.some((t) => t.id === track.id)) {
        showToast('Track already in queue.');
        return prev;
      }
      showToast(`Added to queue: ${track.title}`);
      return [...prev, track];
    });
  };

  const handleRemoveFromQueue = (track: Track) => {
    setQueue((prev) => prev.filter((t) => t.id !== track.id));
  };

  const handleClearQueue = () => {
    setQueue([]);
    showToast('Queue cleared.');
  };

  // Hindi Live Radio Audio Channels Trigger
  const [isRadioPlaying, setIsRadioPlaying] = useState<boolean>(false);

  const handlePlayHindiRadio = useCallback(async () => {
    try {
      showToast('Tuning into live Hindi audio radio...');
      const res = await fetch('/api/radio');
      if (!res.ok) throw new Error('Radio fetch failed');
      const data = await res.json();
      const stations: Track[] = data.stations || [];
      if (stations.length === 0) {
        showToast('No active Hindi radio channels found.');
        return;
      }
      // Pick a live station (Radio Mirchi FM, Mirchi Top 20, Hits of Bollywood, etc.)
      const randomStation = stations[Math.floor(Math.random() * stations.length)];
      setQueue((prev) => {
        const remainingStations = stations.filter((s) => s.id !== randomStation.id);
        return [randomStation, ...remainingStations, ...prev.filter((t) => !stations.some((s) => s.id === t.id))];
      });
      handlePlayTrack(randomStation);
      setIsRadioPlaying(true);
      setActiveView('now-playing');
      showToast(`Tuned into Live Radio: ${randomStation.title}`);
    } catch (err: any) {
      console.error(err);
      showToast('Could not load Hindi radio channels.');
    }
  }, [handlePlayTrack]);

  // Favorites Operations
  const handleToggleFavorite = (track: Track) => {
    setFavorites((prev) => {
      const exists = prev.some((f) => f.id === track.id);
      if (exists) {
        showToast('Removed from favorites.');
        return prev.filter((f) => f.id !== track.id);
      } else {
        showToast('Saved to favorites!');
        return [...prev, track];
      }
    });
  };

  // Custom Playlists Operations
  const handleCreatePlaylist = (name: string) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      createdAt: Date.now(),
      tracks: currentTrack ? [currentTrack] : [],
    };
    setPlaylists((prev) => [...prev, newPl]);
    showToast(`Created playlist "${name}"`);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length === 0) return;
    setQueue(playlist.tracks);
    handlePlayTrack(playlist.tracks[0]);
    setActiveView('now-playing');
    showToast(`Playing playlist "${playlist.name}"`);
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    showToast('Playlist deleted.');
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when typing in input or form
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const nextTime = Math.max(0, currentTime - 5);
        playerRef.current?.seekTo(nextTime);
        setCurrentTime(nextTime);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const nextTime = Math.min(duration || 9999, currentTime + 5);
        playerRef.current?.seekTo(nextTime);
        setCurrentTime(nextTime);
      } else if (e.key === 'n' || e.key === 'N') {
        handleNext();
      } else if (e.key === 'p' || e.key === 'P') {
        handlePrev();
      } else if (e.key === 'm' || e.key === 'M') {
        setVolume((v) => (v === 0 ? 80 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, handleNext, handlePrev, handleTogglePlay]);

  return (
    <div
      className="h-screen text-[#f4f5f8] flex flex-col font-sans relative overflow-hidden selection:bg-[#ec4899]/30 selection:text-[#38bdf8] bg-[#06070a]"
    >
      {/* Prismatic Aurora Borealis & Deep Space Nebula Ambient Atmosphere */}
      <div
        className="absolute inset-0 aurora-nebula-bg pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Cosmic Stardust Layer */}
      <div
        className="absolute inset-0 stardust-layer pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Interactive Constellation / Musical Nodes Canvas with Audio Reactivity */}
      <NodesBackground isPlaying={isPlaying} volume={volume} connectionDistance={150} />

      {/* Subtle Vignette Shading for audiophile focus & crisp UI legibility */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#06070a]/40 via-transparent to-[#06070a]/60 pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* Top Navigation Bar */}
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        queueCount={queue.length}
        onOpenQuickImport={() => setIsQuickImportOpen(true)}
        sleepTimerRemaining={sleepTimerRemaining}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        onPlayHindiRadio={handlePlayHindiRadio}
        isRadioPlaying={isRadioPlaying}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-18 right-6 z-50 glass-panel text-[#f4f5f8] text-xs font-bold px-4 py-2.5 rounded-xl border border-white/20 shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2"
        >
          <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 shadow-[0_0_8px_#ec4899] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area: Locked viewport container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-2 sm:px-6 py-1 overflow-hidden flex flex-col relative z-10 min-h-0">
        {/* VIEW 1: NOW PLAYING (Zero scrolling, fully responsive, mobile bottom nav clearance) */}
        <div className={activeView === 'now-playing' ? 'h-full flex-1 flex flex-col justify-between overflow-hidden pb-16 md:pb-1' : 'fixed -left-[99999px] top-0 opacity-0 pointer-events-none h-0 w-0 overflow-hidden'}>
          <div className="h-full flex-1 flex flex-col justify-between items-center min-h-0">
            <NowPlayingHero
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              isBuffering={isBuffering}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              repeatMode={repeatMode}
              isShuffle={isShuffle}
              playbackRate={playbackRate}
              playbackQuality={playbackQuality}
              visualizerMode={visualizerMode}
              playerStyle={playerStyle}
              onTogglePlayerStyle={() => {
                setPlayerStyle((prev) => {
                  const next = prev === 'wavy' ? 'vinyl' : 'wavy';
                  showToast(`Player style: ${next === 'wavy' ? 'Wavy Flow' : 'Vinyl Turntable'}`);
                  return next;
                });
              }}
              isVideoVisible={isVideoVisible}
              themeConfig={currentTheme}
              videoSlot={
              <YouTubePlayer
                ref={playerRef}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                volume={volume}
                playbackRate={playbackRate}
                playbackQuality={playbackQuality}
                isVideoVisible={isVideoVisible}
                onTimeUpdate={(cur, dur) => {
                  setCurrentTime(cur);
                  if (dur > 0) setDuration(dur);
                }}
                onStateChange={(playing, buffering) => {
                  setIsPlaying(playing);
                  setIsBuffering(buffering);
                }}
                onTrackEnded={handleNext}
                onError={(err) => {
                  showToast(err);
                }}
              />
            }
            isFavorite={currentTrack ? favorites.some((f) => f.id === currentTrack.id) : false}
            crossfadeDuration={crossfadeDuration}
            onChangeCrossfadeDuration={setCrossfadeDuration}
            onTogglePlay={handleTogglePlay}
            onSeek={(time) => {
              playerRef.current?.seekTo(time);
              setCurrentTime(time);
            }}
            onPrev={handlePrev}
            onNext={handleNext}
            onSkipBack5s={() => {
              const nextT = Math.max(0, currentTime - 5);
              playerRef.current?.seekTo(nextT);
              setCurrentTime(nextT);
            }}
            onSkipForward5s={() => {
              const nextT = Math.min(duration || 9999, currentTime + 5);
              playerRef.current?.seekTo(nextT);
              setCurrentTime(nextT);
            }}
            onToggleShuffle={() => setIsShuffle(!isShuffle)}
            onToggleRepeat={() => {
              setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
            }}
            onChangeVolume={setVolume}
            onChangePlaybackRate={setPlaybackRate}
            onChangePlaybackQuality={(q) => {
              setPlaybackQuality(q);
              playerRef.current?.setPlaybackQuality(q);
              showToast(`Quality set to ${q.toUpperCase()}`);
            }}
            onChangeVisualizerMode={setVisualizerMode}
            onToggleVideo={() => setIsVideoVisible(!isVideoVisible)}
            onToggleFavorite={() => {
              if (currentTrack) handleToggleFavorite(currentTrack);
            }}
            onPlayHindiRadio={handlePlayHindiRadio}
          />

          {/* Quick Up Next Preview Strip (Ultra-compact, non-overflowing) */}
          {queue.length > 1 && (
            <div className="max-w-xl w-full mx-auto pt-1 mt-1 border-t border-white/10 shrink-0 hidden md:block">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="font-mono font-bold tracking-wider uppercase text-cyan-300">UP NEXT IN QUEUE</span>
                <button
                  onClick={() => setActiveView('queue')}
                  className="text-pink-400 hover:text-pink-300 font-black text-[10px] uppercase tracking-wider transition-colors"
                >
                  VIEW ALL ({queue.length})
                </button>
              </div>
              <div className="space-y-1">
                {queue
                  .filter((t) => t.id !== currentTrack?.id)
                  .slice(0, 1)
                  .map((track) => (
                    <TrackCard
                      key={`hero-next-${track.id}`}
                      track={track}
                      isCurrent={false}
                      isPlaying={false}
                      onPlay={handlePlayTrack}
                      onAddToQueue={() => {}}
                      onRemoveFromQueue={handleRemoveFromQueue}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorite={favorites.some((f) => f.id === track.id)}
                    />
                  ))}
              </div>
            </div>
          )}
          </div>
        </div>

        {/* VIEW 2: SEARCH & BROWSE */}
        <div className={activeView === 'discover' ? 'h-full flex-1 flex flex-col space-y-4 pb-36 md:pb-24 overflow-hidden min-h-0' : 'hidden'}>
          <div className="shrink-0">
            <SearchBar
              onSearch={handleSearch}
              onDirectPlay={handleDirectPlay}
              isLoading={isSearching}
              activeGenre={activeGenreFilter}
              onSelectGenre={handleSelectGenreFilter}
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
              <h3 className="text-base font-black tracking-tight text-white uppercase flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <span>
                  {searchQuery
                    ? `SEARCH RESULTS: "${searchQuery}"`
                    : activeGenreFilter
                    ? `COLLECTION: ${activeGenreFilter.toUpperCase()}`
                    : 'CATALOG DISCOVERY'}
                </span>
              </h3>
              <span className="text-xs font-mono font-bold tracking-wider text-pink-400/80 tabular-nums uppercase">
                {searchResults.length} TRACKS
              </span>
            </div>

            {isSearching ? (
              <div className="py-20 text-center text-slate-500 space-y-3">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_12px_rgba(56,189,248,0.5)]" />
                <p className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">Querying YouTube Audio Stream...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                <AlertCircle className="w-8 h-8 opacity-40 mx-auto mb-2 text-cyan-400" />
                <p className="text-sm font-bold uppercase tracking-wider text-slate-300">No tracks located</p>
                <p className="text-xs text-slate-500 mt-1 font-mono">Check artist query or link.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pb-6">
                  {searchResults.map((track) => (
                    <TrackCard
                      key={`search-${track.id}`}
                      track={track}
                      isCurrent={currentTrack?.id === track.id}
                      isPlaying={isPlaying && currentTrack?.id === track.id}
                      isQueued={queue.some((q) => q.id === track.id)}
                      onPlay={handlePlayTrack}
                      onAddToQueue={handleAddToQueue}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorite={favorites.some((f) => f.id === track.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VIEW 3: CURATED VIBES */}
        <div className={activeView === 'genres' ? 'h-full flex-1 overflow-y-auto pb-36 md:pb-28 pr-1' : 'hidden'}>
          <CuratedVibes
            genres={genres}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            favorites={favorites}
            onPlayTrack={handlePlayTrack}
            onPlayGenre={handlePlayGenre}
            onAddToQueue={handleAddToQueue}
            onToggleFavorite={handleToggleFavorite}
          />
        </div>

        {/* VIEW 4: QUEUE & PLAYLISTS */}
        <div className={activeView === 'queue' ? 'h-full flex-1 overflow-y-auto pb-36 md:pb-28 pr-1' : 'hidden'}>
          <QueueDrawer
            queue={queue}
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            favorites={favorites}
            playlists={playlists}
            onPlayTrack={handlePlayTrack}
            onRemoveFromQueue={handleRemoveFromQueue}
            onClearQueue={handleClearQueue}
            onToggleFavorite={handleToggleFavorite}
            onCreatePlaylist={handleCreatePlaylist}
            onPlayPlaylist={handlePlayPlaylist}
            onDeletePlaylist={handleDeletePlaylist}
          />
        </div>
      </main>

      {/* Persistent Bottom MiniPlayerBar when navigating outside of Now Playing */}
      {activeView !== 'now-playing' && (
        <MiniPlayerBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          accentColor={currentTheme.accent}
          onTogglePlay={handleTogglePlay}
          onPrev={handlePrev}
          onNext={handleNext}
          onSeek={(time) => {
            playerRef.current?.seekTo(time);
            setCurrentTime(time);
          }}
          onChangeVolume={setVolume}
          onExpand={() => setActiveView('now-playing')}
        />
      )}

      {/* Quick Import Modal */}
      <QuickImportModal
        isOpen={isQuickImportOpen}
        onClose={() => setIsQuickImportOpen(false)}
        onPlayTrack={handlePlayTrack}
        onAddToQueue={handleAddToQueue}
      />

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
        sleepTimerRemaining={sleepTimerRemaining}
        onSetTimerMinutes={(mins) => {
          if (mins === null) {
            setSleepTimerRemaining(null);
            showToast('Sleep timer turned off.');
          } else {
            setSleepTimerRemaining(mins * 60);
            showToast(`Sleep timer set for ${mins} minutes.`);
          }
        }}
      />

      {/* Dedicated Mobile Bottom Navigation Bar (Phone First) */}
      <MobileBottomNav
        activeView={activeView}
        onSelectView={setActiveView}
        onPlayHindiRadio={handlePlayHindiRadio}
        isRadioPlaying={Boolean(currentTrack?.isLiveRadio && isPlaying)}
        queueCount={queue.length}
      />
    </div>
  );
}
