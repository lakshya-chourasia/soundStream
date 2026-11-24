import React, { useState, useEffect, useLayoutEffect, useRef, useMemo } from 'react';
import { Track, RepeatMode, GenreCollection, StreamQuality } from '../types/player';
import {
  cleanTrackTitle,
  getFullSingerName,
  parseLrcLyrics,
  findActiveLyricIndex,
  formatTime,
  cryptoShuffleList,
} from '../utils/playerUtils';
import { getQualityOption } from '../utils/qualityConfig';
import {
  Play,
  Pause,
  Shuffle,
  Heart,
  Plus,
  Check,
  Search,
  X,
  Maximize2,
  Film,
  PanelRightClose,
  PanelRightOpen,
  Home,
  ListMusic,
  Mic,
  Mic2,
  Layers,
  Library,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Dices,
  RefreshCw,
} from 'lucide-react';
import { useVoiceSearch } from '../hooks/useVoiceSearch';
import { ArtworkImage } from './ArtworkImage';
import { InteractiveCoverArt } from './InteractiveCoverArt';
import { UnifiedTrackCard } from './UnifiedTrackCard';
import { UnifiedPlaybackBar } from './UnifiedPlaybackBar';
import { QueueView } from './QueueView';
import { CinemaModeOverlay, CinemaViewMode } from './CinemaModeOverlay';
import { PWAInstallButton } from './PWAInstallButton';
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
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onChangeVolume: (volume: number) => void;
  onToggleVideo: () => void;
  onSetVideoVisible?: (visible: boolean) => void;
  onPlayTrack: (track: Track) => void;
  onPlayGenre?: (genre: GenreCollection) => void;
  onAddToQueue: (track: Track) => void;
  onRemoveFromQueue?: (track: Track) => void;
  onClearQueue?: () => void;
  onToggleFavorite: (track: Track) => void;
  onSearch: (query: string) => void;
  onClearSearch: () => void;
  genres?: GenreCollection[];
  featuredTracks?: Track[];
  popularTracks?: Track[];
  isRandomizingFeed?: boolean;
  isSurpriseLoading?: boolean;
  onRandomizeFeed?: () => void;
  onSurprisePlay?: () => void;
  onRefreshRecommendations?: () => void;
  playbackQuality?: StreamQuality;
  onChangePlaybackQuality?: (quality: StreamQuality) => void;
}

