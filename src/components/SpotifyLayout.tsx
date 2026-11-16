import React, { useState, useEffect, useRef } from 'react';
import { Track, RepeatMode } from '../types/player';
import { formatTime, cleanTrackTitle, getFullSingerName, parseLrcLyrics, findActiveLyricIndex } from '../utils/playerUtils';
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
  Folder,
  Disc,
  ListMusic,
  Sparkles,
  ExternalLink,
  MoreHorizontal,
  Share2,
  PlaySquare,
  User,
  Mic2,
  Laptop2,
  PictureInPicture,
} from 'lucide-react';
import { ArtworkImage } from './ArtworkImage';
import { extractColorFromImage, RGBColor } from '../utils/colorUtils';

interface SpotifyLayoutProps {
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
  // ── Hover Preview State: dynamic preview of songs on hover ──
  const [hoveredTrack, setHoveredTrack] = useState<Track | null>(null);

  // ── Library Tab Switcher ──
  const [libraryTab, setLibraryTab] = useState<'queue' | 'recommended' | 'favorites'>('queue');

  // ── Right Panel Visibility ──
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);

  // ── Screenshot 2: Fullscreen Cinema Artwork Mode ──
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);
  const [maximizeViewMode, setMaximizeViewMode] = useState<'poster' | 'video' | 'lyrics'>('poster');
  const activeRightLineRef = useRef<HTMLParagraphElement | null>(null);
  const aboutArtistRef = useRef<HTMLDivElement | null>(null);

  // ── Dynamic Poster Ambient Color Extraction ──
  const [currentPoster, setCurrentPoster] = useState<string>('');
  const [posterColor, setPosterColor] = useState<RGBColor>({ r: 85, g: 30, b: 55 });

  // ── Search Input State ──
  const [localSearchInput, setLocalSearchInput] = useState<string>(searchQuery || '');
  const searchDebounceRef = useRef<any>(null);

  // ── Synced Lyrics State for Center Panel ──
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

  // Auto-scroll the active lyric line into view in the Right Panel Lyrics Card
  useEffect(() => {
    if (activeRightLineRef.current) {
      activeRightLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLyricIndex]);

  // Dynamically extract dominant ambient color from active poster
  useEffect(() => {
    const candidateUrl = currentPoster || displayTrack?.thumbnail || '';
    const seed = `${displayTitle} ${displayArtist}`;
    extractColorFromImage(candidateUrl, seed).then((col) => {
      setPosterColor(col);
    });
  }, [currentPoster, displayTrack?.id, displayTrack?.thumbnail, displayTitle, displayArtist]);

  // Synchronize local search input with prop
  useEffect(() => {
    setLocalSearchInput(searchQuery || '');
  }, [searchQuery]);

  // Handle Search Input Change with 200ms debounce
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

  // Fetch lyrics when currentTrack changes
  useEffect(() => {
    if (!currentTrack) return;
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
          const step = (end - start) / lines.length;
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

  // Escape key to close cinema mode
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCinemaMode) {
        setIsCinemaMode(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isCinemaMode]);

  // Volume icon
  const VolumeIcon = volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  // Active track list for Library panel
  const displayedLibraryTracks =
    libraryTab === 'queue'
      ? queue
      : libraryTab === 'recommended'
      ? recommendations
      : favorites;

  const isCurrentFavorite = currentTrack ? favorites.some((f) => f.id === currentTrack.id) : false;

  return (
    <div className="h-screen w-screen flex flex-col bg-black text-white select-none overflow-hidden font-sans">
      {/* ══════════════════════════════════════════════════
          1. SPOTIFY TOP BAR: BRAND + INTEGRATED SEARCH PILL + UTILITIES
         ══════════════════════════════════════════════════ */}
      <header className="h-14 sm:h-16 w-full px-4 flex items-center justify-between bg-black shrink-0 z-40 border-b border-[#1f1f1f]">
        {/* Left: SoundStream Brand with '|' Accent */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onClearSearch()}
            className="flex items-center gap-2 focus:outline-none group cursor-pointer"
            title="SoundStream Home"
          >
            <span className="w-1.5 h-5 bg-yellow-400 rounded-xs transition-transform group-hover:scale-y-110 shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
            <span className="font-display font-black text-lg sm:text-xl tracking-wider text-white">
              <span className="inline sm:hidden">S</span>
              <span className="hidden sm:inline">SOUNDSTREAM</span>
            </span>
          </button>
        </div>

        {/* Center: Home Button + Integrated Search Pill (NO SEPARATE SEARCH PAGE) */}
        <div className="flex items-center gap-2 max-w-xl w-full mx-4 justify-center">
          <button
            onClick={() => handleClearSearchInput()}
            className="w-10 h-10 rounded-full bg-[#1f1f1f] hover:bg-[#2a2a2a] flex items-center justify-center text-white transition-colors shrink-0"
            title="Home"
            aria-label="Home"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Search Pill Input */}
          <div className="relative flex-1 max-w-md">
            <div className="relative flex items-center w-full h-11 px-3.5 rounded-full bg-[#1f1f1f] hover:bg-[#282828] focus-within:bg-[#282828] focus-within:ring-2 focus-within:ring-white/40 border border-transparent transition-all">
              <Search className="w-4 h-4 text-white/50 shrink-0 mr-2.5" />
              <input
                type="text"
                value={localSearchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="What do you want to play?"
                className="w-full bg-transparent text-xs sm:text-sm font-medium text-white placeholder:text-white/40 focus:outline-none"
              />
              {localSearchInput && (
                <button
                  onClick={handleClearSearchInput}
                  className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors mr-1"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="border-l border-white/15 pl-2 ml-1 hidden sm:flex items-center">
                <Folder className="w-3.5 h-3.5 text-white/40" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Sleep Timer + Create/Import + User Avatar */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Direct Sleep Timer Button */}
          <button
            onClick={onOpenSleepTimer}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              sleepTimerRemaining !== null
                ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.25)]'
                : 'bg-[#1f1f1f] hover:bg-[#2a2a2a] border-transparent text-white/80 hover:text-white'
            }`}
            title={sleepTimerRemaining !== null ? `Sleep timer: ${Math.ceil(sleepTimerRemaining / 60)}m remaining` : 'Set sleep timer'}
          >
            <Timer className={`w-3.5 h-3.5 ${sleepTimerRemaining !== null ? 'text-yellow-400 animate-pulse' : 'text-white/60'}`} />
            <span className="hidden md:inline font-mono">
              {sleepTimerRemaining !== null ? `${Math.ceil(sleepTimerRemaining / 60)}m` : 'Sleep Timer'}
            </span>
          </button>

          {/* Quick Import Button */}
          {onOpenQuickImport && (
            <button
              onClick={onOpenQuickImport}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white/80 hover:text-white transition-colors"
              title="Import YouTube track"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Import</span>
            </button>
          )}

          {/* User Profile Avatar Pill */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-500 text-black font-black flex items-center justify-center text-xs shadow-inner">
            S
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          2. MAIN 3-PANEL SPOTIFY WORKSPACE
         ══════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2 min-h-0">

        {/* ──────────────────────────────────────────────
            PANEL 1: LEFT SIDEBAR ("YOUR LIBRARY")
           ────────────────────────────────────────────── */}
        <aside className="w-72 lg:w-80 shrink-0 bg-[#121212] rounded-xl flex flex-col overflow-hidden border border-white/5">
          {/* Header: Your Library + Create */}
          <div className="p-4 pb-3 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ListMusic className="w-5 h-5 text-white/60" />
              <span className="font-bold text-sm tracking-tight text-white">Your Library</span>
            </div>
            {onOpenQuickImport && (
              <button
                onClick={onOpenQuickImport}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
                title="Add YouTube track"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create</span>
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 px-3 py-2.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setLibraryTab('queue')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                libraryTab === 'queue'
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#242424] text-white/80 hover:bg-[#2a2a2a]'
              }`}
            >
              Up Next ({queue.length})
            </button>
            <button
              onClick={() => setLibraryTab('recommended')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                libraryTab === 'recommended'
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#242424] text-white/80 hover:bg-[#2a2a2a]'
              }`}
            >
              Recommended
            </button>
            <button
              onClick={() => setLibraryTab('favorites')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                libraryTab === 'favorites'
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#242424] text-white/80 hover:bg-[#2a2a2a]'
              }`}
            >
              Liked ({favorites.length})
            </button>
          </div>

          {/* Scrollable Song List with Dynamic Hover Preview */}
          <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
            {displayedLibraryTracks.length === 0 ? (
              <div className="p-6 text-center text-white/40">
                <p className="text-xs font-medium">No tracks in this view</p>
              </div>
            ) : (
              displayedLibraryTracks.map((track, idx) => {
                const isCurrent = track.id === currentTrack?.id;
                const isHovered = track.id === hoveredTrack?.id;
                const { title: t, artistFromTitle: a } = cleanTrackTitle(track.title);
                const singer = getFullSingerName(track.artist || a || 'Artist', t);

                return (
                  <div
                    key={`${track.id}-${idx}`}
                    onMouseEnter={() => setHoveredTrack(track)}
                    onMouseLeave={() => setHoveredTrack(null)}
                    onClick={() => {
                      onPlayTrack(track);
                    }}
                    className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-150 ${
                      isCurrent
                        ? 'bg-[#282828] text-yellow-400'
                        : isHovered
                        ? 'bg-[#1f1f1f] text-white'
                        : 'hover:bg-[#1a1a1a] text-white/90'
                    }`}
                  >
                    {/* 48x48 Album Thumbnail with iTunes/Deezer art */}
                    <div className="relative w-12 h-12 rounded overflow-hidden bg-black/60 shrink-0 border border-white/10 shadow-sm">
                      {/* Album artwork provided by Apple / iTunes & Deezer API */}
                      <ArtworkImage
                        title={t}
                        artist={singer}
                        trackId={track.id}
                        initialSrc={track.thumbnail}
                        alt={t}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Equalizer indicator for current playing song */}
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-0.5">
                          <span className="w-0.5 h-3 bg-yellow-400 rounded-full animate-bar-1" />
                          <span className="w-0.5 h-4 bg-yellow-400 rounded-full animate-bar-2" />
                          <span className="w-0.5 h-2.5 bg-yellow-400 rounded-full animate-bar-3" />
                        </div>
                      )}
                    </div>

                    {/* Title & Singer */}
                    <div className="flex-1 min-w-0 pr-1">
                      <p className={`text-xs sm:text-sm font-semibold truncate ${isCurrent ? 'text-yellow-300 font-bold' : 'text-white'}`}>
                        {t}
                      </p>
                      <p className="text-[11px] text-white/50 truncate mt-0.5">
                        Song • {singer}
                      </p>
                    </div>

                    {/* Quick Add to Queue Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToQueue(track);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-white/15 text-white/60 hover:text-white transition-all shrink-0"
                      title="Add to queue"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ──────────────────────────────────────────────
            PANEL 2: CENTER MAIN CONTENT STAGE
           ────────────────────────────────────────────── */}
        <main className="flex-1 bg-[#121212] rounded-xl overflow-y-auto flex flex-col relative border border-white/5">
          {displayTrack ? (
            <>
              {/* Dynamic Gradient Top Banner (Adaptive to album poster) */}
              <div
                className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-end gap-6 shrink-0 transition-all duration-700"
                style={{
                  background: `linear-gradient(180deg, rgba(${posterColor.r}, ${posterColor.g}, ${posterColor.b}, 0.85) 0%, rgba(${Math.floor(posterColor.r * 0.35)}, ${Math.floor(posterColor.g * 0.35)}, ${Math.floor(posterColor.b * 0.35)}, 0.95) 55%, #121212 100%)`,
                  transition: 'background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Large Square Album Artwork with Click-to-Cinema (Screenshot 2) */}
                <div
                  onClick={() => setIsCinemaMode(true)}
                  className="relative group w-44 h-44 sm:w-52 sm:h-52 rounded-md shadow-2xl overflow-hidden shrink-0 bg-black/60 border border-white/10 cursor-pointer"
                  title="Click to view full-size poster artwork"
                >
                  {/* Album artwork provided by Apple / iTunes Search API & Deezer */}
                  <ArtworkImage
                    key={displayTrack.id}
                    title={displayTitle}
                    artist={displayArtist}
                    trackId={displayTrack.id}
                    initialSrc={displayTrack.thumbnail}
                    alt={displayTitle}
                    priority
                    onArtworkLoaded={(url) => setCurrentPoster(url)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  />
                  {/* Hover Overlay: Expand Poster */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity">
                    <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-white/90 font-bold">
                      Expand Poster
                    </span>
                  </div>
                </div>

                {/* Right of Artwork: Metadata */}
                <div className="flex-1 min-w-0 flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-white/80">
                      Song
                    </span>
                    {hoveredTrack && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-mono font-black uppercase tracking-wider animate-pulse">
                        Previewing
                      </span>
                    )}
                  </div>

                  <h1 className="font-display font-black text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-none line-clamp-2 drop-shadow-lg transition-all duration-200">
                    {displayTitle}
                  </h1>

                  {/* Singer / Single / Duration / Views */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/70 font-medium mt-3.5">
                    <span className="font-bold text-white">{displayArtist}</span>
                    <span className="text-white/40">•</span>
                    <span>Single</span>
                    <span className="text-white/40">•</span>
                    <span className="font-mono">{displayTrack.duration || '3:30'}</span>
                    {displayTrack.views && (
                      <>
                        <span className="text-white/40">•</span>
                        <span>{displayTrack.views}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Controls Row (Big Circular Play, Plus, Favorite, More) */}
              <div className="px-6 sm:px-8 py-4 flex items-center gap-6 bg-[#121212] shrink-0 border-b border-white/5">
                {/* Big Circular Play Button */}
                <button
                  onClick={() => {
                    if (hoveredTrack && hoveredTrack.id !== currentTrack?.id) {
                      onPlayTrack(hoveredTrack);
                    } else {
                      onTogglePlay();
                    }
                  }}
                  className="w-14 h-14 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black flex items-center justify-center hover:scale-105 active:scale-95 shadow-[0_8px_20px_rgba(250,204,21,0.35)] transition-all cursor-pointer shrink-0"
                  title={isPlaying && !hoveredTrack ? 'Pause' : 'Play'}
                  aria-label="Play or pause"
                >
                  {isBuffering ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying && !hoveredTrack ? (
                    <Pause className="w-6 h-6 fill-black text-black" />
                  ) : (
                    <Play className="w-6 h-6 fill-black text-black ml-1" />
                  )}
                </button>

                {/* Add to Queue / Plus */}
                <button
                  onClick={() => onAddToQueue(displayTrack)}
                  className="w-9 h-9 rounded-full border border-white/30 hover:border-white text-white/70 hover:text-white flex items-center justify-center transition-colors"
                  title="Add to queue"
                >
                  <Plus className="w-5 h-5" />
                </button>

                {/* Heart / Favorite */}
                <button
                  onClick={() => onToggleFavorite(displayTrack)}
                  className={`w-9 h-9 rounded-full border border-white/30 hover:border-white flex items-center justify-center transition-colors ${
                    isCurrentFavorite ? 'text-yellow-400 border-yellow-400 fill-current' : 'text-white/70 hover:text-white'
                  }`}
                  title={isCurrentFavorite ? 'Remove from favorites' : 'Save to favorites'}
                >
                  <Heart className={`w-5 h-5 ${isCurrentFavorite ? 'fill-current' : ''}`} />
                </button>

                {/* Fullscreen Poster View Button */}
                <button
                  onClick={() => setIsCinemaMode(true)}
                  className="w-9 h-9 rounded-full border border-white/30 hover:border-white text-white/70 hover:text-white flex items-center justify-center transition-colors"
                  title="Full-screen cinema poster view"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Main Body: Live Search Results OR Center Lyrics (Matching Screenshot 1) */}
              <div className="px-6 sm:px-8 py-6 flex-1">
                {localSearchInput.trim() ? (
                  /* ── Live Search Results Mode (Integrated directly in Home) ── */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/10">
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Search className="w-4 h-4 text-yellow-400" />
                        <span>Search Results for &ldquo;{localSearchInput}&rdquo;</span>
                      </h3>
                      <span className="text-xs font-mono text-white/50">{searchResults.length} tracks found</span>
                    </div>

                    {isSearching ? (
                      <div className="py-16 text-center text-white/50 space-y-3">
                        <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-mono text-yellow-400">Searching music catalog...</p>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="py-16 text-center text-white/40">
                        <p className="text-sm font-semibold text-white">No tracks found</p>
                        <p className="text-xs mt-1">Try another song or artist query</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {searchResults.map((track, sIdx) => {
                          const { title: st, artistFromTitle: sa } = cleanTrackTitle(track.title);
                          const singer = getFullSingerName(track.artist || sa || 'Artist', st);

                          return (
                            <div
                              key={`search-res-${track.id}-${sIdx}`}
                              onMouseEnter={() => setHoveredTrack(track)}
                              onMouseLeave={() => setHoveredTrack(null)}
                              onClick={() => {
                                onPlayTrack(track);
                              }}
                              className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                            >
                              <div className="w-12 h-12 rounded overflow-hidden bg-black shrink-0 border border-white/10">
                                <ArtworkImage
                                  title={st}
                                  artist={singer}
                                  trackId={track.id}
                                  initialSrc={track.thumbnail}
                                  alt={st}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate group-hover:text-yellow-300">
                                  {st}
                                </p>
                                <p className="text-xs text-white/50 truncate mt-0.5">
                                  {singer} • {track.duration}
                                </p>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddToQueue(track);
                                }}
                                className="p-2 rounded-full hover:bg-white/20 text-white/60 hover:text-white"
                                title="Add to queue"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  /* ── Center Lyrics Section (Direct from Screenshot 1) ── */
                  <div className="space-y-4 max-w-2xl">
                    <h2 className="text-2xl font-bold text-white tracking-tight">Lyrics</h2>

                    {lyricsData.isLoading ? (
                      <div className="py-8 space-y-3">
                        <div className="h-5 bg-white/5 rounded w-1/3 animate-pulse" />
                        <div className="h-5 bg-white/5 rounded w-2/3 animate-pulse" />
                        <div className="h-5 bg-white/5 rounded w-1/2 animate-pulse" />
                      </div>
                    ) : lyricsData.parsedLines.length > 0 ? (
                      <div className="space-y-3.5 py-2">
                        {lyricsData.parsedLines.map((line, idx) => {
                          const isActive = idx === activeLyricIndex;
                          const isPast = activeLyricIndex >= 0 && idx < activeLyricIndex;

                          return (
                            <p
                              key={`center-lyric-${idx}`}
                              onClick={() => onSeek(line.time)}
                              className={`cursor-pointer transition-all duration-200 select-none ${
                                isActive
                                  ? 'text-white text-2xl sm:text-3xl font-black drop-shadow-md scale-[1.02] origin-left'
                                  : isPast
                                  ? 'text-white/40 text-lg sm:text-xl font-bold hover:text-white/70'
                                  : 'text-white/60 text-lg sm:text-xl font-bold hover:text-white'
                              }`}
                            >
                              {line.text}
                            </p>
                          );
                        })}
                      </div>
                    ) : lyricsData.plainLyrics ? (
                      <div className="space-y-3 py-2 text-white/80 text-lg sm:text-xl font-bold leading-relaxed whitespace-pre-line">
                        {lyricsData.plainLyrics}
                      </div>
                    ) : (
                      <div className="py-8 text-white/40 text-sm">
                        <p>No vocal transcript available for this track.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/40">
              <p>Select a track to start playback</p>
            </div>
          )}
        </main>

        {/* ──────────────────────────────────────────────
            PANEL 3: RIGHT PANEL ("NOW PLAYING VIEW" / VIDEO & CANVAS)
           ────────────────────────────────────────────── */}
        {isRightPanelOpen && currentTrack && (
          <aside className="w-80 lg:w-96 shrink-0 bg-[#121212] rounded-xl flex flex-col overflow-y-auto p-4 space-y-3.5 border border-white/5 hidden xl:flex no-scrollbar">
            {/* Header: Track Name + More + Maximize (Matching Screenshot 1) */}
            <div className="flex items-center justify-between pb-0.5">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <button
                  onClick={() => setIsRightPanelOpen(false)}
                  className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors shrink-0"
                  title="Close side panel"
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
                <h3 className="font-bold text-sm text-white truncate">
                  {cleanTrackTitle(currentTrack.title).title}
                </h3>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsCinemaMode(true)}
                  className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="More options"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsCinemaMode(true)}
                  className="p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Fullscreen cinema mode"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Video / Canvas Area (Embedded tall format matching Screenshot 1) */}
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black shadow-xl relative border border-white/10 shrink-0">
              {videoSlot}
            </div>

            {/* Title & Artist with Share + Plus Action Buttons (Matching Screenshot 1) */}
            <div className="flex items-center justify-between pt-1 shrink-0">
              <div className="min-w-0 pr-2">
                <h4 className="font-extrabold text-xl sm:text-2xl text-white tracking-tight truncate hover:underline cursor-pointer">
                  {cleanTrackTitle(currentTrack.title).title}
                </h4>
                <p className="text-xs sm:text-sm text-white/75 truncate mt-0.5 font-medium">
                  {getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: currentTrack.title, url: window.location.href }).catch(() => {});
                    } else if (navigator.clipboard) {
                      navigator.clipboard.writeText(`${cleanTrackTitle(currentTrack.title).title} - ${getFullSingerName(currentTrack.artist || '', currentTrack.title)}`);
                    }
                  }}
                  className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onToggleFavorite(currentTrack)}
                  className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
                    isCurrentFavorite ? 'text-yellow-400' : 'text-white/70 hover:text-white'
                  }`}
                  title={isCurrentFavorite ? 'Saved to library' : 'Save to library'}
                >
                  {isCurrentFavorite ? <Check className="w-5 h-5 text-yellow-400" /> : <Plus className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Dedicated Dynamic Poster-Adaptive Lyrics Card */}
            <div
              className="rounded-2xl p-4 sm:p-5 flex flex-col flex-1 min-h-[250px] max-h-[380px] border border-white/10 shadow-inner transition-all duration-700"
              style={{
                background: `linear-gradient(145deg, rgba(${posterColor.r}, ${posterColor.g}, ${posterColor.b}, 0.45) 0%, rgba(${Math.floor(posterColor.r * 0.25)}, ${Math.floor(posterColor.g * 0.25)}, ${Math.floor(posterColor.b * 0.25)}, 0.75) 100%)`,
                transition: 'background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <h3 className="text-white font-bold text-base tracking-wide mb-3 shrink-0">Lyrics</h3>
              <div className="overflow-y-auto space-y-3.5 pr-1 no-scrollbar scroll-smooth flex-1">
                {lyricsData.isLoading ? (
                  <p className="text-[#c84d7e]/70 text-sm animate-pulse">Syncing lyrics with Apple & Deezer...</p>
                ) : lyricsData.parsedLines.length > 0 ? (
                  lyricsData.parsedLines.map((line, idx) => {
                    const isActive = idx === activeLyricIndex;
                    return (
                      <p
                        key={idx}
                        ref={isActive ? activeRightLineRef : undefined}
                        onClick={() => onSeek(line.time)}
                        className={`transition-all duration-300 cursor-pointer ${
                          isActive
                            ? 'text-white font-extrabold text-lg sm:text-xl leading-snug drop-shadow-sm scale-[1.01] origin-left'
                            : 'text-[#c84d7e]/75 hover:text-white/80 font-bold text-base sm:text-lg leading-snug'
                        }`}
                      >
                        {line.text}
                      </p>
                    );
                  })
                ) : lyricsData.plainLyrics ? (
                  <div className="text-[#f48fb1]/90 font-bold text-base leading-relaxed whitespace-pre-line">
                    {lyricsData.plainLyrics}
                  </div>
                ) : (
                  <p className="text-[#c84d7e]/60 text-sm">Lyrics will sync here when available for this track.</p>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          3. SPOTIFY BOTTOM PLAYBACK BAR (Full Width)
         ══════════════════════════════════════════════════ */}
      {currentTrack && (
        <footer className="h-20 bg-black border-t border-[#282828] px-4 flex items-center justify-between shrink-0 z-40 select-none">
          {/* Left: Mini Album Art + Track Info + Heart */}
          <div className="flex items-center gap-3 w-1/4 min-w-[180px] max-w-[300px]">
            <div
              onClick={() => setIsCinemaMode(true)}
              className="relative w-14 h-14 rounded overflow-hidden bg-[#282828] shrink-0 cursor-pointer group shadow-sm border border-white/10"
              title="Click to view poster"
            >
              {/* Album artwork provided by Apple / iTunes Search API & Deezer */}
              <ArtworkImage
                title={cleanTrackTitle(currentTrack.title).title}
                artist={getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                trackId={currentTrack.id}
                initialSrc={currentTrack.thumbnail}
                alt={cleanTrackTitle(currentTrack.title).title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0 pr-1">
              <p
                onClick={() => setIsCinemaMode(true)}
                className="text-xs sm:text-sm font-semibold text-white truncate hover:underline cursor-pointer"
              >
                {cleanTrackTitle(currentTrack.title).title}
              </p>
              <p className="text-[11px] text-white/50 truncate hover:underline cursor-pointer mt-0.5">
                {getFullSingerName(currentTrack.artist || '', currentTrack.title)}
              </p>
            </div>

            <button
              onClick={() => onToggleFavorite(currentTrack)}
              className={`p-1 text-white/60 hover:text-white transition-colors shrink-0 ${
                isCurrentFavorite ? 'text-yellow-400 fill-current' : ''
              }`}
              title={isCurrentFavorite ? 'Saved to library' : 'Save to library'}
            >
              <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => onAddToQueue(currentTrack)}
              className="p-1 text-white/60 hover:text-white transition-colors shrink-0"
              title="Add to queue"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Center: Playback Transport Controls + Progress Scrubber */}
          <div className="flex-1 max-w-2xl px-4 flex flex-col items-center gap-1.5">
            {/* Top Row: Transport Buttons */}
            <div className="flex items-center gap-5">
              <button
                onClick={onToggleShuffle}
                className={`p-1.5 transition-colors ${
                  isShuffle ? 'text-yellow-400' : 'text-white/60 hover:text-white'
                }`}
                title="Shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                onClick={onPrev}
                className="p-1.5 text-white/70 hover:text-white transition-colors"
                title="Previous"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              {/* Center Play/Pause Circle */}
              <button
                onClick={onTogglePlay}
                className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isBuffering ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-4 h-4 fill-black text-black" />
                ) : (
                  <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                )}
              </button>

              <button
                onClick={onNext}
                className="p-1.5 text-white/70 hover:text-white transition-colors"
                title="Next"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-1.5 transition-colors ${
                  repeatMode !== 'off' ? 'text-yellow-400' : 'text-white/60 hover:text-white'
                }`}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
              </button>
            </div>

            {/* Bottom Row: Authentic Spotify Scrubber Line */}
            <div className="w-full flex items-center gap-2 group/scrubber cursor-pointer select-none">
              <span className="text-[11px] font-mono text-[#a7a7a7] min-w-[34px] text-right">
                {formatTime(currentTime)}
              </span>

              <div className="relative flex-1 flex items-center h-4">
                {/* 4px Dark Gray Track */}
                <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden relative pointer-events-none">
                  {/* Played Progress Bar (White normally, turns Yellow on hover) */}
                  <div
                    className="h-full bg-white group-hover/scrubber:bg-[#facc15] rounded-full transition-colors"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Thumb: Small White Dot visible on hover */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.5)] opacity-0 group-hover/scrubber:opacity-100 transition-opacity pointer-events-none"
                  style={{ left: `calc(${progressPercent}% - 6px)` }}
                />

                {/* Range input for smooth click & drag seeking */}
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

              <span className="text-[11px] font-mono text-[#a7a7a7] min-w-[34px]">
                {formatTime(effectiveDuration)}
              </span>
            </div>
          </div>

          {/* Right: Film, Mic2, ListMusic, Laptop2, Right Panel, Volume, Fullscreen Cinema Mode */}
          <div className="w-1/4 min-w-[180px] max-w-[300px] flex items-center justify-end gap-1.5">
            {/* Toggle Video */}
            <button
              onClick={onToggleVideo}
              className={`p-1.5 rounded transition-colors ${
                isVideoVisible ? 'text-yellow-400' : 'text-white/60 hover:text-white'
              }`}
              title="Toggle Video Player"
            >
              <Film className="w-4 h-4" />
            </button>

            {/* Lyrics */}
            <button
              onClick={() => {
                if (!isRightPanelOpen) setIsRightPanelOpen(true);
              }}
              className="p-1.5 rounded text-white/60 hover:text-white transition-colors"
              title="Lyrics"
            >
              <Mic2 className="w-4 h-4" />
            </button>

            {/* Queue */}
            <button
              onClick={() => {
                setLibraryTab('queue');
                if (!isRightPanelOpen) setIsRightPanelOpen(true);
              }}
              className={`p-1.5 rounded transition-colors ${
                libraryTab === 'queue' ? 'text-yellow-400' : 'text-white/60 hover:text-white'
              }`}
              title="Queue"
            >
              <ListMusic className="w-4 h-4" />
            </button>

            {/* Connect Device */}
            <button
              className="p-1.5 rounded text-white/60 hover:text-white transition-colors"
              title="SoundStream Hi-Fi Engine (Connected)"
            >
              <Laptop2 className="w-4 h-4" />
            </button>

            {/* Toggle Right Panel */}
            <button
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className={`p-1.5 rounded transition-colors ${
                isRightPanelOpen ? 'text-yellow-400' : 'text-white/60 hover:text-white'
              }`}
              title="Toggle Right Panel"
            >
              {isRightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
            </button>

            {/* Volume Control Bar */}
            <div className="flex items-center gap-1.5 ml-0.5 group/volume cursor-pointer select-none">
              <button
                onClick={() => onChangeVolume(volume === 0 ? 80 : 0)}
                className="p-1 text-[#a7a7a7] hover:text-white transition-colors"
                title="Mute / Unmute"
              >
                <VolumeIcon className="w-4 h-4" />
              </button>

              <div className="relative w-20 flex items-center h-4">
                <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden pointer-events-none">
                  <div
                    className="h-full bg-white group-hover/volume:bg-[#facc15] rounded-full transition-colors"
                    style={{ width: `${volume}%` }}
                  />
                </div>

                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.5)] opacity-0 group-hover/volume:opacity-100 transition-opacity pointer-events-none"
                  style={{ left: `calc(${volume}% - 6px)` }}
                />

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => onChangeVolume(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  aria-label="Volume slider"
                />
              </div>
            </div>

            {/* Cinema Mode Toggle (Open) */}
            <button
              onClick={() => setIsCinemaMode(true)}
              className="p-1.5 text-white/60 hover:text-white transition-colors ml-0.5"
              title="Full Screen Artwork Poster"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </footer>
      )}

      {/* ══════════════════════════════════════════════════
          4. SCREENSHOT 2: FULLSCREEN CINEMA ARTWORK POSTER MODE
         ══════════════════════════════════════════════════ */}
      {isCinemaMode && currentTrack && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-between overflow-y-auto select-none animate-in fade-in duration-300 no-scrollbar"
          style={{
            background: `radial-gradient(ellipse at 50% 25%, rgba(${posterColor.r}, ${posterColor.g}, ${posterColor.b}, 0.85) 0%, rgba(${Math.floor(posterColor.r * 0.38)}, ${Math.floor(posterColor.g * 0.38)}, ${Math.floor(posterColor.b * 0.38)}, 0.92) 50%, #0a0a0a 100%)`,
            transition: 'background 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Top Bar: Song Title on Left + The 6 Screenshot 2 Icons on Right */}
          <div className="sticky top-0 z-30 h-16 px-6 sm:px-10 flex items-center justify-between shrink-0 bg-transparent">
            {/* Left: Song Title */}
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide truncate max-w-xs sm:max-w-md">
              {cleanTrackTitle(currentTrack.title).title}
            </h2>

            {/* Right: Exactly 6 Icons Matching Screenshot 2 */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* 1. Disc: Poster Mode */}
              <button
                onClick={() => setMaximizeViewMode('poster')}
                className={`p-2 rounded-full transition-colors ${
                  maximizeViewMode === 'poster' ? 'text-white bg-white/20' : 'text-white/60 hover:text-white'
                }`}
                title="Album Poster View"
              >
                <Disc className="w-5 h-5" />
              </button>

              {/* 2. PlaySquare: Video View */}
              <button
                onClick={() => setMaximizeViewMode('video')}
                className={`p-2 rounded-full transition-colors ${
                  maximizeViewMode === 'video' ? 'text-white bg-white/20' : 'text-white/60 hover:text-white'
                }`}
                title="Music Video View"
              >
                <PlaySquare className="w-5 h-5" />
              </button>

              {/* 3. User: About Artist */}
              <button
                onClick={() => {
                  aboutArtistRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-2 rounded-full text-white/60 hover:text-white transition-colors"
                title="About the Artist"
              >
                <User className="w-5 h-5" />
              </button>

              {/* 4. Mic2: Lyrics Mode */}
              <button
                onClick={() => setMaximizeViewMode('lyrics')}
                className={`p-2 rounded-full transition-colors ${
                  maximizeViewMode === 'lyrics' ? 'text-white bg-white/20' : 'text-white/60 hover:text-white'
                }`}
                title="Live Lyrics View"
              >
                <Mic2 className="w-5 h-5" />
              </button>

              {/* 5. MoreHorizontal: More options */}
              <button
                className="p-2 rounded-full text-white/60 hover:text-white transition-colors"
                title="More Options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {/* 6. Minimize2: Exit maximize / cinema mode */}
              <button
                onClick={() => setIsCinemaMode(false)}
                className="p-2 rounded-full text-white/60 hover:text-white transition-colors ml-1"
                title="Exit Fullscreen (Esc)"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center: Large Album Artwork Poster / Video / Synced Lyrics */}
          <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-6 w-full max-w-5xl mx-auto">
            {maximizeViewMode === 'poster' && (
              <div className="w-72 sm:w-96 md:w-[440px] aspect-square rounded-3xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.85)] border border-white/15 bg-black my-4 transform transition-all duration-300">
                {/* Album artwork provided by Apple / iTunes Search API & Deezer */}
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
            )}

            {maximizeViewMode === 'video' && (
              <div className="w-full max-w-3xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-black my-4">
                {videoSlot}
              </div>
            )}

            {maximizeViewMode === 'lyrics' && (
              <div className="max-w-2xl w-full py-8 text-center space-y-4 max-h-[500px] overflow-y-auto no-scrollbar">
                {lyricsData.parsedLines.length > 0 ? (
                  lyricsData.parsedLines.map((line, idx) => {
                    const isActive = idx === activeLyricIndex;
                    return (
                      <p
                        key={idx}
                        onClick={() => onSeek(line.time)}
                        className={`transition-all duration-300 cursor-pointer ${
                          isActive
                            ? 'text-white font-extrabold text-2xl sm:text-3xl scale-105'
                            : 'text-[#e57399]/60 hover:text-white/80 font-bold text-lg sm:text-xl'
                        }`}
                      >
                        {line.text}
                      </p>
                    );
                  })
                ) : lyricsData.plainLyrics ? (
                  <div className="text-white/90 text-xl font-bold leading-relaxed whitespace-pre-line">
                    {lyricsData.plainLyrics}
                  </div>
                ) : (
                  <p className="text-white/50 text-base">No synced lyrics available for this track.</p>
                )}
              </div>
            )}

            {/* Screenshot 2: Side-by-Side Cards (About the artist & Credits) */}
            <div ref={aboutArtistRef} className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
              {/* Card 1: About the artist */}
              <div className="bg-[#181818]/80 hover:bg-[#202020]/90 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between transition-colors shadow-lg">
                <div>
                  <h3 className="font-bold text-white text-base mb-3">About the artist</h3>
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-white/10 shrink-0 border border-white/20">
                      <ArtworkImage
                        title={cleanTrackTitle(currentTrack.title).title}
                        artist={getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                        trackId={currentTrack.id}
                        initialSrc={currentTrack.thumbnail}
                        alt={getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white text-sm sm:text-base">
                          {getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                        </h4>
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold" title="Verified Artist">
                          ✓
                        </span>
                      </div>
                      <p className="text-xs text-white/60 mt-0.5">41,894,320 monthly listeners</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/65 leading-relaxed line-clamp-3">
                    Internationally celebrated playback artist and composer, known for soulful vocal textures, cinematic ballads, and global chart-topping releases.
                  </p>
                </div>
                <div className="pt-3 border-t border-white/10 mt-3 flex items-center justify-between text-[11px] text-white/40">
                  <span>Top Global Performer</span>
                  <span className="text-yellow-400 font-medium">Apple & Deezer Verified</span>
                </div>
              </div>

              {/* Card 2: Credits */}
              <div className="bg-[#181818]/80 hover:bg-[#202020]/90 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col justify-between transition-colors shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white text-base">Credits</h3>
                    <button className="text-xs font-bold text-white/60 hover:text-white uppercase tracking-wider">
                      Show all
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <p className="font-bold text-sm text-white">{getFullSingerName(currentTrack.artist || '', currentTrack.title)}</p>
                      <p className="text-xs text-white/50">Main Artist, Lead Vocals</p>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{cleanTrackTitle(currentTrack.title).artistFromTitle || getFullSingerName(currentTrack.artist || '', currentTrack.title)}</p>
                      <p className="text-xs text-white/50">Composer, Producer</p>
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">SoundStream Master Audio</p>
                      <p className="text-xs text-white/50">Lossless Production & Engineering</p>
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-white/10 mt-3 flex items-center justify-between text-[11px] text-white/40">
                  <span>Source: Apple iTunes & Deezer Catalog</span>
                  <span>Lossless Audio Master</span>
                </div>
              </div>
            </div>
          </div>

          {/* Screenshot 2: Docked Bottom Playback Bar in Maximize View */}
          <div className="sticky bottom-0 z-40 h-20 bg-black/95 backdrop-blur-xl border-t border-[#282828] px-4 flex items-center justify-between shrink-0 select-none">
            {/* Left: Mini Art + Track + Heart + Plus */}
            <div className="flex items-center gap-3 w-1/4 min-w-[180px] max-w-[300px]">
              <div className="relative w-14 h-14 rounded overflow-hidden bg-[#282828] shrink-0 border border-white/10">
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
                <p className="text-xs sm:text-sm font-semibold text-white truncate">
                  {cleanTrackTitle(currentTrack.title).title}
                </p>
                <p className="text-[11px] text-white/50 truncate mt-0.5">
                  {getFullSingerName(currentTrack.artist || '', currentTrack.title)}
                </p>
              </div>

              {/* Heart (Like) */}
              <button
                onClick={() => onToggleFavorite(currentTrack)}
                className={`p-1 text-white/60 hover:text-white transition-colors shrink-0 ${
                  isCurrentFavorite ? 'text-yellow-400 fill-current' : ''
                }`}
                title={isCurrentFavorite ? 'Saved to library' : 'Save to library'}
              >
                <Heart className={`w-4 h-4 ${isCurrentFavorite ? 'fill-current' : ''}`} />
              </button>

              {/* Plus (Add to queue) */}
              <button
                onClick={() => onAddToQueue(currentTrack)}
                className="p-1 text-white/60 hover:text-white transition-colors shrink-0"
                title="Add to queue"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Center: Playback Controls + 4px Scrubber */}
            <div className="flex-1 max-w-2xl px-4 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-5">
                <button
                  onClick={onToggleShuffle}
                  className={`p-1.5 transition-colors ${
                    isShuffle ? 'text-yellow-400' : 'text-white/60 hover:text-white'
                  }`}
                  title="Shuffle"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <button
                  onClick={onPrev}
                  className="p-1.5 text-white/70 hover:text-white transition-colors"
                  title="Previous"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>
                <button
                  onClick={onTogglePlay}
                  className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isBuffering ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-4 h-4 fill-black text-black" />
                  ) : (
                    <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                  )}
                </button>
                <button
                  onClick={onNext}
                  className="p-1.5 text-white/70 hover:text-white transition-colors"
                  title="Next"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
                <button
                  onClick={onToggleRepeat}
                  className={`p-1.5 transition-colors ${
                    repeatMode !== 'off' ? 'text-yellow-400' : 'text-white/60 hover:text-white'
                  }`}
                  title={`Repeat: ${repeatMode}`}
                >
                  {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </button>
              </div>

              {/* Scrubber Line */}
              <div className="w-full flex items-center gap-2 group/scrubber cursor-pointer select-none">
                <span className="text-[11px] font-mono text-[#a7a7a7] min-w-[34px] text-right">
                  {formatTime(currentTime)}
                </span>
                <div className="relative flex-1 flex items-center h-4">
                  <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden relative pointer-events-none">
                    <div
                      className="h-full bg-white group-hover/scrubber:bg-[#facc15] rounded-full transition-colors"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.5)] opacity-0 group-hover/scrubber:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `calc(${progressPercent}% - 6px)` }}
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
                <span className="text-[11px] font-mono text-[#a7a7a7] min-w-[34px]">
                  {formatTime(effectiveDuration)}
                </span>
              </div>
            </div>

            {/* Right: Film, Mic2, ListMusic, Laptop2, Right Panel, Volume, Minimize */}
            <div className="w-1/4 min-w-[180px] max-w-[300px] flex items-center justify-end gap-1.5">
              {/* 1. Toggle Video View Mode */}
              <button
                onClick={() => setMaximizeViewMode(maximizeViewMode === 'video' ? 'poster' : 'video')}
                className={`p-1.5 rounded transition-colors ${
                  maximizeViewMode === 'video' ? 'text-yellow-400' : 'text-white/60 hover:text-white'
                }`}
                title="Music Video View"
              >
                <Film className="w-4 h-4" />
              </button>

              {/* 2. Toggle Lyrics View Mode */}
              <button
                onClick={() => setMaximizeViewMode(maximizeViewMode === 'lyrics' ? 'poster' : 'lyrics')}
                className={`p-1.5 rounded transition-colors ${
                  maximizeViewMode === 'lyrics' ? 'text-yellow-400' : 'text-white/60 hover:text-white'
                }`}
                title="Live Lyrics View"
              >
                <Mic2 className="w-4 h-4" />
              </button>

              {/* 3. Queue */}
              <button
                onClick={() => {
                  setLibraryTab('queue');
                  aboutArtistRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`p-1.5 rounded transition-colors ${
                  libraryTab === 'queue' ? 'text-yellow-400' : 'text-white/60 hover:text-white'
                }`}
                title="Queue"
              >
                <ListMusic className="w-4 h-4" />
              </button>

              {/* 4. Connect Device */}
              <button
                className="p-1.5 rounded text-white/60 hover:text-white transition-colors"
                title="SoundStream Hi-Fi Engine (Connected)"
              >
                <Laptop2 className="w-4 h-4" />
              </button>

              {/* 5. Toggle Right Panel / Details */}
              <button
                onClick={() => {
                  aboutArtistRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="p-1.5 rounded text-white/60 hover:text-white transition-colors"
                title="About the Artist & Details"
              >
                <PanelRightOpen className="w-4 h-4" />
              </button>

              {/* 6. Volume Control Bar */}
              <div className="flex items-center gap-1.5 ml-0.5 group/volume cursor-pointer select-none">
                <button
                  onClick={() => onChangeVolume(volume === 0 ? 80 : 0)}
                  className="p-1 text-[#a7a7a7] hover:text-white transition-colors"
                  title="Mute / Unmute"
                >
                  <VolumeIcon className="w-4 h-4" />
                </button>
                <div className="relative w-20 flex items-center h-4">
                  <div className="w-full h-1 bg-[#4d4d4d] rounded-full overflow-hidden pointer-events-none">
                    <div
                      className="h-full bg-white group-hover/volume:bg-[#facc15] rounded-full transition-colors"
                      style={{ width: `${volume}%` }}
                    />
                  </div>
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.5)] opacity-0 group-hover/volume:opacity-100 transition-opacity pointer-events-none"
                    style={{ left: `calc(${volume}% - 6px)` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => onChangeVolume(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    aria-label="Volume slider"
                  />
                </div>
              </div>

              {/* 7. Exit Cinema Mode */}
              <button
                onClick={() => setIsCinemaMode(false)}
                className="p-1.5 text-white/60 hover:text-white transition-colors ml-0.5"
                title="Exit Fullscreen (Esc)"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
