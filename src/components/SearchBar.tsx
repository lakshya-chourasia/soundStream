import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Link2, Sparkles } from 'lucide-react';
import { extractYouTubeId } from '../utils/playerUtils';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onDirectPlay: (urlOrId: string) => void;
  isLoading?: boolean;
  activeGenre?: string | null;
  onSelectGenre?: (genreId: string) => void;
}

const GENRE_SHORTCUTS = [
  { id: 'lofi', label: 'Lofi Chill' },
  { id: 'synthwave', label: 'Synthwave' },
  { id: 'acoustic', label: 'Acoustic Folk' },
  { id: 'ambient', label: 'Ambient Sleep' },
  { id: 'jazz', label: 'Japanese Jazz' },
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onDirectPlay,
  isLoading = false,
  activeGenre = null,
  onSelectGenre,
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [directVideoId, setDirectVideoId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceTimerRef = useRef<any>(null);

  // Check if current input looks like a YouTube URL or direct ID
  useEffect(() => {
    const id = extractYouTubeId(query);
    setDirectVideoId(id);
  }, [query]);

  // Fetch suggestions with 200ms debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || directVideoId) {
      setSuggestions([]);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch {
        setSuggestions([]);
      }
    }, 180);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, directVideoId]);

  const handleSubmit = (searchVal: string) => {
    const val = searchVal.trim();
    if (!val) return;

    const possibleId = extractYouTubeId(val);
    if (possibleId && (val.includes('youtube.com') || val.includes('youtu.be'))) {
      onDirectPlay(possibleId);
    } else {
      onSearch(val);
    }
    setSuggestions([]);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        setQuery(suggestions[selectedIndex]);
        handleSubmit(suggestions[selectedIndex]);
      } else {
        handleSubmit(query);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setIsFocused(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3" ref={containerRef}>
      {/* Search Input Box */}
      <div className="relative">
        <div
          className={`relative flex items-center w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border transition-all ${
            isFocused
              ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-sm'
              : 'border-zinc-200 dark:border-zinc-800'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-amber-500 animate-spin shrink-0 mr-2.5" />
          ) : (
            <Search className="w-4 h-4 text-zinc-400 shrink-0 mr-2.5" />
          )}

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Search YouTube songs, artists, or paste a link..."
            className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            aria-label="Search YouTube music"
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md transition-colors mr-1"
              aria-label="Clear search input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => handleSubmit(query)}
            disabled={!query.trim()}
            className="px-3 py-1 text-xs font-medium text-zinc-950 disabled:opacity-40 rounded-lg transition-colors whitespace-nowrap shrink-0"
            style={{ backgroundColor: 'var(--theme-accent, #f59e0b)' }}
          >
            Search
          </button>
        </div>

        {/* Direct YouTube Link Detection Banner */}
        {directVideoId && query.includes('http') && (
          <div className="mt-2 p-2.5 bg-white/5 border border-white/10 rounded-lg flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2 truncate pr-2">
              <Link2 className="w-4 h-4 shrink-0" style={{ color: 'var(--theme-accent, #f59e0b)' }} />
              <span className="truncate">Detected YouTube Video ID: <strong>{directVideoId}</strong></span>
            </div>
            <button
              onClick={() => onDirectPlay(directVideoId)}
              className="px-2.5 py-1 text-xs font-semibold text-zinc-950 rounded hover:opacity-90 transition-opacity whitespace-nowrap shrink-0"
              style={{ backgroundColor: 'var(--theme-accent, #f59e0b)' }}
            >
              Play Video
            </button>
          </div>
        )}

        {/* Autocomplete Dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden">
            {suggestions.map((item, idx) => (
              <button
                key={item}
                onMouseDown={() => {
                  setQuery(item);
                  handleSubmit(item);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs md:text-sm flex items-center justify-between transition-colors ${
                  idx === selectedIndex
                    ? 'bg-white/10 font-medium'
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                }`}
                style={idx === selectedIndex ? { color: 'var(--theme-accent, #f59e0b)' } : {}}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
                <Sparkles className="w-3 h-3 opacity-60 shrink-0" style={{ color: 'var(--theme-accent, #f59e0b)' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Genre shortcut filter tabs */}
      {onSelectGenre && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
          <span className="text-xs font-medium text-zinc-400 shrink-0 mr-1 hidden sm:inline">Vibes:</span>
          {GENRE_SHORTCUTS.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelectGenre(g.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                activeGenre === g.id
                  ? 'text-zinc-950 shadow-sm font-semibold'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 border border-zinc-200/60 dark:border-zinc-800'
              }`}
              style={activeGenre === g.id ? { backgroundColor: 'var(--theme-accent, #f59e0b)' } : {}}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
