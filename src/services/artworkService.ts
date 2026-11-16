/**
 * Ultra-Fast Multi-Tier Album Artwork Service via free Apple / iTunes Search API
 * 
 * Multi-Tier Caching Architecture:
 * 1. L1 Memory Cache: 0ms instant synchronous Map lookup.
 * 2. In-Flight Request Coalescing: Deduplicates concurrent requests for the same track.
 * 3. L2 IndexedDB Store: High-capacity persistent asynchronous storage with 30-day TTL.
 * 4. L2 LocalStorage Fallback: Resilient storage for environments where IndexedDB is blocked.
 * 5. Image Byte Pre-decoding: Pre-decodes image textures in browser cache for 0ms visual render.
 * 6. Rate Limiting: Minimum 3000ms request spacing (~20 calls/min) with exponential backoff on 429/403.
 * 
 * Credit: Album artwork provided by Apple / iTunes Search API
 */

export const DEFAULT_ARTWORK_FALLBACK =
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';

const LOCAL_STORAGE_KEY = 'soundstream_artwork_v4';
const INDEXED_DB_NAME = 'soundstream_artwork_db';
const INDEXED_DB_STORE = 'artworks';
const INDEXED_DB_VERSION = 1;
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 Days Cache TTL
const MAX_REQUESTS_PER_MINUTE = 20;
const MIN_INTERVAL_MS = Math.ceil(60000 / MAX_REQUESTS_PER_MINUTE); // ~3000ms
const MAX_RETRIES = 3;

// Cache entry record
interface CacheRecord {
  url: string;
  timestamp: number;
  hits: number;
  trackTitle?: string;
  artistName?: string;
}

// L1: In-memory cache
const memoryCache = new Map<string, CacheRecord>();

// In-Flight Promise Map (Single-Flight Deduplication)
const inFlightRequests = new Map<string, Promise<string>>();

// Cache statistics
let totalHits = 0;
let totalMisses = 0;

/* ─────────────────────────────────────────────────────────────
   L2 CACHING: INDEXEDDB PERSISTENCE (High Capacity, Non-blocking)
───────────────────────────────────────────────────────────── */
let dbPromise: Promise<IDBDatabase | null> | null = null;

function getIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = window.indexedDB.open(INDEXED_DB_NAME, INDEXED_DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(INDEXED_DB_STORE)) {
            db.createObjectStore(INDEXED_DB_STORE, { keyPath: 'key' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => {
          console.warn('[ArtworkCache] IndexedDB open error, falling back to localStorage');
          resolve(null);
        };
      } catch (err) {
        console.warn('[ArtworkCache] IndexedDB init exception:', err);
        resolve(null);
      }
    });
  }
  return dbPromise;
}

