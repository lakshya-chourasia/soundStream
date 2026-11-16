import React, { useState, useEffect, useRef } from 'react';
import { getArtwork, getCachedArtworkSync, DEFAULT_ARTWORK_FALLBACK } from '../services/artworkService';
import { Music } from 'lucide-react';

interface ArtworkImageProps {
  title: string;
  artist?: string;
  trackId?: string;
  initialSrc?: string;
  alt?: string;
  className?: string;
  aspectRatio?: 'square' | 'video';
  priority?: boolean;
  onArtworkLoaded?: (url: string) => void;
}

/**
 * High-Resolution Artwork Image Component with multi-tier API discovery (iTunes, Deezer, MusicBrainz),
 * instant L1/L2 caching, lazy loading, and loading skeleton.
 * 
 * Credit: Album artwork provided by Apple / iTunes Search API & Deezer Music
 */
export const ArtworkImage: React.FC<ArtworkImageProps> = ({
  title,
  artist = '',
  trackId,
  initialSrc,
  alt,
  className = '',
  priority = false,
  onArtworkLoaded,
}) => {
  // Synchronous cache lookup for instantaneous 0ms display on hover/navigation
  const cachedSyncUrl = getCachedArtworkSync(title, artist, trackId);
  const initialCandidate = cachedSyncUrl || initialSrc || '';

  const [src, setSrc] = useState<string>(initialCandidate);
  const [isLoading, setIsLoading] = useState<boolean>(!initialCandidate);
  const [isLoaded, setIsLoaded] = useState<boolean>(!!cachedSyncUrl);
  const [hasError, setHasError] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    let isCancelled = false;

    // Check synchronous cache first
    const syncHit = getCachedArtworkSync(title, artist, trackId);
    if (syncHit) {
      setSrc(syncHit);
      setIsLoading(false);
      onArtworkLoaded?.(syncHit);
      return;
    }

    // If initialSrc is already high-res 1200x1200bb or 600x600bb, we can use it directly
    if (initialSrc && (initialSrc.includes('1200x1200bb') || initialSrc.includes('600x600bb'))) {
      setSrc(initialSrc);
      setIsLoading(false);
      onArtworkLoaded?.(initialSrc);
      return;
    }

    if (!src) setIsLoading(true);
    setHasError(false);

    getArtwork(title, artist, trackId || initialSrc)
      .then((artUrl) => {
        if (!isCancelled) {
          const finalUrl = artUrl || initialSrc || DEFAULT_ARTWORK_FALLBACK;
          setSrc(finalUrl);
          setIsLoading(false);
          onArtworkLoaded?.(finalUrl);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          const fallback = initialSrc || DEFAULT_ARTWORK_FALLBACK;
          setSrc(fallback);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [title, artist, trackId, initialSrc, onArtworkLoaded]);

  return (
    <div
      className={`relative overflow-hidden bg-black/40 select-none ${className}`}
      title={`Album artwork: ${title} — ${artist} (Artwork via Apple / iTunes)`}
    >
      {/* Loading Skeleton Placeholder */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/5 animate-pulse">
          <Music className="w-5 h-5 text-white/20 animate-pulse" />
        </div>
      )}

      {/* Album Artwork Image */}
      {/* Credit: Album artwork provided by Apple / iTunes Search API */}
      <img
        ref={imgRef}
        src={hasError ? DEFAULT_ARTWORK_FALLBACK : src || DEFAULT_ARTWORK_FALLBACK}
        alt={alt || `${title} by ${artist} artwork`}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => {
          setIsLoaded(true);
          setIsLoading(false);
        }}
        onError={() => {
          if (!hasError && initialSrc && src !== initialSrc) {
            setSrc(initialSrc);
          } else {
            setHasError(true);
          }
          setIsLoading(false);
          setIsLoaded(true);
        }}
        className={`w-full h-full object-cover transition-all duration-500 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      />
    </div>
  );
};
