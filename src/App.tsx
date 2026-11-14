import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Track, RepeatMode, VisualizerMode, ActiveView, GenreCollection, Playlist, ThemePreset } from './types/player';
import { THEME_PRESETS } from './utils/themeConfig';
import { Header } from './components/Header';
import { NowPlayingHero } from './components/NowPlayingHero';
import { SearchBar } from './components/SearchBar';
import { TrackCard } from './components/TrackCard';
import { QueueDrawer } from './components/QueueDrawer';
import { CuratedVibes } from './components/CuratedVibes';
import { MiniPlayerBar } from './components/MiniPlayerBar';
import { YouTubePlayer, YouTubePlayerHandle } from './components/YouTubePlayer';
import { QuickImportModal } from './components/QuickImportModal';
import { SleepTimerModal } from './components/SleepTimerModal';
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
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('spectrum');
  const [isVideoVisible, setIsVideoVisible] = useState<boolean>(false);
  const [crossfadeDuration, setCrossfadeDuration] = useState<number>(() => {
    const saved = localStorage.getItem('aura_crossfade');
    return saved !== null ? Number(saved) : 1.5;
  });

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
        playerRef.current?.loadTrack(targetTrack.id, autoPlay);
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
          playerRef.current?.loadTrack(targetTrack.id, true);

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
      className={`min-h-screen ${isDarkMode ? currentTheme.bgClass : 'bg-stone-50'} text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden`}
      style={{
        backgroundImage: isDarkMode
          ? `radial-gradient(circle at 50% 20%, ${currentTheme.accent}14 0%, transparent 60%)`
          : `radial-gradient(circle at 50% 20%, ${currentTheme.accent}0a 0%, transparent 60%)`,
      }}
    >
      {/* Top Navigation Bar */}
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        queueCount={queue.length}
        onOpenQuickImport={() => setIsQuickImportOpen(true)}
        sleepTimerRemaining={sleepTimerRemaining}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        themePreset={themePreset}
        onChangeThemePreset={setThemePreset}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed top-18 right-6 z-50 bg-zinc-900/95 text-zinc-100 text-xs px-3.5 py-2 rounded-xl border shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2"
          style={{ borderColor: `${currentTheme.accent}40` }}
        >
          <Info className="w-4 h-4 shrink-0" style={{ color: currentTheme.accent }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 pb-28">
        {/* VIEW 1: NOW PLAYING (kept in DOM with off-screen positioning so audio never pauses during tab switching) */}
        <div className={activeView === 'now-playing' ? 'block space-y-6' : 'fixed -left-[99999px] top-0 opacity-0 pointer-events-none h-0 w-0 overflow-hidden'}>
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
            visualizerMode={visualizerMode}
            isVideoVisible={isVideoVisible}
            themeConfig={currentTheme}
            videoSlot={
              <YouTubePlayer
                ref={playerRef}
                currentTrack={currentTrack}
                isPlaying={isPlaying}
                volume={volume}
                playbackRate={playbackRate}
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
            onChangeVisualizerMode={setVisualizerMode}
            onToggleVideo={() => setIsVideoVisible(!isVideoVisible)}
            onToggleFavorite={() => {
              if (currentTrack) handleToggleFavorite(currentTrack);
            }}
          />

          {/* Quick Up Next Preview Strip */}
          {queue.length > 1 && (
            <div className="max-w-xl mx-auto pt-6 border-t border-zinc-200 dark:border-zinc-800/60">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
                <span>Up Next in Queue</span>
                <button
                  onClick={() => setActiveView('queue')}
                  className="text-amber-500 hover:text-amber-400 font-medium"
                >
                  View All ({queue.length})
                </button>
              </div>
              <div className="space-y-1">
                {queue
                  .filter((t) => t.id !== currentTrack?.id)
                  .slice(0, 3)
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

        {/* VIEW 2: SEARCH & BROWSE */}
        <div className={activeView === 'discover' ? 'block space-y-6' : 'hidden'}>
          <SearchBar
            onSearch={handleSearch}
            onDirectPlay={handleDirectPlay}
            isLoading={isSearching}
            activeGenre={activeGenreFilter}
            onSelectGenre={handleSelectGenreFilter}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-500" />
                <span>
                  {searchQuery
                    ? `Search Results for "${searchQuery}"`
                    : activeGenreFilter
                    ? `Featured in ${activeGenreFilter.toUpperCase()}`
                    : 'Featured Music'}
                </span>
              </h3>
              <span className="text-xs text-zinc-400 font-mono tabular-nums">
                {searchResults.length} tracks
              </span>
            </div>

            {isSearching ? (
              <div className="py-16 text-center text-zinc-500 space-y-2">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Fetching tracks from YouTube...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-16 text-center text-zinc-500">
                <AlertCircle className="w-8 h-8 opacity-30 mx-auto mb-2" />
                <p className="text-sm font-medium">No results found.</p>
                <p className="text-xs text-zinc-400 mt-1">Try a different song or artist query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
            )}
          </div>
        </div>

        {/* VIEW 3: CURATED VIBES */}
        <div className={activeView === 'genres' ? 'block' : 'hidden'}>
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
        <div className={activeView === 'queue' ? 'block' : 'hidden'}>
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
    </div>
  );
}