async function getFromIndexedDB(key: string): Promise<string | null> {
  try {
    const db = await getIndexedDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(INDEXED_DB_STORE, 'readonly');
        const store = tx.objectStore(INDEXED_DB_STORE);
        const req = store.get(key);
        req.onsuccess = () => {
          const record: (CacheRecord & { key: string }) | undefined = req.result;
          if (record && record.url) {
            // Check TTL expiration (30 days)
            if (Date.now() - record.timestamp < TTL_MS) {
              resolve(record.url);
              return;
            }
          }
          resolve(null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

async function saveToIndexedDB(key: string, url: string, title?: string, artist?: string): Promise<void> {
  try {
    const db = await getIndexedDB();
    if (!db) return;

    const tx = db.transaction(INDEXED_DB_STORE, 'readwrite');
    const store = tx.objectStore(INDEXED_DB_STORE);
    store.put({
      key,
      url,
      timestamp: Date.now(),
      hits: 1,
      trackTitle: title,
      artistName: artist,
    });
  } catch (err) {
    // Non-fatal, memory & localStorage handle fallback
  }
}

/* ─────────────────────────────────────────────────────────────
   L2 CACHING: LOCALSTORAGE SYNC & HYDRATION
───────────────────────────────────────────────────────────── */
function initHydrateCache(): void {
  if (typeof window === 'undefined') return;

  // 1. Synchronously hydrate from localStorage for 0ms initial paint
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed: Record<string, CacheRecord | string> = JSON.parse(stored);
      Object.entries(parsed).forEach(([k, val]) => {
        const record: CacheRecord =
          typeof val === 'string'
            ? { url: val, timestamp: Date.now(), hits: 1 }
            : val;

        if (Date.now() - record.timestamp < TTL_MS) {
          memoryCache.set(k.toLowerCase(), record);
        }
      });
    }
  } catch (err) {
    console.warn('[ArtworkCache] Could not read localStorage cache:', err);
  }

  // 2. Asynchronously load all persisted records from IndexedDB into memoryCache
  getIndexDBRecords().then((records) => {
    records.forEach(({ key, url, timestamp, hits }) => {
      if (url && (!memoryCache.has(key) || (memoryCache.get(key)?.hits || 0) < hits)) {
        memoryCache.set(key.toLowerCase(), { url, timestamp, hits });
      }
    });
  });
}
initHydrateCache();

async function getIndexDBRecords(): Promise<Array<{ key: string; url: string; timestamp: number; hits: number }>> {
  try {
    const db = await getIndexedDB();
    if (!db) return [];

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(INDEXED_DB_STORE, 'readonly');
        const store = tx.objectStore(INDEXED_DB_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  } catch {
    return [];
  }
}

// Debounced flush of memoryCache to localStorage (keeps top 500 items)
let persistTimer: any = null;
function persistToLocalStorage(): void {
  if (typeof window === 'undefined') return;
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try {
      const obj: Record<string, CacheRecord> = {};
      const sortedEntries = Array.from(memoryCache.entries())
        .sort((a, b) => b[1].hits - a[1].hits)
        .slice(0, 500);

      sortedEntries.forEach(([k, v]) => {
        obj[k] = v;
      });
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(obj));
    } catch (err) {
      console.warn('[ArtworkCache] LocalStorage sync warning:', err);
    }
  }, 1000);
}

/* ─────────────────────────────────────────────────────────────
   L3 BROWSER PRE-DECODING (Zero Visual Glitch)
───────────────────────────────────────────────────────────── */
function preDecodeImage(url: string): void {
  if (typeof window === 'undefined' || !url || url.startsWith('data:')) return;
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    if (typeof img.decode === 'function') {
      img.decode().catch(() => {});
    }
  } catch {}
}

/* ─────────────────────────────────────────────────────────────
   SEARCH TITLE & ARTIST STRING NORMALIZERS
───────────────────────────────────────────────────────────── */
export function cleanTitleForSearch(rawTitle: string): string {
  if (!rawTitle) return '';
  return rawTitle
    .replace(/\s*[\(\[]\s*(?:official\s*(?:music\s*)?)?(?:video|audio|lyric\s*video|hd|4k|remaster(?:ed)?(?:\s*\d+)?|visualizer|lyrics?|extended\s*mix)\s*[\)\]]/gi, '')
    .replace(/\s*\|.*$/, '')
    .replace(/\s*-\s*official\s*(?:music\s*)?video/gi, '')
    .replace(/\s*ft\.?.*$/i, '')
    .replace(/\s*feat\.?.*$/i, '')
    .trim();
}