function formatCollectionTag(rawTag?: string): string {
  if (!rawTag) return 'Curated';
  const cleaned = rawTag.replace(/^#/, '').replace(/[-_]+/g, ' ').trim();
  return cleaned.toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());
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
  genres = [],
  featuredTracks = [],
  popularTracks = [],
  isRandomizingFeed = false,
  isSurpriseLoading = false,
  onRandomizeFeed,
  onSurprisePlay,
  onRefreshRecommendations,
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
  onSetVideoVisible,
  onPlayTrack,
  onPlayGenre,
  onAddToQueue,
  onRemoveFromQueue,
  onClearQueue,
  onToggleFavorite,
  onSearch,
  onClearSearch,
}) => {
  // ── Workspace Navigation & View States ──
  const [centerViewMode, setCenterViewMode] = useState<'home' | 'library' | 'queue'>('home');
  const [homeFilter, setHomeFilter] = useState<'all' | 'music' | 'vibes' | 'videos'>('all');
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState<boolean>(false);
  const [randomSeed, setRandomSeed] = useState<number>(() => Date.now());
  const [activeHeroIndex, setActiveHeroIndex] = useState<number>(0);

  // ── Resizable Sidebars ──
  const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('soundstream_left_width');
      return saved ? Math.max(220, Math.min(400, Number(saved))) : 272;
    } catch {
      return 272;
    }
  });

  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('soundstream_right_width');
      return saved ? Math.max(276, Math.min(420, Number(saved))) : 332;
    } catch {
      return 332;
    }
  });

  const isDraggingLeftRef = useRef<boolean>(false);
  const isDraggingRightRef = useRef<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingLeftRef.current) {
        const newWidth = Math.max(220, Math.min(400, e.clientX - 10));
        setLeftSidebarWidth(newWidth);
        try {
          localStorage.setItem('soundstream_left_width', newWidth.toString());
        } catch {}
      } else if (isDraggingRightRef.current) {
        const newWidth = Math.max(276, Math.min(420, window.innerWidth - e.clientX - 10));
        setRightSidebarWidth(newWidth);
        try {
          localStorage.setItem('soundstream_right_width', newWidth.toString());
        } catch {}
      }
    };

    const handleMouseUp = () => {
      if (isDraggingLeftRef.current || isDraggingRightRef.current) {
        isDraggingLeftRef.current = false;
        isDraggingRightRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Quick `/` shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.key === '/' &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA' &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Left Library Tab & Right Panel Visibility ──
  const [libraryTab, setLibraryTab] = useState<'all' | 'queue' | 'recommended' | 'favorites'>('all');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);

  // ── Progressive Cut-Off Blur Detection for Left Sidebar Tabs & Track List ──
  const libraryTabsRef = useRef<HTMLDivElement | null>(null);
  const libraryListRef = useRef<HTMLDivElement | null>(null);
  const [tabEdgeBlur, setTabEdgeBlur] = useState<{ left: boolean; right: boolean }>({
    left: false,
    right: false,
  });
  const [listEdgeBlur, setListEdgeBlur] = useState<{ top: boolean; bottom: boolean }>({
    top: false,
    bottom: true,
  });

  const syncTabEdgeBlur = () => {
    const el = libraryTabsRef.current;
    if (!el) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setTabEdgeBlur((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
  };

  const syncListEdgeBlur = () => {
    const el = libraryListRef.current;
    if (!el) return;
    const top = el.scrollTop > 4;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 4;
    setListEdgeBlur((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
  };

  // ── Fullscreen Cinema Mode ──
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [cinemaViewMode, setCinemaViewMode] = useState<CinemaViewMode>('poster');

  // ── Right Sidebar Live Video Docking (Zero-Unmount Single Player) ──
  const [isRightVideoDocked, setIsRightVideoDocked] = useState<boolean>(false);
  const [startedVideoTrackId, setStartedVideoTrackId] = useState<string | null>(null);
  const rightSidebarRef = useRef<HTMLElement | null>(null);
  const rightVideoAnchorRef = useRef<HTMLDivElement | null>(null);
  const videoSlotWrapperRef = useRef<HTMLDivElement | null>(null);

  const isCinemaVideo = Boolean(isCinemaMode && cinemaViewMode === 'video');
  const isDockedInRightPanel = Boolean(currentTrack && !isCinemaMode && isRightPanelOpen);
  const isDockedVideoRevealed = Boolean(currentTrack && startedVideoTrackId === currentTrack.id);

  useEffect(() => {
    if (
      currentTrack?.id &&
      ((isPlaying && !isBuffering) || (isPlaying && currentTime > 0.15))
    ) {
      setStartedVideoTrackId((prev) => (prev === currentTrack.id ? prev : currentTrack.id));
    }
  }, [currentTrack?.id, isPlaying, isBuffering, currentTime]);

  useLayoutEffect(() => {
    const slotEl = videoSlotWrapperRef.current;

    const clearDockedStyles = () => {
      if (slotEl) {
        slotEl.style.left = '';
        slotEl.style.top = '';
        slotEl.style.width = '';
        slotEl.style.height = '';
        slotEl.style.clipPath = '';
        slotEl.style.pointerEvents = '';
      }
      setIsRightVideoDocked(false);
    };

    if (!isDockedInRightPanel) {
      clearDockedStyles();
      return;
    }

    const syncDockedGeometry = () => {
      const anchorEl = rightVideoAnchorRef.current;
      const asideEl = rightSidebarRef.current;
      const wrapperEl = videoSlotWrapperRef.current;
      if (!anchorEl || !asideEl || !wrapperEl) {
        clearDockedStyles();
        return;
      }

      const anchorRect = anchorEl.getBoundingClientRect();
      const asideRect = asideEl.getBoundingClientRect();

      // When hidden below `xl` breakpoint or collapsed, revert to Android-safe background slot
      if (anchorRect.width < 40 || anchorRect.height < 40 || asideRect.width < 40) {
        clearDockedStyles();
        return;
      }

      const clipTop = Math.max(0, asideRect.top - anchorRect.top);
      const clipRight = Math.max(0, anchorRect.right - asideRect.right);
      const clipBottom = Math.max(0, anchorRect.bottom - asideRect.bottom);
      const clipLeft = Math.max(0, asideRect.left - anchorRect.left);
      const isFullyClipped = clipTop >= anchorRect.height || clipBottom >= anchorRect.height;

      wrapperEl.style.left = `${anchorRect.left}px`;
      wrapperEl.style.top = `${anchorRect.top}px`;
      wrapperEl.style.width = `${anchorRect.width}px`;
      wrapperEl.style.height = `${anchorRect.height}px`;
      wrapperEl.style.clipPath = `inset(${clipTop}px ${clipRight}px ${clipBottom}px ${clipLeft}px round 12px)`;
      wrapperEl.style.pointerEvents = isFullyClipped ? 'none' : '';
      setIsRightVideoDocked(true);
    };

    syncDockedGeometry();
    const rafId = window.requestAnimationFrame(syncDockedGeometry);

    const asideEl = rightSidebarRef.current;
    const anchorEl = rightVideoAnchorRef.current;

    asideEl?.addEventListener('scroll', syncDockedGeometry, { passive: true });
    asideEl?.addEventListener('transitionend', syncDockedGeometry);
    window.addEventListener('resize', syncDockedGeometry);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(syncDockedGeometry);
      if (asideEl) observer.observe(asideEl);
      if (anchorEl) observer.observe(anchorEl);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      asideEl?.removeEventListener('scroll', syncDockedGeometry);
      asideEl?.removeEventListener('transitionend', syncDockedGeometry);
      window.removeEventListener('resize', syncDockedGeometry);
      observer?.disconnect();
    };
  }, [isDockedInRightPanel, rightSidebarWidth, currentTrack?.id]);

  const syncVideoVisible = (visible: boolean) => {
    if (onSetVideoVisible) {
      onSetVideoVisible(visible);
    } else if (visible !== isVideoVisible) {
      onToggleVideo();
    }
  };

  const openCinema = (mode: CinemaViewMode) => {
    setCinemaViewMode(mode);
    setIsCinemaMode(true);
    syncVideoVisible(mode === 'video');
  };

  const closeCinema = () => {
    setIsCinemaMode(false);
    syncVideoVisible(false);
  };

  const handleCinemaViewModeChange = (mode: CinemaViewMode) => {
    setCinemaViewMode(mode);
    syncVideoVisible(mode === 'video');
  };

  // ── Dynamic Poster Ambient Color ──
  const [posterColor, setPosterColor] = useState<RGBColor>({ r: 245, g: 158, b: 11 });

  // ── Search State ──
  const [localSearchInput, setLocalSearchInput] = useState<string>(searchQuery || '');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Synced Lyrics State ──
  const [lyricsData, setLyricsData] = useState<{
    plainLyrics: string | null;
    syncedLyrics: string | null;
    parsedLines: Array<{ time: number; text: string }>;
    instrumental?: boolean;
    quotaExceeded?: boolean;
    isLoading: boolean;
  }>({
    plainLyrics: null,
    syncedLyrics: null,
    parsedLines: [],
    instrumental: false,
    quotaExceeded: false,
    isLoading: false,
  });
  const lyricsCacheRef = useRef<Map<string, any>>(new Map());

  // ── Dynamic Catalog Pool ──
  const allCatalogPool = useMemo(() => {
    const map = new Map<string, Track>();
    for (const g of genres) {
      for (const t of g.tracks || []) {
        if (!map.has(t.id)) map.set(t.id, t);
      }
    }
    for (const t of recommendations) {
      if (!map.has(t.id)) map.set(t.id, t);
    }
    for (const t of queue) {
      if (!map.has(t.id)) map.set(t.id, t);
    }
    for (const t of favorites) {
      if (!map.has(t.id)) map.set(t.id, t);
    }
    return Array.from(map.values());
  }, [genres, recommendations, queue, favorites]);

  const dynamicCollections = useMemo(
    () =>
      genres.map((g) => ({
        raw: g,
        id: g.id,
        name: g.name,
        description: g.description,
        tagLabel: formatCollectionTag((g as any).tag || g.id),
        tracks: g.tracks || [],
      })),
    [genres]
  );

  const dynamicPopularTracks = useMemo(() => {
    if (popularTracks.length > 0) {
      return cryptoShuffleList(popularTracks).slice(0, 9);
    }
    const pool = genres.flatMap((g) => g.tracks || []);
    return cryptoShuffleList(pool).slice(0, 9);
  }, [popularTracks, genres, randomSeed]);

  const dynamicVibeTracks = useMemo(() => {
    const list: Track[] = [];
    for (const c of dynamicCollections) {
      if (c.tracks.length > 0) list.push(...c.tracks);
    }
    return cryptoShuffleList(list).slice(0, 8);
  }, [dynamicCollections, randomSeed]);

  const randomizedLibraryPool = useMemo(() => {
    return cryptoShuffleList(allCatalogPool);
  }, [allCatalogPool, randomSeed]);

  const featuredItems = useMemo(() => {
    const source =
      featuredTracks.length > 0 ? featuredTracks.slice(0, 4) : dynamicPopularTracks.slice(0, 4);
    const list = source.length > 0 ? source : currentTrack ? [currentTrack] : [];
    return list.map((track) => {
      const { title: cleanT, artistFromTitle } = cleanTrackTitle(track.title);
      return {
        track,
        title: cleanT,
        artist: getFullSingerName(track.artist || artistFromTitle || '', cleanT),
        duration:
          track.duration && track.duration !== 'YouTube Track'
            ? track.duration
            : track.durationSec > 0
            ? formatTime(track.durationSec)
            : '',
      };
    });
  }, [featuredTracks, dynamicPopularTracks, currentTrack]);

  const activeHeroIdx =
    ((activeHeroIndex % Math.max(1, featuredItems.length)) + Math.max(1, featuredItems.length)) %
    Math.max(1, featuredItems.length);
  const activeHeroItem = featuredItems[activeHeroIdx];

  // True Up Next tracks (excluding currently playing track)
  const upNextPreviewTracks = useMemo(() => {
    if (!currentTrack) return queue.slice(0, 3);
    const idx = queue.findIndex((t) => t.id === currentTrack.id);
    if (idx === -1) return queue.filter((t) => t.id !== currentTrack.id).slice(0, 3);
    const ordered = [...queue.slice(idx + 1), ...queue.slice(0, idx)];
    return ordered.slice(0, 3);
  }, [queue, currentTrack]);

  // Fast lookup sets
  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  const queueIds = useMemo(() => new Set(queue.map((q) => q.id)), [queue]);
  const isCurrentFavorite = currentTrack ? favoriteIds.has(currentTrack.id) : false;
  const isCurrentInQueue = currentTrack ? queueIds.has(currentTrack.id) : false;
  const activeQuality = getQualityOption(playbackQuality);

  const activeLyricIndex = findActiveLyricIndex(lyricsData.parsedLines, currentTime);

  // Fetch synced lyrics whenever currentTrack changes
  useEffect(() => {
    if (!currentTrack?.id) return;
    const cacheKey = currentTrack.id;
    if (lyricsCacheRef.current.has(cacheKey)) {
      setLyricsData({ ...lyricsCacheRef.current.get(cacheKey), isLoading: false });
      return;
    }

    setLyricsData((prev) => ({ ...prev, isLoading: true }));
    const controller = new AbortController();

    const { title: t, artistFromTitle: a } = cleanTrackTitle(currentTrack.title);
    const singer = getFullSingerName(currentTrack.artist || a || '', t);

    const queryParams = new URLSearchParams({
      track: t,
      artist: singer,
      durationSec: (currentTrack.durationSec || 0).toString(),
    });

    fetch(`/api/lyrics?${queryParams.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        let parsed = data.syncedLyrics ? parseLrcLyrics(data.syncedLyrics) : [];
        if (parsed.length === 0 && data.plainLyrics) {
          const lines = data.plainLyrics
            .split('\n')
            .map((l: string) => l.trim())
            .filter(Boolean);
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
          instrumental: !!data.instrumental,
          quotaExceeded: !!data.quotaExceeded,
        };
        lyricsCacheRef.current.set(cacheKey, resData);
        setLyricsData({ ...resData, isLoading: false });
      })
      .catch((err) => {
        if (err?.name === 'AbortError' || controller.signal.aborted) return;
        setLyricsData({
          plainLyrics: null,
          syncedLyrics: null,
          parsedLines: [],
          instrumental: false,
          quotaExceeded: false,
          isLoading: false,
        });
      });

    return () => {
      controller.abort();
    };
  }, [currentTrack?.id]);

  // 3-line synchronized lyrics context: [previous, current, next]
  const lyricsContextLines = useMemo<[string, string, string]>(() => {
    if (lyricsData.isLoading) {
      return ['', 'Loading synchronized lyrics...', ''];
    }
    if (lyricsData.instrumental) {
      return ['', 'Instrumental track — no vocal lyrics.', ''];
    }
    if (lyricsData.parsedLines.length > 0) {
      if (activeLyricIndex >= 0 && activeLyricIndex < lyricsData.parsedLines.length) {
        const prev = activeLyricIndex > 0 ? lyricsData.parsedLines[activeLyricIndex - 1].text : '';
        const cur = lyricsData.parsedLines[activeLyricIndex].text;
        const nxt = lyricsData.parsedLines[activeLyricIndex + 1]?.text || '';
        return [prev, cur, nxt];
      }
      return [
        '',
        lyricsData.parsedLines[0]?.text || '',
        lyricsData.parsedLines[1]?.text || '',
      ];
    }
    if (lyricsData.plainLyrics) {
      const lines = lyricsData.plainLyrics
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      return ['', lines[0] || '', lines[1] || ''];
    }
    return ['', 'No synchronized lyrics found for this track.', ''];
  }, [lyricsData.isLoading, lyricsData.instrumental, lyricsData.parsedLines, lyricsData.plainLyrics, activeLyricIndex]);

  // Ambient artwork color extraction
  useEffect(() => {
    if (!currentTrack) return;
    const { title: t, artistFromTitle: a } = cleanTrackTitle(currentTrack.title);
    const singer = getFullSingerName(currentTrack.artist || a || '', t);
    extractColorFromImage(currentTrack.thumbnail || '', `${t} ${singer}`).then(setPosterColor);
  }, [currentTrack?.id, currentTrack?.thumbnail]);

  useEffect(() => {
    setLocalSearchInput(searchQuery || '');
  }, [searchQuery]);

  const handleSearchChange = (val: string) => {
    setLocalSearchInput(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!val.trim()) {
      onClearSearch();
      return;
    }
    searchDebounceRef.current = setTimeout(() => {
      onSearch(val);
    }, 240);
  };

  const handleSearchSubmit = (val?: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const target = (typeof val === 'string' ? val : localSearchInput).trim();
    if (target) {
      onSearch(target);
    } else {
      handleClearSearchInput();
    }
  };

  const handleClearSearchInput = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setLocalSearchInput('');
    onClearSearch();
  };

  const {
    isListening: isVoiceListening,
    isSupported: isVoiceSupported,
    error: voiceError,
    toggleListening: toggleVoiceSearch,
    clearError: clearVoiceError,
  } = useVoiceSearch({
    onResult: (text, isFinal) => {
      setLocalSearchInput(text);
      if (isFinal) {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        onSearch(text);
      } else {
        handleSearchChange(text);
      }
    },
  });

  const handleGoHome = () => {
    setCenterViewMode('home');
    handleClearSearchInput();
  };

  const displayedLibraryTracks =
    libraryTab === 'all'
      ? allCatalogPool
      : libraryTab === 'queue'
      ? queue
      : libraryTab === 'recommended'
      ? recommendations
      : favorites;

  useEffect(() => {
    syncTabEdgeBlur();
    syncListEdgeBlur();
    const ro = new ResizeObserver(() => {
      syncTabEdgeBlur();
      syncListEdgeBlur();
    });
    if (libraryTabsRef.current) ro.observe(libraryTabsRef.current);
    if (libraryListRef.current) ro.observe(libraryListRef.current);
    return () => ro.disconnect();
  }, [leftSidebarWidth, isLeftSidebarCollapsed, libraryTab, displayedLibraryTracks.length]);

  const isSearchingView = localSearchInput.trim().length > 0;
  const [prevLyricLine, activeLyricLine, nextLyricLine] = lyricsContextLines;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090B] text-zinc-100 select-none overflow-hidden font-sans relative">
      {/* ══════════════════════════════════════════════════
          SHARED STAGE ABOVE PERSISTENT PLAYBACK BAR
          (Home Workspace + Cinema Mode Overlay + Video Slot)
         ══════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {/* ══════════════════════════════════════════════════
            1. TOP HEADER BAR
           ══════════════════════════════════════════════════ */}
        <header
          className="h-14 sm:h-15 w-full px-4 sm:px-6 flex items-center justify-between gap-4 bg-[#09090B]/95 backdrop-blur-xl shrink-0 z-40 border-b border-white/[0.07]"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
        {/* Zone 1: Signature Monogram Logo (!M) */}
        <button
          type="button"
          onClick={handleGoHome}
          className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 rounded-lg px-1 py-1 group cursor-pointer shrink-0 whitespace-nowrap"
          title="Home"
          aria-label="Home"
        >
          <img
            src="/logo.png"
            alt="!M"
            className="h-8 w-auto object-contain select-none transition-transform group-hover:scale-105 drop-shadow-[0_0_12px_rgba(250,204,21,0.45)]"
          />
        </button>

        {/* Zone 2: Command-Style Live Search */}
        <div className="flex items-center max-w-lg w-full justify-center min-w-0 relative">
          <div
            className={`relative flex items-center w-full h-9 sm:h-9.5 px-3 rounded-lg bg-[#141418] hover:bg-[#18181E] focus-within:bg-[#18181E] border transition-all ${
              isVoiceListening
                ? 'border-amber-400/90 ring-2 ring-amber-400/30 shadow-[0_0_22px_rgba(251,191,36,0.25)] bg-[#1a1814]'
                : 'border-white/[0.08] focus-within:border-amber-400/60 focus-within:ring-2 focus-within:ring-amber-400/15'
            }`}
          >
            <Search
              className={`w-4 h-4 shrink-0 mr-2.5 transition-colors ${
                isVoiceListening ? 'text-amber-400 animate-pulse' : 'text-zinc-500'
              }`}
            />
            <input
              ref={searchInputRef}
              id="soundstream-search-input"
              type="text"
              value={localSearchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchSubmit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleClearSearchInput();
                }
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text');
                if (
                  pasted &&
                  (pasted.includes('youtube.com') ||
                    pasted.includes('youtu.be') ||
                    /^[a-zA-Z0-9_-]{11}$/.test(pasted.trim()))
                ) {
                  e.preventDefault();
                  setLocalSearchInput(pasted.trim());
                  handleSearchSubmit(pasted.trim());
                }
              }}
              placeholder={
                isVoiceListening
                  ? 'Listening... speak song, artist, or vibe'
                  : 'Search songs, artists, or moods...'
              }
              className="w-full bg-transparent text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              aria-label="Search songs, artists, or moods"
            />

            {/* Voice Search Mic Button */}
            <button
              type="button"
              onClick={toggleVoiceSearch}
              className={`p-1.5 rounded-md transition-all cursor-pointer mr-1 relative flex items-center justify-center shrink-0 ${
                isVoiceListening
                  ? 'bg-amber-400/20 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                  : 'hover:bg-white/[0.08] text-zinc-400 hover:text-amber-400'
              }`}
              title={
                !isVoiceSupported
                  ? 'Voice search not supported in this browser'
                  : isVoiceListening
                  ? 'Listening... Click to stop'
                  : 'Search with voice'
              }
              aria-label={isVoiceListening ? 'Stop voice search' : 'Start voice search'}
            >
              <Mic
                className={`w-3.5 h-3.5 ${
                  isVoiceListening ? 'text-amber-400 animate-pulse scale-110' : ''
                }`}
              />
              {isVoiceListening && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            {localSearchInput ? (
              <button
                type="button"
                onClick={handleClearSearchInput}
                className="p-1 rounded-md hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Clear search"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center justify-center w-5 h-5 text-[10px] font-mono text-zinc-500 border border-white/[0.1] rounded bg-white/[0.03] shrink-0">
                /
              </kbd>
            )}
          </div>

          {/* Voice Search Error Alert */}
          {voiceError && (
            <div className="absolute top-full left-0 right-0 mt-1.5 px-3 py-1.5 bg-red-950/90 border border-red-500/30 rounded-lg text-[11px] text-red-200 flex items-center justify-between z-50 shadow-xl backdrop-blur-md">
              <span className="truncate mr-2">{voiceError}</span>
              <button
                type="button"
                onClick={clearVoiceError}
                className="text-red-300 hover:text-white p-0.5 cursor-pointer"
                aria-label="Dismiss error"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Zone 3: PWA Install & Cinema Mode Primary Utilities */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <PWAInstallButton />
          {currentTrack && (
            <button
              type="button"
              onClick={() => openCinema('poster')}
              className="h-9 px-2.5 sm:px-3.5 rounded-lg bg-[#141418] hover:bg-[#1c1c23] text-zinc-200 hover:text-white border border-white/[0.08] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
              title="Open Cinema Mode"
              aria-label="Open Cinema Mode"
            >
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Cinema Mode</span>
            </button>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          2. THREE-COLUMN RESPONSIVE WORKSPACE
         ══════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden p-2 sm:p-3 gap-2.5 relative">
        {/* ──────────────────────────────────────────────
            LEFT RAIL: LIBRARY & QUEUE NAVIGATION
           ────────────────────────────────────────────── */}
        <aside
          style={{ width: isLeftSidebarCollapsed ? '4.5rem' : `${leftSidebarWidth}px` }}
          className={`shrink-0 bg-[#111114] rounded-xl flex flex-col overflow-hidden border border-white/[0.07] transition-[width] duration-150 hidden md:flex ${
            isLeftSidebarCollapsed ? 'items-center' : ''
          }`}
        >
          {/* Sidebar Header */}
          <div className="w-full px-3.5 h-12 flex items-center justify-between border-b border-white/[0.06] shrink-0">
            <button
              type="button"
              onClick={() => setIsLeftSidebarCollapsed(!isLeftSidebarCollapsed)}
              className="flex items-center gap-2 text-zinc-200 hover:text-amber-400 transition-colors font-semibold text-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 rounded-md px-1 py-1 whitespace-nowrap"
              title={isLeftSidebarCollapsed ? 'Expand library rail' : 'Collapse library rail'}
              aria-label={isLeftSidebarCollapsed ? 'Expand library rail' : 'Collapse library rail'}
            >
              <Layers className="w-4 h-4 text-amber-400 shrink-0" />
              {!isLeftSidebarCollapsed && <span>Library</span>}
            </button>

            {!isLeftSidebarCollapsed && (
              <span className="text-[11px] font-mono tabular-nums text-zinc-500">
                {displayedLibraryTracks.length}
              </span>
            )}
          </div>

          {/* Clean Single-Row Underline Tabs with Progressive Cut-Off Edge Blur */}
          {!isLeftSidebarCollapsed && (
            <div className="relative shrink-0 border-b border-white/[0.06] overflow-hidden">
              <div
                ref={libraryTabsRef}
                onScroll={syncTabEdgeBlur}
                role="tablist"
                aria-label="Library sections"
                className="px-3 pt-1 flex items-center gap-1 overflow-x-auto no-scrollbar"
              >
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'queue', label: 'Queue' },
                    { id: 'recommended', label: 'For You' },
                    { id: 'favorites', label: 'Liked' },
                  ] as const
                ).map((tab) => {
                  const active = libraryTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setLibraryTab(tab.id)}
                      className={`relative px-2.5 py-2.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:text-amber-300 ${
                        active ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-100'
                      }`}
                    >
                      {tab.label}
                      {active && (
                        <span className="absolute bottom-0 inset-x-1.5 h-[2px] rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Left Cut-Off Progressive Blur + Fade */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-0 left-0 w-9 z-10 transition-opacity duration-200 ${
                  tabEdgeBlur.left ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div
                  className="absolute inset-0 backdrop-blur-[5px]"
                  style={{
                    maskImage: 'linear-gradient(to left, transparent 0%, black 75%, black 100%)',
                    WebkitMaskImage: 'linear-gradient(to left, transparent 0%, black 75%, black 100%)',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#111114] via-[#111114]/75 to-transparent" />
              </div>

              {/* Right Cut-Off Progressive Blur + Fade */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-y-0 right-0 w-10 z-10 transition-opacity duration-200 ${
                  tabEdgeBlur.right ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div
                  className="absolute inset-0 backdrop-blur-[5px]"
                  style={{
                    maskImage: 'linear-gradient(to right, transparent 0%, black 75%, black 100%)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 75%, black 100%)',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-l from-[#111114] via-[#111114]/75 to-transparent" />
              </div>
            </div>
          )}

          {/* Contextual Queue & For You Shortcut Rows */}
          {!isLeftSidebarCollapsed && libraryTab === 'queue' && (
            <div className="px-3.5 py-2 flex items-center justify-between border-b border-white/[0.05] bg-white/[0.015] shrink-0">
              <span className="text-[11px] text-zinc-400 font-mono tabular-nums">
                {queue.length} in queue
              </span>
              <button
                type="button"
                onClick={() => {
                  if (isSearchingView) handleClearSearchInput();
                  setCenterViewMode('queue');
                }}
                className="text-[11px] font-medium text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                Manage →
              </button>
            </div>
          )}

          {!isLeftSidebarCollapsed && libraryTab === 'recommended' && onRefreshRecommendations && (
            <div className="px-3.5 py-2 flex items-center justify-between border-b border-white/[0.05] bg-white/[0.015] shrink-0">
              <span className="text-[11px] text-zinc-400">Fresh random picks</span>
              <button
                type="button"
                onClick={onRefreshRecommendations}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reroll</span>
              </button>
            </div>
          )}

          {/* Scrollable Track Rows with Progressive Top & Bottom Cut-Off Edge Blur */}
          <div className="relative flex-1 min-h-0 w-full overflow-hidden">
            {/* Top Cut-Off Progressive Blur + Fade */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute top-0 inset-x-0 h-8 z-10 transition-opacity duration-200 ${
                listEdgeBlur.top ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div
                className="absolute inset-0 backdrop-blur-[5px]"
                style={{
                  maskImage: 'linear-gradient(to top, transparent 0%, black 75%, black 100%)',
                  WebkitMaskImage: 'linear-gradient(to top, transparent 0%, black 75%, black 100%)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#111114] via-[#111114]/70 to-transparent" />
            </div>

            <div
              ref={libraryListRef}
              onScroll={syncListEdgeBlur}
              className="h-full w-full overflow-y-auto no-scrollbar p-2 pb-10 space-y-0.5"
            >
            {displayedLibraryTracks.length === 0 ? (
              !isLeftSidebarCollapsed && (
                <div className="px-3 py-10 text-center space-y-1.5">
                  <p className="text-xs font-medium text-zinc-300">
                    {libraryTab === 'favorites'
                      ? 'No liked tracks yet'
                      : libraryTab === 'recommended'
                      ? 'Loading recommendations...'
                      : 'No tracks here yet'}
                  </p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    {libraryTab === 'favorites'
                      ? 'Tap the heart on any song to save it here.'
                      : 'Pick any song from the main stage to start listening.'}
                  </p>
                </div>
              )
            ) : (
              displayedLibraryTracks.map((track, idx) => {
                const isCurrent = currentTrack?.id === track.id;
                const isFav = favoriteIds.has(track.id);
                const { title: t, artistFromTitle: a } = cleanTrackTitle(track.title);
                const singer = getFullSingerName(track.artist || a || '', t);

                if (isLeftSidebarCollapsed) {
                  return (
                    <button
                      key={`rail-${track.id}-${idx}`}
                      type="button"
                      onClick={() => (isCurrent ? onTogglePlay() : onPlayTrack(track))}
                      className={`w-11 h-11 rounded-lg overflow-hidden mx-auto my-1.5 cursor-pointer transition-all border block relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        isCurrent
                          ? 'ring-2 ring-amber-400 border-transparent'
                          : 'border-white/[0.08] hover:border-white/25'
                      }`}
                      title={`${t} — ${singer}`}
                      aria-label={`Play ${t} by ${singer}`}
                    >
                      <ArtworkImage
                        title={t}
                        artist={singer}
                        trackId={track.id}
                        initialSrc={track.thumbnail}
                        alt={t}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  );
                }

                return (
                  <div
                    key={`lib-${track.id}-${idx}`}
                    onClick={() => (isCurrent ? onTogglePlay() : onPlayTrack(track))}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (isCurrent) onTogglePlay();
                        else onPlayTrack(track);
                      }
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer transition-colors group border focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400 ${
                      isCurrent
                        ? 'bg-[#1a160e] border-amber-500/35 text-zinc-50'
                        : 'border-transparent hover:bg-white/[0.04] text-zinc-200'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-md overflow-hidden bg-[#0c0c0f] shrink-0 ring-1 ring-white/[0.08] relative">
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
                          <div className="flex items-end gap-[2px] h-3">
                            <span className="w-[2px] bg-amber-400 rounded-full animate-bar-1" />
                            <span className="w-[2px] bg-amber-400 rounded-full animate-bar-2" />
                            <span className="w-[2px] bg-amber-400 rounded-full animate-bar-3" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-semibold truncate leading-snug ${
                          isCurrent ? 'text-amber-400' : 'text-zinc-100'
                        }`}
                      >
                        {t}
                      </p>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5 leading-snug">
                        {singer}
                      </p>
                    </div>

                    <div
                      className="flex items-center gap-0.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {libraryTab === 'queue' && !isCurrent && onRemoveFromQueue ? (
                        <button
                          type="button"
                          onClick={() => onRemoveFromQueue(track)}
                          className="opacity-0 group-hover:opacity-100 focus:opacity-100 w-7 h-7 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition-all cursor-pointer"
                          title="Remove from queue"
                          aria-label={`Remove ${t} from queue`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggleFavorite(track)}
                          className={`w-7 h-7 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                            isFav
                              ? 'text-amber-400 opacity-100'
                              : 'text-zinc-500 hover:text-zinc-100 opacity-0 group-hover:opacity-100 focus:opacity-100'
                          }`}
                          title={isFav ? 'Remove from liked' : 'Save to liked'}
                          aria-label={isFav ? `Remove ${t} from liked` : `Save ${t} to liked`}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            </div>

            {/* Bottom Cut-Off Progressive Blur + Fade */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute bottom-0 inset-x-0 h-14 z-10 transition-opacity duration-200 ${
                listEdgeBlur.bottom ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div
                className="absolute inset-0 backdrop-blur-[6px]"
                style={{
                  maskImage: 'linear-gradient(to bottom, transparent 0%, black 70%, black 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 70%, black 100%)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-[#111114]/75 to-transparent" />
            </div>
          </div>
        </aside>

        {/* Left Resizer Drag Handle */}
        {!isLeftSidebarCollapsed && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              isDraggingLeftRef.current = true;
              document.body.style.cursor = 'col-resize';
              document.body.style.userSelect = 'none';
            }}
            className="w-1.5 -mx-1 cursor-col-resize z-20 hidden md:flex items-center justify-center group"
            title="Drag to resize library panel"
          >
            <div className="w-0.5 h-16 rounded-full bg-transparent group-hover:bg-amber-400/70 transition-colors" />
          </div>
        )}

        {/* ──────────────────────────────────────────────
            CENTER STAGE: DISCOVERY, SEARCH, LIBRARY & QUEUE
           ────────────────────────────────────────────── */}
        <main className="flex-1 rounded-xl bg-[#111114] border border-white/[0.07] flex flex-col overflow-hidden relative min-w-0">
          {/* Subtle Ambient Glow Derived From Artwork */}
          <div
            className="absolute top-0 left-0 right-0 h-72 opacity-18 pointer-events-none transition-all duration-700 blur-[95px]"
            style={{
              background: `radial-gradient(circle at 40% 0%, rgb(${posterColor.r}, ${posterColor.g}, ${posterColor.b}) 0%, transparent 72%)`,
            }}
          />

          {/* Subheader Toolbar (Deterministic Filter Tabs + Explicit Shuffle) */}
          <div className="px-4 sm:px-6 h-12 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#111114]/85 backdrop-blur-md shrink-0 z-10">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'music', label: 'Music' },
                  { id: 'vibes', label: 'Collections' },
                  { id: 'videos', label: 'Videos' },
                ] as const
              ).map((tab) => {
                const active = !isSearchingView && centerViewMode === 'home' && homeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (isSearchingView) handleClearSearchInput();
                      setCenterViewMode('home');
                      setHomeFilter(tab.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                      active
                        ? 'bg-amber-400 text-zinc-950 font-semibold'
                        : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}

              <span className="w-px h-4 bg-white/[0.08] mx-1.5 shrink-0" aria-hidden="true" />

              <button
                type="button"
                onClick={() => {
                  if (isSearchingView) handleClearSearchInput();
                  setCenterViewMode('library');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                  !isSearchingView && centerViewMode === 'library'
                    ? 'bg-amber-400 text-zinc-950 font-semibold'
                    : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Library className="w-3.5 h-3.5" />
                <span>Full Library</span>
                <span className="font-mono tabular-nums text-[11px] opacity-75">
                  ({allCatalogPool.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isSearchingView) handleClearSearchInput();
                  setCenterViewMode('queue');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                  !isSearchingView && centerViewMode === 'queue'
                    ? 'bg-amber-400 text-zinc-950 font-semibold'
                    : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span>Queue</span>
                <span className="font-mono tabular-nums text-[11px] opacity-75">
                  ({queue.length})
                </span>
              </button>
            </div>

            {!isSearchingView && centerViewMode !== 'queue' && (
              <div className="flex items-center gap-1.5 shrink-0">
                {onSurprisePlay && (
                  <button
                    type="button"
                    disabled={isSurpriseLoading}
                    onClick={onSurprisePlay}
                    className="h-8 px-2.5 rounded-lg text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-400/10 hover:bg-amber-400/15 border border-amber-400/25 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                    title="Play a completely random unseen track right now"
                  >
                    <Dices className={`w-3.5 h-3.5 ${isSurpriseLoading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Surprise Me</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isRandomizingFeed}
                  onClick={() => {
                    setRandomSeed(Date.now());
                    setActiveHeroIndex(0);
                    if (onRandomizeFeed) onRandomizeFeed();
                  }}
                  className="h-8 px-2.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-amber-300 hover:bg-white/[0.06] transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                  title="Generate an entirely new random mix of collections, spotlight, and suggestions"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRandomizingFeed ? 'animate-spin text-amber-400' : ''}`} />
                  <span className="hidden sm:inline">
                    {isRandomizingFeed ? 'Rolling Mix...' : 'New Random Mix'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Scrollable Main Viewport */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 space-y-9 z-10">
            {isSearchingView ? (
              /* ── SEARCH RESULTS VIEW ── */
              <section className="space-y-5">
                <div className="flex items-end justify-between gap-4 pb-3 border-b border-white/[0.07]">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-zinc-50 tracking-tight">
                      Results for &ldquo;{localSearchInput}&rdquo;
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      <span className="font-mono tabular-nums">{searchResults.length}</span>{' '}
                      {searchResults.length === 1 ? 'track found' : 'tracks found'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSearchInput}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white bg-[#18181D] border border-white/[0.08] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Clear Search
                  </button>
                </div>

                {isSearching ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-xl p-3 bg-[#141418] border border-white/[0.06] space-y-3"
                      >
                        <div className="aspect-square rounded-lg bg-white/[0.05] animate-pulse" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-3/4 rounded bg-white/[0.06] animate-pulse" />
                          <div className="h-3 w-1/2 rounded bg-white/[0.04] animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="rounded-xl border border-white/[0.07] bg-[#141418] py-16 px-6 text-center space-y-3">
                    <p className="text-base font-semibold text-zinc-200">
                      No tracks matched &ldquo;{localSearchInput}&rdquo;
                    </p>
                    <p className="text-xs text-zinc-400">
                      Try searching by a different song title, artist name, or mood.
                    </p>
                    <button
                      type="button"
                      onClick={handleClearSearchInput}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Back to Home
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {searchResults.map((track, idx) => (
                      <UnifiedTrackCard
                        key={`search-${track.id}-${idx}`}
                        track={track}
                        isCurrent={currentTrack?.id === track.id}
                        isPlaying={isPlaying}
                        isFavorite={favoriteIds.has(track.id)}
                        isInQueue={queueIds.has(track.id)}
                        onPlay={onPlayTrack}
                        onTogglePlay={onTogglePlay}
                        onAddToQueue={onAddToQueue}
                        onToggleFavorite={onToggleFavorite}
                      />
                    ))}
                  </div>
                )}
              </section>
            ) : centerViewMode === 'queue' ? (
              /* ── DEDICATED QUEUE VIEW ── */
              <QueueView
                currentTrack={currentTrack}
                queue={queue}
                favorites={favorites}
                isPlaying={isPlaying}
                isShuffle={isShuffle}
                onPlayTrack={onPlayTrack}
                onTogglePlay={onTogglePlay}
                onToggleFavorite={onToggleFavorite}
                onRemoveFromQueue={onRemoveFromQueue}
                onClearQueue={onClearQueue}
                onToggleShuffle={onToggleShuffle}
                onBrowseHome={() => setCenterViewMode('home')}
              />
            ) : centerViewMode === 'library' ? (
              /* ── FULL LIBRARY VIEW ── */
              <section className="space-y-5">
                <div className="flex items-end justify-between gap-4 pb-3 border-b border-white/[0.07]">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-zinc-50 tracking-tight text-balance">
                      Full Library
                    </h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                      <span className="font-mono tabular-nums">{allCatalogPool.length}</span> curated
                      tracks, recommendations, and saved favorites
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {randomizedLibraryPool.map((track, idx) => (
                    <UnifiedTrackCard
                      key={`library-${track.id}-${idx}`}
                      track={track}
                      isCurrent={currentTrack?.id === track.id}
                      isPlaying={isPlaying}
                      isFavorite={favoriteIds.has(track.id)}
                      isInQueue={queueIds.has(track.id)}
                      onPlay={onPlayTrack}
                      onTogglePlay={onTogglePlay}
                      onAddToQueue={onAddToQueue}
                      onToggleFavorite={onToggleFavorite}
                    />
                  ))}
                </div>
              </section>
            ) : (
              /* ── HOME DISCOVERY FEED ── */
              <>
                {/* Atmospheric Editorial Spotlight Hero */}
                {activeHeroItem && homeFilter !== 'videos' && (
                  <section className="relative rounded-2xl p-5 sm:p-7 lg:p-8 bg-[#141418] border border-white/[0.09] overflow-hidden">
                    {/* Blurred Artwork Atmospheric Backdrop */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none overflow-hidden"
                    >
                      <img
                        src={activeHeroItem.track.thumbnail}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-2/3 h-[140%] object-cover opacity-25 blur-3xl scale-110 transition-all duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#121216] via-[#121216]/90 to-[#121216]/55" />
                    </div>

                    <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      {/* Left: Editorial Headline, Metadata & Actions */}
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <span className="text-amber-400 font-semibold">Featured Spotlight</span>
                          {activeHeroItem.duration && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums">
                                {activeHeroItem.duration}
                              </span>
                            </>
                          )}
                          {activeHeroItem.track.views && (
                            <>
                              <span aria-hidden="true" className="hidden sm:inline">
                                ·
                              </span>
                              <span className="hidden sm:inline font-mono tabular-nums">
                                {activeHeroItem.track.views}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h1 className="font-display font-bold text-2xl sm:text-4xl lg:text-[42px] text-zinc-50 tracking-tight leading-[1.1] text-balance">
                            {activeHeroItem.title}
                          </h1>
                          <p className="text-sm sm:text-base text-zinc-300 font-medium truncate">
                            {activeHeroItem.artist}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (currentTrack?.id === activeHeroItem.track.id) {
                                onTogglePlay();
                              } else {
                                onPlayTrack(activeHeroItem.track);
                              }
                            }}
                            className="h-10 px-5 rounded-lg bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap shadow-[0_8px_24px_-8px_rgba(245,158,11,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          >
                            {currentTrack?.id === activeHeroItem.track.id && isPlaying ? (
                              <>
                                <Pause className="w-4 h-4 fill-zinc-950 text-zinc-950" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 fill-zinc-950 text-zinc-950" />
                                <span>Play Now</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onAddToQueue(activeHeroItem.track)}
                            className="h-10 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-zinc-100 border border-white/[0.1] text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                          >
                            {queueIds.has(activeHeroItem.track.id) ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-amber-400" />
                                <span>In Queue</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add to Queue</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onToggleFavorite(activeHeroItem.track)}
                            className={`h-10 w-10 rounded-lg border flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                              favoriteIds.has(activeHeroItem.track.id)
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                                : 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white border-white/[0.1]'
                            }`}
                            title={
                              favoriteIds.has(activeHeroItem.track.id)
                                ? 'Remove from liked'
                                : 'Save to liked'
                            }
                            aria-label={
                              favoriteIds.has(activeHeroItem.track.id)
                                ? 'Remove from liked'
                                : 'Save to liked'
                            }
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                favoriteIds.has(activeHeroItem.track.id) ? 'fill-current' : ''
                              }`}
                            />
                          </button>
                        </div>

                        {/* Spotlight Slide Stepper & Direct Indicators */}
                        {featuredItems.length > 1 && (
                          <div className="flex items-center gap-3 pt-2">
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setActiveHeroIndex((i) => i - 1)}
                                className="w-7 h-7 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="Previous spotlight"
                                title="Previous spotlight"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveHeroIndex((i) => i + 1)}
                                className="w-7 h-7 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="Next spotlight"
                                title="Next spotlight"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5" role="tablist" aria-label="Spotlight slides">
                              {featuredItems.map((item, idx) => (
                                <button
                                  key={item.track.id}
                                  type="button"
                                  role="tab"
                                  aria-selected={idx === activeHeroIdx}
                                  aria-label={`Spotlight ${idx + 1}: ${item.title}`}
                                  onClick={() => setActiveHeroIndex(idx)}
                                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                                    idx === activeHeroIdx
                                      ? 'w-6 bg-amber-400'
                                      : 'w-2 bg-white/20 hover:bg-white/40'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right: Interactive Wiggly Spotlight Artwork */}
                      <InteractiveCoverArt
                        title={activeHeroItem.title}
                        artist={activeHeroItem.artist}
                        trackId={activeHeroItem.track.id}
                        initialSrc={activeHeroItem.track.thumbnail}
                        isPlaying={isPlaying && currentTrack?.id === activeHeroItem.track.id}
                        isFavorite={favoriteIds.has(activeHeroItem.track.id)}
                        size="panel"
                        priority
                        onTogglePlay={() => {
                          if (currentTrack?.id === activeHeroItem.track.id) {
                            onTogglePlay();
                          } else {
                            onPlayTrack(activeHeroItem.track);
                          }
                        }}
                        onPrev={
                          featuredItems.length > 1
                            ? () => setActiveHeroIndex((i) => i - 1)
                            : undefined
                        }
                        onNext={
                          featuredItems.length > 1
                            ? () => setActiveHeroIndex((i) => i + 1)
                            : undefined
                        }
                        onToggleFavorite={() => onToggleFavorite(activeHeroItem.track)}
                        className="w-36 sm:w-44 lg:w-52 shrink-0"
                      />
                    </div>
                  </section>
                )}

                {/* Section 1: Popular Releases (Compact Studio Quick-Play Shelf) */}
                {(homeFilter === 'all' || homeFilter === 'music') && (
                  <section className="space-y-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-zinc-50 tracking-tight">
                          Popular Releases
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                          Quick-play studio picks ready for instant streaming
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {dynamicPopularTracks.map((track, idx) => (
                        <UnifiedTrackCard
                          key={`pop-${track.id}-${idx}`}
                          track={track}
                          variant="shelf"
                          isCurrent={currentTrack?.id === track.id}
                          isPlaying={isPlaying}
                          isFavorite={favoriteIds.has(track.id)}
                          isInQueue={queueIds.has(track.id)}
                          onPlay={onPlayTrack}
                          onTogglePlay={onTogglePlay}
                          onAddToQueue={onAddToQueue}
                          onToggleFavorite={onToggleFavorite}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Section 2: Curated Genre Collections (With Play Collection Action) */}
                {(homeFilter === 'all' || homeFilter === 'vibes') &&
                  dynamicCollections.map((collection) => (
                    <section key={collection.id} className="space-y-4">
                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span className="text-amber-400 font-medium">{collection.tagLabel}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {collection.tracks.length} tracks
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-bold text-zinc-50 tracking-tight">
                            {collection.name}
                          </h2>
                          {collection.description && (
                            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">
                              {collection.description}
                            </p>
                          )}
                        </div>

                        {onPlayGenre && collection.tracks.length > 0 && (
                          <button
                            type="button"
                            onClick={() => onPlayGenre(collection.raw)}
                            className="h-9 px-3.5 rounded-lg bg-[#18181D] hover:bg-amber-400 text-zinc-200 hover:text-zinc-950 border border-white/[0.08] hover:border-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Play Collection</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {collection.tracks.slice(0, 5).map((track, idx) => (
                          <UnifiedTrackCard
                            key={`col-${collection.id}-${track.id}-${idx}`}
                            track={track}
                            isCurrent={currentTrack?.id === track.id}
                            isPlaying={isPlaying}
                            isFavorite={favoriteIds.has(track.id)}
                            isInQueue={queueIds.has(track.id)}
                            onPlay={onPlayTrack}
                            onTogglePlay={onTogglePlay}
                            onAddToQueue={onAddToQueue}
                            onToggleFavorite={onToggleFavorite}
                          />
                        ))}
                      </div>
                    </section>
                  ))}

                {/* Section 3: Official Music Videos */}
                {(homeFilter === 'all' || homeFilter === 'videos') && (
                  <section className="space-y-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-zinc-50 tracking-tight">
                        Official Music Videos
                      </h2>
                      <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                        Launch straight into fullscreen video playback in Cinema Mode
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {dynamicVibeTracks.slice(0, 4).map((track, idx) => {
                        const { title: t, artistFromTitle: a } = cleanTrackTitle(track.title);
                        const singer = getFullSingerName(track.artist || a || '', t);
                        const isCurrent = currentTrack?.id === track.id;
                        const durationLabel =
                          track.duration || (track.durationSec > 0 ? formatTime(track.durationSec) : '');

                        return (
                          <div
                            key={`vid-${track.id}-${idx}`}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              onPlayTrack(track);
                              openCinema('video');
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onPlayTrack(track);
                                openCinema('video');
                              }
                            }}
                            className={`group rounded-xl overflow-hidden border transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 ${
                              isCurrent
                                ? 'bg-[#1a160e] border-amber-500/45'
                                : 'bg-[#141418]/90 hover:bg-[#1a1a21] border-white/[0.06] hover:border-white/[0.15]'
                            }`}
                          >
                            <div className="relative aspect-video w-full bg-[#0c0c0f] overflow-hidden">
                              <ArtworkImage
                                title={t}
                                artist={singer}
                                trackId={track.id}
                                initialSrc={track.thumbnail}
                                alt={t}
                                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent flex items-center justify-center transition-opacity">
                                <div className="w-11 h-11 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
                                  {isCurrent && isPlaying ? (
                                    <Pause className="w-4 h-4 fill-zinc-950 text-zinc-950" />
                                  ) : (
                                    <Play className="w-4 h-4 fill-zinc-950 text-zinc-950 ml-0.5" />
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="p-3.5 space-y-1">
                              <p
                                className={`text-sm font-semibold truncate ${
                                  isCurrent ? 'text-amber-400' : 'text-zinc-100'
                                }`}
                              >
                                {t}
                              </p>
                              <div className="flex items-center justify-between gap-2 text-xs text-zinc-400">
                                <span className="truncate">{singer}</span>
                                {durationLabel && (
                                  <span className="font-mono tabular-nums text-[11px] text-zinc-500 shrink-0">
                                    {durationLabel}
                                  </span>
                                )}
                              </div>
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

        {/* Right Resizer Drag Handle */}
        {currentTrack && isRightPanelOpen && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              isDraggingRightRef.current = true;
              document.body.style.cursor = 'col-resize';
              document.body.style.userSelect = 'none';
            }}
            className="w-1.5 -mx-1 cursor-col-resize z-20 hidden xl:flex items-center justify-center group"
            title="Drag to resize Now Playing panel"
          >
            <div className="w-0.5 h-16 rounded-full bg-transparent group-hover:bg-amber-400/70 transition-colors" />
          </div>
        )}

        {/* ──────────────────────────────────────────────
            RIGHT SIDEBAR: STUDIO NOW PLAYING MONITOR
           ────────────────────────────────────────────── */}
        {currentTrack && (
          <aside
            ref={rightSidebarRef}
            style={{ width: isRightPanelOpen ? `${rightSidebarWidth}px` : '4rem' }}
            className={`shrink-0 bg-[#111114] rounded-xl flex flex-col border border-white/[0.07] transition-[width] duration-150 hidden xl:flex relative overflow-hidden ${
              isRightPanelOpen
                ? 'overflow-y-auto p-4 space-y-4 no-scrollbar'
                : 'items-center py-3.5 space-y-4'
            }`}
          >
            {/* Subtle Ambient Wash at Top of Monitor */}
            {isRightPanelOpen && (
              <div
                aria-hidden="true"
                className="absolute top-0 inset-x-0 h-56 opacity-20 pointer-events-none blur-[70px] transition-all duration-700"
                style={{
                  background: `radial-gradient(circle at 50% 10%, rgb(${posterColor.r}, ${posterColor.g}, ${posterColor.b}) 0%, transparent 72%)`,
                }}
              />
            )}

            {isRightPanelOpen ? (
              <>
                {/* Panel Header */}
                <div className="relative z-10 flex items-center justify-between pb-2 border-b border-white/[0.06] shrink-0">
                  <span className="text-xs font-semibold text-zinc-200">Now Playing</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openCinema('video')}
                      className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                      title="Open Cinema Mode"
                      aria-label="Open Cinema Mode"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsRightPanelOpen(false)}
                      className="w-8 h-8 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                      title="Collapse Now Playing panel"
                      aria-label="Collapse Now Playing panel"
                    >
                      <PanelRightClose className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Clean 1:1 Live Video Monitor Slot (No Overlays) */}
                <div
                  ref={rightVideoAnchorRef}
                  className="relative z-10 w-full aspect-square rounded-xl overflow-hidden bg-black border border-white/[0.08] shadow-lg shrink-0"
                />

                {/* Track Title, Artist, Metadata & Primary Actions */}
                <div className="relative z-10 space-y-3 shrink-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-zinc-50 tracking-tight truncate leading-snug">
                        {cleanTrackTitle(currentTrack.title).title}
                      </h3>
                      <p className="text-xs text-zinc-300 truncate mt-0.5">
                        {getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5 font-mono tabular-nums">
                        <span>{formatTime(duration > 0 ? duration : currentTrack.durationSec || 0)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{activeQuality.label}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onAddToQueue(currentTrack)}
                        className="w-8 h-8 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
                        title={isCurrentInQueue ? 'In queue' : 'Add to queue'}
                        aria-label="Add current track to queue"
                      >
                        {isCurrentInQueue ? (
                          <Check className="w-4 h-4 text-amber-400" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(currentTrack)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          isCurrentFavorite
                            ? 'text-amber-400 hover:bg-white/[0.06]'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                        }`}
                        title={isCurrentFavorite ? 'Remove from favorites' : 'Save to favorites'}
                        aria-label={isCurrentFavorite ? 'Remove from favorites' : 'Save to favorites'}
                      >
                        <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Quick Cinema Mode Mode Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openCinema('video')}
                      className="h-9 px-3 rounded-lg bg-[#18181D] hover:bg-[#222229] text-zinc-200 border border-white/[0.08] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5 text-amber-400" />
                      <span>Watch Video</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openCinema('lyrics')}
                      className="h-9 px-3 rounded-lg bg-[#18181D] hover:bg-[#222229] text-zinc-200 border border-white/[0.08] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Mic2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Synced Lyrics</span>
                    </button>
                  </div>
                </div>

                {/* Live 3-Line Lyrics Preview Card */}
                <button
                  type="button"
                  onClick={() => openCinema('lyrics')}
                  className="relative z-10 w-full text-left rounded-xl p-4 bg-[#161512]/95 hover:bg-[#1c1a14] border border-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer space-y-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70"
                  title="Open full synchronized lyrics"
                >
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-semibold text-zinc-300">Live Lyrics</span>
                    <span className="text-xs text-amber-400 font-medium">Expand →</span>
                  </div>
                  {prevLyricLine && (
                    <p className="text-xs text-zinc-500 truncate">{prevLyricLine}</p>
                  )}
                  <p className="text-sm font-semibold text-amber-300 leading-snug line-clamp-2">
                    {activeLyricLine}
                  </p>
                  {nextLyricLine && (
                    <p className="text-xs text-zinc-400 leading-snug truncate">{nextLyricLine}</p>
                  )}
                </button>

                {/* True Up Next Preview */}
                <div className="relative z-10 pt-2 border-t border-white/[0.06] space-y-2.5 shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300">Up Next</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isSearchingView) handleClearSearchInput();
                        setCenterViewMode('queue');
                      }}
                      className="text-xs font-medium text-amber-400 hover:text-amber-300 cursor-pointer"
                    >
                      View Queue ({queue.length})
                    </button>
                  </div>

                  {upNextPreviewTracks.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-2">No upcoming tracks queued.</p>
                  ) : (
                    <div className="space-y-1">
                      {upNextPreviewTracks.map((nextT, idx) => {
                        const { title: nt, artistFromTitle: na } = cleanTrackTitle(nextT.title);
                        const nSinger = getFullSingerName(nextT.artist || na || '', nt);
                        const dur =
                          nextT.duration && nextT.duration !== 'YouTube Track'
                            ? nextT.duration
                            : nextT.durationSec > 0
                            ? formatTime(nextT.durationSec)
                            : '';
                        return (
                          <button
                            key={`next-${nextT.id}-${idx}`}
                            type="button"
                            onClick={() => onPlayTrack(nextT)}
                            className="w-full text-left flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/[0.05] cursor-pointer transition-colors group"
                          >
                            <span className="text-[10px] font-mono tabular-nums text-zinc-500 w-4 shrink-0 text-center">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <div className="w-8 h-8 rounded-md overflow-hidden bg-[#0c0c0f] shrink-0 ring-1 ring-white/[0.07]">
                              <ArtworkImage
                                title={nt}
                                artist={nSinger}
                                trackId={nextT.id}
                                initialSrc={nextT.thumbnail}
                                alt={nt}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-zinc-100 group-hover:text-amber-300 truncate transition-colors">
                                {nt}
                              </p>
                              <p className="text-[11px] text-zinc-400 truncate">{nSinger}</p>
                            </div>
                            {dur && (
                              <span className="text-[10px] font-mono tabular-nums text-zinc-500 shrink-0">
                                {dur}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Collapsed Right Rail */
              <>
                <button
                  type="button"
                  onClick={() => setIsRightPanelOpen(true)}
                  className="w-10 h-10 rounded-lg bg-[#18181D] hover:bg-[#222229] text-zinc-300 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer border border-white/[0.08]"
                  title="Expand Now Playing panel"
                  aria-label="Expand Now Playing panel"
                >
                  <PanelRightOpen className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsRightPanelOpen(true)}
                  className="w-10 h-10 rounded-lg overflow-hidden bg-[#0c0c0f] border border-white/[0.1] hover:border-amber-400/50 cursor-pointer relative transition-colors"
                  title={`Now Playing: ${cleanTrackTitle(currentTrack.title).title}`}
                >
                  <ArtworkImage
                    title={cleanTrackTitle(currentTrack.title).title}
                    artist={getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                    trackId={currentTrack.id}
                    initialSrc={currentTrack.thumbnail}
                    alt={cleanTrackTitle(currentTrack.title).title}
                    className="w-full h-full object-cover"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                      <div className="flex items-end gap-[2px] h-3">
                        <span className="w-[2px] bg-amber-400 rounded-full animate-bar-1" />
                        <span className="w-[2px] bg-amber-400 rounded-full animate-bar-2" />
                        <span className="w-[2px] bg-amber-400 rounded-full animate-bar-3" />
                      </div>
                    </div>
                  )}
                </button>

                <div className="flex-1" />

                <button
                  type="button"
                  onClick={() => openCinema('poster')}
                  className="w-10 h-10 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] flex items-center justify-center transition-colors cursor-pointer"
                  title="Fullscreen Cinema Mode"
                  aria-label="Fullscreen Cinema Mode"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </>
            )}
          </aside>
        )}
      </div>

        {/* ══════════════════════════════════════════════════
            5. FULLSCREEN CINEMA MODE STAGE (Flush Above Persistent Player Bar)
           ══════════════════════════════════════════════════ */}
        {isCinemaMode && currentTrack && (
          <CinemaModeOverlay
            currentTrack={currentTrack}
            viewMode={cinemaViewMode}
            posterColor={posterColor}
            isPlaying={isPlaying}
            duration={duration}
            isCurrentFavorite={isCurrentFavorite}
            isCurrentInQueue={isCurrentInQueue}
            playbackQuality={playbackQuality}
            lyricsData={lyricsData}
            activeLyricIndex={activeLyricIndex}
            lyricsContextLines={lyricsContextLines}
            onChangeViewMode={handleCinemaViewModeChange}
            onClose={closeCinema}
            onTogglePlay={onTogglePlay}
            onSeek={onSeek}
            onPrev={onPrev}
            onNext={onNext}
            onToggleFavorite={onToggleFavorite}
            onAddToQueue={onAddToQueue}
          />
        )}

        {/* ══════════════════════════════════════════════════
            6. PERSISTENT ZERO-UNMOUNT YOUTUBE VIDEO SLOT
               (Kept in-viewport at 0.1% opacity when audio-only so Android Chrome
               never triggers offscreen/1px iframe occlusion suspension)
           ══════════════════════════════════════════════════ */}
        <div
          ref={videoSlotWrapperRef}
          className={
            isCinemaVideo
              ? 'absolute top-16 bottom-0 left-0 right-0 z-[60] flex items-center justify-center px-3 sm:px-6 md:px-10 py-4 pointer-events-none'
              : isDockedInRightPanel && isRightVideoDocked
              ? 'fixed z-20 overflow-hidden rounded-xl bg-black border border-white/[0.08] shadow-lg flex items-center justify-center'
              : 'fixed bottom-0 right-0 w-[200px] h-[112px] opacity-[0.001] pointer-events-none z-0 overflow-hidden'
          }
        >
          <div
            className={
              isCinemaVideo
                ? 'w-full max-w-5xl max-h-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/[0.1] relative pointer-events-auto'
                : isDockedInRightPanel && isRightVideoDocked
                ? 'h-full aspect-video shrink-0 relative overflow-hidden bg-black'
                : 'w-[200px] h-[112px] overflow-hidden'
            }
          >
            {videoSlot}
          </div>

          {/* Initial Artwork -> Live Video Crossfade + Transparent Click & Scroll Layer (No Overlays) */}
          {!isCinemaVideo && isDockedInRightPanel && isRightVideoDocked && currentTrack && (
            <div
              onClick={onTogglePlay}
              onDoubleClick={() => openCinema('video')}
              onWheel={(e) => {
                if (rightSidebarRef.current) {
                  rightSidebarRef.current.scrollTop += e.deltaY;
                }
              }}
              className="absolute inset-0 z-10 cursor-pointer select-none"
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
            >
              <div
                className={`absolute inset-0 bg-black pointer-events-none transition-opacity duration-300 ${
                  isDockedVideoRevealed ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <ArtworkImage
                  title={cleanTrackTitle(currentTrack.title).title}
                  artist={getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                  trackId={currentTrack.id}
                  initialSrc={currentTrack.thumbnail}
                  alt={cleanTrackTitle(currentTrack.title).title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          3. SINGLE PERSISTENT PLAYBACK BAR (Identical in Home & Cinema Mode)
         ══════════════════════════════════════════════════ */}
      {currentTrack && (
        <UnifiedPlaybackBar
          isCinemaMode={isCinemaMode}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isBuffering={isBuffering}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          repeatMode={repeatMode}
          isShuffle={isShuffle}
          isVideoActive={isCinemaMode && cinemaViewMode === 'video'}
          isLyricsActive={isCinemaMode && cinemaViewMode === 'lyrics'}
          isCurrentFavorite={isCurrentFavorite}
          playbackQuality={playbackQuality}
          onTogglePlay={onTogglePlay}
          onSeek={onSeek}
          onPrev={onPrev}
          onNext={onNext}
          onToggleShuffle={onToggleShuffle}
          onToggleRepeat={onToggleRepeat}
          onChangeVolume={onChangeVolume}
          onToggleFavorite={onToggleFavorite}
          onChangePlaybackQuality={onChangePlaybackQuality}
          onToggleVideo={() => {
            if (isCinemaMode && cinemaViewMode === 'video') {
              handleCinemaViewModeChange('poster');
            } else {
              openCinema('video');
            }
          }}
          onToggleLyrics={() => {
            if (isCinemaMode && cinemaViewMode === 'lyrics') {
              handleCinemaViewModeChange('poster');
            } else {
              openCinema('lyrics');
            }
          }}
          onToggleCinema={() => {
            if (isCinemaMode) {
              closeCinema();
            } else {
              openCinema('poster');
            }
          }}
        />
      )}

      {/* ══════════════════════════════════════════════════
          4. MOBILE BOTTOM NAVIGATION (Home Only, < md)
         ══════════════════════════════════════════════════ */}
      {!isCinemaMode && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden bg-[#0b0b0e]/95 backdrop-blur-xl border-t border-white/[0.08] grid grid-cols-4 items-center shrink-0 z-40 select-none"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          {(
            [
              {
                id: 'home',
                label: 'Home',
                Icon: Home,
                active: !isSearchingView && centerViewMode === 'home',
                onClick: () => {
                  handleClearSearchInput();
                  setCenterViewMode('home');
                },
              },
              {
                id: 'search',
                label: 'Search',
                Icon: Search,
                active: isSearchingView,
                onClick: () => {
                  searchInputRef.current?.focus();
                },
              },
              {
                id: 'library',
                label: 'Library',
                Icon: Library,
                active: !isSearchingView && centerViewMode === 'library',
                onClick: () => {
                  handleClearSearchInput();
                  setCenterViewMode('library');
                },
              },
              {
                id: 'queue',
                label: 'Queue',
                Icon: ListMusic,
                active: !isSearchingView && centerViewMode === 'queue',
                onClick: () => {
                  handleClearSearchInput();
                  setCenterViewMode('queue');
                },
              },
            ] as const
          ).map(({ id, label, Icon, active, onClick }) => (
            <button
              key={id}
              type="button"
              onClick={onClick}
              className={`h-13 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                active ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
};
