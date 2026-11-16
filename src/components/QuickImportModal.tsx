import React, { useState } from 'react';
import { X, Link2, Loader2, Play, Plus, Check } from 'lucide-react';
import { Track } from '../types/player';
import { extractYouTubeId } from '../utils/playerUtils';

interface QuickImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
}

export const QuickImportModal: React.FC<QuickImportModalProps> = ({
  isOpen,
  onClose,
  onPlayTrack,
  onAddToQueue,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedTrack, setResolvedTrack] = useState<Track | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  if (!isOpen) return null;

  const handleResolve = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    const videoId = extractYouTubeId(trimmed);
    if (!videoId) {
      setErrorMsg('Please enter a valid YouTube link or 11-character video ID.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setIsAdded(false);

    try {
      const res = await fetch(`/api/resolve?urlOrId=${encodeURIComponent(videoId)}`);
      if (!res.ok) {
        throw new Error('Unable to resolve video details.');
      }
      const data = await res.json();
      setResolvedTrack({
        id: data.id,
        title: data.title,
        artist: data.artist,
        duration: data.duration || 'YouTube Track',
        durationSec: 0,
        thumbnail: data.thumbnail,
      });
    } catch {
      // Direct fallback
      setResolvedTrack({
        id: videoId,
        title: 'YouTube Track',
        artist: 'YouTube',
        duration: 'YouTube Track',
        durationSec: 0,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayNow = () => {
    if (!resolvedTrack) return;
    onPlayTrack(resolvedTrack);
    onClose();
  };

  const handleQueue = () => {
    if (!resolvedTrack) return;
    onAddToQueue(resolvedTrack);
    setIsAdded(true);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in select-none">
      <div className="relative w-full max-w-md bg-[#121214] border border-white/15 rounded-3xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-white" />
            <h3 className="text-base font-bold text-white">
              Import Track
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
          Enter YouTube URL or video ID:
        </p>

        {/* Input */}
        <form onSubmit={handleResolve} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              autoFocus
              className="flex-1 px-4 py-2 text-xs font-medium bg-[#18181b] border border-white/10 rounded-full text-white placeholder:text-zinc-500 focus:outline-none focus:border-white/40"
            />
            <button
              type="submit"
              disabled={isLoading || !inputVal.trim()}
              className="px-4 py-2 text-xs font-semibold bg-white text-black hover:bg-zinc-200 rounded-full disabled:opacity-40 transition-colors whitespace-nowrap flex items-center gap-1.5"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Resolve</span>
            </button>
          </div>

          {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
        </form>

        {/* Resolved Preview Card */}
        {resolvedTrack && (
          <div className="p-3.5 bg-[#18181b] border border-white/10 rounded-2xl space-y-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <img
                src={resolvedTrack.thumbnail}
                alt={resolvedTrack.title}
                referrerPolicy="no-referrer"
                className="w-13 h-13 rounded-xl object-cover shrink-0 border border-white/10"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate">
                  {resolvedTrack.title}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  {resolvedTrack.artist}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handlePlayNow}
                className="flex-1 py-2 px-3 text-xs font-semibold bg-white text-black hover:bg-zinc-200 rounded-full flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>Play Now</span>
              </button>

              <button
                onClick={handleQueue}
                disabled={isAdded}
                className="py-2 px-3 text-xs font-semibold bg-white/10 hover:bg-white/15 text-white rounded-full flex items-center gap-1.5 transition-colors"
              >
                {isAdded ? <Check className="w-3.5 h-3.5 text-white" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{isAdded ? 'Added' : 'Queue'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
