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

  // Fetch suggestions with 180ms debounce
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
      {/* Search Input Box (Uiverse Telemetry Field with Ambient Cyan/Pink Glow) */}
      <div className="relative">
        <div
          className={`relative flex items-center w-full px-4 py-2 rounded-full glass-panel transition-all duration-200 ${
            isFocused
              ? 'border-pink-500/60 ring-2 ring-pink-500/20 shadow-[0_0_24px_rgba(236,72,153,0.3)]'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0 mr-3" />
          ) : (
            <Search className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
          )}

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Search catalog, artists, or paste YouTube link..."
            className="w-full bg-transparent text-sm font-semibold text-[#f4f5f8] placeholder:text-slate-500 focus:outline-none"
            aria-label="Search YouTube music"
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              className="p-1 text-slate-400 hover:text-white rounded-full transition-colors mr-1.5"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => handleSubmit(query)}
            disabled={!query.trim()}
            className="px-4 py-1.5 text-xs font-black uppercase tracking-wider glass-aether-button disabled:opacity-40 rounded-full transition-all whitespace-nowrap shrink-0"
          >
            Search
          </button>
        </div>

        {/* Direct YouTube Link Detection Banner */}
        {directVideoId && query.includes('http') && (
          <div className="mt-2 p-3 glass-panel border-pink-500/30 rounded-xl flex items-center justify-between text-xs animate-in fade-in shadow-lg">
            <div className="flex items-center gap-2 truncate pr-2">
              <Link2 className="w-4 h-4 shrink-0 text-pink-400" />
              <span className="truncate text-slate-300 font-mono">DETECTED YOUTUBE ID: <strong className="text-cyan-300 font-mono">{directVideoId}</strong></span>
            </div>
            <button
              onClick={() => onDirectPlay(directVideoId)}
              className="px-3.5 py-1.5 text-xs font-black uppercase tracking-wider glass-aether-button rounded-full transition-all whitespace-nowrap shrink-0"
            >
              Play Video
            </button>
          </div>
        )}

        {/* Autocomplete Dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 py-1.5 glass-panel border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {suggestions.map((item, idx) => (
              <button
                key={item}
                onMouseDown={() => {
                  setQuery(item);
                  handleSubmit(item);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs md:text-sm font-semibold flex items-center justify-between transition-colors ${
                  idx === selectedIndex
                    ? 'bg-gradient-to-r from-cyan-500/80 to-pink-500/80 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Search className={`w-3.5 h-3.5 shrink-0 ${idx === selectedIndex ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item}</span>
                </div>
                <Sparkles className={`w-3.5 h-3.5 opacity-60 shrink-0 ${idx === selectedIndex ? 'text-amber-300' : 'text-pink-400'}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Genre shortcut filter tabs (Aether Telemetry Chips) */}
      {onSelectGenre && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-500 shrink-0 mr-1 hidden sm:inline">ARCHIVE //</span>
          {GENRE_SHORTCUTS.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelectGenre(g.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 font-mono ${
                activeGenre === g.id
                  ? 'bg-gradient-to-r from-cyan-500 via-pink-500 to-amber-400 text-white font-black shadow-[0_0_12px_rgba(236,72,153,0.5)] border border-white/20'
                  : 'glass-pill text-slate-300 hover:text-white'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