export function cleanArtistForSearch(rawArtist: string): string {
  if (!rawArtist) return '';

  // 1. Check for stage/band moniker inside parentheses (e.g. "Christopher Comstock (Marshmello)" -> "Marshmello")
  const monikerMatch = rawArtist.match(/\(([^)]+)\)/);
  if (monikerMatch && monikerMatch[1].trim()) {
    const moniker = monikerMatch[1].trim();
    // Exclude record labels, publisher tags, and technical annotations
    const isExcluded = /(?:records?|entertainment|label|sony|warner|universal|music|ent|prod|topic|official|remaster|deluxe|live|audio|video|explicit|version)/i.test(moniker);
    if (!isExcluded) {
      return moniker;
    }
  }

  // 2. Known singer real-name aliases for streaming catalog lookups
  const lower = rawArtist.trim().toLowerCase();
  if (lower.includes('edward christopher sheeran')) return 'Ed Sheeran';
  if (lower.includes('harry edward styles')) return 'Harry Styles';
  if (lower.includes('adele adkins')) return 'Adele';
  if (lower.includes('austin richard post')) return 'Post Malone';

  return rawArtist
    .replace(/ - Topic$/i, '')
    .replace(/VEVO$/i, '')
    .replace(/Official$/i, '')
    .replace(/\s*[\(\[].*?[\)\]]/g, '')
    .trim();
}

function stringSimilarity(s1: string, s2: string): number {
  const norm1 = s1.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const norm2 = s2.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.85;

  const words1 = new Set(norm1.split(/\s+/));
  const words2 = new Set(norm2.split(/\s+/));
  let intersection = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersection++;
  });

  const union = new Set([...words1, ...words2]).size;
  return union > 0 ? intersection / union : 0;
}

/* ─────────────────────────────────────────────────────────────
   RATE-LIMITED QUEUE WITH RETRY & EXPONENTIAL BACKOFF
───────────────────────────────────────────────────────────── */
interface QueuedRequest {
  fn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

const requestQueue: QueuedRequest[] = [];
let isProcessingQueue = false;
let lastRequestTime = 0;

async function processQueue(): Promise<void> {
  if (isProcessingQueue || requestQueue.length === 0) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const item = requestQueue.shift();
    if (!item) break;

    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < MIN_INTERVAL_MS) {
      await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
    }
    lastRequestTime = Date.now();

    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (err) {
      item.reject(err);
    }
  }

  isProcessingQueue = false;
}

function enqueueRequest<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    requestQueue.push({ fn, resolve, reject });
    processQueue();
  });
}

