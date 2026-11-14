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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Add YouTube Track
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          Paste any YouTube song link, short URL, or video ID to play directly without leaving the app.
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
              className="flex-1 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputVal.trim()}
              className="px-4 py-2 text-xs font-semibold text-zinc-950 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity whitespace-nowrap flex items-center gap-1.5"
              style={{ backgroundColor: 'var(--theme-accent, #f59e0b)' }}
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Inspect</span>
            </button>
          </div>

          {errorMsg && <p className="text-xs text-rose-500">{errorMsg}</p>}
        </form>

        {/* Resolved Preview Card */}
        {resolvedTrack && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <img
                src={resolvedTrack.thumbnail}
                alt={resolvedTrack.title}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  {resolvedTrack.title}
                </h4>
                <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                  {resolvedTrack.artist}
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={handlePlayNow}
                className="flex-1 py-1.5 px-3 text-xs font-semibold text-zinc-950 rounded-lg flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--theme-accent, #f59e0b)' }}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play Now</span>
              </button>

              <button
                onClick={handleQueue}
                disabled={isAdded}
                className="py-1.5 px-3 text-xs font-medium bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                {isAdded ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{isAdded ? 'Added' : 'Add to Queue'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
