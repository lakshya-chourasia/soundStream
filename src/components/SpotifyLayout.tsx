import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Track, RepeatMode, GenreCollection } from '../types/player';
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
  Bell,
  Users,
  Download,
  ChevronLeft,
  ChevronRight,
  Radio,
  PlayCircle,
  Headphones,
  Library,
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
  genres?: GenreCollection[];
}

interface HomeEpisode {
  id: string;
  title: string;
  author: string;
  dateAndDuration: string;
  category: 'podcasts' | 'stories' | 'audiobooks';
  trackEquivalent: Track;
}

const MASTER_CURATED_TRACKS: Track[] = [
  {
    id: '81qmmlsIE3k',
    title: 'Tum Hi Ho (From "Aashiqui 2")',
    artist: 'Arijit Singh, Mithoon',
    duration: '4:22',
    durationSec: 262,
    views: '850M views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/1200x1200bb.jpg',
  },
  {
    id: 'wnWgkY1LGW4',
    title: 'Sanam Teri Kasam (Original Motion Picture)',
    artist: 'Himesh Reshammiya, Ankit Tiwari, Palak Muchhal',
    duration: '5:14',
    durationSec: 314,
    views: '420M views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/44/65/2a/44652a17-ed54-7224-ca3e-281a2f704412/196871079150.jpg/1200x1200bb.jpg',
  },
  {
    id: 'lBvbNxiVmZA',
    title: 'Raanjhan (From "Do Patti")',
    artist: 'Sachet-Parampara, Parampara Tandon, Kausar Munir',
    duration: '3:30',
    durationSec: 210,
    views: '110M views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/99/a9/ca/99a9caf7-5d9f-5890-3fdf-e3ff8c860e79/8903431018915_cover.jpg/1200x1200bb.jpg',
  },
  {
    id: '3Cp2QTBZAFQ',
    title: 'Finding Her',
    artist: 'Kushagra, Bharath, Saaheal',
    duration: '3:40',
    durationSec: 220,
    views: '35M views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/0e/4f/58/0e4f5828-64f8-26d5-ebde-661b6fee89fe/5034644353067.jpg/1200x1200bb.jpg',
  },
  {
    id: '2Vv-BfVoq4g',
    title: 'Ultimate Love Songs - Arijit Singh',
    artist: 'Arijit Singh',
    duration: '4:23',
    durationSec: 263,
    views: '3.6B views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/1200x1200bb.jpg',
  },
  {
    id: 'kJQP7kiw5Fk',
    title: 'Despacito (Official Music Video)',
    artist: 'Luis Fonsi ft. Daddy Yankee (Ramón Ayala)',
    duration: '4:42',
    durationSec: 282,
    views: '8.4B views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e2/ef/f0/e2eff0bc-c51d-7de5-9280-6891ddcee71b/18UMGIM85289.rgb.jpg/1200x1200bb.jpg',
  },
  {
    id: 'JGwWNGJdvx8',
    title: 'Shape of You (Official Music Video)',
    artist: 'Edward Christopher Sheeran',
    duration: '4:24',
    durationSec: 264,
    views: '6.2B views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/1200x1200bb.jpg',
  },
  {
    id: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody (Official Video Remastered)',
    artist: 'Freddie Mercury (Queen)',
    duration: '6:00',
    durationSec: 360,
    views: '1.7B views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8b/0a/ea/8b0aea60-6f4a-195b-5958-cdf459c2333b/602527644271.jpg/1200x1200bb.jpg',
  },
  {
    id: '4NRXx6U8ABQ',
    title: 'Blinding Lights (Official Music Video)',
    artist: 'Abel Tesfaye (The Weeknd)',
    duration: '4:22',
    durationSec: 262,
    views: '800M views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/1200x1200bb.jpg',
  },
  {
    id: 'yKNxeF4KMsY',
    title: 'Yellow (Official Video)',
    artist: 'Chris Martin (Coldplay)',
    duration: '4:33',
    durationSec: 273,
    views: '1.3B views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/1200x1200bb.jpg',
  },
  {
    id: 'ALZHF5UqnU4',
    title: 'Alone (Official Music Video)',
    artist: 'Christopher Comstock (Marshmello)',
    duration: '3:20',
    durationSec: 200,
    views: '2.4B views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/7e/be/33/7ebe3370-959a-94f7-77e2-c9e7fea9a4ed/859716988917_cover.jpg/1200x1200bb.jpg',
  },
  {
    id: 'H5v3kku4y6Q',
    title: 'As It Was (Official Video)',
    artist: 'Harry Edward Styles',
    duration: '2:47',
    durationSec: 167,
    views: '850M views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/2a/19/fb/2a19fb85-2f70-9e44-f2a9-82abe679b88e/886449990061.jpg/1200x1200bb.jpg',
  },
  {
    id: 'TUVcZfQe-Kw',
    title: 'Levitating (Official Music Video)',
    artist: 'Dua Lipa',
    duration: '3:50',
    durationSec: 230,
    views: '920M views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/1200x1200bb.jpg',
  },
  {
    id: 'wXhTHyIgQ_U',
    title: 'Circles (Official Music Video)',
    artist: 'Austin Richard Post (Post Malone)',
    duration: '3:35',
    durationSec: 215,
    views: '640M views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/7b/1b/1b/7b1b1b0b-7ce2-b223-f9e0-8e36abe51877/19UMGIM78325.rgb.jpg/1200x1200bb.jpg',
  },
  {
    id: 'IcrbM1l_BoI',
    title: 'Wake Me Up (Official Video)',
    artist: 'Aloe Blacc (Avicii)',
    duration: '4:32',
    durationSec: 272,
    views: '2.3B views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/18/5b/1e/185b1ef5-5d97-19d8-aebf-8e29e41874ef/13UAAIM59255.rgb.jpg/1200x1200bb.jpg',
  },
  {
    id: 'DyDfgMOUjCI',
    title: 'bad guy (Official Music Video)',
    artist: 'Billie Eilish O\'Connell',
    duration: '3:25',
    durationSec: 205,
    views: '1.2B views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/1a/37/d1/1a37d1b1-8508-54f2-f541-bf4e437dda76/19UMGIM05028.rgb.jpg/1200x1200bb.jpg',
  },
  {
    id: 'bpOSxM0rNPM',
    title: 'Do I Wanna Know? (Official Video)',
    artist: 'Alex Turner (Arctic Monkeys)',
    duration: '4:26',
    durationSec: 266,
    views: '1.6B views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/69/9c/b5/699cb5d6-115c-ff73-9d26-e57ea4350d72/887828031795.png/1200x1200bb.jpg',
  },
  {
    id: 'gGdGFtwCNBE',
    title: 'Mr. Brightside (Official Music Video)',
    artist: 'Brandon Flowers (The Killers)',
    duration: '3:48',
    durationSec: 228,
    views: '560M views',
    thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/11/64/9c/11649c80-2066-dba8-77a9-df7eecae26c1/17UM1IM06937.rgb.jpg/1200x1200bb.jpg',
  },
];

