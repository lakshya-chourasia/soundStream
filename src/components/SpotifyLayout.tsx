import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Track, RepeatMode, GenreCollection } from '../types/player';
import {
  formatTime,
  cleanTrackTitle,
  getFullSingerName,
  parseLrcLyrics,
  findActiveLyricIndex,
} from '../utils/playerUtils';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Heart,
  Plus,
  Check,
  Search,
  X,
  Maximize2,
  Minimize2,
  Film,
  BookOpen,
  PanelRightClose,
  PanelRightOpen,
  Timer,
  Home,
  ListMusic,
  Sparkles,
  MoreHorizontal,
  Share2,
  Mic2,
  Laptop2,
  PictureInPicture,
  ChevronLeft,
  ChevronRight,
  Radio,
  GripHorizontal,
  Image as ImageIcon,
  Flame,
  Music2,
  Layers,
  Disc,
  Library,
  ChevronDown,
} from 'lucide-react';
import { ArtworkImage } from './ArtworkImage';
import { extractColorFromImage, RGBColor } from '../utils/colorUtils';

export interface SpotifyLayoutProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isVideoVisible: boolean;
  videoSlot?: React.ReactNode;
  queue: Track[];
  recommendations: Track[];
  favorites: Track[];
  searchQuery: string;
  searchResults: Track[];
  isSearching: boolean;
  sleepTimerRemaining: number | null;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onChangeVolume: (volume: number) => void;
  onToggleVideo: () => void;
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  onRemoveFromQueue?: (track: Track) => void;
  onToggleFavorite: (track: Track) => void;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  onOpenSleepTimer: () => void;
  onOpenQuickImport?: () => void;
  genres?: GenreCollection[];
  playbackQuality?: string;
  onChangePlaybackQuality?: (quality: any) => void;
}

