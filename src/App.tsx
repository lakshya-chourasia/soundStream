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
import { SpotifyLayout } from './components/SpotifyLayout';
import { getNextTrackIndex, getPrevTrackIndex, extractYouTubeId, cleanTrackTitle, getDynamicTrackTag, getFullSingerName } from './utils/playerUtils';
import { prefetchArtwork } from './services/artworkService';
import { FALLBACK_CURATED_GENRES } from './data/curatedFallback';
import { backgroundAudio } from './services/backgroundAudioService';
import { Compass, AlertCircle, X } from 'lucide-react';

const INITIAL_STARTER_POOL: Track[] = [
  {
    id: '2Vv-BfVoq4g',
    title: 'Perfect',
    artist: 'Edward Christopher Sheeran',
    duration: '4:23',
    durationSec: 263,
    views: '3.6B views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/1200x1200bb.jpg',
  },
  {
    id: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'Abel Tesfaye (The Weeknd)',
    duration: '4:22',
    durationSec: 262,
    views: '800M views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/1200x1200bb.jpg',
  },
  {
    id: 'yKNxeF4KMsY',
    title: 'Yellow',
    artist: 'Chris Martin (Coldplay)',
    duration: '4:33',
    durationSec: 273,
    views: '1.3B views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/1200x1200bb.jpg',
  },
  {
    id: 'gGdGFtwCNBE',
    title: 'Mr. Brightside',
    artist: 'Brandon Flowers (The Killers)',
    duration: '3:48',
    durationSec: 228,
    views: '560M views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/11/64/9c/11649c80-2066-dba8-77a9-df7eecae26c1/17UM1IM06937.rgb.jpg/1200x1200bb.jpg',
  },
  {
    id: 'H5v3kku4y6Q',
    title: 'As It Was',
    artist: 'Harry Edward Styles',
    duration: '2:47',
    durationSec: 167,
    views: '850M views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/2a/19/fb/2a19fb85-2f70-9e44-f2a9-82abe679b88e/886449990061.jpg/1200x1200bb.jpg',
  },
  {
    id: 'TUVcZfQe-Kw',
    title: 'Levitating',
    artist: 'Dua Lipa',
    duration: '3:50',
    durationSec: 230,
    views: '920M views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/1200x1200bb.jpg',
  },
  {
    id: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    artist: 'Freddie Mercury (Queen)',
    duration: '6:00',
    durationSec: 360,
    views: '1.7B views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8b/0a/ea/8b0aea60-6f4a-195b-5958-cdf459c2333b/602527644271.jpg/1200x1200bb.jpg',
  },
  {
    id: 'bpOSxM0rNPM',
    title: 'Do I Wanna Know?',
    artist: 'Alex Turner (Arctic Monkeys)',
    duration: '4:26',
    durationSec: 266,
    views: '1.6B views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/69/9c/b5/699cb5d6-115c-ff73-9d26-e57ea4350d72/887828031795.png/1200x1200bb.jpg',
  },
  {
    id: 'IcrbM1l_BoI',
    title: 'Wake Me Up',
    artist: 'Aloe Blacc (Avicii)',
    duration: '4:32',
    durationSec: 272,
    views: '2.3B views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/18/5b/1e/185b1ef5-5d97-19d8-aebf-8e29e41874ef/13UAAIM59255.rgb.jpg/1200x1200bb.jpg',
  },
];

const getRandomStarterTrack = (): Track => {
  const idx = Math.floor(Math.random() * INITIAL_STARTER_POOL.length);
  return INITIAL_STARTER_POOL[idx];
};