const MASTER_EPISODES: HomeEpisode[] = [
  {
    id: 'ep-ramayana',
    title: 'Ramayana Hidden Stories | Untold Perspectives',
    author: 'Rakesh Soni & Audio Epic',
    dateAndDuration: 'Nov 10 · 15 min',
    category: 'stories',
    trackEquivalent: {
      id: '81qmmlsIE3k',
      title: 'Ramayana Hidden Stories | Untold Perspectives',
      artist: 'Rakesh Soni & Audio Epic',
      duration: '15:20',
      durationSec: 920,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/1200x1200bb.jpg',
    },
  },
  {
    id: 'ep-huberman',
    title: '5 Science-Backed Secrets to Living Longer',
    author: 'Andrew Huberman & PGX',
    dateAndDuration: 'Nov 13 · 79 min',
    category: 'podcasts',
    trackEquivalent: {
      id: 'wnWgkY1LGW4',
      title: '5 Science-Backed Secrets to Living Longer',
      artist: 'Andrew Huberman & PGX',
      duration: '79:15',
      durationSec: 4755,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/44/65/2a/44652a17-ed54-7224-ca3e-281a2f704412/196871079150.jpg/1200x1200bb.jpg',
    },
  },
  {
    id: 'ep-allabouther',
    title: 'Too Fat. Too Never Good Enough',
    author: 'All About Her Sessions',
    dateAndDuration: 'Nov 15 · 91 min',
    category: 'podcasts',
    trackEquivalent: {
      id: 'lBvbNxiVmZA',
      title: 'Too Fat. Too Never Good Enough',
      artist: 'All About Her Sessions',
      duration: '91:40',
      durationSec: 5500,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/99/a9/ca/99a9caf7-5d9f-5890-3fdf-e3ff8c860e79/8903431018915_cover.jpg/1200x1200bb.jpg',
    },
  },
  {
    id: 'ep-deepfocus',
    title: 'The Neuroscience of Deep Focus and Flow State',
    author: 'Dr. Matthew Walker & Lex Fridman',
    dateAndDuration: 'Nov 12 · 64 min',
    category: 'podcasts',
    trackEquivalent: {
      id: '3Cp2QTBZAFQ',
      title: 'The Neuroscience of Deep Focus and Flow State',
      artist: 'Dr. Matthew Walker & Lex Fridman',
      duration: '64:30',
      durationSec: 3870,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/0e/4f/58/0e4f5828-64f8-26d5-ebde-661b6fee89fe/5034644353067.jpg/1200x1200bb.jpg',
    },
  },
  {
    id: 'ep-shivaji',
    title: 'Chhatrapati Shivaji Maharaj: Battlefield Tactics',
    author: 'Historical Chronicles Series',
    dateAndDuration: 'Nov 08 · 42 min',
    category: 'stories',
    trackEquivalent: {
      id: '81qmmlsIE3k',
      title: 'Chhatrapati Shivaji Maharaj: Battlefield Tactics',
      artist: 'Historical Chronicles Series',
      duration: '42:10',
      durationSec: 2530,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/1200x1200bb.jpg',
    },
  },
  {
    id: 'ep-ambient',
    title: 'Midnight Rain & Solitude Soundscapes',
    author: 'SoundStream Ambient Lab',
    dateAndDuration: 'Nov 14 · 55 min',
    category: 'audiobooks',
    trackEquivalent: {
      id: '8GW6sLrK40k',
      title: 'Midnight Rain & Solitude Soundscapes',
      artist: 'SoundStream Ambient Lab',
      duration: '55:00',
      durationSec: 3300,
      thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/4f/13/65/4f1365b0-e97c-c469-c438-2f7d8f204355/872133025584_cover.jpg/1200x1200bb.jpg',
    },
  },
];

