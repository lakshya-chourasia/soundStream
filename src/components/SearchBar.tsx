import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Link2, Sparkles, Mic } from 'lucide-react';
import { extractYouTubeId } from '../utils/playerUtils';
import { useVoiceSearch } from '../hooks/useVoiceSearch';

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

  const {
    isListening: isVoiceListening,
    isSupported: isVoiceSupported,
    error: voiceError,
    toggleListening: toggleVoiceSearch,
    clearError: clearVoiceError,
  } = useVoiceSearch({
    onResult: (text, isFinal) => {
      setQuery(text);
      if (isFinal) {
        handleSubmit(text);
      }
    },
  });

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
      {/* Search Input Box */}
      <div className="relative">
        <div
          className={`relative flex items-center w-full px-4 py-2 rounded-full bg-black/60 backdrop-blur-xl border transition-all duration-200 ${
            isFocused
              ? 'border-yellow-400/80 ring-2 ring-yellow-400/20 shadow-[0_0_24px_rgba(250,204,21,0.25)]'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-yellow-400 animate-spin shrink-0 mr-3" />
          ) : (
            <Search className="w-4 h-4 text-white/50 shrink-0 mr-3" />
          )}

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={handleKeyDown}
            placeholder="Search catalog, artists, or paste YouTube link..."
            className="w-full bg-transparent text-sm font-semibold text-white placeholder:text-white/40 focus:outline-none"
            aria-label="Search YouTube music"
          />

          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              className="p-1 text-white/40 hover:text-white rounded-full transition-colors mr-1.5"
              aria-label="Clear search input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Voice Search Button */}
          <button
            type="button"
            onClick={toggleVoiceSearch}
            className={`p-1.5 rounded-full transition-all mr-1.5 shrink-0 cursor-pointer relative ${
              isVoiceListening
                ? 'bg-yellow-400/20 text-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.4)] animate-pulse'
                : 'text-white/40 hover:text-yellow-400 hover:bg-white/10'
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
            <Mic className={`w-4 h-4 ${isVoiceListening ? 'text-yellow-400 scale-110' : ''}`} />
            {isVoiceListening && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => handleSubmit(query)}
            disabled={!query.trim()}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-yellow-400 hover:bg-yellow-300 text-black disabled:opacity-40 rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer"
          >
            Search
          </button>
        </div>

        {/* Voice Search Error Alert */}
        {voiceError && (
          <div className="mt-2 p-2 px-3 bg-red-950/80 backdrop-blur-xl border border-red-500/30 rounded-xl flex items-center justify-between text-xs text-red-200 animate-in fade-in">
            <span>{voiceError}</span>
            <button
              type="button"
              onClick={clearVoiceError}
              className="text-red-300 hover:text-white p-0.5 cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Direct YouTube Link Detection Banner */}
        {directVideoId && query.includes('http') && (
          <div className="mt-2 p-3 bg-black/80 backdrop-blur-xl border border-yellow-400/30 rounded-xl flex items-center justify-between text-xs animate-in fade-in shadow-lg">
            <div className="flex items-center gap-2 truncate pr-2">
              <Link2 className="w-4 h-4 shrink-0 text-yellow-400" />
              <span className="truncate text-white/80 font-mono">Found YouTube Track: <strong className="text-yellow-300 font-mono">{directVideoId}</strong></span>
            </div>
            <button
              onClick={() => onDirectPlay(directVideoId)}
              className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider bg-yellow-400 hover:bg-yellow-300 text-black rounded-full transition-all whitespace-nowrap shrink-0"
            >
              Play
            </button>
          </div>
        )}

        {/* Autocomplete Dropdown */}
        {isFocused && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 py-1.5 bg-black/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden">
            {suggestions.map((item, idx) => (
              <button
                key={item}
                onMouseDown={() => {
                  setQuery(item);
                  handleSubmit(item);
                }}
                className={`w-full text-left px-4 py-2.5 text-xs md:text-sm font-semibold flex items-center justify-between transition-colors ${
                  idx === selectedIndex
                    ? 'bg-yellow-400/20 text-yellow-300 font-bold shadow-sm'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Search className={`w-3.5 h-3.5 shrink-0 ${idx === selectedIndex ? 'text-yellow-400' : 'text-white/40'}`} />
                  <span className="truncate">{item}</span>
                </div>
                <Sparkles className={`w-3.5 h-3.5 opacity-60 shrink-0 ${idx === selectedIndex ? 'text-yellow-400' : 'text-white/30'}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Genre shortcut filter tabs */}
      {onSelectGenre && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {GENRE_SHORTCUTS.map((g) => (
            <button
              key={g.id}
              onClick={() => onSelectGenre(g.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-full transition-all whitespace-nowrap shrink-0 font-mono ${
                activeGenre === g.id
                  ? 'bg-yellow-400 text-black font-black shadow-[0_0_12px_rgba(250,204,21,0.35)]'
                  : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20'
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
