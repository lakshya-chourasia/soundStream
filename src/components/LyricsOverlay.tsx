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

        let parsedLines = data.syncedLyrics ? parseLrcLyrics(data.syncedLyrics) : [];
        // If exact LRC timestamps are not available but plain lyrics are, synthesize synchronized lines
        if (parsedLines.length === 0 && data.plainLyrics) {
          const lines = data.plainLyrics.split('\n').map((l: string) => l.trim()).filter(Boolean);
          if (lines.length > 0) {
            const totalDuration = currentTrack.durationSec || 220;
            const startTime = Math.min(15, totalDuration * 0.08);
            const endTime = Math.max(startTime + 10, totalDuration * 0.92);
            const step = (endTime - startTime) / lines.length;
            parsedLines = lines.map((text: string, i: number) => ({
              time: Math.round((startTime + i * step) * 10) / 10,
              text,
            }));
          }
        }

        const resultData: LyricsData = {
          track: data.track || title,
          artist: data.artist || displayArtist,
          plainLyrics: data.plainLyrics || null,
          syncedLyrics: data.syncedLyrics || null,
          parsedLines,
          instrumental: !!data.instrumental,
          notFound: !data.syncedLyrics && !data.plainLyrics && !data.instrumental,
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
    <div className="relative w-full h-full rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/15 overflow-hidden flex flex-col transition-all">
      {/* Top Header Bar */}
      <div className="relative z-10 px-5 py-3 border-b border-white/10 flex items-center justify-between gap-3 bg-black/60 backdrop-blur-xl">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15] shrink-0 animate-pulse" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/60 font-mono truncate">
              {hasSynced ? 'SYNCHRONIZED TRANSCRIPT' : lyricsData?.instrumental ? 'INSTRUMENTAL SESSION' : 'LYRICS TELEMETRY'}
            </h3>
          </div>
          <p className="text-sm font-black text-white truncate mt-0.5">
            {title} <span className="text-white/50 font-normal text-xs">/ {displayArtist}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {hasSynced && (
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase transition-all ${
                autoScroll
                  ? 'bg-yellow-400 text-black font-black shadow-[0_0_8px_rgba(250,204,21,0.4)]'
                  : 'bg-white/10 text-white/70 hover:text-white'
              }`}
              title={autoScroll ? 'Disable auto-scrolling' : 'Enable auto-scrolling'}
            >
              {autoScroll ? 'AUTO SCROLL' : 'MANUAL'}
            </button>
          )}

          {(lyricsData?.plainLyrics || hasSynced) && (
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              title="Copy lyrics to clipboard"
              aria-label="Copy lyrics"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
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
        className="relative z-10 flex-1 overflow-y-auto px-6 py-6 space-y-3 scroll-smooth no-scrollbar"
      >
        {isLoading ? (
          <div className="space-y-4 py-8 animate-pulse max-w-sm mx-auto text-center">
            <div className="h-5 bg-white/5 rounded w-3/4 mx-auto" />
            <div className="h-5 bg-white/5 rounded w-1/2 mx-auto" />
            <div className="h-5 bg-white/5 rounded w-2/3 mx-auto" />
            <div className="h-5 bg-white/5 rounded w-4/5 mx-auto" />
            <p className="text-xs text-white/40 pt-4 font-mono font-bold uppercase tracking-wider">Loading synchronized lyrics...</p>
          </div>
        ) : lyricsData?.instrumental ? (
          <div className="flex flex-col items-center justify-center text-center py-10 px-4 space-y-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 text-yellow-400 border border-white/10">
              <Music className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-white">Instrumental Session</h4>
            <p className="text-xs text-white/50 max-w-sm leading-relaxed">
              No vocal transcript for this audio signal. Pure acoustic and instrumental composition.
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
                  className={`group cursor-pointer py-1.5 px-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'scale-105 font-display font-black text-2xl sm:text-3xl py-3 my-2 text-yellow-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]'
                      : isPast
                      ? 'text-white/25 font-semibold text-base sm:text-lg hover:text-white/50'
                      : 'text-white/60 font-semibold text-base sm:text-lg hover:text-white'
                  }`}
                >
                  <p className="leading-snug select-none tracking-tight">{line.text}</p>
                  <span className="hidden group-hover:inline-block text-[10px] font-mono font-bold tracking-wider uppercase text-yellow-400/80 mt-1">
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
                  <p key={`line-${idx}-${lIdx}`} className="text-base font-medium text-white/80 leading-relaxed">
                    {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-12 px-4 space-y-3">
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 border border-white/10">
              <Music className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Lyrics Not Available</h4>
            <p className="text-xs text-white/40 max-w-xs">
              No synced transcript detected for this track.
            </p>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${title} ${displayArtist} lyrics`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-yellow-400 hover:underline pt-2 uppercase tracking-wider font-mono"
            >
              <span>Search Google Transcript</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Subtle bottom fade gradient */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
    </div>
  );
};