export default function App() {
  const playerRef = useRef<YouTubePlayerHandle | null>(null);

  // Playback Restricted Video Filter List (persist across sessions)
  const [restrictedVideoIds, setRestrictedVideoIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('soundstream_restricted_ids');
      return saved ? new Set(JSON.parse(saved)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  // Core Player State (Randomized startup track - never fixed!)
  const [currentTrack, setCurrentTrack] = useState<Track>(getRandomStarterTrack);
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
    return saved || 'highres';
  });
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('spectrum');
  const [playerStyle, setPlayerStyle] = useState<PlayerStyle>('wavy');
  const [isVideoVisible, setIsVideoVisible] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState<boolean>(false);
  const [crossfadeDuration, setCrossfadeDuration] = useState<number>(1.5);

  // Persist Quality
  useEffect(() => {
    localStorage.setItem('soundstream_quality', playbackQuality);
  }, [playbackQuality]);

  // Navigation & Modals State
  const [activeView, setActiveView] = useState<ActiveView>('now-playing');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('love-2k20');
  const [isQuickImportOpen, setIsQuickImportOpen] = useState<boolean>(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Playlists, Favorites, and Queue (Random Starter Pool)
  const [queue, setQueue] = useState<Track[]>(() => [getRandomStarterTrack()]);
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

  // Discovery & Genres (Initialized with static fallback so Vercel renders instantly)
  const [genres, setGenres] = useState<GenreCollection[]>(FALLBACK_CURATED_GENRES);
  const [searchResults, setSearchResults] = useState<Track[]>(() => FALLBACK_CURATED_GENRES[0]?.tracks || []);
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

  // Dynamic Recommendations State
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState<boolean>(false);

  const fetchRecommendations = useCallback(async (targetTrack?: Track) => {
    const track = targetTrack || currentTrack;
    if (!track) return;

    setIsRecommendationsLoading(true);
    try {
      const { title: cleanT, artistFromTitle } = cleanTrackTitle(track.title);
      const artist = artistFromTitle || track.artist || '';
      const res = await fetch(
        `/api/recommendations?trackId=${encodeURIComponent(track.id)}&artist=${encodeURIComponent(artist)}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.recommendations && data.recommendations.length > 0) {
          setRecommendations(data.recommendations);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch recommendations:', err);
    } finally {
      setIsRecommendationsLoading(false);
    }
  }, [currentTrack]);

  // Fetch Initial Curated Soundscapes (Random Flexible Starter — Never Fixed!)
  useEffect(() => {
    fetch('/api/curated')
      .then((res) => res.json())
      .then((data) => {
        if (data.genres && data.genres.length > 0) {
          setGenres(data.genres);

          // Flatten all tracks across all soundscapes
          const allCurated = data.genres
            .flatMap((g: GenreCollection) => g.tracks || [])
            .filter((t: Track) => !restrictedVideoIds.has(t.id));

          if (allCurated.length > 0) {
            // Pick a randomized starter track from the pool
            const starter: Track =
              data.randomStarter && !restrictedVideoIds.has(data.randomStarter.id)
                ? data.randomStarter
                : allCurated[Math.floor(Math.random() * allCurated.length)];

            setCurrentTrack(starter);

            // Sync parent soundscape collection
            const parentGenre = data.genres.find((g: GenreCollection) =>
              g.tracks?.some((t: Track) => t.id === starter.id)
            );
            if (parentGenre) setSelectedCollectionId(parentGenre.id);

            // Build diverse initial queue
            const otherTracks = allCurated.filter((t: Track) => t.id !== starter.id);
            const shuffled = [...otherTracks].sort(() => 0.5 - Math.random());
            setQueue([starter, ...shuffled.slice(0, 9)]);

            // Immediately load recommendations for this starter track
            fetchRecommendations(starter);
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

  // Refetch recommendations whenever currentTrack changes
  useEffect(() => {
    if (currentTrack?.id) {
      fetchRecommendations(currentTrack);
    }
  }, [currentTrack?.id]);

  // Prefetch artwork for upcoming tracks in the queue and recommendations
  useEffect(() => {
    if (queue.length > 0) {
      prefetchArtwork(queue.slice(0, 6));
    }
  }, [queue]);

  useEffect(() => {
    if (recommendations.length > 0) {
      prefetchArtwork(recommendations.slice(0, 4));
    }
  }, [recommendations]);

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

  // Select Curated Collection from Dropdown
  const handleSelectCollection = (genreId: string) => {
    setSelectedCollectionId(genreId);
    const col = genres.find((g) => g.id === genreId);
    if (col && col.tracks && col.tracks.length > 0) {
      setQueue(col.tracks);
      handlePlayTrack(col.tracks[0]);
      showToast(`Loaded: ${col.name}`);
    }
  };

  const handleSelectGenreFilter = async (genreId: string) => {
    setActiveGenreFilter(genreId);
    const selected = genres.find((g) => g.id === genreId);
    if (selected && selected.tracks) {
      setSearchResults(selected.tracks);
    }
  };

  // Play Specific Track
  const handlePlayTrack = useCallback((track: Track) => {
    const isSameTrack = currentTrack?.id === track.id;
    setCurrentTrack(track);

    setQueue((prevQueue) => {
      const exists = prevQueue.some((t) => t.id === track.id);
      if (!exists) {
        return [track, ...prevQueue];
      }
      return prevQueue;
    });

    if (isSameTrack) {
      setIsPlaying(true);
      playerRef.current?.play();
    } else {
      setCurrentTime(0);
      setIsPlaying(true);
      setIsBuffering(true);
    }
  }, [currentTrack]);

  // Upgrade track thumbnail to ultra-high-resolution 1200x1200bb studio master artwork
  useEffect(() => {
    if (!currentTrack) return;
    if (currentTrack.thumbnail && currentTrack.thumbnail.includes('1200x1200bb')) return;

    const { title, artistFromTitle } = cleanTrackTitle(currentTrack.title);
    const artist = artistFromTitle || currentTrack.artist || '';

    fetch(`/api/highres-artwork?track=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.artworkUrl) {
          const highRes = data.artworkUrl;
          setCurrentTrack((prev) => (prev && prev.id === currentTrack.id ? { ...prev, thumbnail: highRes } : prev));
          setQueue((prevQueue) =>
            prevQueue.map((t) => (t.id === currentTrack.id ? { ...t, thumbnail: highRes } : t))
          );
        }
      })
      .catch(() => {});
  }, [currentTrack?.id]);

  // Aggressively prefetch and cache artwork for queue and recommendations
  useEffect(() => {
    const candidateTracks = [...queue, ...recommendations];
    if (candidateTracks.length > 0) {
      prefetchArtwork(candidateTracks, 25);
    }
  }, [queue, recommendations]);

  // Handle and filter playback-restricted videos automatically
  const handlePlaybackRestricted = useCallback(
    (restrictedTrack: Track, errorCode: number) => {
      console.warn(`[Restricted Video Blocked] ID: ${restrictedTrack.id} - ${restrictedTrack.title} (code ${errorCode})`);

      // 1. Add to blacklist & persist in localStorage so it never renders again
      setRestrictedVideoIds((prev) => {
        const updated = new Set(prev);
        updated.add(restrictedTrack.id);
        try {
          localStorage.setItem('soundstream_restricted_ids', JSON.stringify(Array.from(updated)));
        } catch {}
        return updated;
      });

      // Report to backend blacklist
      fetch('/api/report-restricted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: restrictedTrack.id }),
      }).catch(() => {});

      // 2. Remove immediately from queue and search results
      setQueue((prevQueue) => prevQueue.filter((t) => t.id !== restrictedTrack.id));
      setSearchResults((prevResults) => prevResults.filter((t) => t.id !== restrictedTrack.id));

      // 3. Immediately auto-play the next available non-restricted track
      setQueue((currentQueue) => {
        const playableRemaining = currentQueue.filter(
          (t) => t.id !== restrictedTrack.id && !restrictedVideoIds.has(t.id)
        );

        if (playableRemaining.length > 0) {
          const nextTrack = playableRemaining[0];
          setTimeout(() => {
            handlePlayTrack(nextTrack);
            showToast(`Skipped restricted video: "${restrictedTrack.title}". Playing next.`);
          }, 50);
        } else {
          // If queue had only that track, search for an embed-playable audio stream
          fetch(`/api/search?q=${encodeURIComponent(restrictedTrack.title + ' audio')}`)
            .then((res) => res.json())
            .then((data) => {
              const fallbackTrack = data.tracks?.find(
                (t: Track) => t.id !== restrictedTrack.id && !restrictedVideoIds.has(t.id)
              );
              if (fallbackTrack) {
                handlePlayTrack(fallbackTrack);
                showToast(`Streaming embed-friendly version of "${restrictedTrack.title}"`);
              } else {
                showToast(`"${restrictedTrack.title}" has playback restrictions.`);
              }
            })
            .catch(() => {
              showToast(`"${restrictedTrack.title}" has playback restrictions.`);
            });
        }
        return playableRemaining;
      });
    },
    [handlePlayTrack, restrictedVideoIds]
  );

  // Direct Play
  const handleDirectPlay = (urlOrId: string) => {
    const id = extractYouTubeId(urlOrId) || urlOrId;
    const track: Track = {
      id,
      title: 'Imported Track',
      artist: 'YouTube Audio',
      duration: '4:00',
      durationSec: 240,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    };
    handlePlayTrack(track);
    setActiveView('now-playing');
    showToast(`Streaming "${track.title}"`);
  };

  // Play Genre
  const handlePlayGenre = (genre: GenreCollection) => {
    if (genre && genre.tracks.length > 0) {
      setQueue(genre.tracks);
      handlePlayTrack(genre.tracks[0]);
      setActiveView('now-playing');
      showToast(`Started playlist: ${genre.name}`);
    }
  };

  // Transport Handlers
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      playerRef.current?.pause();
    } else {
      setIsPlaying(true);
      playerRef.current?.play();
    }
  };

  const handleNext = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = getNextTrackIndex(currentIndex, queue.length, repeatMode, isShuffle, playedHistory);

    if (nextIndex === null || nextIndex === -1) {
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    setPlayedHistory((prev) => [...prev, currentIndex]);
    const nextTrack = queue[nextIndex];
    if (nextTrack) handlePlayTrack(nextTrack);
  }, [currentTrack, isShuffle, playedHistory, queue, repeatMode]);

  const handlePrev = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = getPrevTrackIndex(currentIndex, queue.length, currentTime);
    const prevTrack = queue[prevIndex];
    if (prevTrack) handlePlayTrack(prevTrack);
  }, [currentTime, currentTrack, queue]);

  // Queue Management
  const handleAddToQueue = (track: Track) => {
    if (queue.some((t) => t.id === track.id)) {
      showToast(`"${track.title}" is already in queue.`);
      return;
    }
    setQueue((prev) => [...prev, track]);
    showToast(`Added to queue: "${track.title}"`);
  };

  const handleRemoveFromQueue = (track: Track) => {
    setQueue((prev) => prev.filter((t) => t.id !== track.id));
  };

  const handleClearQueue = () => {
    if (currentTrack) {
      setQueue([currentTrack]);
    } else {
      setQueue([]);
    }
    showToast('Queue cleared.');
  };

  // Favorites
  const handleToggleFavorite = (track: Track) => {
    setFavorites((prev) => {
      const exists = prev.some((t) => t.id === track.id);
      if (exists) {
        showToast(`Removed from liked songs`);
        return prev.filter((t) => t.id !== track.id);
      } else {
        showToast(`Saved to liked songs`);
        return [...prev, track];
      }
    });
  };

  // Playlists
  const handleCreatePlaylist = (name: string) => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      tracks: currentTrack ? [currentTrack] : [],
      createdAt: Date.now(),
    };
    setPlaylists((prev) => [...prev, newPlaylist]);
    showToast(`Created playlist "${name}"`);
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist && playlist.tracks.length > 0) {
      setQueue(playlist.tracks);
      handlePlayTrack(playlist.tracks[0]);
      setActiveView('now-playing');
      showToast(`Playing playlist: "${playlist.name}"`);
    }
  };

  const handleDeletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
    showToast('Playlist deleted');
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleTogglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          const forwardT = Math.min(duration || 9999, currentTime + 5);
          playerRef.current?.seekTo(forwardT);
          setCurrentTime(forwardT);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          const backT = Math.max(0, currentTime - 5);
          playerRef.current?.seekTo(backT);
          setCurrentTime(backT);
          break;
        case 'KeyN':
          handleNext();
          break;
        case 'KeyP':
          handlePrev();
          break;
        case 'KeyM':
          setVolume((prev) => (prev > 0 ? 0 : 80));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, handleNext, handlePrev, handleTogglePlay]);

  // Hook background audio service to player handle for seamless background auto-recovery
  useEffect(() => {
    backgroundAudio.registerResumeCallback(() => {
      if (isPlaying && playerRef.current) {
        playerRef.current.play();
      }
    });
  }, [isPlaying]);

  // Synchronize Android MediaSession & Background Audio Playback
  useEffect(() => {
    if (!currentTrack) return;
    const { title: cleanT, artistFromTitle } = cleanTrackTitle(currentTrack.title);
    const artist = getFullSingerName(currentTrack.artist || artistFromTitle || '', cleanT);

    backgroundAudio.updateMediaSession({
      title: cleanT,
      artist,
      album: 'Melophile',
      artwork: currentTrack.thumbnail,
      isPlaying,
      currentTime,
      duration,
      onPlay: () => {
        setIsPlaying(true);
        playerRef.current?.play();
      },
      onPause: () => {
        setIsPlaying(false);
        playerRef.current?.pause();
      },
      onNext: handleNext,
      onPrev: handlePrev,
      onSeek: (time: number) => {
        playerRef.current?.seekTo(time);
        setCurrentTime(time);
      },
    });
  }, [currentTrack, isPlaying, currentTime, duration, handleNext, handlePrev]);

  // Dynamically compute active context as track changes — NO HARDCODED STRINGS
  const { title: cleanCurrentTitle, artistFromTitle: currentArtistFromTitle } = cleanTrackTitle(currentTrack?.title || '');
  const rawCurrentArtist = currentTrack?.artist || currentArtistFromTitle || 'Melophile';
  const currentArtist = getFullSingerName(rawCurrentArtist, cleanCurrentTitle);
  const activeCollection = genres.find((g) => g.id === selectedCollectionId && g.tracks?.some((t) => t.id === currentTrack?.id));
  const dynamicPlaylistTitle = activeCollection ? activeCollection.name : currentArtist.toUpperCase();
  const dynamicGenreTag = (activeCollection as any)?.tag || getDynamicTrackTag(cleanCurrentTitle, currentArtist, currentTrack?.views);

  return (
    <div className="h-screen w-screen text-white flex flex-col font-sans relative overflow-hidden bg-black select-none">
      <SpotifyLayout
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        isBuffering={isBuffering}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        repeatMode={repeatMode}
        isShuffle={isShuffle}
        isVideoVisible={isVideoVisible}
        playbackQuality={playbackQuality}
        onChangePlaybackQuality={(q) => {
          setPlaybackQuality(q);
          showToast(`Audio quality switched to ${q.toUpperCase()}`);
        }}
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
            onPlaybackRestricted={handlePlaybackRestricted}
          />
        }
        queue={queue.filter((t) => !restrictedVideoIds.has(t.id))}
        recommendations={recommendations.filter((t) => !restrictedVideoIds.has(t.id))}
        favorites={favorites}
        searchQuery={searchQuery}
        searchResults={searchResults.filter((t) => !restrictedVideoIds.has(t.id))}
        isSearching={isSearching}
        sleepTimerRemaining={sleepTimerRemaining}
        onTogglePlay={handleTogglePlay}
        onSeek={(time) => {
          playerRef.current?.seekTo(time);
          setCurrentTime(time);
        }}
        onPrev={handlePrev}
        onNext={handleNext}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onToggleRepeat={() => {
          setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
        }}
        onChangeVolume={setVolume}
        onToggleVideo={() => setIsVideoVisible(!isVideoVisible)}
        onPlayTrack={handlePlayTrack}
        onAddToQueue={handleAddToQueue}
        onToggleFavorite={handleToggleFavorite}
        onSearch={handleSearch}
        onClearSearch={() => {
          setSearchQuery('');
          setSearchResults([]);
        }}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        onOpenQuickImport={() => setIsQuickImportOpen(true)}
        genres={genres}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-4 right-4 sm:left-auto sm:right-8 z-50 bg-black/95 backdrop-blur-xl text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/20 shadow-2xl flex items-center justify-between sm:justify-start gap-2.5 animate-in">
          <div className="flex items-center gap-2.5 truncate">
            <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15] shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:text-white/60 text-white/40 sm:hidden shrink-0"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
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
    </div>
  );
}