async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status === 403) {
        if (attempt === retries) throw new Error(`iTunes rate limit exceeded (HTTP ${res.status})`);
        const delay = Math.pow(2, attempt) * 1500;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      if (!res.ok) {
        throw new Error(`iTunes returned HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/* ─────────────────────────────────────────────────────────────
   MAIN REUSABLE GETARTWORK FUNCTION (Coalesced, Multi-Tier Cached)
───────────────────────────────────────────────────────────── */
/**
 * Discover and fetch studio high-resolution artwork via Apple iTunes Search API
 * with 3-tier caching (L1 Memory, L2 IndexedDB/localStorage), single-flight deduplication,
 * rate limiting, and resolution upgrading.
 * 
 * @param title Track song title
 * @param artist Artist name
 * @param trackId Optional unique track ID or fallback thumbnail
 * @returns High-resolution 600x600bb (or 1000x1000bb) studio artwork URL
 */
export async function getArtwork(
  title: string,
  artist: string,
  trackId?: string
): Promise<string> {
  const cleanT = cleanTitleForSearch(title);
  const cleanA = cleanArtistForSearch(artist);

  const titleArtistKey = `${cleanT}::${cleanA}`.toLowerCase();
  const trackIdKey = trackId ? `id::${trackId}`.toLowerCase() : null;

  // 1. Check L1 Memory Cache (0ms synchronous lookup)
  if (cleanT && memoryCache.has(titleArtistKey)) {
    const record = memoryCache.get(titleArtistKey)!;
    record.hits++;
    totalHits++;
    preDecodeImage(record.url);
    return record.url;
  }
  if (trackIdKey && memoryCache.has(trackIdKey)) {
    const record = memoryCache.get(trackIdKey)!;
    record.hits++;
    totalHits++;
    preDecodeImage(record.url);
    return record.url;
  }

  // 2. Check L2 IndexedDB Storage (Asynchronous cache check before dispatching network request)
  if (cleanT) {
    const idbUrl = await getFromIndexedDB(titleArtistKey);
    if (idbUrl) {
      memoryCache.set(titleArtistKey, { url: idbUrl, timestamp: Date.now(), hits: 1 });
      totalHits++;
      preDecodeImage(idbUrl);
      return idbUrl;
    }
  }

  // Fallback candidate if network lookup fails
  const localFallback =
    trackId && trackId.startsWith('http')
      ? trackId
      : trackId
      ? `https://i.ytimg.com/vi/${trackId}/hqdefault.jpg`
      : DEFAULT_ARTWORK_FALLBACK;

  if (!cleanT) return localFallback;

  // 3. Single-Flight In-Flight Request Coalescing
  // If this exact track is already being fetched, reuse the in-flight Promise!
  if (inFlightRequests.has(titleArtistKey)) {
    return inFlightRequests.get(titleArtistKey)!;
  }

  totalMisses++;

  const requestPromise = (async () => {
    try {
      let matchedArtwork: string | null = null;

      // Source 1: Apple iTunes Search API (Free, high-res 600x600 studio art)
      try {
        const query = `${cleanT} ${cleanA}`.trim();
        const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=1`;

        const data = await enqueueRequest(() => fetchWithRetry(searchUrl));

        if (data && data.results && data.results.length > 0) {
          const top = data.results[0];
          const itunesArtist = top.artistName || '';
          const similarity = stringSimilarity(cleanA, itunesArtist);

          if (similarity >= 0.35 || !cleanA || cleanA.toLowerCase().includes('unknown')) {
            matchedArtwork = top.artworkUrl100 || null;
          } else {
            // Fuzzy match fallback with limit=5
            const broaderUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanT)}&media=music&entity=song&limit=5`;
            try {
              const broaderData = await enqueueRequest(() => fetchWithRetry(broaderUrl));
              if (broaderData && broaderData.results && broaderData.results.length > 0) {
                let bestScore = -1;
                let bestResult = broaderData.results[0];

                for (const r of broaderData.results) {
                  const score = stringSimilarity(cleanA, r.artistName || '');
                  if (score > bestScore) {
                    bestScore = score;
                    bestResult = r;
                  }
                }
                matchedArtwork = bestResult.artworkUrl100 || null;
              }
            } catch {
              matchedArtwork = top.artworkUrl100 || null;
            }
          }
        }
      } catch (itunesErr) {
        console.warn(`[ArtworkService] iTunes search attempt failed for "${cleanT}":`, itunesErr);
      }

      // Source 2: Deezer Public Music API & Backend Proxy (Free lossless 1000x1000 cover_xl)
      if (!matchedArtwork) {
        try {
          const proxyUrl = `/api/highres-artwork?track=${encodeURIComponent(cleanT)}&artist=${encodeURIComponent(cleanA)}&videoId=${encodeURIComponent(trackId || '')}`;
          const proxyRes = await fetch(proxyUrl);
          if (proxyRes.ok) {
            const proxyData = await proxyRes.json();
            if (proxyData.artworkUrl) {
              matchedArtwork = proxyData.artworkUrl;
            }
          }
        } catch (deezerErr) {
          console.warn(`[ArtworkService] Deezer/proxy search failed for "${cleanT}":`, deezerErr);
        }
      }

      // Source 3: MusicBrainz / Cover Art Archive (Open source catalog)
      if (!matchedArtwork) {
        try {
          const mbUrl = `https://musicbrainz.org/ws/2/recording/?query=recording:${encodeURIComponent(cleanT)}+artist:${encodeURIComponent(cleanA)}&fmt=json&limit=1`;
          const mbRes = await fetch(mbUrl, {
            headers: { 'User-Agent': 'SoundStream/2.0 (music@soundstream.app)' },
          });
          if (mbRes.ok) {
            const mbData = await mbRes.json();
            const release = mbData.recordings?.[0]?.releases?.[0];
            if (release && release.id) {
              matchedArtwork = `https://coverartarchive.org/release/${release.id}/front-500.jpg`;
            }
          }
        } catch {}
      }

      if (matchedArtwork) {
        // Upgrade iTunes resolution from 100x100 to 600x600bb if applicable
        const highRes = matchedArtwork.includes('100x100bb')
          ? matchedArtwork.replace(/\/\d+x\d+bb\./, '/600x600bb.')
          : matchedArtwork;

        const record: CacheRecord = {
          url: highRes,
          timestamp: Date.now(),
          hits: 1,
          trackTitle: title,
          artistName: artist,
        };

        // Cache into L1 Memory Cache
        memoryCache.set(titleArtistKey, record);
        if (trackIdKey) memoryCache.set(trackIdKey, record);

        // Persist to L2 IndexedDB and LocalStorage
        saveToIndexedDB(titleArtistKey, highRes, title, artist);
        if (trackIdKey) saveToIndexedDB(trackIdKey, highRes, title, artist);
        persistToLocalStorage();

        // L3: Pre-decode image texture into browser memory
        preDecodeImage(highRes);

        return highRes;
      }
    } catch (err) {
      console.warn(`[ArtworkService] Multi-API artwork discovery failed for "${cleanT}":`, err);
    } finally {
      inFlightRequests.delete(titleArtistKey);
    }

    return localFallback;
  })();

  inFlightRequests.set(titleArtistKey, requestPromise);
  return requestPromise;
}

