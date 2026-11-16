import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Track, RepeatMode, VisualizerMode, ActiveView, GenreCollection, Playlist, ThemePreset, StreamQuality, PlayerStyle } from './types/player';
import { THEME_PRESETS } from './utils/themeConfig';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NowPlayingHero } from './components/NowPlayingHero';
import { SearchBar } from './components/SearchBar';
import { TrackCard } from './components/TrackCard';
import { QueueDrawer } from './components/QueueDrawer';
import { CuratedVibes } from './components/CuratedVibes';
import { PlayerBottomBar } from './components/PlayerBottomBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { YouTubePlayer, YouTubePlayerHandle } from './components/YouTubePlayer';
import { QuickImportModal } from './components/QuickImportModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { getNextTrackIndex, getPrevTrackIndex, extractYouTubeId } from './utils/playerUtils';
import { Compass, AlertCircle } from 'lucide-react';

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
  const [themePreset] = useState<ThemePreset>('obsidian');
  const currentTheme = THEME_PRESETS[themePreset];

  // Sleep Timer Countdown
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  // Persist Volume
  useEffect(() => {
    localStorage.setItem('aura_volume', volume.toString());
  }, [volume]);

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
          if (!currentTrack && data.featured && data.featured.length > 0) {
            setCurrentTrack(data.featured[0]);
            setQueue(data.featured);
          }
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

  // Crossfade Track Switcher
  const isCrossfadingRef = useRef<boolean>(false);
  const crossfadeTimerRef = useRef<any>(null);

  const performTrackSwitch = useCallback(
    (targetTrack: Track, autoPlay = true) => {
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

    if (prevIdx !== null && queue[prevIdx]) {
      handlePlayTrack(queue[prevIdx]);
    } else {
      playerRef.current?.seekTo(0);
      setCurrentTime(0);
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
    showToast(`Removed from queue.`);
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
        showToast(`Removed from favorites: ${track.title}`);
        return prev.filter((f) => f.id !== track.id);
      } else {
        showToast(`Added to favorites: ${track.title}`);
        return [track, ...prev];
      }
    });
  };

  // Playlist Operations
  const handleCreatePlaylist = (name: string) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      tracks: currentTrack ? [currentTrack] : [],
      createdAt: Date.now(),
    };
    setPlaylists((prev) => [newPl, ...prev]);
    showToast(`Created playlist: "${name}"`);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length === 0) {
      showToast('This playlist has no songs yet.');
      return;
    }
    setQueue(playlist.tracks);
    handlePlayTrack(playlist.tracks[0]);
    setActiveView('now-playing');
    showToast(`Playing playlist: "${playlist.name}"`);
  };

  const handleDeletePlaylist = (id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
    showToast('Playlist deleted.');
  };

  // Keyboard Shortcuts (Space to play/pause, Arrow keys for seek & track skips)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        const nextTime = Math.min(duration || 9999, currentTime + 5);
        playerRef.current?.seekTo(nextTime);
        setCurrentTime(nextTime);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        const prevTime = Math.max(0, currentTime - 5);
        playerRef.current?.seekTo(prevTime);
        setCurrentTime(prevTime);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, handleNext, handlePrev, handleTogglePlay]);

  return (
    <div className="h-screen w-screen text-zinc-100 flex flex-col font-sans relative overflow-hidden bg-black stealth-bg select-none">
      {/* App Shell: Desktop Sidebar + Dynamic Center Stage */}
      <div className="flex-1 flex overflow-hidden relative z-10 min-h-0">
        {/* Desktop Sidebar Navigation */}
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          queueCount={queue.length}
          favoritesCount={favorites.length}
          playlists={playlists}
          onOpenQuickImport={() => setIsQuickImportOpen(true)}
          sleepTimerRemaining={sleepTimerRemaining}
          onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
          playbackQuality={playbackQuality}
          isPlaying={isPlaying}
        />

        {/* Dynamic Center Stage Area */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative bg-black/40">
          {/* Top Header */}
          <Header
            activeView={activeView}
            onSelectView={setActiveView}
            queueCount={queue.length}
            onOpenQuickImport={() => setIsQuickImportOpen(true)}
            sleepTimerRemaining={sleepTimerRemaining}
            onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
            onSearch={handleSearch}
          />

          {/* Center Stage Scrollable Canvas */}
          <main className="flex-1 overflow-y-auto px-3 sm:px-8 py-3 pb-36 md:pb-28 min-h-0">
            {/* VIEW 1: NOW PLAYING */}
            <div className={activeView === 'now-playing' ? 'h-full flex-1 flex flex-col justify-center items-center' : 'fixed -left-[99999px] top-0 opacity-0 pointer-events-none h-0 w-0 overflow-hidden'}>
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
                  setPlayerStyle((prev) => (prev === 'wavy' ? 'vinyl' : 'wavy'));
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
              />
            </div>

            {/* VIEW 2: SEARCH & DISCOVER */}
            <div className={activeView === 'discover' ? 'max-w-5xl mx-auto space-y-4 pb-6 min-h-0' : 'hidden'}>
              <div className="shrink-0">
                <SearchBar
                  onSearch={handleSearch}
                  onDirectPlay={handleDirectPlay}
                  isLoading={isSearching}
                  activeGenre={activeGenreFilter}
                  onSelectGenre={handleSelectGenreFilter}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
                  <h3 className="text-base font-bold tracking-tight text-white uppercase flex items-center gap-2">
                    <Compass className="w-4 h-4 text-white" />
                    <span>
                      {searchQuery
                        ? `Search Results: "${searchQuery}"`
                        : activeGenreFilter
                        ? `Collection: ${activeGenreFilter.toUpperCase()}`
                        : 'Catalog Discovery'}
                    </span>
                  </h3>
                  <span className="text-xs font-mono font-medium text-zinc-400 tabular-nums uppercase">
                    {searchResults.length} Tracks
                  </span>
                </div>

                {isSearching ? (
                  <div className="py-20 text-center text-zinc-500 space-y-3">
                    <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">Searching audio catalog...</p>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-20 text-center text-zinc-500">
                    <AlertCircle className="w-7 h-7 opacity-40 mx-auto mb-2 text-zinc-400" />
                    <p className="text-sm font-semibold uppercase tracking-wider text-zinc-300">No tracks located</p>
                    <p className="text-xs text-zinc-500 mt-1 font-mono">Check artist query or link.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pb-6">
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
            <div className={activeView === 'genres' ? 'max-w-5xl mx-auto pb-6' : 'hidden'}>
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

            {/* VIEW 4: QUEUE & LIBRARY */}
            <div className={activeView === 'queue' ? 'max-w-4xl mx-auto pb-6' : 'hidden'}>
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
        </div>
      </div>

      {/* Persistent Bottom Player Bar (Minimalist Monochrome) */}
      <div className={activeView === 'now-playing' ? 'hidden md:block' : 'block'}>
        <PlayerBottomBar
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          repeatMode={repeatMode}
          isShuffle={isShuffle}
          isFavorite={currentTrack ? favorites.some((f) => f.id === currentTrack.id) : false}
          isVideoVisible={isVideoVisible}
          onTogglePlay={handleTogglePlay}
          onPrev={handlePrev}
          onNext={handleNext}
          onSeek={(time) => {
            playerRef.current?.seekTo(time);
            setCurrentTime(time);
          }}
          onToggleShuffle={() => setIsShuffle(!isShuffle)}
          onToggleRepeat={() => {
            setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
          }}
          onChangeVolume={setVolume}
          onToggleFavorite={() => {
            if (currentTrack) handleToggleFavorite(currentTrack);
          }}
          onToggleVideo={() => setIsVideoVisible(!isVideoVisible)}
          onToggleLyrics={() => setActiveView('now-playing')}
          onExpandNowPlaying={() => setActiveView('now-playing')}
          onToggleQueue={() => setActiveView(activeView === 'queue' ? 'now-playing' : 'queue')}
        />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 glass-panel text-white text-xs font-semibold px-4 py-2.5 rounded-2xl border border-white/15 shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
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
        queueCount={queue.length}
      />
    </div>
  );
}