function shuffleList<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export const SpotifyLayout: React.FC<SpotifyLayoutProps> = ({
  currentTrack,
  isPlaying,
  isBuffering,
  currentTime,
  duration,
  volume,
  repeatMode,
  isShuffle,
  isVideoVisible,
  videoSlot,
  queue,
  recommendations,
  favorites,
  searchQuery,
  searchResults,
  isSearching,
  sleepTimerRemaining,
  genres = [],
  playbackQuality = 'highres',
  onChangePlaybackQuality,
  onTogglePlay,
  onSeek,
  onPrev,
  onNext,
  onToggleShuffle,
  onToggleRepeat,
  onChangeVolume,
  onToggleVideo,
  onPlayTrack,
  onAddToQueue,
  onToggleFavorite,
  onSearch,
  onClearSearch,
  onOpenSleepTimer,
  onOpenQuickImport,
}) => {
  // ── Home View Mode & Navigation States ──
  const [centerViewMode, setCenterViewMode] = useState<'home' | 'library' | 'queue'>('home');
  const [homeFilter, setHomeFilter] = useState<'all' | 'music' | 'vibes' | 'videos'>('all');
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState<boolean>(false);
  const [randomSeed, setRandomSeed] = useState<number>(1);
  const [activeHeroIndex, setActiveHeroIndex] = useState<number>(0);

  // ── Hover Preview State ──
  const [hoveredTrack, setHoveredTrack] = useState<Track | null>(null);

  // ── Library Tab Switcher (Left Sidebar) ──
  const [libraryTab, setLibraryTab] = useState<'all' | 'queue' | 'recommended' | 'favorites'>('all');

  // ── Right Sidebar Visibility ──
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);

  // ── Fullscreen Cinema Artwork / Video / Lyrics Mode ──
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [maximizeViewMode, setMaximizeViewMode] = useState<'poster' | 'video' | 'lyrics'>('poster');



  // ── Dynamic Poster Ambient Color Extraction ──
  const [posterColor, setPosterColor] = useState<RGBColor>({ r: 245, g: 158, b: 11 }); // Warm gold default

  // ── Search Input State ──
  const [localSearchInput, setLocalSearchInput] = useState<string>(searchQuery || '');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState<boolean>(false);
  const [mobileNavTab, setMobileNavTab] = useState<'home' | 'search' | 'library'>('home');
  const searchDebounceRef = useRef<any>(null);

  // ── Synced Lyrics State (Real-Time Dynamic Fetch, Zero Hardcoding) ──
  const [lyricsData, setLyricsData] = useState<{
    plainLyrics: string | null;
    syncedLyrics: string | null;
    parsedLines: Array<{ time: number; text: string }>;
    isLoading: boolean;
  }>({
    plainLyrics: null,
    syncedLyrics: null,
    parsedLines: [],
    isLoading: false,
  });
  const lyricsCacheRef = useRef<Map<string, any>>(new Map());
  const activeCenterLineRef = useRef<HTMLParagraphElement | null>(null);

  // ── 1. Dynamic Catalog Pool (Constructed from live API data & Props) ──
  const allCatalogPool = useMemo(() => {
    const map = new Map<string, Track>();
    if (genres && genres.length > 0) {
      for (const g of genres) {
        for (const t of g.tracks || []) {
          if (!map.has(t.id)) map.set(t.id, t);
        }
      }
    }
    for (const t of recommendations || []) {
      if (!map.has(t.id)) map.set(t.id, t);
    }
    for (const t of queue || []) {
      if (!map.has(t.id)) map.set(t.id, t);
    }
    for (const t of favorites || []) {
      if (!map.has(t.id)) map.set(t.id, t);
    }
    return Array.from(map.values());
  }, [genres, recommendations, queue, favorites]);

  // Dynamic curated sections derived from live genres (stable, never reshuffles automatically)
  const dynamicCollections = useMemo(() => {
    if (!genres || genres.length === 0) return [];
    return genres.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      tag: (g as any).tag || `#${g.id.toUpperCase()}`,
      tracks: g.tracks || [],
    }));
  }, [genres]);

  // Stable Popular Releases (Derived from genres and curated pool, only reshuffled on explicit user Shuffle)
  const dynamicPopularTracks = useMemo(() => {
    // Collect tracks from the first 2-3 genres to ensure high quality and complete stability
    const stablePool: Track[] = [];
    if (genres && genres.length > 0) {
      for (const g of genres.slice(0, 3)) {
        for (const t of g.tracks || []) {
          if (!stablePool.some((x) => x.id === t.id)) {
            stablePool.push(t);
          }
        }
      }
    }
    const pool = stablePool.length > 0 ? stablePool : allCatalogPool;
    if (randomSeed === 1) {
      return pool.slice(0, 12);
    }
    return shuffleList(pool).slice(0, 12);
  }, [genres, allCatalogPool, randomSeed]);

  // Stable Vibe Tracks
  const dynamicVibeTracks = useMemo(() => {
    const list: Track[] = [];
    for (const c of dynamicCollections) {
      if (c.tracks.length > 0) list.push(...c.tracks);
    }
    const pool = list.length > 0 ? list : allCatalogPool;
    if (randomSeed === 1) {
      return pool.slice(0, 10);
    }
    return shuffleList(pool).slice(0, 10);
  }, [dynamicCollections, allCatalogPool, randomSeed]);

  // Featured Hero Items: Stable featured tracks
  const dynamicFeaturedItems = useMemo(() => {
    const items: Array<{
      track: Track;
      badge: string;
      title: string;
      subtitle: string;
      actionText: string;
      actionType: 'play' | 'video' | 'lyrics';
    }> = [];

    // Prioritize the top curated flagship tracks so the banner is stable
    const bannerTracks = dynamicPopularTracks.slice(0, 4);
    for (let i = 0; i < bannerTracks.length; i++) {
      const t = bannerTracks[i];
      items.push({
        track: t,
        badge: i === 0 ? 'FEATURED SPOTLIGHT' : 'TOP STREAM',
        title: cleanTrackTitle(t.title).title,
        subtitle: getFullSingerName(t.artist || '', t.title),
        actionText: 'Play Now',
        actionType: 'play',
      });
    }

    return items.length > 0 ? items : (currentTrack ? [{
      track: currentTrack,
      badge: 'FEATURED SPOTLIGHT',
      title: cleanTrackTitle(currentTrack.title).title,
      subtitle: getFullSingerName(currentTrack.artist || '', currentTrack.title),
      actionText: 'Play Audio',
      actionType: 'play' as const,
    }] : []);
  }, [dynamicPopularTracks, currentTrack]);

  const activeHeroItem = dynamicFeaturedItems[activeHeroIndex % Math.max(1, dynamicFeaturedItems.length)];

  // Derive active display track (hovered track takes preview precedence)
  const displayTrack = hoveredTrack || currentTrack;
  const { title: displayTitle, artistFromTitle: displayArtistFromTitle } = cleanTrackTitle(displayTrack?.title || '');
  const rawDisplayArtist = displayTrack?.artist || displayArtistFromTitle || 'Artist';
  const displayArtist = getFullSingerName(rawDisplayArtist, displayTitle);

  const effectiveDuration = duration > 0 ? duration : currentTrack?.durationSec || 240;
  const progressPercent = effectiveDuration > 0
    ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
    : 0;

  // Active lyric line index
  const activeLyricIndex = findActiveLyricIndex(lyricsData.parsedLines, currentTime);

  // Auto-scroll active lyric line into view in Center / Cinema Stage
  useEffect(() => {
    if (activeCenterLineRef.current) {
      activeCenterLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricIndex]);

  // ── Dynamic Lyrics Fetcher (Queries /api/lyrics, ZERO Hardcoding) ──
  useEffect(() => {
    if (!currentTrack?.id) return;
    const cacheKey = currentTrack.id;
    if (lyricsCacheRef.current.has(cacheKey)) {
      setLyricsData({ ...lyricsCacheRef.current.get(cacheKey), isLoading: false });
      return;
    }

    setLyricsData((prev) => ({ ...prev, isLoading: true }));
    let isCancelled = false;

    const { title: t, artistFromTitle: a } = cleanTrackTitle(currentTrack.title);
    const singer = getFullSingerName(currentTrack.artist || a || '', t);

    const queryParams = new URLSearchParams({
      track: t,
      artist: singer,
      durationSec: (currentTrack.durationSec || 0).toString(),
    });

    fetch(`/api/lyrics?${queryParams.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (isCancelled) return;
        let parsed = data.syncedLyrics ? parseLrcLyrics(data.syncedLyrics) : [];
        if (parsed.length === 0 && data.plainLyrics) {
          const lines = data.plainLyrics.split('\n').map((l: string) => l.trim()).filter(Boolean);
          const totalDur = currentTrack.durationSec || 220;
          const start = Math.min(15, totalDur * 0.08);
          const end = Math.max(start + 10, totalDur * 0.92);
          const step = (end - start) / Math.max(1, lines.length);
          parsed = lines.map((text: string, i: number) => ({
            time: Math.round((start + i * step) * 10) / 10,
            text,
          }));
        }

        const resData = {
          plainLyrics: data.plainLyrics || null,
          syncedLyrics: data.syncedLyrics || null,
          parsedLines: parsed,
        };
        lyricsCacheRef.current.set(cacheKey, resData);
        setLyricsData({ ...resData, isLoading: false });
      })
      .catch(() => {
        if (!isCancelled) {
          setLyricsData({ plainLyrics: null, syncedLyrics: null, parsedLines: [], isLoading: false });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentTrack?.id]);

  // Dynamic Lyrics Preview for Right Sidebar (Real dynamic lines, ZERO fake text)
  const lyricsPreviewLines = useMemo(() => {
    if (lyricsData.isLoading) {
      return ['Fetching synchronized lyrics...', ''];
    }
    if (lyricsData.parsedLines.length > 0) {
      if (activeLyricIndex >= 0 && activeLyricIndex < lyricsData.parsedLines.length) {
        const cur = lyricsData.parsedLines[activeLyricIndex].text;
        const nxt = lyricsData.parsedLines[activeLyricIndex + 1]?.text || '';
        return [cur, nxt];
      }
      return lyricsData.parsedLines.slice(0, 2).map((l) => l.text);
    }
    if (lyricsData.plainLyrics) {
      const lines = lyricsData.plainLyrics.split('\n').map((l) => l.trim()).filter(Boolean);
      return lines.slice(0, 2);
    }
    return ['No synchronized lyrics found for this track', 'Enjoy the music flow'];
  }, [lyricsData.isLoading, lyricsData.parsedLines, lyricsData.plainLyrics, activeLyricIndex]);

  // Extract ambient poster color dynamically
  useEffect(() => {
    const candidateUrl = displayTrack?.thumbnail || '';
    const seed = `${displayTitle} ${displayArtist}`;
    extractColorFromImage(candidateUrl, seed).then((col) => {
      setPosterColor(col);
    });
  }, [displayTrack?.thumbnail, displayTitle, displayArtist]);

  // Synchronize local search input
  useEffect(() => {
    setLocalSearchInput(searchQuery || '');
  }, [searchQuery]);

  const handleSearchChange = (val: string) => {
    setLocalSearchInput(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      onSearch(val);
    }, 200);
  };

  const handleClearSearchInput = () => {
    setLocalSearchInput('');
    onClearSearch();
  };

  const handleGoHome = () => {
    setCenterViewMode('home');
    setLocalSearchInput('');
    onClearSearch();
    setRandomSeed((s) => s + 1);
  };



  // Escape key handler for cinema mode
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCinemaMode) {
        setIsCinemaMode(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isCinemaMode]);

  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;
  const isCurrentFavorite = currentTrack ? favorites.some((f) => f.id === currentTrack.id) : false;

  const displayedLibraryTracks =
    libraryTab === 'all'
      ? allCatalogPool
      : libraryTab === 'queue'
      ? queue
      : libraryTab === 'recommended'
      ? recommendations
      : favorites;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#080808] text-white select-none overflow-hidden font-sans relative">
      {/* ══════════════════════════════════════════════════
          1. SOUNDSTREAM SIGNATURE TOP BAR
         ══════════════════════════════════════════════════ */}
      <header className="h-14 sm:h-16 w-full px-3 sm:px-5 flex items-center justify-between bg-black/95 backdrop-blur-xl shrink-0 z-40 border-b border-white/[0.08]">
        {/* Left: SoundStream Signature Logo & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2.5 focus:outline-none group cursor-pointer"
            title="SoundStream Home"
            aria-label="SoundStream Home"
          >
            {/* Signature SoundStream Golden Monogram Mark */}
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-yellow-300 via-yellow-400 to-amber-500 flex items-center justify-center shadow-[0_0_16px_rgba(250,204,21,0.4)] group-hover:scale-105 transition-transform shrink-0">
              <span className="font-display font-black text-black text-base sm:text-lg tracking-tighter leading-none">
                S
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-display font-black text-base sm:text-xl tracking-wider text-white">
                SOUNDSTREAM
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
            </div>
          </button>
        </div>

        {/* Center: Home Button & Sleek Search Bar */}
        <div className="flex items-center gap-2 max-w-xl w-full mx-2 sm:mx-4 justify-center">
          <button
            onClick={() => {
              setMobileNavTab('home');
              setIsMobileSearchOpen(false);
              handleGoHome();
            }}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              centerViewMode === 'home' && !localSearchInput.trim()
                ? 'bg-yellow-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.4)]'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white'
            }`}
            title="Home"
            aria-label="Home"
          >
            <Home className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* Integrated Search Pill */}
          <div className="relative flex-1 max-w-md">
            <div className="relative flex items-center w-full h-9 sm:h-10 px-3.5 rounded-full bg-white/[0.06] hover:bg-white/[0.09] focus-within:bg-white/[0.12] focus-within:ring-2 focus-within:ring-yellow-400/50 border border-white/[0.08] transition-all">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/40 shrink-0 mr-2" />
              <input
                id="soundstream-search-input"
                type="text"
                value={localSearchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search tracks, singers, or vibes..."
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-white placeholder:text-white/40 focus:outline-none"
              />
              {localSearchInput && (
                <button
                  onClick={handleClearSearchInput}
                  className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: SoundStream Utilities (+ Import, Sleep Timer, Cinema Mode) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {onOpenQuickImport && (
            <button
              onClick={onOpenQuickImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-yellow-400 hover:bg-yellow-300 text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_12px_rgba(250,204,21,0.3)] cursor-pointer"
              title="Import YouTube / Audio link"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
            </button>
          )}

          {/* Sleep Timer */}
          <button
            onClick={onOpenSleepTimer}
            className={`p-2 rounded-full border transition-all cursor-pointer relative ${
              sleepTimerRemaining
                ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.3)]'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white border-white/[0.08]'
            }`}
            title={sleepTimerRemaining ? `Sleep Timer: ${Math.ceil(sleepTimerRemaining / 60)}m left` : 'Sleep Timer'}
          >
            <Timer className="w-4 h-4" />
            {sleepTimerRemaining && (
              <span className="absolute -top-1 -right-1 px-1 rounded-full bg-yellow-400 text-black text-[9px] font-black">
                {Math.ceil(sleepTimerRemaining / 60)}m
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          2. MAIN RESPONSIVE WORKSPACE (3-COLUMN RESPONSIVE)
         ══════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden p-2 sm:p-2.5 gap-2 relative">
        {/* ──────────────────────────────────────────────
            LEFT RAIL: YOUR SOUNDSTREAM LIBRARY (Collapsible)
           ────────────────────────────────────────────── */}
        <aside
          className={`shrink-0 bg-[#101010] rounded-2xl flex flex-col overflow-hidden border border-white/[0.06] transition-all duration-300 hidden md:flex ${
            isLeftSidebarCollapsed ? 'w-18 items-center' : 'w-72'
          }`}
        >
          {/* Header */}
          <div className="w-full p-3.5 flex items-center justify-between border-b border-white/[0.06]">
            <button
              onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
              className="flex items-center gap-2.5 text-white/80 hover:text-yellow-400 transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer"
              title={isLeftSidebarCollapsed ? 'Expand library' : 'Collapse library'}
            >
              <Layers className="w-4 h-4 text-yellow-400" />
              {!isLeftSidebarCollapsed && <span>Your Library</span>}
            </button>
          </div>

          {/* Category Tabs (All Songs, Queue, Recommendations, Favorites) */}
          {!isLeftSidebarCollapsed && (
            <div className="px-3 pt-3 flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setLibraryTab('all')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  libraryTab === 'all'
                    ? 'bg-yellow-400 text-black shadow-[0_0_8px_rgba(250,204,21,0.3)]'
                    : 'bg-white/[0.06] text-white/70 hover:text-white'
                }`}
              >
                All ({allCatalogPool.length})
              </button>
              <button
                onClick={() => setLibraryTab('queue')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  libraryTab === 'queue'
                    ? 'bg-yellow-400 text-black shadow-[0_0_8px_rgba(250,204,21,0.3)]'
                    : 'bg-white/[0.06] text-white/70 hover:text-white'
                }`}
              >
                Queue ({queue.length})
              </button>
              <button
                onClick={() => setLibraryTab('recommended')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  libraryTab === 'recommended'
                    ? 'bg-yellow-400 text-black shadow-[0_0_8px_rgba(250,204,21,0.3)]'
                    : 'bg-white/[0.06] text-white/70 hover:text-white'
                }`}
              >
                Recommended
              </button>
              <button
                onClick={() => setLibraryTab('favorites')}
                className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  libraryTab === 'favorites'
                    ? 'bg-yellow-400 text-black shadow-[0_0_8px_rgba(250,204,21,0.3)]'
                    : 'bg-white/[0.06] text-white/70 hover:text-white'
                }`}
              >
                Favorites ({favorites.length})
              </button>
            </div>
          )}

          {/* Scrollable Track Rows */}
          <div className="flex-1 w-full overflow-y-auto no-scrollbar p-2 space-y-1">
            {displayedLibraryTracks.length === 0 ? (
              <div className="p-4 text-center text-white/40 text-xs">
                {!isLeftSidebarCollapsed && 'No tracks in this section'}
              </div>
            ) : (
              displayedLibraryTracks.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                const { title: t, artistFromTitle: a } = cleanTrackTitle(track.title);
                const singer = getFullSingerName(track.artist || a || '', t);

                if (isLeftSidebarCollapsed) {
                  return (
                    <div
                      key={`rail-${track.id}-${idx}`}
                      onClick={() => onPlayTrack(track)}
                      className={`w-12 h-12 rounded-xl overflow-hidden mx-auto my-1 cursor-pointer transition-all border relative group shadow-sm ${
                        isCurrent ? 'ring-2 ring-yellow-400 border-transparent' : 'border-white/[0.08] hover:border-white/20'
                      }`}
                      title={`${t} • ${singer}`}
                    >
                      <ArtworkImage
                        title={t}
                        artist={singer}
                        trackId={track.id}
                        initialSrc={track.thumbnail}
                        alt={t}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={`lib-${track.id}-${idx}`}
                    onClick={() => onPlayTrack(track)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all group ${
                      isCurrent ? 'bg-yellow-400/15 border border-yellow-400/30 text-white' : 'hover:bg-white/[0.06] text-white/90'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 shadow-sm relative">
                      <ArtworkImage
                        title={t}
                        artist={singer}
                        trackId={track.id}
                        initialSrc={track.thumbnail}
                        alt={t}
                        className="w-full h-full object-cover"
                      />
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="flex items-end gap-0.5 h-3">
                            <span className="w-0.5 bg-yellow-400 rounded-full animate-bar-1" />
                            <span className="w-0.5 bg-yellow-400 rounded-full animate-bar-2" />
                            <span className="w-0.5 bg-yellow-400 rounded-full animate-bar-3" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate leading-tight ${isCurrent ? 'text-yellow-400' : 'text-white'}`}>
                        {t}
                      </p>
                      <p className="text-[11px] text-white/50 truncate mt-0.5">
                        {singer}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ──────────────────────────────────────────────
            CENTER STAGE: HOME FEED, VIBES, OR FULL LYRICS
           ────────────────────────────────────────────── */}
        <main className="flex-1 rounded-2xl bg-[#0f0f0f] border border-white/[0.06] flex flex-col overflow-hidden relative">
          {/* Dynamic Ambient Background Glow derived from artwork */}
          <div
            className="absolute top-0 left-0 right-0 h-80 opacity-25 pointer-events-none transition-all duration-700 blur-3xl"
            style={{
              background: `radial-gradient(circle at 50% 0%, rgb(${posterColor.r}, ${posterColor.g}, ${posterColor.b}) 0%, transparent 75%)`,
            }}
          />

          {/* Subheader Filter Bar (All, Music, Vibes, Videos, Full Library) */}
          <div className="px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between border-b border-white/[0.06] shrink-0 z-10">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {(['all', 'music', 'vibes', 'videos'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setCenterViewMode('home');
                    setHomeFilter(filter);
                    setRandomSeed((s) => s + 1);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all capitalize shrink-0 cursor-pointer ${
                    centerViewMode === 'home' && homeFilter === filter
                      ? 'bg-yellow-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.35)]'
                      : 'bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/[0.12]'
                  }`}
                >
                  {filter}
                </button>
              ))}

              {/* Full Library Tab in Center Feed */}
              <button
                onClick={() => setCenterViewMode('library')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all capitalize shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  centerViewMode === 'library'
                    ? 'bg-yellow-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.35)]'
                    : 'bg-white/[0.06] text-white/70 hover:text-white hover:bg-white/[0.12]'
                }`}
              >
                <Library className="w-3.5 h-3.5" />
                <span>Full Library ({allCatalogPool.length})</span>
              </button>
            </div>

            {/* Quick Randomize / Shuffle Feed */}
            <button
              onClick={() => setRandomSeed((s) => s + 1)}
              className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-yellow-400 transition-colors px-2.5 py-1 rounded-full hover:bg-white/[0.06] cursor-pointer"
              title="Shuffle dynamic recommendations"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Shuffle</span>
            </button>
          </div>

          {/* Main Stage Content: Search Results OR Home Feed OR Full Synced Lyrics */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-8 z-10">
            {/* If actively searching, show real search results */}
            {localSearchInput.trim() ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Results for "{localSearchInput}"
                  </h2>
                  <span className="text-xs text-white/50">{searchResults.length} songs found</span>
                </div>
                {isSearching ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="aspect-square rounded-2xl bg-white/[0.04] animate-pulse" />
                    ))}
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-16 text-center text-white/50">
                    <p className="text-base font-semibold">No tracks found matching your query.</p>
                    <p className="text-xs mt-1 text-white/40">Try searching by song name, movie, or singer.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                    {searchResults.map((track, idx) => {
                      const { title: t, artistFromTitle: a } = cleanTrackTitle(track.title);
                      const singer = getFullSingerName(track.artist || a || '', t);
                      const isCurrent = currentTrack?.id === track.id;
                      return (
                        <div
                          key={`search-${track.id}-${idx}`}
                          onClick={() => onPlayTrack(track)}
                          className={`group relative p-2.5 sm:p-3 rounded-2xl transition-all duration-300 border cursor-pointer flex flex-col justify-between hover:-translate-y-1 ${
                            isCurrent
                              ? 'bg-gradient-to-b from-[#1a1708] to-[#141208] border-yellow-400/60 shadow-[0_8px_24px_rgba(250,204,21,0.18)] ring-1 ring-yellow-400/40'
                              : 'bg-[#121215]/80 hover:bg-[#18181c] border-white/[0.06] hover:border-yellow-400/30 hover:shadow-[0_12px_28px_rgba(0,0,0,0.6)]'
                          }`}
                        >
                          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#0d0d0f] shadow-lg mb-2.5">
                            <ArtworkImage
                              title={t}
                              artist={singer}
                              trackId={track.id}
                              initialSrc={track.thumbnail}
                              alt={t}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                            {/* Ambient gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />

                            {/* Active playing indicator badge */}
                            {isCurrent && (
                              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-yellow-400/50 flex items-center gap-1.5 shadow-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                                <span className="text-[9px] font-black tracking-wider text-yellow-400 uppercase">
                                  {isPlaying ? 'PLAYING' : 'PAUSED'}
                                </span>
                              </div>
                            )}

                            {/* Play / Pause floating action pill */}
                            <div className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-[0_4px_16px_rgba(250,204,21,0.4)] transition-all duration-300 ${
                              isCurrent
                                ? 'opacity-100 translate-y-0 scale-100'
                                : 'opacity-0 translate-y-2 scale-90 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100'
                            }`}>
                              {isCurrent && isPlaying ? (
                                <Pause className="w-4 h-4 fill-black text-black" />
                              ) : (
                                <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                              )}
                            </div>
                          </div>
                          <div className="px-0.5">
                            <p className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                              isCurrent ? 'text-yellow-400' : 'text-white group-hover:text-yellow-400'
                            }`}>
                              {t}
                            </p>
                            <p className="text-[11px] text-white/50 truncate mt-0.5 font-medium">
                              {singer}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ) : centerViewMode === 'library' || centerViewMode === 'queue' ? (
              /* FULL CATALOG / LIBRARY VIEW */
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                      <Library className="w-6 h-6 text-yellow-400" />
                      <span>SoundStream Full Library</span>
                    </h2>
                    <p className="text-xs text-white/50 font-medium">
                      All {allCatalogPool.length} curated tracks, vibes, and high-definition streams
                    </p>
                  </div>
                  <button
                    onClick={() => setRandomSeed((s) => s + 1)}
                    className="text-xs font-bold text-yellow-400 hover:text-yellow-300 uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Shuffle
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                  {allCatalogPool.map((track, idx) => {
                    const { title: t, artistFromTitle: a } = cleanTrackTitle(track.title);
                    const singer = getFullSingerName(track.artist || a || '', t);
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <div
                        key={`library-full-${track.id}-${idx}`}
                        onClick={() => onPlayTrack(track)}
                        className={`group relative p-2.5 sm:p-3 rounded-2xl transition-all duration-300 border cursor-pointer flex flex-col justify-between hover:-translate-y-1 ${
                          isCurrent
                            ? 'bg-gradient-to-b from-[#1a1708] to-[#141208] border-yellow-400/60 shadow-[0_8px_24px_rgba(250,204,21,0.18)] ring-1 ring-yellow-400/40'
                            : 'bg-[#121215]/80 hover:bg-[#18181c] border-white/[0.06] hover:border-yellow-400/30 hover:shadow-[0_12px_28px_rgba(0,0,0,0.6)]'
                        }`}
                      >
                        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#0d0d0f] shadow-lg mb-2.5">
                          <ArtworkImage
                            title={t}
                            artist={singer}
                            trackId={track.id}
                            initialSrc={track.thumbnail}
                            alt={t}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                          {/* Ambient gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />

                          {/* Active playing indicator badge */}
                          {isCurrent && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-yellow-400/50 flex items-center gap-1.5 shadow-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                              <span className="text-[9px] font-black tracking-wider text-yellow-400 uppercase">
                                {isPlaying ? 'PLAYING' : 'PAUSED'}
                              </span>
                            </div>
                          )}

                          <div className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-[0_4px_16px_rgba(250,204,21,0.4)] transition-all duration-300 ${
                            isCurrent
                              ? 'opacity-100 translate-y-0 scale-100'
                              : 'opacity-0 translate-y-2 scale-90 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100'
                          }`}>
                            {isCurrent && isPlaying ? (
                              <Pause className="w-4 h-4 fill-black text-black" />
                            ) : (
                              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                            )}
                          </div>
                        </div>
                        <div className="px-0.5">
                          <p className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                            isCurrent ? 'text-yellow-400' : 'text-white group-hover:text-yellow-400'
                          }`}>
                            {t}
                          </p>
                          <p className="text-[11px] text-white/50 truncate mt-0.5 font-medium">
                            {singer}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : (
              /* DYNAMIC HOME FEED (ZERO Hardcoded Mock Data) */
              <>
                {/* Dynamic Featured Hero Card */}
                {activeHeroItem && (
                  <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-yellow-950/40 via-amber-900/20 to-black border border-yellow-400/20 shadow-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="relative z-10 max-w-lg space-y-2">
                      <span className="inline-block px-3 py-1 rounded-full bg-yellow-400 text-black text-[10px] font-black tracking-wider uppercase shadow-md">
                        {activeHeroItem.badge}
                      </span>
                      <h2 className="font-display font-black text-2xl sm:text-4xl text-white tracking-tight leading-tight">
                        {activeHeroItem.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-white/70 font-medium">
                        {activeHeroItem.subtitle}
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => {
                            if (activeHeroItem.actionType === 'video') {
                              if (!isVideoVisible) onToggleVideo();
                              setMaximizeViewMode('video');
                              setIsCinemaMode(true);
                            } else if (activeHeroItem.actionType === 'lyrics') {
                              setMaximizeViewMode('lyrics');
                              setIsCinemaMode(true);
                            } else {
                              onPlayTrack(activeHeroItem.track);
                            }
                          }}
                          className="px-5 py-2.5 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black font-extrabold text-xs tracking-wider uppercase shadow-[0_0_15px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Play className="w-4 h-4 fill-black text-black" />
                          <span>{activeHeroItem.actionText}</span>
                        </button>
                        {dynamicFeaturedItems.length > 1 && (
                          <button
                            onClick={() => setActiveHeroIndex((i) => i + 1)}
                            className="px-4 py-2.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            Next Vibe →
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right Artwork Showcase */}
                    <div className="relative w-36 h-36 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/15 shrink-0 group cursor-pointer"
                      onClick={() => onPlayTrack(activeHeroItem.track)}
                    >
                      <ArtworkImage
                        title={activeHeroItem.track.title}
                        artist={activeHeroItem.track.artist}
                        trackId={activeHeroItem.track.id}
                        initialSrc={activeHeroItem.track.thumbnail}
                        alt={activeHeroItem.track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>
                )}

                {/* Section 1: Popular Hits & Releases */}
                {(homeFilter === 'all' || homeFilter === 'music') && (
                  <section className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                          Popular Hits & Releases
                        </h3>
                        <p className="text-xs text-white/50 font-medium">Top stream releases in ultra-clear audio</p>
                      </div>
                      <button
                        onClick={() => setRandomSeed((s) => s + 1)}
                        className="text-xs font-bold text-yellow-400 hover:text-yellow-300 uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Shuffle
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                      {dynamicPopularTracks.map((track, idx) => {
                        const { title: t, artistFromTitle: a } = cleanTrackTitle(track.title);
                        const singer = getFullSingerName(track.artist || a || '', t);
                        const isCurrent = currentTrack?.id === track.id;
                        return (
                          <div
                            key={`pop-${track.id}-${idx}`}
                            onClick={() => onPlayTrack(track)}
                            className={`group relative p-2.5 sm:p-3 rounded-2xl transition-all duration-300 border cursor-pointer flex flex-col justify-between hover:-translate-y-1 ${
                              isCurrent
                                ? 'bg-gradient-to-b from-[#1a1708] to-[#141208] border-yellow-400/60 shadow-[0_8px_24px_rgba(250,204,21,0.18)] ring-1 ring-yellow-400/40'
                                : 'bg-[#121215]/80 hover:bg-[#18181c] border-white/[0.06] hover:border-yellow-400/30 hover:shadow-[0_12px_28px_rgba(0,0,0,0.6)]'
                            }`}
                          >
                            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#0d0d0f] shadow-lg mb-2.5">
                              <ArtworkImage
                                title={t}
                                artist={singer}
                                trackId={track.id}
                                initialSrc={track.thumbnail}
                                alt={t}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                              />
                              {/* Ambient gradient overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />

                              {/* Active playing indicator badge */}
                              {isCurrent && (
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-yellow-400/50 flex items-center gap-1.5 shadow-md">
                                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                                  <span className="text-[9px] font-black tracking-wider text-yellow-400 uppercase">
                                    {isPlaying ? 'PLAYING' : 'PAUSED'}
                                  </span>
                                </div>
                              )}

                              {/* Action play button */}
                              <div className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-[0_4px_16px_rgba(250,204,21,0.4)] transition-all duration-300 ${
                                isCurrent
                                  ? 'opacity-100 translate-y-0 scale-100'
                                  : 'opacity-0 translate-y-2 scale-90 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100'
                              }`}>
                                {isCurrent && isPlaying ? (
                                  <Pause className="w-4 h-4 fill-black text-black" />
                                ) : (
                                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                                )}
                              </div>
                            </div>
                            <div className="px-0.5">
                              <p className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                                isCurrent ? 'text-yellow-400' : 'text-white group-hover:text-yellow-400'
                              }`}>
                                {t}
                              </p>
                              <p className="text-[11px] text-white/50 truncate mt-0.5 font-medium">
                                {singer}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Section 2: Dynamic Genre Collections from API */}
                {(homeFilter === 'all' || homeFilter === 'vibes') && dynamicCollections.length > 0 && (
                  dynamicCollections.map((collection) => (
                    <section key={collection.id} className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                              {collection.tag}
                            </span>
                            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                              {collection.name}
                            </h3>
                          </div>
                          {collection.description && (
                            <p className="text-xs text-white/50 font-medium mt-0.5">{collection.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                        {collection.tracks.slice(0, 6).map((track, idx) => {
                          const { title: t, artistFromTitle: a } = cleanTrackTitle(track.title);
                          const singer = getFullSingerName(track.artist || a || '', t);
                          const isCurrent = currentTrack?.id === track.id;
                          return (
                            <div
                              key={`col-${collection.id}-${track.id}-${idx}`}
                              onClick={() => onPlayTrack(track)}
                              className={`group relative p-2.5 sm:p-3 rounded-2xl transition-all duration-300 border cursor-pointer flex flex-col justify-between hover:-translate-y-1 ${
                                isCurrent
                                  ? 'bg-gradient-to-b from-[#1a1708] to-[#141208] border-yellow-400/60 shadow-[0_8px_24px_rgba(250,204,21,0.18)] ring-1 ring-yellow-400/40'
                                  : 'bg-[#121215]/80 hover:bg-[#18181c] border-white/[0.06] hover:border-yellow-400/30 hover:shadow-[0_12px_28px_rgba(0,0,0,0.6)]'
                              }`}
                            >
                              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#0d0d0f] shadow-lg mb-2.5">
                                <ArtworkImage
                                  title={t}
                                  artist={singer}
                                  trackId={track.id}
                                  initialSrc={track.thumbnail}
                                  alt={t}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                />
                                {/* Ambient gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />

                                {/* Active playing indicator badge */}
                                {isCurrent && (
                                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-yellow-400/50 flex items-center gap-1.5 shadow-md">
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping" />
                                    <span className="text-[9px] font-black tracking-wider text-yellow-400 uppercase">
                                      {isPlaying ? 'PLAYING' : 'PAUSED'}
                                    </span>
                                  </div>
                                )}

                                {/* Action play button */}
                                <div className={`absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-[0_4px_16px_rgba(250,204,21,0.4)] transition-all duration-300 ${
                                  isCurrent
                                    ? 'opacity-100 translate-y-0 scale-100'
                                    : 'opacity-0 translate-y-2 scale-90 group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100'
                                }`}>
                                  {isCurrent && isPlaying ? (
                                    <Pause className="w-4 h-4 fill-black text-black" />
                                  ) : (
                                    <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                                  )}
                                </div>
                              </div>
                              <div className="px-0.5">
                                <p className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                                  isCurrent ? 'text-yellow-400' : 'text-white group-hover:text-yellow-400'
                                }`}>
                                  {t}
                                </p>
                                <p className="text-[11px] text-white/50 truncate mt-0.5 font-medium">
                                  {singer}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))
                )}

                {/* Section 3: Official Videos Collection */}
                {(homeFilter === 'all' || homeFilter === 'videos') && (
                  <section className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                          <Film className="w-5 h-5 text-yellow-400" />
                          <span>Official Music Videos</span>
                        </h3>
                        <p className="text-xs text-white/50 font-medium">Stream high-definition visuals with zero ads</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {dynamicVibeTracks.slice(0, 4).map((track, idx) => {
                        const { title: t, artistFromTitle: a } = cleanTrackTitle(track.title);
                        const singer = getFullSingerName(track.artist || a || '', t);
                        const isCurrent = currentTrack?.id === track.id;
                        return (
                          <div
                            key={`vid-${track.id}-${idx}`}
                            onClick={() => {
                              onPlayTrack(track);
                              if (!isVideoVisible) onToggleVideo();
                              setMaximizeViewMode('video');
                              setIsCinemaMode(true);
                            }}
                            className={`group relative rounded-2xl overflow-hidden transition-all duration-300 border cursor-pointer shadow-lg hover:-translate-y-1 ${
                              isCurrent
                                ? 'bg-gradient-to-b from-[#1a1708] to-[#141208] border-yellow-400/60 shadow-[0_8px_24px_rgba(250,204,21,0.2)] ring-1 ring-yellow-400/40'
                                : 'bg-[#121215]/80 hover:bg-[#18181c] border-white/[0.06] hover:border-yellow-400/40 hover:shadow-[0_12px_28px_rgba(0,0,0,0.6)]'
                            }`}
                          >
                            <div className="relative aspect-video w-full bg-[#0d0d0f] overflow-hidden">
                              <ArtworkImage
                                title={t}
                                artist={singer}
                                trackId={track.id}
                                initialSrc={track.thumbnail}
                                alt={t}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                              />
                              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-all">
                                <div className="w-12 h-12 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-[0_4px_20px_rgba(250,204,21,0.5)] group-hover:scale-110 active:scale-95 transition-transform">
                                  {isCurrent && isPlaying ? (
                                    <Pause className="w-5 h-5 fill-black" />
                                  ) : (
                                    <Play className="w-5 h-5 fill-black ml-0.5" />
                                  )}
                                </div>
                              </div>
                              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] font-black text-yellow-400 border border-yellow-400/40 shadow">
                                HD VIDEO
                              </span>
                            </div>
                            <div className="p-3">
                              <p className={`text-sm font-bold truncate transition-colors ${
                                isCurrent ? 'text-yellow-400' : 'text-white group-hover:text-yellow-400'
                              }`}>
                                {t}
                              </p>
                              <p className="text-xs text-white/50 truncate mt-0.5 font-medium">
                                {singer}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </main>

        {/* ──────────────────────────────────────────────
            RIGHT SIDEBAR: NOW PLAYING VIEW (Collapsible to side like Spotify)
           ────────────────────────────────────────────── */}
        {currentTrack && (
          <aside
            className={`shrink-0 bg-[#101010] rounded-2xl flex flex-col border border-white/[0.06] transition-all duration-300 hidden xl:flex ${
              isRightPanelOpen
                ? 'w-80 lg:w-96 overflow-y-auto p-4 space-y-4 no-scrollbar'
                : 'w-16 items-center py-4 space-y-4 overflow-hidden'
            }`}
          >
            {isRightPanelOpen ? (
              /* ── EXPANDED NOW PLAYING PANEL ── */
              <>
                {/* Header: Title Left, Fullscreen & Close to side Right */}
                <div className="flex items-center justify-between pb-1 shrink-0">
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <h3 className="font-bold text-sm text-white truncate">
                      {cleanTrackTitle(currentTrack.title).title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setIsCinemaMode(true)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
                      title="Fullscreen Cinema Mode"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsRightPanelOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-yellow-400 transition-colors cursor-pointer"
                      title="Close panel to side"
                    >
                      <PanelRightClose className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Visual Media Box: Album Poster OR Pure Clean 16:9 Video Player */}
                <div
                  onClick={() => {
                    if (isVideoVisible) {
                      setMaximizeViewMode('video');
                      setIsCinemaMode(true);
                    }
                  }}
                  className={`w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl relative border border-white/[0.08] shrink-0 ${
                    isVideoVisible ? 'cursor-pointer group' : ''
                  }`}
                  title={isVideoVisible ? 'Click to open video in Cinema Mode' : ''}
                >
                  {/* High-Resolution Album Artwork Poster */}
                  <div className="w-full h-full relative">
                    <ArtworkImage
                      title={cleanTrackTitle(currentTrack.title).title}
                      artist={getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                      trackId={currentTrack.id}
                      initialSrc={currentTrack.thumbnail}
                      alt={cleanTrackTitle(currentTrack.title).title}
                      className="w-full h-full object-cover"
                    />
                    {isVideoVisible && (
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-all">
                        <div className="px-3 py-1.5 rounded-full bg-yellow-400 text-black text-xs font-black flex items-center gap-1.5 shadow-xl group-hover:scale-105 transition-transform">
                          <Film className="w-3.5 h-3.5" />
                          <span>Watch Video</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Track Info & Actions */}
                <div className="flex items-center justify-between pt-1 shrink-0">
                  <div className="min-w-0 pr-2">
                    <h4 className="font-extrabold text-xl text-white tracking-tight truncate">
                      {cleanTrackTitle(currentTrack.title).title}
                    </h4>
                    <p className="text-xs text-white/60 truncate mt-0.5 font-medium">
                      {getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onAddToQueue(currentTrack)}
                      className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-yellow-400 transition-colors cursor-pointer"
                      title="Add to queue"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onToggleFavorite(currentTrack)}
                      className={`p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer ${
                        isCurrentFavorite ? 'text-yellow-400' : 'text-white/70 hover:text-white'
                      }`}
                      title={isCurrentFavorite ? 'Saved to library' : 'Save to library'}
                    >
                      <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* SoundStream Signature Lyrics Preview Card */}
                <div
                  onClick={() => {
                    setMaximizeViewMode('lyrics');
                    setIsCinemaMode(true);
                  }}
                  className="rounded-2xl p-4 sm:p-5 flex flex-col justify-between bg-gradient-to-br from-yellow-950/30 via-[#141414] to-black border border-yellow-400/20 hover:border-yellow-400/50 shadow-lg cursor-pointer group transition-all min-h-[150px] shrink-0"
                  title="Click to view full synchronized lyrics in cinema mode"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Mic2 className="w-3.5 h-3.5 text-yellow-400" />
                        <h5 className="text-white font-bold text-xs tracking-wider uppercase">
                          Lyrics Preview
                        </h5>
                      </div>
                      <span className="text-[11px] text-yellow-400 group-hover:translate-x-0.5 font-bold transition-transform">
                        Full lyrics →
                      </span>
                    </div>
                    <div className="space-y-1 mt-2">
                      <p className="text-yellow-400 font-extrabold text-base sm:text-lg leading-snug tracking-tight">
                        {lyricsPreviewLines[0]}
                      </p>
                      {lyricsPreviewLines[1] && (
                        <p className="text-white/50 font-semibold text-sm leading-snug">
                          {lyricsPreviewLines[1]}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Up Next Preview */}
                {queue.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2 shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider">
                        Next in Queue
                      </span>
                      <button
                        onClick={() => setCenterViewMode('queue')}
                        className="text-[11px] font-bold text-yellow-400 hover:underline cursor-pointer"
                      >
                        View All ({queue.length})
                      </button>
                    </div>
                    {queue.slice(0, 2).map((nextT, idx) => (
                      <div
                        key={`next-${nextT.id}-${idx}`}
                        onClick={() => onPlayTrack(nextT)}
                        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-white/[0.06] cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-black shrink-0">
                          <ArtworkImage
                            title={nextT.title}
                            artist={nextT.artist}
                            trackId={nextT.id}
                            initialSrc={nextT.thumbnail}
                            alt={nextT.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">
                            {cleanTrackTitle(nextT.title).title}
                          </p>
                          <p className="text-[10px] text-white/50 truncate">
                            {getFullSingerName(nextT.artist || '', nextT.title)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* ── COLLAPSED SIDE RAIL (Docked to side like Spotify) ── */
              <>
                {/* Top: Expand button */}
                <button
                  onClick={() => setIsRightPanelOpen(true)}
                  className="w-10 h-10 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-yellow-400 flex items-center justify-center transition-all cursor-pointer group shadow-sm border border-white/[0.08]"
                  title="Expand Now Playing panel"
                >
                  <PanelRightOpen className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>

                {/* Current Track Artwork with animated visualizer */}
                <div
                  onClick={() => setIsRightPanelOpen(true)}
                  className="w-10 h-10 rounded-xl overflow-hidden bg-black border border-white/10 hover:border-yellow-400/50 cursor-pointer shadow-md group relative transition-all"
                  title={`Now Playing: ${cleanTrackTitle(currentTrack.title).title} • Click to expand`}
                >
                  <ArtworkImage
                    title={cleanTrackTitle(currentTrack.title).title}
                    artist={getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                    trackId={currentTrack.id}
                    initialSrc={currentTrack.thumbnail}
                    alt={cleanTrackTitle(currentTrack.title).title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-0.5 bg-yellow-400 rounded-full animate-bar-1" />
                        <span className="w-0.5 bg-yellow-400 rounded-full animate-bar-2" />
                        <span className="w-0.5 bg-yellow-400 rounded-full animate-bar-3" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Vertical "NOW PLAYING" Label */}
                <div
                  onClick={() => setIsRightPanelOpen(true)}
                  className="flex-1 flex items-center justify-center cursor-pointer group py-6"
                  title="Click to expand Now Playing panel"
                >
                  <span className="text-[10px] font-black tracking-widest text-white/30 group-hover:text-yellow-400 uppercase rotate-90 whitespace-nowrap transition-colors select-none">
                    NOW PLAYING
                  </span>
                </div>

                {/* Bottom: Cinema mode quick expand */}
                <button
                  onClick={() => setIsCinemaMode(true)}
                  className="w-9 h-9 rounded-xl text-white/40 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
                  title="Fullscreen Cinema Mode"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </>
            )}
          </aside>
        )}
      </div>



      {/* ══════════════════════════════════════════════════
          4. SOUNDSTREAM SIGNATURE BOTTOM PLAYBACK BAR
         ══════════════════════════════════════════════════ */}
      {currentTrack && (
        <div className="shrink-0 z-40 relative select-none">
          {/* ── MOBILE DOCKED MINIPLAYER (Android Web Native Feel) ── */}
          <div
            onClick={() => setIsCinemaMode(true)}
            className="md:hidden flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#141414] via-[#101010] to-[#141414] border-t border-white/[0.08] cursor-pointer relative shadow-lg"
          >
            {/* Top edge active scrubber line */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-white/10">
              <div
                className="h-full bg-yellow-400 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Left: Mini Artwork + Track Info */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-[#202020] shrink-0 border border-white/10 relative">
                <ArtworkImage
                  title={cleanTrackTitle(currentTrack.title).title}
                  artist={getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                  trackId={currentTrack.id}
                  initialSrc={currentTrack.thumbnail}
                  alt={cleanTrackTitle(currentTrack.title).title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate leading-tight">
                  {cleanTrackTitle(currentTrack.title).title}
                </p>
                <p className="text-[10px] text-white/50 truncate mt-0.5 font-medium">
                  {getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                </p>
              </div>
            </div>

            {/* Right: Quick Mobile Actions */}
            <div
              className="flex items-center gap-1 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onToggleFavorite(currentTrack)}
                className={`p-2 transition-colors cursor-pointer ${
                  isCurrentFavorite ? 'text-yellow-400' : 'text-white/40 hover:text-white'
                }`}
                title={isCurrentFavorite ? 'Saved' : 'Save'}
              >
                <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={onTogglePlay}
                className="w-9 h-9 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-[0_0_10px_rgba(250,204,21,0.4)] cursor-pointer active:scale-90 transition-all shrink-0 ml-1"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isBuffering ? (
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-black text-black" />
                ) : (
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* ── DESKTOP PLAYBACK BAR (Screens >= md) ── */}
          <footer className="hidden md:flex h-20 bg-black/95 backdrop-blur-2xl border-t border-white/[0.08] px-3 sm:px-5 items-center justify-between">
            {/* Left: Mini Artwork + Track Info + Favorite */}
            <div className="flex items-center gap-2.5 sm:gap-3 w-1/4 min-w-[160px] max-w-[320px]">
              <div
                onClick={() => setIsCinemaMode(true)}
                className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-[#202020] shrink-0 shadow-md border border-white/10 cursor-pointer group"
                title="Open Cinema Mode"
              >
                <ArtworkImage
                  title={cleanTrackTitle(currentTrack.title).title}
                  artist={getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                  trackId={currentTrack.id}
                  initialSrc={currentTrack.thumbnail}
                  alt={cleanTrackTitle(currentTrack.title).title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="min-w-0 pr-1">
                <p
                  onClick={() => setIsCinemaMode(true)}
                  className="text-xs sm:text-sm font-bold text-white truncate cursor-pointer hover:text-yellow-400 transition-colors"
                >
                  {cleanTrackTitle(currentTrack.title).title}
                </p>
                <p className="text-[11px] text-white/50 truncate mt-0.5 font-medium">
                  {getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                </p>
              </div>

              <button
                onClick={() => onToggleFavorite(currentTrack)}
                className={`p-1.5 transition-colors shrink-0 cursor-pointer ${
                  isCurrentFavorite ? 'text-yellow-400' : 'text-white/40 hover:text-white'
                }`}
                title={isCurrentFavorite ? 'Saved to library' : 'Save to library'}
              >
                <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Center: Transport Controls + Desktop Progress Scrubber */}
            <div className="flex-1 max-w-2xl px-2 sm:px-6 flex flex-col items-center gap-1 sm:gap-1.5">
              {/* Transport Controls */}
              <div className="flex items-center gap-4 sm:gap-6">
                <button
                  onClick={onToggleShuffle}
                  className={`p-1.5 transition-colors cursor-pointer hidden sm:block ${
                    isShuffle ? 'text-yellow-400 shadow-[0_0_8px_#facc15]' : 'text-white/50 hover:text-white'
                  }`}
                  title="Shuffle"
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                <button
                  onClick={onPrev}
                  className="p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Previous track"
                >
                  <SkipBack className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-current" />
                </button>

                {/* Big Circular Play / Pause Button */}
                <button
                  onClick={onTogglePlay}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(250,204,21,0.4)] cursor-pointer shrink-0"
                  title={isPlaying ? 'Pause' : 'Play'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isBuffering ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 fill-black text-black" />
                  ) : (
                    <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                  )}
                </button>

                <button
                  onClick={onNext}
                  className="p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Next track"
                >
                  <SkipForward className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-current" />
                </button>

                <button
                  onClick={onToggleRepeat}
                  className={`p-1.5 transition-colors cursor-pointer hidden sm:block ${
                    repeatMode !== 'off' ? 'text-yellow-400 shadow-[0_0_8px_#facc15]' : 'text-white/50 hover:text-white'
                  }`}
                  title={`Repeat: ${repeatMode}`}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </button>
              </div>

              {/* Desktop Scrubber Timeline */}
              <div className="w-full flex items-center gap-2.5 group/scrubber cursor-pointer select-none">
                <span className="text-[11px] font-mono text-white/50 min-w-[34px] text-right">
                  {formatTime(currentTime)}
                </span>

                <div className="relative flex-1 flex items-center h-4">
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden relative pointer-events-none">
                    <div
                      className="h-full bg-yellow-400 group-hover/scrubber:bg-yellow-300 rounded-full transition-colors"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-yellow-400 rounded-full shadow-[0_0_8px_#facc15] opacity-0 group-hover/scrubber:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `calc(${progressPercent}% - 7px)` }}
                  />

                  <input
                    type="range"
                    min={0}
                    max={effectiveDuration || 100}
                    step={0.5}
                    value={currentTime}
                    onChange={(e) => onSeek(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    aria-label="Seek track"
                  />
                </div>

                <span className="text-[11px] font-mono text-white/50 min-w-[34px]">
                  {formatTime(effectiveDuration)}
                </span>
              </div>
            </div>

            {/* Right: Video, Lyrics, Sidebar Toggle, Volume Slider */}
            <div className="flex items-center justify-end gap-1 sm:gap-2 w-1/4 min-w-[80px] max-w-[300px]">
              {/* Ultra Lossless / Studio Master Audio Badge */}
              <button
                onClick={() => {
                  if (onChangePlaybackQuality) {
                    const nextQ = playbackQuality === 'highres' ? 'hd1080' : 'highres';
                    onChangePlaybackQuality(nextQ);
                  }
                }}
                className="px-2 py-1 rounded-md bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/40 text-[10px] font-black text-yellow-400 tracking-wider transition-all cursor-pointer hidden sm:flex items-center gap-1 shadow-[0_0_8px_rgba(250,204,21,0.2)]"
                title="Master Hi-Fi Audio Stream: Ultra Bitrate (256-320kbps equivalent Opus/AAC stream container)"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                <span>HI-FI MASTER</span>
              </button>

              {/* Toggle Video (Directly Opens Cinema Mode in Video view) */}
              <button
                onClick={() => {
                  if (!isVideoVisible) onToggleVideo();
                  setMaximizeViewMode('video');
                  setIsCinemaMode(true);
                }}
                className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer relative flex flex-col items-center justify-center ${
                  isVideoVisible
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 shadow-[0_0_8px_rgba(250,204,21,0.3)]'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                }`}
                title="Watch Video (Cinema Mode)"
              >
                <Film className="w-4 h-4" />
              </button>

              {/* Lyrics View Toggle (Directly Opens Cinema Mode, No Other Tab) */}
              <button
                onClick={() => {
                  if (isCinemaMode && maximizeViewMode === 'lyrics') {
                    setIsCinemaMode(false);
                  } else {
                    setMaximizeViewMode('lyrics');
                    setIsCinemaMode(true);
                  }
                }}
                className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer ${
                  isCinemaMode && maximizeViewMode === 'lyrics'
                    ? 'bg-yellow-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.4)]'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                }`}
                title="Synchronized Lyrics (Cinema Mode)"
              >
                <Mic2 className="w-4 h-4" />
              </button>

              {/* Toggle Right Panel (Now Playing Panel) */}
              <button
                onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                className={`p-1.5 sm:p-2 rounded-xl transition-all cursor-pointer hidden xl:flex ${
                  isRightPanelOpen
                    ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/40 shadow-[0_0_8px_rgba(250,204,21,0.3)]'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                }`}
                title={isRightPanelOpen ? 'Close panel to side' : 'Open panel from side'}
              >
                {isRightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>

              {/* Volume Control Bar */}
              <div className="hidden lg:flex items-center gap-1.5 ml-1 select-none">
                <button
                  onClick={() => onChangeVolume(volume === 0 ? 80 : 0)}
                  className="p-1 text-white/60 hover:text-white transition-colors cursor-pointer"
                  title="Mute / Unmute"
                >
                  <VolumeIcon className="w-4 h-4" />
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => onChangeVolume(Number(e.target.value))}
                  className="w-20 accent-yellow-400 cursor-pointer h-1 rounded-full bg-white/20"
                  aria-label="Volume"
                />
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* ── ANDROID PHONE BOTTOM NAVIGATION BAR (< md) ── */}
      <nav
        className="md:hidden bg-[#0a0a0a]/95 backdrop-blur-2xl border-t border-white/[0.08] px-6 py-2 flex items-center justify-around shrink-0 z-40 select-none pb-[calc(0.5rem+var(--safe-bottom))]"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button
          onClick={() => {
            setMobileNavTab('home');
            setCenterViewMode('home');
            setIsMobileSearchOpen(false);
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            mobileNavTab === 'home' && !isMobileSearchOpen ? 'text-yellow-400' : 'text-white/50 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Home</span>
        </button>

        <button
          onClick={() => {
            setMobileNavTab('search');
            setIsMobileSearchOpen(true);
            setTimeout(() => {
              const el = document.getElementById('soundstream-search-input');
              if (el) el.focus();
            }, 50);
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            mobileNavTab === 'search' || isMobileSearchOpen ? 'text-yellow-400' : 'text-white/50 hover:text-white'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Search</span>
        </button>

        <button
          onClick={() => {
            setMobileNavTab('library');
            setCenterViewMode('library');
            setIsMobileSearchOpen(false);
          }}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${
            mobileNavTab === 'library' || centerViewMode === 'library' ? 'text-yellow-400' : 'text-white/50 hover:text-white'
          }`}
        >
          <Library className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-tight">Library</span>
        </button>
      </nav>

      {/* ══════════════════════════════════════════════════
          5. FULLSCREEN CINEMA MODE (Matching screenshot placement & SoundStream Theme)
         ══════════════════════════════════════════════════ */}
      {isCinemaMode && currentTrack && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-between overflow-hidden animate-in fade-in duration-200 select-none"
          style={{
            backgroundColor: `rgb(${Math.max(16, Math.round(posterColor.r * 0.16 + 12))}, ${Math.max(16, Math.round(posterColor.g * 0.16 + 12))}, ${Math.max(18, Math.round(posterColor.b * 0.16 + 15))})`,
          }}
        >
          {/* Subtle Ambient Radial Lighting */}
          <div
            className="absolute inset-0 opacity-25 pointer-events-none blur-3xl"
            style={{
              background: `radial-gradient(circle at 50% 30%, rgb(${posterColor.r}, ${posterColor.g}, ${posterColor.b}) 0%, transparent 70%)`,
            }}
          />

          {/* ── TOP BAR (Track title left, controls right) ── */}
          <div className="relative z-10 w-full px-4 sm:px-10 py-3 sm:py-5 flex items-center justify-between shrink-0 pt-[calc(0.75rem+var(--safe-top))]">
            {/* Left: Mobile collapse chevron / Track Title */}
            <div className="flex items-center gap-2 min-w-0 pr-4">
              <button
                onClick={() => setIsCinemaMode(false)}
                className="p-1.5 -ml-1 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Collapse (Esc)"
              >
                <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div className="min-w-0">
                <span className="text-xs sm:text-base font-bold text-white/90 truncate tracking-tight block">
                  {cleanTrackTitle(currentTrack.title).title}
                </span>
                <span className="text-[10px] sm:hidden text-white/50 truncate block">
                  {getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                </span>
              </div>
            </div>

            {/* Right: Mode Switchers & Utility Icons */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Disc / Poster Mode */}
              <button
                onClick={() => setMaximizeViewMode('poster')}
                className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${
                  maximizeViewMode === 'poster'
                    ? 'text-yellow-400 drop-shadow-[0_0_8px_#facc15]'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Cover Art Mode"
              >
                <Disc className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Video Mode */}
              <button
                onClick={() => {
                  if (!isVideoVisible) onToggleVideo();
                  setMaximizeViewMode('video');
                }}
                className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${
                  maximizeViewMode === 'video'
                    ? 'text-yellow-400 drop-shadow-[0_0_8px_#facc15]'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Video Mode"
              >
                <Film className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Lyrics Mode */}
              <button
                onClick={() => setMaximizeViewMode('lyrics')}
                className={`p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${
                  maximizeViewMode === 'lyrics'
                    ? 'text-yellow-400 drop-shadow-[0_0_8px_#facc15]'
                    : 'text-white/60 hover:text-white'
                }`}
                title="Lyrics Mode"
              >
                <Mic2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Exit Cinema Mode (Desktop) */}
              <button
                onClick={() => setIsCinemaMode(false)}
                className="hidden sm:block p-2 rounded-full text-white/60 hover:text-white transition-colors cursor-pointer"
                title="Exit Fullscreen (Esc)"
              >
                <Minimize2 className="w-4.5 h-4.5" />
              </button>

              {/* SoundStream Signature Sparkle Widget */}
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shadow-[0_0_12px_rgba(250,204,21,0.3)] ml-1 shrink-0"
                title="SoundStream Pure Audio"
              >
                <Sparkles className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              </div>
            </div>
          </div>

          {/* ── CENTER STAGE (Left-aligned lyrics / clean 16:9 video / poster) ── */}
          <div className="relative z-10 flex-1 w-full overflow-hidden flex flex-col justify-center">
            {maximizeViewMode === 'lyrics' && (
              <div className="w-full h-full overflow-y-auto no-scrollbar flex flex-col justify-start px-6 sm:px-14 md:px-20 lg:px-28 xl:px-36 py-10 sm:py-16">
                <div className="max-w-4xl space-y-6 sm:space-y-8 select-text">
                  {lyricsData.isLoading ? (
                    <div className="flex items-center gap-3 text-yellow-400 text-xl font-bold animate-pulse text-left">
                      <Mic2 className="w-6 h-6 animate-spin" />
                      <span>Fetching synchronized lyrics...</span>
                    </div>
                  ) : lyricsData.parsedLines.length > 0 ? (
                    lyricsData.parsedLines.map((line, idx) => {
                      const isActive = idx === activeLyricIndex;
                      return (
                        <p
                          key={idx}
                          ref={isActive ? activeCenterLineRef : null}
                          onClick={() => onSeek(line.time)}
                          className={`cursor-pointer transition-all duration-300 font-black text-left leading-tight sm:leading-snug ${
                            isActive
                              ? 'text-yellow-400 text-2xl sm:text-4xl lg:text-5xl drop-shadow-[0_0_18px_rgba(250,204,21,0.45)]'
                              : 'text-white/35 hover:text-white/80 text-xl sm:text-3xl lg:text-4xl'
                          }`}
                        >
                          {line.text}
                        </p>
                      );
                    })
                  ) : lyricsData.plainLyrics ? (
                    <div className="text-white/80 text-xl sm:text-3xl font-bold leading-relaxed whitespace-pre-line text-left">
                      {lyricsData.plainLyrics}
                    </div>
                  ) : (
                    <p className="text-white/50 text-xl font-bold text-left">
                      No synchronized lyrics found for this track.
                    </p>
                  )}
                </div>
              </div>
            )}

            {maximizeViewMode === 'video' && (
              /* Pure Clean 16:9 Video Frame: Zero overlay badges, zero options, completely responsive */
              <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 md:p-8">
                <div
                  id="soundstream-cinema-video-container"
                  className="w-full max-w-5xl aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95)] bg-black border border-white/10 relative"
                />
              </div>
            )}

            {maximizeViewMode === 'poster' && (
              <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
                <div className="w-72 sm:w-96 md:w-[460px] aspect-square rounded-3xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.9)] border border-white/20 bg-black">
                  <ArtworkImage
                    title={cleanTrackTitle(currentTrack.title).title}
                    artist={getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                    trackId={currentTrack.id}
                    initialSrc={currentTrack.thumbnail}
                    alt={cleanTrackTitle(currentTrack.title).title}
                    priority
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── CINEMA MODE DOCKED BOTTOM PLAYBACK BAR ── */}
          <div
            className="relative z-10 w-full bg-black/85 backdrop-blur-2xl border-t border-white/[0.08] px-4 sm:px-8 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between shrink-0 select-none gap-3 sm:gap-0"
            style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Top/Left on mobile: Mini Thumbnail, Track Info, Plus / Favorite */}
            <div className="flex items-center gap-3 w-full sm:w-1/4 sm:min-w-[160px] sm:max-w-[320px] justify-between sm:justify-start">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-[#202020] shrink-0 shadow-md border border-white/10">
                  <ArtworkImage
                    title={cleanTrackTitle(currentTrack.title).title}
                    artist={getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                    trackId={currentTrack.id}
                    initialSrc={currentTrack.thumbnail}
                    alt={cleanTrackTitle(currentTrack.title).title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="min-w-0 pr-1">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                    {cleanTrackTitle(currentTrack.title).title}
                  </p>
                  <p className="text-[10px] sm:text-xs text-white/50 truncate mt-0.5 font-medium">
                    {getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onToggleFavorite(currentTrack)}
                className={`p-1.5 transition-colors shrink-0 cursor-pointer ${
                  isCurrentFavorite ? 'text-yellow-400' : 'text-white/40 hover:text-white'
                }`}
                title={isCurrentFavorite ? 'Saved to library' : 'Save to library'}
              >
                <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Center: Controls + Timeline Scrubber */}
            <div className="w-full sm:flex-1 sm:max-w-2xl sm:px-6 flex flex-col items-center gap-1 sm:gap-1.5">
              {/* Transport Controls */}
              <div className="flex items-center gap-4 sm:gap-6">
                <button
                  onClick={onToggleShuffle}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    isShuffle ? 'text-yellow-400 shadow-[0_0_8px_#facc15]' : 'text-white/50 hover:text-white'
                  }`}
                  title="Shuffle"
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                <button
                  onClick={onPrev}
                  className="p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Previous track"
                >
                  <SkipBack className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-current" />
                </button>

                {/* Play / Pause Circular Button */}
                <button
                  onClick={onTogglePlay}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(250,204,21,0.4)] cursor-pointer shrink-0"
                  title={isPlaying ? 'Pause' : 'Play'}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isBuffering ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-5 h-5 fill-black text-black" />
                  ) : (
                    <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                  )}
                </button>

                <button
                  onClick={onNext}
                  className="p-1.5 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Next track"
                >
                  <SkipForward className="w-4.5 h-4.5 sm:w-5 sm:h-5 fill-current" />
                </button>

                <button
                  onClick={onToggleRepeat}
                  className={`p-1.5 transition-colors cursor-pointer ${
                    repeatMode !== 'off' ? 'text-yellow-400 shadow-[0_0_8px_#facc15]' : 'text-white/50 hover:text-white'
                  }`}
                  title={`Repeat: ${repeatMode}`}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </button>
              </div>

              {/* Timeline Scrubber */}
              <div className="w-full flex items-center gap-2.5 group/scrubber cursor-pointer select-none">
                <span className="text-[11px] font-mono text-white/50 min-w-[34px] text-right">
                  {formatTime(currentTime)}
                </span>

                <div className="relative flex-1 flex items-center h-4">
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden relative pointer-events-none">
                    <div
                      className="h-full bg-yellow-400 group-hover/scrubber:bg-yellow-300 rounded-full transition-colors"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-yellow-400 rounded-full shadow-[0_0_8px_#facc15] opacity-0 group-hover/scrubber:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `calc(${progressPercent}% - 7px)` }}
                  />

                  <input
                    type="range"
                    min={0}
                    max={effectiveDuration || 100}
                    step={0.5}
                    value={currentTime}
                    onChange={(e) => onSeek(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    aria-label="Seek track"
                  />
                </div>

                <span className="text-[11px] font-mono text-white/50 min-w-[34px]">
                  {formatTime(effectiveDuration)}
                </span>
              </div>
            </div>

            {/* Right: SoundStream Audio Quality + Volume Slider */}
            <div className="hidden sm:flex items-center justify-end gap-2.5 sm:gap-4 w-1/4 min-w-[80px] max-w-[320px]">
              {/* SoundStream Lossless HD Audio Badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/25 text-yellow-400 text-[11px] font-bold tracking-wider">
                <Radio className="w-3.5 h-3.5 text-yellow-400" />
                <span className="hidden md:inline">Lossless • 320kbps</span>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-1.5 select-none">
                <button
                  onClick={() => onChangeVolume(volume === 0 ? 80 : 0)}
                  className="p-1 text-white/60 hover:text-white transition-colors cursor-pointer"
                  title="Mute / Unmute"
                >
                  <VolumeIcon className="w-4.5 h-4.5" />
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => onChangeVolume(Number(e.target.value))}
                  className="w-16 sm:w-20 accent-yellow-400 cursor-pointer h-1 rounded-full bg-white/20"
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PERSISTENT ZERO-UNMOUNT VIDEO SLOT CONTAINER ── */}
      {/*
        CRITICAL ARCHITECTURE:
        YouTubePlayer iframe lives in this SINGLE DOM container permanently across the app's entire lifecycle.
        - In Cinema Mode (maximizeViewMode === 'video'): Styled into a centered responsive 16:9 box.
        - In any other mode or audio-only: Fixed offscreen with opacity 0 so audio plays without interruption and iframe never unmounts.
      */}
      <div
        className={
          isCinemaMode && maximizeViewMode === 'video'
            ? 'fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 md:p-8 pointer-events-none'
            : 'fixed -left-[9999px] top-0 w-1 h-1 opacity-0 pointer-events-none'
        }
      >
        <div
          className={
            isCinemaMode && maximizeViewMode === 'video'
              ? 'w-full max-w-5xl aspect-video rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.95)] bg-black border border-white/10 relative pointer-events-auto'
              : 'w-1 h-1 overflow-hidden'
          }
        >
          {videoSlot}
        </div>
      </div>
    </div>
  );
};