/**
 * Instant synchronous lookup in L1 memory cache (0ms latency, zero flicker)
 */
export function getCachedArtworkSync(
  title: string,
  artist?: string,
  trackId?: string
): string | null {
  const cleanT = cleanTitleForSearch(title);
  const cleanA = cleanArtistForSearch(artist || '');
  const titleArtistKey = `${cleanT}::${cleanA}`.toLowerCase();
  const trackIdKey = trackId ? `id::${trackId}`.toLowerCase() : null;

  if (cleanT && memoryCache.has(titleArtistKey)) {
    return memoryCache.get(titleArtistKey)!.url;
  }
  if (trackIdKey && memoryCache.has(trackIdKey)) {
    return memoryCache.get(trackIdKey)!.url;
  }
  return null;
}

/**
 * Prefetch artwork for upcoming tracks in background queue
 */
export function prefetchArtwork(
  tracks: Array<{ title: string; artist?: string; id?: string }>,
  limit = 12
): void {
  if (!Array.isArray(tracks) || tracks.length === 0) return;

  const nextTracks = tracks.slice(0, limit);
  nextTracks.forEach((track) => {
    const cleanT = cleanTitleForSearch(track.title);
    const cleanA = cleanArtistForSearch(track.artist || '');
    const key = `${cleanT}::${cleanA}`.toLowerCase();

    if (!memoryCache.has(key)) {
      getArtwork(track.title, track.artist || '', track.id).catch(() => {});
    }
  });
}

/**
 * Clear all cache tiers (Memory, LocalStorage, IndexedDB)
 */
export async function clearArtworkCache(): Promise<void> {
  memoryCache.clear();
  inFlightRequests.clear();
  totalHits = 0;
  totalMisses = 0;

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      const db = await getIndexedDB();
      if (db) {
        const tx = db.transaction(INDEXED_DB_STORE, 'readwrite');
        tx.objectStore(INDEXED_DB_STORE).clear();
      }
      console.info('[ArtworkCache] Multi-tier artwork cache cleared.');
    } catch (err) {
      console.warn('[ArtworkCache] Error clearing cache:', err);
    }
  }
}

/**
 * Get comprehensive cache diagnostics
 */
export function getArtworkCacheStats(): {
  memorySize: number;
  totalHits: number;
  totalMisses: number;
  hitRatio: string;
  sampleKeys: string[];
} {
  const total = totalHits + totalMisses;
  const hitRatio = total > 0 ? `${Math.round((totalHits / total) * 100)}%` : '0%';
  return {
    memorySize: memoryCache.size,
    totalHits,
    totalMisses,
    hitRatio,
    sampleKeys: Array.from(memoryCache.keys()).slice(0, 10),
  };
}
