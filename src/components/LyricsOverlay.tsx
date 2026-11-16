import React, { useState, useEffect, useRef } from 'react';
import { Track, ThemeConfig, LyricsData } from '../types/player';
import { parseLrcLyrics, findActiveLyricIndex, cleanTrackTitle, formatTime } from '../utils/playerUtils';
import { X, Copy, Check, Music, ExternalLink } from 'lucide-react';

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
    <div className="relative w-full max-w-xl mx-auto my-3 h-80 sm:h-96 rounded-2xl glass-panel shadow-[0_0_55px_rgba(0,0,0,0.95)] border border-white/10 overflow-hidden flex flex-col transition-all">
      {/* Top Header Bar */}
      <div className="relative z-10 px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3 bg-black/50 backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-pink-500 shadow-[0_0_8px_#ec4899] shrink-0" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 font-mono truncate">
              {hasSynced ? 'UIVERSE AETHER // SYNCHRONIZED TRANSCRIPT' : lyricsData?.instrumental ? 'INSTRUMENTAL SESSION' : 'LYRICS TELEMETRY'}
            </h3>
          </div>
          <p className="text-sm font-black text-white truncate mt-0.5">
            {title} <span className="font-serif italic text-pink-300 font-normal text-xs">/ {displayArtist}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {hasSynced && (
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-3 py-1 rounded-full text-[11px] font-mono font-black tracking-wider uppercase transition-all ${
                autoScroll
                  ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)] border border-white/20'
                  : 'glass-pill text-slate-300 hover:text-white'
              }`}
              title={autoScroll ? 'Disable auto-scrolling' : 'Enable auto-scrolling'}
            >
              {autoScroll ? 'AUTO SCROLL' : 'MANUAL'}
            </button>
          )}

          {(lyricsData?.plainLyrics || hasSynced) && (
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-full text-slate-400 hover:text-pink-300 hover:bg-white/5 transition-colors"
              title="Copy lyrics to clipboard"
              aria-label="Copy lyrics"
            >
              {isCopied ? <Check className="w-4 h-4 text-cyan-400" /> : <Copy className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
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
      >
        {isLoading ? (
          <div className="space-y-4 py-8 animate-pulse max-w-sm mx-auto text-center">
            <div className="h-5 bg-white/5 rounded w-3/4 mx-auto" />
            <div className="h-5 bg-white/5 rounded w-1/2 mx-auto" />
            <div className="h-5 bg-white/5 rounded w-2/3 mx-auto" />
            <div className="h-5 bg-white/5 rounded w-4/5 mx-auto" />
            <p className="text-xs text-slate-400 pt-4 font-mono font-bold uppercase tracking-wider">Decompressing telemetry stream...</p>
          </div>
        ) : lyricsData?.instrumental ? (
          <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 text-pink-400 border border-white/10 shadow-inner">
              <Music className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-white">Instrumental Session</h4>
            <p className="text-xs font-serif italic text-slate-300 max-w-sm leading-relaxed">
              No vocal modulation cataloged for this signal. Pure acoustic and synthesised refraction.
            </p>
          </div>
        ) : hasSynced ? (
          <div className="space-y-3 py-6 text-center">
            {lyricsData!.parsedLines.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              const isPast = activeLineIndex >= 0 && idx < activeLineIndex;

              return (
                <div
                  key={`lyric-${idx}-${line.time}`}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek(line.time)}
                  className={`group cursor-pointer py-1.5 px-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'scale-105 font-black text-2xl sm:text-3xl py-4 my-2 bg-gradient-to-r from-cyan-300 via-pink-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]'
                      : isPast
                      ? 'text-slate-600 font-bold text-base sm:text-lg hover:text-slate-400'
                      : 'text-slate-400 font-bold text-base sm:text-lg hover:text-white'
                  }`}
                >
                  <p className="leading-snug select-none tracking-tight">{line.text}</p>
                  <span className="hidden group-hover:inline-block text-[10px] font-mono font-bold tracking-wider uppercase text-pink-400/80 mt-1">
                    SEEK • {formatTime(line.time)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : lyricsData?.plainLyrics ? (
          <div className="py-4 text-center max-w-md mx-auto space-y-4">
            {lyricsData.plainLyrics.split(/\n\s*\n/).map((stanza, idx) => (
              <div key={`stanza-${idx}`} className="space-y-1.5">
                {stanza.split('\n').map((line, lIdx) => (
                  <p key={`line-${idx}-${lIdx}`} className="text-base font-medium text-slate-200 leading-relaxed font-serif">
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-3">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 border border-white/10">
              <Music className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Lyrics Not Cataloged</h4>
            <p className="text-xs font-serif italic text-slate-400 max-w-xs">
              No synced LRC modulation detected for this track identifier.
            </p>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${title} ${displayArtist} lyrics`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 hover:underline pt-2 uppercase tracking-wider font-mono"
            >
              <span>Search Google Transcript</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Subtle bottom fade gradient */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#08090c] to-transparent pointer-events-none" />
    </div>
  );
};
