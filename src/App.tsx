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
import { SpotifyLayout } from './components/SpotifyLayout';
import { getNextTrackIndex, getPrevTrackIndex, extractYouTubeId, cleanTrackTitle, getDynamicTrackTag, getFullSingerName, cryptoShuffleList, pickCryptoRandom } from './utils/playerUtils';
import { prefetchArtwork } from './services/artworkService';
import { FALLBACK_CURATED_GENRES } from './data/curatedFallback';
import { backgroundAudio } from './services/backgroundAudioService';
import { getQualityOption } from './utils/qualityConfig';
import { X, CheckCircle2 } from 'lucide-react';

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
  return pickCryptoRandom(INITIAL_STARTER_POOL) || INITIAL_STARTER_POOL[0];
};

const getShuffledFallbackGenres = (): GenreCollection[] => {
  return cryptoShuffleList(FALLBACK_CURATED_GENRES).map((g) => ({
    ...g,
    tracks: cryptoShuffleList(g.tracks || []),
  }));
};

const SEEN_IDS_STORAGE_KEY = 'melophile_seen_random_ids';

function loadSessionSeenIds(): string[] {
  try {
    const raw = sessionStorage.getItem(SEEN_IDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export default function App() {
  const playerRef = useRef<YouTubePlayerHandle | null>(null);
  const hasUserInteractedRef = useRef<boolean>(false);
  const seenTrackIdsRef = useRef<string[]>(loadSessionSeenIds());

  const rememberSeenIds = useCallback((ids: string[]) => {
    const merged = [...seenTrackIdsRef.current];
    for (const id of ids) {
      if (!id) continue;
      const idx = merged.indexOf(id);
      if (idx !== -1) merged.splice(idx, 1);
      merged.push(id);
    }
    if (merged.length > 160) {
      merged.splice(0, merged.length - 160);
    }
    seenTrackIdsRef.current = merged;
    try {
      sessionStorage.setItem(SEEN_IDS_STORAGE_KEY, JSON.stringify(merged));
    } catch {}
  }, []);

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

  // Navigation & Notifications State
  const [activeView, setActiveView] = useState<ActiveView>('now-playing');
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('love-2k20');
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

  // Discovery & Genres (Cryptographically shuffled even on initial paint before live random universe loads)
  const [genres, setGenres] = useState<GenreCollection[]>(() => getShuffledFallbackGenres());
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [popularTracks, setPopularTracks] = useState<Track[]>([]);
  const [isRandomizingFeed, setIsRandomizingFeed] = useState<boolean>(false);
  const [isSurpriseLoading, setIsSurpriseLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Track[]>(() =>
    cryptoShuffleList(FALLBACK_CURATED_GENRES.flatMap((g) => g.tracks || [])).slice(0, 12)
  );
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeGenreFilter, setActiveGenreFilter] = useState<string | null>(null);

  // Theme State
  const [themePreset] = useState<ThemePreset>('obsidian');
  const currentTheme = THEME_PRESETS[themePreset];

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

  // Dynamic Random Recommendations State
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [isRecommendationsLoading, setIsRecommendationsLoading] = useState<boolean>(false);

  const buildExcludeQuery = useCallback(
    (extraIds: string[] = []) => {
      const combined = new Set<string>([
        ...seenTrackIdsRef.current.slice(-110),
        ...Array.from(restrictedVideoIds),
        ...extraIds,
      ]);
      return Array.from(combined).slice(-130).join(',');
    },
    [restrictedVideoIds]
  );

  const fetchRecommendations = useCallback(
    async (targetTrack?: Track) => {
      const track = targetTrack || currentTrack;
      setIsRecommendationsLoading(true);
      try {
        const exclude = buildExcludeQuery(track ? [track.id] : []);
        const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const params = new URLSearchParams({
          trackId: track?.id || '',
          limit: '12',
          exclude,
          nonce,
        });
        const res = await fetch(`/api/recommendations?${params.toString()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.recommendations && data.recommendations.length > 0) {
            const freshRecs: Track[] = cryptoShuffleList(data.recommendations);
            setRecommendations(freshRecs);
            rememberSeenIds(freshRecs.map((t) => t.id));
          }
        }
      } catch (err) {
        console.warn('Failed to fetch random recommendations:', err);
      } finally {
        setIsRecommendationsLoading(false);
      }
    },
    [buildExcludeQuery, currentTrack, rememberSeenIds]
  );

  const loadRandomUniverse = useCallback(
    async (options: { isInitial?: boolean; notify?: boolean } = {}) => {
      const { isInitial = false, notify = false } = options;
      setIsRandomizingFeed(true);
      try {
        const exclude = buildExcludeQuery();
        const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const res = await fetch(
          `/api/curated?exclude=${encodeURIComponent(exclude)}&nonce=${encodeURIComponent(nonce)}`,
          { cache: 'no-store' }
        );
        const data = await res.json();

        if (data.genres && data.genres.length > 0) {
          const liveGenres: GenreCollection[] = data.genres;
          setGenres(liveGenres);

          const allFresh = liveGenres
            .flatMap((g: GenreCollection) => g.tracks || [])
            .filter((t: Track) => !restrictedVideoIds.has(t.id));

          const freshFeatured: Track[] =
            Array.isArray(data.featured) && data.featured.length > 0
              ? data.featured.filter((t: Track) => !restrictedVideoIds.has(t.id))
              : cryptoShuffleList(allFresh).slice(0, 4);

          const freshPopular: Track[] =
            Array.isArray(data.popular) && data.popular.length > 0
              ? data.popular.filter((t: Track) => !restrictedVideoIds.has(t.id))
              : cryptoShuffleList(allFresh).slice(0, 9);

          setFeaturedTracks(freshFeatured);
          setPopularTracks(freshPopular);
          rememberSeenIds(allFresh.map((t) => t.id));

          if (isInitial && allFresh.length > 0 && !hasUserInteractedRef.current) {
            const starter: Track =
              data.randomStarter && !restrictedVideoIds.has(data.randomStarter.id)
                ? data.randomStarter
                : pickCryptoRandom(allFresh) || allFresh[0];

            setCurrentTrack(starter);
            const parentGenre = liveGenres.find((g) => g.tracks?.some((t) => t.id === starter.id));
            if (parentGenre) setSelectedCollectionId(parentGenre.id);

            const otherTracks = cryptoShuffleList(allFresh.filter((t) => t.id !== starter.id));
            setQueue([starter, ...otherTracks.slice(0, 10)]);
            fetchRecommendations(starter);
          } else if (!isInitial) {
            fetchRecommendations(currentTrack || undefined);
          }

          if (notify) {
            showToast('Generated a brand-new random music mix');
          }
        }
      } catch (err) {
        console.error('Failed to generate random music universe:', err);
        if (notify) showToast('Shuffled a fresh local mix');
      } finally {
        setIsRandomizingFeed(false);
      }
    },
    [buildExcludeQuery, currentTrack, fetchRecommendations, rememberSeenIds, restrictedVideoIds]
  );

  // Fetch Initial Totally Random Universe on Mount
  useEffect(() => {
    loadRandomUniverse({ isInitial: true, notify: false });
  }, []);

  // Refetch totally fresh random recommendations whenever currentTrack changes
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
      if (Array.isArray(data.tracks) && data.tracks.length > 0) {
        setSearchResults(data.tracks);
        return;
      }
      throw new Error('Empty search results');
    } catch (err: any) {
      console.warn('Network search error, using local pool:', err);
      const lower = q.toLowerCase();
      const localPool = [
        ...INITIAL_STARTER_POOL,
        ...FALLBACK_CURATED_GENRES.flatMap((g) => g.tracks || []),
        ...genres.flatMap((g) => g.tracks || []),
        ...recommendations,
      ];
      const matched = localPool.filter(
        (t) =>
          t.title.toLowerCase().includes(lower) ||
          t.artist.toLowerCase().includes(lower)
      );
      if (matched.length > 0) {
        const seen = new Set<string>();
        const unique = matched.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)));
        setSearchResults(unique.slice(0, 16));
      } else {
        showToast('No matching songs found in local catalog.');
      }
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
    hasUserInteractedRef.current = true;
    // Arm Android 30s background audio anchor synchronously inside the user gesture
    backgroundAudio.armFromUserGesture();
    const isSameTrack = currentTrack?.id === track.id;
    setCurrentTrack(track);
    rememberSeenIds([track.id]);

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
  }, [currentTrack, rememberSeenIds]);

  // Surprise Me: Pick and immediately play a totally random unseen song from the live engine
  const handleSurprisePlay = useCallback(async () => {
    hasUserInteractedRef.current = true;
    setIsSurpriseLoading(true);
    try {
      const exclude = buildExcludeQuery(currentTrack ? [currentTrack.id] : []);
      const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const res = await fetch(
        `/api/random-track?exclude=${encodeURIComponent(exclude)}&nonce=${encodeURIComponent(nonce)}`,
        { cache: 'no-store' }
      );
      if (!res.ok) throw new Error('Random track fetch failed');
      const data = await res.json();
      const picked: Track | undefined = data.track;
      const upNext: Track[] = Array.isArray(data.upNext) ? data.upNext : [];

      if (picked && !restrictedVideoIds.has(picked.id)) {
        rememberSeenIds([picked.id, ...upNext.map((t) => t.id)]);
        setQueue((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const freshAddons = [picked, ...upNext].filter(
            (t) => !existingIds.has(t.id) && !restrictedVideoIds.has(t.id)
          );
          return [picked, ...prev.filter((t) => t.id !== picked.id), ...freshAddons.filter((t) => t.id !== picked.id)];
        });
        handlePlayTrack(picked);
        const { title: cleanT } = cleanTrackTitle(picked.title);
        showToast(`Random pick: "${cleanT}"`);
      }
    } catch {
      const pool = cryptoShuffleList([
        ...genres.flatMap((g) => g.tracks || []),
        ...recommendations,
      ]).filter((t) => t.id !== currentTrack?.id && !restrictedVideoIds.has(t.id));
      const fallbackPick = pickCryptoRandom(pool);
      if (fallbackPick) {
        handlePlayTrack(fallbackPick);
        showToast(`Random pick: "${cleanTrackTitle(fallbackPick.title).title}"`);
      }
    } finally {
      setIsSurpriseLoading(false);
    }
  }, [buildExcludeQuery, currentTrack, genres, handlePlayTrack, recommendations, rememberSeenIds, restrictedVideoIds]);

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
  const handleTogglePlay = useCallback(() => {
    hasUserInteractedRef.current = true;
    if (isPlaying) {
      backgroundAudio.disarm();
      setIsPlaying(false);
      playerRef.current?.pause();
    } else {
      // Arm Android background anchor synchronously inside tap/click gesture
      backgroundAudio.armFromUserGesture();
      setIsPlaying(true);
      playerRef.current?.play();
    }
  }, [isPlaying]);

  const handleNext = useCallback(() => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = getNextTrackIndex(currentIndex, queue.length, repeatMode, isShuffle, playedHistory);

    if (nextIndex === null || nextIndex === -1) {
      // Infinite Random Autoplay: seamlessly pull a totally unseen random song when queue finishes
      handleSurprisePlay();
      return;
    }

    setPlayedHistory((prev) => [...prev, currentIndex]);
    const nextTrack = queue[nextIndex];
    if (nextTrack) handlePlayTrack(nextTrack);
  }, [currentTrack, handlePlayTrack, handleSurprisePlay, isShuffle, playedHistory, queue, repeatMode]);

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

  // Connect background audio watchdog bridge to the YouTube player instance
  useEffect(() => {
    backgroundAudio.registerPlayerBridge({
      isActuallyPlaying: () => playerRef.current?.isActuallyPlaying() ?? false,
      forceBackgroundResume: () => playerRef.current?.forceBackgroundResume(),
      getCurrentTime: () => playerRef.current?.getCurrentTime() ?? 0,
      getDuration: () => playerRef.current?.getDuration() ?? 0,
    });
  }, []);

  // 1. Android Lock-Screen & Notification Metadata (only updates when track info changes)
  useEffect(() => {
    if (!currentTrack) return;
    const { title: cleanT, artistFromTitle } = cleanTrackTitle(currentTrack.title);
    const artist = getFullSingerName(currentTrack.artist || artistFromTitle || '', cleanT);

    backgroundAudio.updateMetadata({
      title: cleanT,
      artist,
      album: 'Melophile',
      artwork: currentTrack.thumbnail,
    });
  }, [currentTrack?.id, currentTrack?.title, currentTrack?.artist, currentTrack?.thumbnail]);

  // 2. Android MediaSession Playback State + 30s Audio Anchor & Web Lock sync
  useEffect(() => {
    backgroundAudio.updatePlaybackState(isPlaying);
  }, [isPlaying]);

  // 3. Android Lock-Screen Progress Bar (throttled inside backgroundAudio)
  useEffect(() => {
    if (duration > 0) {
      backgroundAudio.updatePositionState(currentTime, duration, playbackRate);
    }
  }, [currentTime, duration, playbackRate]);

  // 4. Native Android Lock-Screen, Notification Shade & Bluetooth Hardware Controls
  useEffect(() => {
    backgroundAudio.setActionHandlers({
      onPlay: () => {
        setIsPlaying(true);
        playerRef.current?.play();
      },
      onPause: () => {
        setIsPlaying(false);
        playerRef.current?.pause();
      },
      onStop: () => {
        setIsPlaying(false);
        playerRef.current?.pause();
      },
      onNext: handleNext,
      onPrev: handlePrev,
      onSeek: (time: number) => {
        playerRef.current?.seekTo(time);
        setCurrentTime(time);
        if (duration > 0) {
          backgroundAudio.updatePositionState(time, duration, playbackRate, true);
        }
      },
    });
  }, [handleNext, handlePrev, duration, playbackRate]);

  // Dynamically compute active context as track changes — NO HARDCODED STRINGS
  const { title: cleanCurrentTitle, artistFromTitle: currentArtistFromTitle } = cleanTrackTitle(currentTrack?.title || '');
  const rawCurrentArtist = currentTrack?.artist || currentArtistFromTitle || 'Melophile';
  const currentArtist = getFullSingerName(rawCurrentArtist, cleanCurrentTitle);
  const activeCollection = genres.find((g) => g.id === selectedCollectionId && g.tracks?.some((t) => t.id === currentTrack?.id));
  const dynamicPlaylistTitle = activeCollection ? activeCollection.name : currentArtist.toUpperCase();
  const dynamicGenreTag = (activeCollection as any)?.tag || getDynamicTrackTag(cleanCurrentTitle, currentArtist, currentTrack?.views);

  return (
    <div className="h-screen w-screen text-zinc-100 flex flex-col font-sans relative overflow-hidden bg-[#09090B] select-none">
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
          const opt = getQualityOption(q);
          showToast(`Stream quality set to ${opt.label}`);
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
        onSetVideoVisible={(visible) => setIsVideoVisible(visible)}
        onPlayTrack={handlePlayTrack}
        onPlayGenre={handlePlayGenre}
        onAddToQueue={handleAddToQueue}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={handleClearQueue}
        onToggleFavorite={handleToggleFavorite}
        onSearch={handleSearch}
        onClearSearch={() => {
          setSearchQuery('');
          setSearchResults([]);
        }}
        genres={genres}
        featuredTracks={featuredTracks}
        popularTracks={popularTracks}
        isRandomizingFeed={isRandomizingFeed}
        isSurpriseLoading={isSurpriseLoading}
        onRandomizeFeed={() => loadRandomUniverse({ isInitial: false, notify: true })}
        onSurprisePlay={handleSurprisePlay}
        onRefreshRecommendations={() => {
          fetchRecommendations(currentTrack || undefined);
          showToast('Rolled fresh random recommendations');
        }}
      />

      {/* Unified Obsidian Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-16 left-4 right-4 sm:left-auto sm:right-6 z-[70] bg-[#141418]/95 backdrop-blur-xl text-zinc-100 text-xs font-medium px-4 py-2.5 rounded-xl border border-white/[0.12] shadow-2xl flex items-center justify-between sm:justify-start gap-2.5 max-w-sm"
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:text-white text-zinc-400 shrink-0 cursor-pointer rounded-md"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