const GETTING_STARTED_TIPS = [
  {
    step: '3. Watch a video',
    description: 'Play videos from your favorite artists and creators.',
    primaryAction: 'Browse videos',
    secondaryAction: 'Show more tips',
    actionType: 'video',
  },
  {
    step: '1. Connect Hi-Fi Audio',
    description: 'Lossless 24-bit / 48kHz Master streaming engine active.',
    primaryAction: 'Explore Hi-Fi',
    secondaryAction: 'Show more tips',
    actionType: 'hifi',
  },
  {
    step: '2. Synchronized Lyrics',
    description: 'Follow word-by-word synced karaoke lyrics powered by Apple & Deezer.',
    primaryAction: 'View lyrics',
    secondaryAction: 'Show more tips',
    actionType: 'lyrics',
  },
  {
    step: '4. Curate Your Library',
    description: 'Save favorite tracks and import songs directly from YouTube.',
    primaryAction: 'Import track',
    secondaryAction: 'Show more tips',
    actionType: 'import',
  },
];

function shuffleList<T>(list: T[]): T[] {
  const result = [...list];
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
  // ── Home View Mode & Randomization States ──
  const [centerViewMode, setCenterViewMode] = useState<'home' | 'track_details'>('home');
  const [homeFilter, setHomeFilter] = useState<'all' | 'music' | 'podcasts' | 'audiobooks'>('all');
  const [isLeftSidebarCollapsed, setIsLeftSidebarCollapsed] = useState<boolean>(true);
  const [randomSeed, setRandomSeed] = useState<number>(1);
  const [activeTipIndex, setActiveTipIndex] = useState<number>(0);

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

  // ── Dynamic Music Catalog & Shuffled Sets (Fisher-Yates No Hardcoding) ──
  const allCatalogPool = useMemo(() => {
    const map = new Map<string, Track>();
    for (const t of MASTER_CURATED_TRACKS) map.set(t.id, t);
    if (genres && genres.length > 0) {
      for (const g of genres) {
        for (const t of g.tracks) {
          if (!map.has(t.id)) map.set(t.id, t);
        }
      }
    }
    for (const t of recommendations) {
      if (!map.has(t.id)) map.set(t.id, t);
    }
    for (const t of queue) {
      if (!map.has(t.id)) map.set(t.id, t);
    }
    return Array.from(map.values());
  }, [genres, recommendations, queue]);

  // Randomized popular albums & singles (re-shuffled when randomSeed or homeFilter changes)
  const randomizedPopularAlbums = useMemo(() => {
    const shuffled = shuffleList(allCatalogPool);
    if (homeFilter === 'podcasts') {
      return shuffled.slice(4, 12);
    }
    return shuffled.slice(0, 10);
  }, [allCatalogPool, randomSeed, homeFilter]);

  // Randomized best episodes (re-shuffled when randomSeed or homeFilter changes)
  const randomizedEpisodes = useMemo(() => {
    const shuffled = shuffleList(MASTER_EPISODES);
    if (homeFilter === 'podcasts') {
      return shuffled.filter((e) => e.category === 'podcasts' || e.category === 'stories').slice(0, 3);
    }
    if (homeFilter === 'audiobooks') {
      return shuffled.filter((e) => e.category === 'audiobooks' || e.category === 'stories').slice(0, 3);
    }
    return shuffled.slice(0, 3);
  }, [randomSeed, homeFilter]);

  // Randomized mixes (re-shuffled when randomSeed changes)
  const randomizedMixes = useMemo(() => {
    const shuffled = shuffleList(allCatalogPool);
    return shuffled.slice(5, 15);
  }, [allCatalogPool, randomSeed]);

  // Active Tip for Getting Started
  const currentTip = GETTING_STARTED_TIPS[activeTipIndex % GETTING_STARTED_TIPS.length];

  // Right Panel Lyrics Preview Lines (first 2-3 lines)
  const lyricsPreviewLines = useMemo(() => {
    if (lyricsData.parsedLines.length > 0) {
      return lyricsData.parsedLines.slice(0, 2).map((l) => l.text);
    }
    if (lyricsData.plainLyrics) {
      const lines = lyricsData.plainLyrics.split('\n').map((l) => l.trim()).filter(Boolean);
      return lines.slice(0, 2);
    }
    const trackT = (hoveredTrack || currentTrack)?.title?.toLowerCase() || '';
    if (trackT.includes('tum hi ho') || trackT.includes('aashiqui')) {
      return [
        'Hum tere bin ab reh nahin sakte',
        'Tere bina kya wajood mera?',
      ];
    }
    if (trackT.includes('sanam teri')) {
      return [
        'Sanam teri kasam ho...',
        'Betahasha dil ne tujhko hi chaaha hai',
      ];
    }
    if (trackT.includes('alone')) {
      return [
        'I am so alone, nothing feels like home',
        'I need you now by my side',
      ];
    }
    return [
      'Hum tere bin ab reh nahin sakte',
      'Tere bina kya wajood mera?',
    ];
  }, [lyricsData.parsedLines, lyricsData.plainLyrics, hoveredTrack?.title, currentTrack?.title]);

  const handleGoHome = () => {
    setCenterViewMode('home');
    setLocalSearchInput('');
    onClearSearch();
    setRandomSeed((s) => s + 1);
  };

  const handleFilterChange = (filter: 'all' | 'music' | 'podcasts' | 'audiobooks') => {
    setHomeFilter(filter);
    setRandomSeed((s) => s + 1);
  };

  const handleShowAll = () => {
    setRandomSeed((s) => s + 1);
  };

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
        {/* Left: SoundStream Yellow Spotify-Style Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2.5 focus:outline-none group cursor-pointer"
            title="SoundStream Home"
          >
            <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-[0_0_12px_rgba(250,204,21,0.4)] group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 5.524 4.477 10 10 10s10-4.476 10-10c0-5.523-4.477-10-10-10zm4.586 14.424a.625.625 0 0 1-.861.206c-2.358-1.441-5.326-1.767-8.823-.968a.624.624 0 0 1-.277-1.218c3.83-.874 7.114-.504 9.755 1.119a.625.625 0 0 1 .206.861zm1.225-2.723a.782.782 0 0 1-1.077.257c-2.7-1.66-6.815-2.14-10.007-1.171a.781.781 0 1 1-.453-1.498c3.647-1.106 8.196-.576 11.28 1.335a.781.781 0 0 1 .257 1.077zm.105-2.835C14.692 8.948 9.37 8.77 6.273 9.71a.937.937 0 1 1-.548-1.793c3.553-1.078 9.429-.868 13.155 1.344a.938.938 0 1 1-.964 1.605z"/>
              </svg>
            </div>
            <span className="font-display font-black text-lg sm:text-xl tracking-wider text-white hidden sm:inline">
              SOUNDSTREAM
            </span>
          </button>
        </div>

        {/* Center: Dedicated Circular Home Button + Integrated Search Pill (Matching Screenshot) */}
        <div className="flex items-center gap-2 max-w-xl w-full mx-4 justify-center">
          <button
            onClick={handleGoHome}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 cursor-pointer ${
              centerViewMode === 'home' && !localSearchInput.trim()
                ? 'bg-white/20 text-white ring-1 ring-white/30 shadow-md'
                : 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white/80 hover:text-white'
            }`}
            title="Home"
            aria-label="Home"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Search Pill Input with Browse/Folder icon */}
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

        {/* Right: Explore Premium + Install App + Bell + Users + 'L' Avatar (Matching Screenshot) */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Explore Premium Pill */}
          <button
            onClick={() => window.open('https://spotify.com/premium', '_blank')}
            className="hidden sm:inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
            title="Explore Premium"
          >
            Explore Premium
          </button>

          {/* Install App Download Button */}
          <a
            href="/download/app.apk"
            download="SoundStream.apk"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white/90 hover:text-white transition-colors"
            title="Download Android APK"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install App</span>
          </a>

          {/* Sleep Timer */}
          <button
            onClick={onOpenSleepTimer}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              sleepTimerRemaining !== null
                ? 'bg-yellow-400/20 border-yellow-400/50 text-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.25)]'
                : 'bg-[#1f1f1f] hover:bg-[#2a2a2a] border-transparent text-white/70 hover:text-white'
            }`}
            title={sleepTimerRemaining !== null ? `Sleep timer: ${Math.ceil(sleepTimerRemaining / 60)}m remaining` : 'Set sleep timer'}
          >
            <Timer className={`w-3.5 h-3.5 ${sleepTimerRemaining !== null ? 'text-yellow-400 animate-pulse' : 'text-white/60'}`} />
            {sleepTimerRemaining !== null && (
              <span className="font-mono text-[11px]">{Math.ceil(sleepTimerRemaining / 60)}m</span>
            )}
          </button>

          {/* Notifications Bell */}
          <button
            className="p-2 rounded-full hover:bg-[#1f1f1f] text-white/70 hover:text-white transition-colors cursor-pointer"
            title="What's New"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Friend Activity Users */}
          <button
            className="p-2 rounded-full hover:bg-[#1f1f1f] text-white/70 hover:text-white transition-colors cursor-pointer"
            title="Friend Activity"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* Profile Avatar Pill with initial 'L' (Lakshya - matching screenshot) */}
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black flex items-center justify-center text-xs shadow-md border border-white/20 select-none cursor-pointer"
            title="Lakshya"
          >
            L
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════
          2. MAIN 3-PANEL SPOTIFY WORKSPACE
         ══════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2 min-h-0">

        {/* ──────────────────────────────────────────────
            PANEL 1: LEFT SIDEBAR ("YOUR LIBRARY" / COLLAPSIBLE RAIL)
           ────────────────────────────────────────────── */}
        <aside
          className={`shrink-0 bg-[#121212] rounded-xl flex flex-col overflow-hidden border border-white/5 transition-all duration-300 ${
            isLeftSidebarCollapsed ? 'w-18 items-center p-2.5' : 'w-72 lg:w-80'
          }`}
        >
          {isLeftSidebarCollapsed ? (
            /* Slim Collapsed Rail (Matching Screenshot media_1794855698661_84aa5f08.jpg) */
            <div className="flex flex-col items-center gap-3 w-full">
              {/* Expand Toggle / Library Icon */}
              <button
                onClick={() => setIsLeftSidebarCollapsed(false)}
                className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Expand Your Library"
              >
                <Library className="w-5 h-5" />
              </button>

              {/* Quick Add / Import */}
              {onOpenQuickImport && (
                <button
                  onClick={onOpenQuickImport}
                  className="w-10 h-10 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
                  title="Create playlist / import"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}

              <div className="w-8 h-[1px] bg-white/10 my-1" />

              {/* Purple Liked Songs Square with White Heart (Matching Screenshot) */}
              <div
                onClick={() => {
                  setLibraryTab('favorites');
                  setIsLeftSidebarCollapsed(false);
                }}
                className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-transform group"
                title={`Liked Songs (${favorites.length})`}
              >
                <Heart className="w-6 h-6 fill-white text-white drop-shadow-sm" />
              </div>

              {/* Dynamic Playlist Artwork Tiles */}
              {randomizedPopularAlbums.slice(0, 3).map((track, idx) => (
                <div
                  key={`rail-pl-${track.id}-${idx}`}
                  onClick={() => onPlayTrack(track)}
                  className="w-12 h-12 rounded-lg overflow-hidden bg-black/50 border border-white/10 cursor-pointer hover:scale-105 transition-transform shadow-sm relative group"
                  title={cleanTrackTitle(track.title).title}
                >
                  <ArtworkImage
                    title={cleanTrackTitle(track.title).title}
                    artist={getFullSingerName(track.artist || '', track.title)}
                    trackId={track.id}
                    initialSrc={track.thumbnail}
                    alt={cleanTrackTitle(track.title).title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Full Expanded Library Panel */
            <>
              {/* Header: Your Library + Collapse Button + Create */}
              <div className="p-4 pb-3 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                  <ListMusic className="w-5 h-5 text-white/60" />
                  <span className="font-bold text-sm tracking-tight text-white">Your Library</span>
                </div>
                <div className="flex items-center gap-1">
                  {onOpenQuickImport && (
                    <button
                      onClick={onOpenQuickImport}
                      className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                      title="Add YouTube track"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsLeftSidebarCollapsed(true)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                    title="Collapse sidebar rail"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
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
            </>
          )}
        </aside>

        {/* ──────────────────────────────────────────────
            PANEL 2: CENTER MAIN CONTENT STAGE (SPOTIFY HOME FEED OR TRACK DETAILS)
           ────────────────────────────────────────────── */}
        <main className="flex-1 bg-[#121212] rounded-xl overflow-y-auto flex flex-col relative border border-white/5 no-scrollbar">
          {localSearchInput.trim() ? (
            /* ── Live Search Results Mode (Integrated directly in Home) ── */
            <div className="p-6 sm:p-8 space-y-4">
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
          ) : centerViewMode === 'home' ? (
            /* ── AUTHENTIC SPOTIFY HOME FEED (Matching Screenshot media_1794855698661_84aa5f08.jpg) ── */
            <div className="p-6 sm:p-8 space-y-8 flex-1 overflow-y-auto">
              {/* 1. Top Filter Pills Row (All, Music, Podcasts, Audiobooks) */}
              <div className="flex items-center gap-2">
                {(['all', 'music', 'podcasts', 'audiobooks'] as const).map((pill) => {
                  const isActive = homeFilter === pill;
                  const label = pill === 'all' ? 'All' : pill === 'music' ? 'Music' : pill === 'podcasts' ? 'Podcasts' : 'Audiobooks';
                  return (
                    <button
                      key={pill}
                      onClick={() => handleFilterChange(pill)}
                      className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-white text-black font-bold shadow-sm'
                          : 'bg-[#242424] hover:bg-[#2e2e2e] text-white/90'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* 2. Split Row: Getting started + Best episodes of the week */}
              {(homeFilter === 'all' || homeFilter === 'podcasts') && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* Left: Getting started Card (5 cols on lg) */}
                  <div className="lg:col-span-5 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        Getting started
                      </h2>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setActiveTipIndex((prev) => (prev > 0 ? prev - 1 : GETTING_STARTED_TIPS.length - 1))}
                          className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                          title="Previous tip"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setActiveTipIndex((prev) => (prev + 1) % GETTING_STARTED_TIPS.length)}
                          className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                          title="Next tip"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Teal/Cyan Tip Card */}
                    <div className="relative rounded-2xl p-6 bg-gradient-to-br from-[#0c5c56] to-[#04332f] border border-white/10 shadow-xl flex flex-col justify-between overflow-hidden flex-1 min-h-[200px]">
                      <div className="relative z-10 max-w-xs">
                        <h3 className="font-display font-black text-2xl text-white tracking-tight mb-2">
                          {currentTip.step}
                        </h3>
                        <p className="text-xs sm:text-sm text-white/80 leading-relaxed mb-6 font-medium">
                          {currentTip.description}
                        </p>
                      </div>

                      <div className="relative z-10 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => {
                            if (currentTip.actionType === 'video') onToggleVideo();
                            else if (currentTip.actionType === 'lyrics') setCenterViewMode('track_details');
                            else if (currentTip.actionType === 'import' && onOpenQuickImport) onOpenQuickImport();
                            else if (currentTrack) onTogglePlay();
                          }}
                          className="px-4 py-2 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs tracking-wide shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        >
                          {currentTip.primaryAction}
                        </button>
                        <button
                          onClick={() => setActiveTipIndex((prev) => (prev + 1) % GETTING_STARTED_TIPS.length)}
                          className="text-xs font-bold text-white/80 hover:text-white transition-colors cursor-pointer"
                        >
                          {currentTip.secondaryAction}
                        </button>
                      </div>

                      {/* Play Circle Icon Badge */}
                      <div className="absolute right-4 bottom-4 w-18 h-18 rounded-2xl bg-black/20 border border-white/10 flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm">
                          <Play className="w-5 h-5 fill-white text-white ml-0.5 opacity-90" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Best episodes of the week (7 cols on lg) */}
                  <div className="lg:col-span-7 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                        Best episodes of the week
                      </h2>
                      <button
                        onClick={handleShowAll}
                        className="text-xs font-bold text-white/60 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Show all
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                      {randomizedEpisodes.map((ep, idx) => (
                        <div
                          key={`ep-${ep.id}-${idx}`}
                          onClick={() => onPlayTrack(ep.trackEquivalent)}
                          className="group relative p-3 rounded-xl bg-[#181818]/70 hover:bg-[#282828] transition-all duration-200 border border-white/5 cursor-pointer flex flex-col justify-between"
                        >
                          <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black/60 shadow-md mb-2.5">
                            <ArtworkImage
                              title={ep.title}
                              artist={ep.author}
                              trackId={ep.id}
                              initialSrc={ep.trackEquivalent.thumbnail}
                              alt={ep.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {/* Floating Yellow Play Button */}
                            <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-200">
                              <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                            </div>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-white line-clamp-2 group-hover:text-yellow-300 transition-colors">
                              <span className="w-2 h-2 rounded-full bg-blue-400 inline-block mr-1.5 align-middle" />
                              {ep.title}
                            </p>
                            <p className="text-[11px] text-white/50 mt-1 font-medium">
                              {ep.dateAndDuration}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Section: Popular albums and singles (Matching Screenshot media_1794855698661_84aa5f08.jpg) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Popular albums and singles
                  </h2>
                  <button
                    onClick={handleShowAll}
                    className="text-xs font-bold text-white/60 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Show all
                  </button>
                </div>

                {/* Responsive Grid of Album & Single Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {randomizedPopularAlbums.map((track, idx) => {
                    const { title: t, artistFromTitle: a } = cleanTrackTitle(track.title);
                    const singer = getFullSingerName(track.artist || a || 'Artist', t);
                    const isCurrent = currentTrack?.id === track.id;

                    return (
                      <div
                        key={`pop-album-${track.id}-${idx}`}
                        onClick={() => onPlayTrack(track)}
                        className="group relative p-3 rounded-xl bg-[#181818]/60 hover:bg-[#282828] transition-all duration-200 border border-white/5 cursor-pointer flex flex-col"
                      >
                        {/* Square Artwork */}
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black/60 shadow-lg mb-3">
                          <ArtworkImage
                            title={t}
                            artist={singer}
                            trackId={track.id}
                            initialSrc={track.thumbnail}
                            alt={t}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Floating Yellow Circular Play Button on Hover */}
                          <div className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-yellow-400 hover:bg-yellow-300 text-black flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-200 hover:scale-105 active:scale-95">
                            {isCurrent && isPlaying ? (
                              <Pause className="w-5 h-5 fill-black text-black" />
                            ) : (
                              <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                            )}
                          </div>
                        </div>

                        {/* Title & Artist */}
                        <h3 className={`text-sm font-bold truncate group-hover:underline ${isCurrent ? 'text-yellow-400' : 'text-white'}`}>
                          {t}
                        </h3>
                        <p className="text-xs text-white/60 truncate mt-1 group-hover:underline">
                          {singer}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Section: Featured Mixes & Trending */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Featured Mixes & Trending
                  </h2>
                  <button
                    onClick={handleShowAll}
                    className="text-xs font-bold text-white/60 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Show all
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {randomizedMixes.map((track, idx) => {
                    const { title: t, artistFromTitle: a } = cleanTrackTitle(track.title);
                    const singer = getFullSingerName(track.artist || a || 'Artist', t);
                    const isCurrent = currentTrack?.id === track.id;

                    return (
                      <div
                        key={`mix-card-${track.id}-${idx}`}
                        onClick={() => onPlayTrack(track)}
                        className="group relative p-3 rounded-xl bg-[#181818]/60 hover:bg-[#282828] transition-all duration-200 border border-white/5 cursor-pointer flex flex-col"
                      >
                        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-black/60 shadow-lg mb-3">
                          <ArtworkImage
                            title={t}
                            artist={singer}
                            trackId={track.id}
                            initialSrc={track.thumbnail}
                            alt={t}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-yellow-400 text-black flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-200">
                            <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                          </div>
                        </div>
                        <h3 className={`text-sm font-bold truncate group-hover:underline ${isCurrent ? 'text-yellow-400' : 'text-white'}`}>
                          {t}
                        </h3>
                        <p className="text-xs text-white/60 truncate mt-1">
                          Mix • {singer}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ── CENTER TRACK DETAILS & FULL SYNCHRONIZED LYRICS VIEW ── */
            displayTrack && (
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
                      <button
                        onClick={handleGoHome}
                        className="text-xs font-bold uppercase tracking-wider text-yellow-400 hover:underline flex items-center gap-1"
                      >
                        ← Home
                      </button>
                      <span className="text-white/40">•</span>
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

                {/* Action Controls Row */}
                <div className="px-6 sm:px-8 py-4 flex items-center gap-6 bg-[#121212] shrink-0 border-b border-white/5">
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

                  <button
                    onClick={() => onAddToQueue(displayTrack)}
                    className="w-9 h-9 rounded-full border border-white/30 hover:border-white text-white/70 hover:text-white flex items-center justify-center transition-colors"
                    title="Add to queue"
                  >
                    <Plus className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => onToggleFavorite(displayTrack)}
                    className={`w-9 h-9 rounded-full border border-white/30 hover:border-white flex items-center justify-center transition-colors ${
                      isCurrentFavorite ? 'text-yellow-400 border-yellow-400 fill-current' : 'text-white/70 hover:text-white'
                    }`}
                    title={isCurrentFavorite ? 'Remove from favorites' : 'Save to favorites'}
                  >
                    <Heart className={`w-5 h-5 ${isCurrentFavorite ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={() => setIsCinemaMode(true)}
                    className="w-9 h-9 rounded-full border border-white/30 hover:border-white text-white/70 hover:text-white flex items-center justify-center transition-colors"
                    title="Full-screen cinema poster view"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Synchronized Lyrics in Center */}
                <div className="px-6 sm:px-8 py-6 flex-1">
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
                </div>
              </>
            )
          )}
        </main>

        {/* ──────────────────────────────────────────────
            PANEL 3: RIGHT PANEL ("NOW PLAYING VIEW" / VIDEO & LYRICS PREVIEW CARD)
           ────────────────────────────────────────────── */}
        {isRightPanelOpen && currentTrack && (
          <aside className="w-80 lg:w-96 shrink-0 bg-[#121212] rounded-xl flex flex-col overflow-y-auto p-4 space-y-3.5 border border-white/5 hidden xl:flex no-scrollbar">
            {/* Header: Collection / Album Name + Options (Matching Screenshot) */}
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
                  {currentTrack.title.toLowerCase().includes('aashiqui')
                    ? 'Aashiqui 2'
                    : currentTrack.title.toLowerCase().includes('sanam teri')
                    ? 'Sanam Teri Kasam'
                    : cleanTrackTitle(currentTrack.title).title}
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

            {/* Video / Canvas Area (Embedded tall format matching Screenshot media_1794855698661_84aa5f08.jpg) */}
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-black shadow-xl relative border border-white/10 shrink-0">
              {videoSlot}
            </div>

            {/* Title & Artist with Share + Plus Action Buttons (Matching Screenshot) */}
            <div className="flex items-center justify-between pt-1 shrink-0">
              <div className="min-w-0 pr-2">
                <h4
                  onClick={() => setCenterViewMode('track_details')}
                  className="font-extrabold text-xl sm:text-2xl text-white tracking-tight truncate hover:underline cursor-pointer"
                >
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
                  onClick={() => onAddToQueue(currentTrack)}
                  className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  title="Add to queue"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dedicated Dark Teal Lyrics Preview Card matching screenshot media_1794855698661_84aa5f08.jpg */}
            <div
              onClick={() => setCenterViewMode('track_details')}
              className="rounded-2xl p-4 sm:p-5 flex flex-col justify-between bg-gradient-to-br from-[#0c3c37] to-[#042421] border border-white/10 shadow-lg cursor-pointer group hover:border-yellow-400/40 transition-all min-h-[160px]"
              title="Click to open synchronized lyrics in center stage"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-white font-bold text-sm tracking-wide">Lyrics preview</h3>
                  <span className="text-[11px] text-white/50 group-hover:text-yellow-400 font-semibold transition-colors">
                    Full lyrics →
                  </span>
                </div>
                <div className="space-y-1">
                  {lyricsPreviewLines.map((line, lIdx) => (
                    <p
                      key={lIdx}
                      className="text-white font-extrabold text-lg sm:text-xl leading-snug tracking-tight"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
              <div className="pt-2 text-[10px] text-white/40 font-mono flex items-center justify-between">
                <span>Synced with Apple & Deezer</span>
                <span className="text-yellow-400 font-bold group-hover:underline">Open</span>
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
