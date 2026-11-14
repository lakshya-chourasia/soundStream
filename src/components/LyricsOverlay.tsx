import React, { useState, useEffect, useRef } from 'react';
import { Track, ThemeConfig, LyricLine, LyricsData } from '../types/player';
import { parseLrcLyrics, findActiveLyricIndex, cleanTrackTitle, formatTime } from '../utils/playerUtils';
import { X, Copy, Check, Sparkles, Music, ExternalLink, RefreshCw, Radio } from 'lucide-react';

interface LyricsOverlayProps {
  currentTrack: Track;
  currentTime: number;
  onSeek: (time: number) => void;
  themeConfig: ThemeConfig;
  onClose: () => void;
}

export const LyricsOverlay: React.FC<LyricsOverlayProps> = ({
  currentTrack,
  currentTime,
  onSeek,
  themeConfig,
  onClose,
}) => {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // In-memory cache to prevent redundant fetches
  const cacheRef = useRef<Map<string, LyricsData>>(new Map());
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  const { title, artistFromTitle } = cleanTrackTitle(currentTrack.title);
  const displayArtist = artistFromTitle || currentTrack.artist || 'YouTube Artist';

  // Fetch lyrics whenever track changes
  useEffect(() => {
    let isCancelled = false;

    const fetchLyrics = async () => {
      // Check cache first
      if (cacheRef.current.has(currentTrack.id)) {
        setLyricsData(cacheRef.current.get(currentTrack.id)!);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          track: title,
          artist: displayArtist,
          durationSec: (currentTrack.durationSec || 0).toString(),
        });

        const res = await fetch(`/api/lyrics?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch lyrics');
        const data = await res.json();

        if (isCancelled) return;

        const parsedLines = data.syncedLyrics ? parseLrcLyrics(data.syncedLyrics) : [];
        const resultData: LyricsData = {
          track: data.track || title,
          artist: data.artist || displayArtist,
          plainLyrics: data.plainLyrics || null,
          syncedLyrics: data.syncedLyrics || null,
          parsedLines,
          instrumental: !!data.instrumental,
          notFound: !!data.notFound,
        };

        cacheRef.current.set(currentTrack.id, resultData);
        setLyricsData(resultData);
      } catch (err) {
        if (!isCancelled) {
          const fallbackData: LyricsData = {
            track: title,
            artist: displayArtist,
            plainLyrics: null,
            syncedLyrics: null,
            parsedLines: [],
            instrumental: false,
            notFound: true,
          };
          setLyricsData(fallbackData);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchLyrics();

    return () => {
      isCancelled = true;
    };
  }, [currentTrack.id, title, displayArtist, currentTrack.durationSec]);

  // Determine current active synced lyric line
  const activeLineIndex =
    lyricsData?.parsedLines && lyricsData.parsedLines.length > 0
      ? findActiveLyricIndex(lyricsData.parsedLines, currentTime)
      : -1;

  // Auto-scroll active line into vertical center
  useEffect(() => {
    if (autoScroll && activeLineRef.current && lyricsContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeLineIndex, autoScroll]);

  const handleCopy = () => {
    const textToCopy =
      lyricsData?.plainLyrics ||
      lyricsData?.parsedLines?.map((l) => l.text).join('\n') ||
      '';
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const hasSynced = !!(lyricsData?.parsedLines && lyricsData.parsedLines.length > 0);

  return (
    <div className="relative w-full max-w-xl mx-auto my-3 h-80 sm:h-96 rounded-2xl bg-zinc-950/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col transition-all">
      {/* Ambient reactive gradient glow */}
      <div
        className="absolute top-0 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-15 pointer-events-none transition-opacity duration-700"
        style={{ backgroundColor: themeConfig.accent }}
      />

      {/* Top Header Bar */}
      <div className="relative z-10 px-5 py-3 border-b border-white/[0.08] flex items-center justify-between gap-3 bg-black/20">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: themeConfig.accent }}
            />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono truncate">
              {hasSynced ? 'Synchronized Lyrics' : lyricsData?.instrumental ? 'Track Note' : 'Song Lyrics'}
            </h3>
          </div>
          <p className="text-sm font-bold text-zinc-100 truncate mt-0.5">
            {title} <span className="text-zinc-500 font-normal text-xs">by {displayArtist}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasSynced && (
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
                autoScroll
                  ? 'border-white/20 text-zinc-200 bg-white/5'
                  : 'border-white/5 text-zinc-500 hover:text-zinc-300'
              }`}
              title={autoScroll ? 'Disable auto-scrolling' : 'Enable auto-scrolling'}
            >
              {autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
            </button>
          )}

          {(lyricsData?.plainLyrics || hasSynced) && (
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
              title="Copy lyrics to clipboard"
              aria-label="Copy lyrics"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors"
            title="Close lyrics view"
            aria-label="Close lyrics view"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Lyrics Content Area */}
      <div
        ref={lyricsContainerRef}
        className="relative z-10 flex-1 overflow-y-auto px-6 py-8 space-y-4 scroll-smooth"
        onWheel={() => {
          // If user scrolls manually while playing synced lyrics, keep autoScroll but allow inspection
        }}
      >
        {isLoading ? (
          /* Sleek pulsing skeleton lines */
          <div className="space-y-4 py-8 animate-pulse max-w-sm mx-auto text-center">
            <div className="h-4 bg-zinc-800/80 rounded w-3/4 mx-auto" />
            <div className="h-4 bg-zinc-800/60 rounded w-1/2 mx-auto" />
            <div className="h-4 bg-zinc-800/80 rounded w-2/3 mx-auto" />
            <div className="h-4 bg-zinc-800/50 rounded w-4/5 mx-auto" />
            <div className="h-4 bg-zinc-800/70 rounded w-1/2 mx-auto" />
            <p className="text-xs text-zinc-500 pt-4 font-mono">Fetching synchronized lyrics...</p>
          </div>
        ) : lyricsData?.instrumental ? (
          /* Instrumental Soundscape Notice */
          <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${themeConfig.accent}20` }}
            >
              <Music className="w-6 h-6" style={{ color: themeConfig.accent }} />
            </div>
            <h4 className="text-base font-semibold text-zinc-100">Instrumental Soundscape</h4>
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              This track is purely instrumental with no vocal lyrics. Immerse yourself in the ambient synths, rhythmic percussion, and textured acoustics.
            </p>
            <div className="flex items-center gap-1.5 pt-2 text-[11px] font-mono text-zinc-500">
              <Sparkles className="w-3.5 h-3.5" style={{ color: themeConfig.accent }} />
              <span>Enjoy the live audio visualizer</span>
            </div>
          </div>
        ) : hasSynced ? (
          /* Synchronized LRC Lyrics Display */
          <div className="space-y-3 py-6 text-center">
            {lyricsData!.parsedLines.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              const isPast = activeLineIndex >= 0 && idx < activeLineIndex;

              return (
                <div
                  key={`lyric-${idx}-${line.time}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek(line.time)}
                  className={`group cursor-pointer py-1.5 px-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'scale-105 font-bold text-lg sm:text-xl py-3 my-2'
                      : isPast
                      ? 'text-zinc-500 text-sm hover:text-zinc-300 hover:scale-101'
                      : 'text-zinc-400 text-sm hover:text-zinc-200 hover:scale-101'
                  }`}
                  style={
                    isActive
                      ? {
                          color: themeConfig.accent,
                          textShadow: `0 0 20px ${themeConfig.accent}40`,
                        }
                      : {}
                  }
                >
                  <p className="leading-relaxed select-none">{line.text}</p>
                  {/* Subtle timestamp cue on hover */}
                  <span className="hidden group-hover:inline-block text-[10px] font-mono text-zinc-500 opacity-60 mt-0.5">
                    jump to {formatTime(line.time)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : lyricsData?.plainLyrics ? (
          /* Plain Formatted Lyrics Display */
          <div className="py-4 text-center max-w-md mx-auto space-y-4">
            {lyricsData.plainLyrics.split(/\n\s*\n/).map((stanza, idx) => (
              <div key={`stanza-${idx}`} className="space-y-1">
                {stanza.split('\n').map((line, lIdx) => (
                  <p key={`line-${idx}-${lIdx}`} className="text-sm text-zinc-300 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : (
          /* Lyrics Not Found State */
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-zinc-500">
              <Music className="w-5 h-5 opacity-60" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-200">Lyrics Unavailable</h4>
            <p className="text-xs text-zinc-400 max-w-xs">
              No synced lyrics were found in the database for this specific track.
            </p>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${title} ${displayArtist} lyrics`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:underline pt-2"
              style={{ color: themeConfig.accent }}
            >
              <span>Search lyrics on Google</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Subtle bottom fade gradient */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent pointer-events-none" />
    </div>
  );
};
