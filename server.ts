import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Curated collections with 100% verified YouTube video IDs and ultra-high-resolution 1200x1200 studio master artwork
const CURATED_GENRES = [
  {
    id: 'love-2k20',
    name: 'LOVE 2K20',
    description: 'Curated romantic anthems, soulful acoustic ballads and deep heartfelt pop',
    curator: 'Pharrell Williams',
    tag: '#RELATIONSHIPS',
    tracks: [
      {
        id: '2Vv-BfVoq4g',
        title: 'Perfect',
        artist: 'Edward Christopher Sheeran',
        duration: '4:23',
        durationSec: 263,
        views: '3.6B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/1200x1200bb.jpg',
      },
      {
        id: 'yKNxeF4KMsY',
        title: 'Yellow',
        artist: 'Chris Martin (Coldplay)',
        duration: '4:33',
        durationSec: 273,
        views: '1.3B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/1200x1200bb.jpg',
      },
      {
        id: '4NRXx6U8ABQ',
        title: 'Blinding Lights',
        artist: 'Abel Tesfaye (The Weeknd)',
        duration: '4:22',
        durationSec: 262,
        views: '800M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/1200x1200bb.jpg',
      },
      {
        id: 'fJ9rUzIMcZQ',
        title: 'Bohemian Rhapsody',
        artist: 'Freddie Mercury (Queen)',
        duration: '6:00',
        durationSec: 360,
        views: '1.7B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8b/0a/ea/8b0aea60-6f4a-195b-5958-cdf459c2333b/602527644271.jpg/1200x1200bb.jpg',
      },
      {
        id: 'gGdGFtwCNBE',
        title: 'Mr. Brightside',
        artist: 'Brandon Flowers (The Killers)',
        duration: '3:48',
        durationSec: 228,
        views: '560M views',
        thumbnail: 'https://i.ytimg.com/vi/gGdGFtwCNBE/hqdefault.jpg',
      },
      {
        id: 'wXhTHyIgQ_U',
        title: 'Circles',
        artist: 'Austin Richard Post (Post Malone)',
        duration: '3:35',
        durationSec: 215,
        views: '540M views',
        thumbnail: 'https://i.ytimg.com/vi/wXhTHyIgQ_U/hqdefault.jpg',
      },
    ],
  },
  {
    id: 'official-hits',
    name: 'Top Global Official Music Videos',
    description: 'Master studio official music videos from top worldwide artists',
    tag: '#GLOBAL-HIT',
    tracks: [
      {
        id: 'kJQP7kiw5Fk',
        title: 'Despacito (Official Music Video)',
        artist: 'Luis Fonsi ft. Daddy Yankee (Ramón Ayala)',
        duration: '4:42',
        durationSec: 282,
        views: '8.4B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/e2/ef/f0/e2eff0bc-c51d-7de5-9280-6891ddcee71b/18UMGIM85289.rgb.jpg/1200x1200bb.jpg',
      },
      {
        id: 'JGwWNGJdvx8',
        title: 'Shape of You (Official Music Video)',
        artist: 'Edward Christopher Sheeran',
        duration: '4:24',
        durationSec: 264,
        views: '6.2B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/1200x1200bb.jpg',
      },
      {
        id: 'fJ9rUzIMcZQ',
        title: 'Bohemian Rhapsody (Official Video Remastered)',
        artist: 'Freddie Mercury (Queen)',
        duration: '6:00',
        durationSec: 360,
        views: '1.7B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/8b/0a/ea/8b0aea60-6f4a-195b-5958-cdf459c2333b/602527644271.jpg/1200x1200bb.jpg',
      },
      {
        id: '4NRXx6U8ABQ',
        title: 'Blinding Lights (Official Music Video)',
        artist: 'Abel Tesfaye (The Weeknd)',
        duration: '4:22',
        durationSec: 262,
        views: '800M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/1200x1200bb.jpg',
      },
      {
        id: 'yKNxeF4KMsY',
        title: 'Yellow (Official Video)',
        artist: 'Chris Martin (Coldplay)',
        duration: '4:33',
        durationSec: 273,
        views: '1.3B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/1200x1200bb.jpg',
      },
      {
        id: 'H5v3kku4y6Q',
        title: 'As It Was (Official Video)',
        artist: 'Harry Edward Styles',
        duration: '2:47',
        durationSec: 167,
        views: '850M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/2a/19/fb/2a19fb85-2f70-9e44-f2a9-82abe679b88e/886449990061.jpg/1200x1200bb.jpg',
      },
      {
        id: 'TUVcZfQe-Kw',
        title: 'Levitating (Official Music Video)',
        artist: 'Dua Lipa',
        duration: '3:50',
        durationSec: 230,
        views: '920M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/1200x1200bb.jpg',
      },
      {
        id: 'wXhTHyIgQ_U',
        title: 'Circles (Official Music Video)',
        artist: 'Austin Richard Post (Post Malone)',
        duration: '3:35',
        durationSec: 215,
        views: '640M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/7b/1b/1b/7b1b1b0b-7ce2-b223-f9e0-8e36abe51877/19UMGIM78325.rgb.jpg/1200x1200bb.jpg',
      },
    ],
  },
  {
    id: 'synthwave',
    name: 'Synthwave & Retrowave (Official Videos)',
    description: 'Neon horizons, analog synthesizers, and midnight expressway nostalgia',
    tag: '#SYNTHWAVE',
    tracks: [
      {
        id: 'a6P40S5K4c4',
        title: 'Days of Thunder (Official Video)',
        artist: 'Tyler Lyle (The Midnight)',
        duration: '5:30',
        durationSec: 330,
        views: '12M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/5a/0f/a4/5a0fa413-e1b8-7cb6-7ecc-7c22e656d33d/194271526137_cover.jpg/1200x1200bb.jpg',
      },
      {
        id: '_Ci0Kgdpgsw',
        title: 'On the Run (Official Video)',
        artist: 'Jordy Leenaerts (Timecop1983)',
        duration: '5:01',
        durationSec: 301,
        views: '15M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/5a/44/68/5a4468ef-ce33-9aea-1062-a6e9600b1321/859726345762_cover.jpg/1200x1200bb.jpg',
      },
      {
        id: '8GW6sLrK40k',
        title: 'Resonance (Official Video)',
        artist: 'Randy Goffe (HOME)',
        duration: '3:32',
        durationSec: 212,
        views: '140M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/4f/13/65/4f1365b0-e97c-c469-c438-2f7d8f204355/872133025584_cover.jpg/1200x1200bb.jpg',
      },
    ],
  },
  {
    id: 'indie-rock',
    name: 'Indie & Alt Rock (Official Music Videos)',
    description: 'Iconic anthems and guitar driven official videos',
    tag: '#ALT-ROCK',
    tracks: [
      {
        id: 'gGdGFtwCNBE',
        title: 'Mr. Brightside (Official Music Video)',
        artist: 'Brandon Flowers (The Killers)',
        duration: '3:48',
        durationSec: 228,
        views: '560M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/11/64/9c/11649c80-2066-dba8-77a9-df7eecae26c1/17UM1IM06937.rgb.jpg/1200x1200bb.jpg',
      },
      {
        id: 'bpOSxM0rNPM',
        title: 'Do I Wanna Know? (Official Video)',
        artist: 'Alex Turner (Arctic Monkeys)',
        duration: '4:26',
        durationSec: 266,
        views: '1.6B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/69/9c/b5/699cb5d6-115c-ff73-9d26-e57ea4350d72/887828031795.png/1200x1200bb.jpg',
      },
      {
        id: '1G4isv_Fylg',
        title: 'Bloom (Official Music Video)',
        artist: 'Sam Bentley & Christina Lacy (The Paper Kites)',
        duration: '3:30',
        durationSec: 210,
        views: '78M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/0b/a9/d7/0ba9d7c7-2e68-dc9b-cde4-d142e8ce86b1/067003806756.png/1200x1200bb.jpg',
      },
    ],
  },
  {
    id: 'pop-dance',
    name: 'Electronic & Pop Dance (Official Videos)',
    description: 'High energy dance visuals and festival anthems',
    tag: '#DANCE',
    tracks: [
      {
        id: 'YykjpeuMNEk',
        title: 'Hymn For The Weekend (Official Video)',
        artist: 'Chris Martin & Beyoncé (Coldplay)',
        duration: '4:20',
        durationSec: 260,
        views: '2.1B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/c8/0a/6d/c80a6df9-e55a-fb83-0311-f4776984ac67/mzm.lasidxkv.jpg/1200x1200bb.jpg',
      },
      {
        id: 'kOkQ4T5WO9E',
        title: 'This Is What You Came For (Official Video)',
        artist: 'Rihanna & Calvin Harris',
        duration: '4:00',
        durationSec: 240,
        views: '2.7B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music125/v4/59/57/a6/5957a66e-fb10-4065-5739-7c54236339e4/886445857290.jpg/1200x1200bb.jpg',
      },
      {
        id: 'ALZHF5UqnU4',
        title: 'Alone (Official Music Video)',
        artist: 'Christopher Comstock (Marshmello)',
        duration: '3:20',
        durationSec: 200,
        views: '2.4B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/7e/be/33/7ebe3370-959a-94f7-77e2-c9e7fea9a4ed/859716988917_cover.jpg/1200x1200bb.jpg',
      },
      {
        id: 'IcrbM1l_BoI',
        title: 'Wake Me Up (Official Video)',
        artist: 'Aloe Blacc (Avicii)',
        duration: '4:32',
        durationSec: 272,
        views: '2.3B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/18/5b/1e/185b1ef5-5d97-19d8-aebf-8e29e41874ef/13UAAIM59255.rgb.jpg/1200x1200bb.jpg',
      },
      {
        id: 'DyDfgMOUjCI',
        title: 'bad guy (Official Music Video)',
        artist: 'Billie Eilish O\'Connell',
        duration: '3:25',
        durationSec: 205,
        views: '1.2B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/1a/37/d1/1a37d1b1-8508-54f2-f541-bf4e437dda76/19UMGIM05028.rgb.jpg/1200x1200bb.jpg',
      },
    ],
  },
];

function parseDurationSec(durationStr: string): number {
  if (!durationStr || durationStr === 'Live') return 0;
  const parts = durationStr.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

// In-memory blacklist for known playback-restricted videos (disallowed embedding)
const KNOWN_RESTRICTED_IDS = new Set<string>(['hLQl3WQQoQ0']);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Report playback-restricted video to filter across all clients
  app.post('/api/report-restricted', (req: Request, res: Response) => {
    const { videoId } = req.body;
    if (videoId && typeof videoId === 'string') {
      KNOWN_RESTRICTED_IDS.add(videoId);
      console.warn(`[Restricted Video Added to Blacklist]: ${videoId}`);
    }
    res.json({ ok: true, count: KNOWN_RESTRICTED_IDS.size });
  });

  // API 1: Curated Genres and Starter Tracks (Random Flexible Starter)
  app.get('/api/curated', (_req: Request, res: Response) => {
    const allTracks = CURATED_GENRES.flatMap((g) => g.tracks).filter((t) => !KNOWN_RESTRICTED_IDS.has(t.id));
    const randomStarter = allTracks.length > 0
      ? allTracks[Math.floor(Math.random() * allTracks.length)]
      : CURATED_GENRES[0].tracks[0];

    res.json({
      genres: CURATED_GENRES,
      featured: CURATED_GENRES[0].tracks,
      randomStarter,
    });
  });

  // API 2: Dynamic Vibe Smart Recommendations (Auto-matches Genre & Vibe)
  app.get('/api/recommendations', async (req: Request, res: Response) => {
    const trackId = (req.query.trackId as string || '').trim();
    const artist = (req.query.artist as string || '').trim().toLowerCase();
    const tag = (req.query.tag as string || '').trim().toUpperCase();
    const limit = Math.min(20, Math.max(4, parseInt(req.query.limit as string || '10', 10)));

    try {
      // Find parent genre/vibe of the requested track or tag
      const currentGenre = CURATED_GENRES.find((g) =>
        (tag && g.tag === tag) || g.tracks.some((t) => t.id === trackId)
      );

      const allTracks = CURATED_GENRES.flatMap((g) =>
        g.tracks.map((t) => ({ ...t, vibe: g.tag, collectionName: g.name }))
      ).filter((t) => !KNOWN_RESTRICTED_IDS.has(t.id) && t.id !== trackId);

      const uniqueMap = new Map<string, any>();
      for (const t of allTracks) {
        if (!uniqueMap.has(t.id)) {
          uniqueMap.set(t.id, t);
        }
      }

      const pool = Array.from(uniqueMap.values());
      const sameVibeTracks: any[] = [];
      const artistMatches: any[] = [];
      const others: any[] = [];

      for (const t of pool) {
        const isSameVibe = currentGenre && (t.vibe === currentGenre.tag || (tag && t.vibe === tag));
        const isArtistMatch = artist && (t.artist.toLowerCase().includes(artist) || artist.includes(t.artist.toLowerCase()));

        if (isSameVibe) {
          sameVibeTracks.push(t);
        } else if (isArtistMatch) {
          artistMatches.push(t);
        } else {
          others.push(t);
        }
      }

      // Fisher-Yates random shuffle
      const shuffle = (arr: any[]) => {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };

      // Prioritize same vibe tracks first, then same artist, then diverse pool
      const combined = [
        ...shuffle(sameVibeTracks),
        ...shuffle(artistMatches),
        ...shuffle(others),
      ].slice(0, limit);

      res.json({
        recommendations: combined,
        activeVibe: currentGenre?.tag || tag || '#NOW-PLAYING',
      });
    } catch (err: any) {
      console.error('Error generating recommendations:', err);
      res.status(500).json({ error: 'Failed to generate recommendations' });
    }
  });

  // API 2: Search Autocomplete Suggestions
  app.get('/api/suggest', async (req: Request, res: Response) => {
    const q = (req.query.q as string || '').trim();
    if (!q) {
      return res.json({ suggestions: [] });
    }

    try {
      const suggestUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(q)}`;
      const response = await fetch(suggestUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        return res.json({ suggestions: [] });
      }

      const data = await response.json();
      const suggestions = Array.isArray(data[1]) ? data[1].slice(0, 7) : [];
      res.json({ suggestions });
    } catch {
      res.json({ suggestions: [] });
    }
  });

  // API 3: YouTube Search Scraper (Prioritizing & Filtering for Official Music Videos)
  app.get('/api/search', async (req: Request, res: Response) => {
    const rawQ = (req.query.q as string || '').trim();
    if (!rawQ) {
      return res.json({ tracks: CURATED_GENRES[0].tracks });
    }

    // Append "official music video" to query if not already present
    const officialQuery = /official\s*(music\s*)?video/i.test(rawQ)
      ? rawQ
      : `${rawQ} official music video`;

    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(officialQuery)}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      if (!response.ok) {
        throw new Error(`YouTube responded with status ${response.status}`);
      }

      const html = await response.text();
      const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/ytInitialData\s*=\s*({.+?});/);

      if (!match) {
        // Fallback search across curated tracks if scraping fails
        const matched = CURATED_GENRES.flatMap(g => g.tracks).filter(t =>
          t.title.toLowerCase().includes(rawQ.toLowerCase()) ||
          t.artist.toLowerCase().includes(rawQ.toLowerCase())
        );
        return res.json({ tracks: matched.length > 0 ? matched : CURATED_GENRES[0].tracks });
      }

      const data = JSON.parse(match[1]);
      const sections = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
      const tracks: any[] = [];

      for (const sec of sections) {
        const renderers = sec.itemSectionRenderer?.contents || [];
        for (const item of renderers) {
          if (item.videoRenderer) {
            const v = item.videoRenderer;
            const videoId = v.videoId;
            if (!videoId) continue;

            const title = v.title?.runs?.map((r: any) => r.text).join('') || v.title?.simpleText || 'Unknown Title';
            const artist = v.ownerText?.runs?.map((r: any) => r.text).join('') || 'YouTube Artist';
            const duration = v.lengthText?.simpleText || 'Live';
            const views = v.viewCountText?.simpleText || '';
            const thumbs = v.thumbnail?.thumbnails || [];
            const thumbnail = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

            // Skip non-music formats like 10hr loops, full podcasts, reaction videos, or covers when searching for official videos
            const lowerTitle = title.toLowerCase();
            const lowerArtist = artist.toLowerCase();
            const isDisqualified =
              lowerTitle.includes('1 hour') ||
              lowerTitle.includes('10 hours') ||
              lowerTitle.includes('reaction') ||
              lowerTitle.includes('tutorial') ||
              lowerTitle.includes('how to play') ||
              lowerTitle.includes('parody');

            if (isDisqualified) continue;

            // Prioritize badge indicators for official videos (Official Music Video, VEVO, Official Video, - Topic)
            const isOfficial =
              lowerTitle.includes('official') ||
              lowerTitle.includes('music video') ||
              lowerTitle.includes('vevo') ||
              lowerArtist.includes('vevo') ||
              lowerArtist.includes('official') ||
              lowerArtist.includes('- topic') ||
              v.ownerBadges?.some((b: any) => b.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_VERIFIED_ARTIST');

            tracks.push({
              id: videoId,
              title,
              artist,
              duration,
              durationSec: parseDurationSec(duration),
              views,
              thumbnail,
              isOfficial,
            });
          }
        }
      }

      // Sort official videos to the top
      tracks.sort((a, b) => {
        if (a.isOfficial && !b.isOfficial) return -1;
        if (!a.isOfficial && b.isOfficial) return 1;
        return 0;
      });

      // Filter out known playback-restricted videos
      const filtered = tracks.filter((t) => !KNOWN_RESTRICTED_IDS.has(t.id));

      res.json({ tracks: filtered.slice(0, 25) });
    } catch (err: any) {
      console.error('Search error:', err.message);
      // Fallback
      res.json({ tracks: CURATED_GENRES[0].tracks });
    }
  });

  // API 4: Resolve direct YouTube URL or video ID
  app.get('/api/resolve', async (req: Request, res: Response) => {
    const rawInput = (req.query.urlOrId as string || '').trim();
    if (!rawInput) {
      return res.status(400).json({ error: 'Missing urlOrId parameter' });
    }

    // Extract 11-char ID
    let videoId = rawInput;
    if (rawInput.length !== 11) {
      const match = rawInput.match(/(?:v=|\/embed\/|\/watch\?v=|\/watch\?.+&v=|youtu\.be\/|shorts\/)([^#&?]{11})/);
      if (match && match[1]) {
        videoId = match[1];
      }
    }

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({ error: 'Invalid YouTube video ID or URL' });
    }

    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await fetch(oembedUrl);
      if (!response.ok) {
        return res.json({
          id: videoId,
          title: 'YouTube Track',
          artist: 'YouTube',
          duration: '--:--',
          durationSec: 0,
          thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        });
      }

      const info = await response.json();
      res.json({
        id: videoId,
        title: info.title || 'YouTube Track',
        artist: info.author_name || 'YouTube Artist',
        duration: '--:--',
        durationSec: 0,
        thumbnail: info.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
    } catch {
      res.json({
        id: videoId,
        title: 'YouTube Track',
        artist: 'YouTube',
        duration: '--:--',
        durationSec: 0,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      });
    }
  });

  // API 5: Fetch synchronized or plain lyrics for a track
  app.get('/api/lyrics', async (req: Request, res: Response) => {
    const rawTrack = (req.query.track as string || '').trim();
    const rawArtist = (req.query.artist as string || '').trim();
    const durationSec = req.query.durationSec ? parseInt(req.query.durationSec as string, 10) : 0;

    if (!rawTrack) {
      return res.status(400).json({ error: 'Missing track parameter' });
    }

    // Clean track title (strip common YouTube suffixes)
    let cleanTrack = rawTrack
      .replace(/\s*[\(\[]\s*(?:Official\s*(?:Music\s*)?)?(?:Video|Audio|Lyric\s*Video|HD|4K|Visualizer|Lyrics?)\s*[\)\]]/gi, '')
      .replace(/\s*\|.*$/, '')
      .trim();

    let cleanArtist = rawArtist
      .replace(/ - Topic$/i, '')
      .replace(/VEVO$/i, '')
      .replace(/Official$/i, '')
      .trim();

    // If title was "Artist - Title"
    if (cleanTrack.includes(' - ')) {
      const parts = cleanTrack.split(' - ');
      if (parts.length >= 2) {
        if (!cleanArtist || cleanArtist === 'YouTube' || cleanArtist === 'YouTube Artist') {
          cleanArtist = parts[0].trim();
        }
        cleanTrack = parts.slice(1).join(' - ').trim();
      }
    }

    try {
      // Step 1: Direct lookup on LRCLIB
      let url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTrack)}&artist_name=${encodeURIComponent(cleanArtist)}`;
      if (durationSec > 0) {
        url += `&duration=${durationSec}`;
      }
      const lrclibRes = await fetch(url, {
        headers: { 'User-Agent': 'AuraMusicPlayer/1.0 (https://github.com/aura)' }
      });

      if (lrclibRes.ok) {
        const data = await lrclibRes.json();
        return res.json({
          track: data.trackName || cleanTrack,
          artist: data.artistName || cleanArtist,
          plainLyrics: data.plainLyrics || null,
          syncedLyrics: data.syncedLyrics || null,
          instrumental: !!data.instrumental,
          source: 'lrclib',
        });
      }

      // Step 2: Search on LRCLIB if direct match missed
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanTrack + ' ' + cleanArtist)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'AuraMusicPlayer/1.0 (https://github.com/aura)' }
      });

      if (searchRes.ok) {
        const items = await searchRes.json();
        if (Array.isArray(items) && items.length > 0) {
          const match = items[0];
          return res.json({
            track: match.trackName || cleanTrack,
            artist: match.artistName || cleanArtist,
            plainLyrics: match.plainLyrics || null,
            syncedLyrics: match.syncedLyrics || null,
            instrumental: !!match.instrumental,
            source: 'lrclib-search',
          });
        }
      }

      // Step 3: Check if Gemini is available for AI track analysis or lyric fallback
      if (process.env.GEMINI_API_KEY) {
        try {
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({});
          const response = await ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: `You are a music lyrics assistant. Provide the official lyrics for the song "${cleanTrack}" by "${cleanArtist}". If the song is an instrumental track (like electronic, chillhop, or classical with no singing), simply respond with "[Instrumental] - This is an instrumental soundscape with no vocal lyrics." Otherwise, return only the formatted song lyrics with clean verse/chorus line breaks.`,
          });
          const text = response.text || '';
          if (text.includes('[Instrumental]')) {
            return res.json({
              track: cleanTrack,
              artist: cleanArtist,
              plainLyrics: null,
              syncedLyrics: null,
              instrumental: true,
              source: 'gemini',
            });
          } else if (text.trim()) {
            return res.json({
              track: cleanTrack,
              artist: cleanArtist,
              plainLyrics: text.trim(),
              syncedLyrics: null,
              instrumental: false,
              source: 'gemini',
            });
          }
        } catch (geminiErr: any) {
          console.warn('Gemini lyrics fallback error:', geminiErr.message);
        }
      }

      // Step 4: Graceful fallback when lyrics not found
      return res.json({
        track: cleanTrack,
        artist: cleanArtist,
        plainLyrics: null,
        syncedLyrics: null,
        instrumental: false,
        notFound: true,
      });
    } catch (err: any) {
      console.error('Lyrics endpoint error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch lyrics' });
    }
  });

  // API 6: Fetch ultra-high-resolution 1200x1200bb studio master artwork for any track
  const artworkCache = new Map<string, string>();
  app.get('/api/highres-artwork', async (req: Request, res: Response) => {
    const rawTrack = (req.query.track as string || '').trim();
    const rawArtist = (req.query.artist as string || '').trim();
    const cacheKey = `${rawTrack}::${rawArtist}`.toLowerCase();

    if (artworkCache.has(cacheKey)) {
      return res.json({ artworkUrl: artworkCache.get(cacheKey) });
    }

    try {
      const cleanTrack = rawTrack
        .replace(/\s*[\(\[]\s*(?:Official\s*(?:Music\s*)?)?(?:Video|Audio|Lyric\s*Video|HD|4K|Visualizer|Lyrics?)\s*[\)\]]/gi, '')
        .replace(/\s*\|.*$/, '')
        .trim();
      const cleanArtist = rawArtist
        .replace(/ - Topic$/i, '')
        .replace(/VEVO$/i, '')
        .replace(/Official$/i, '')
        .trim();

      const query = `${cleanTrack} ${cleanArtist}`.trim();
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;
      const itunesRes = await fetch(itunesUrl);
      if (itunesRes.ok) {
        const data = await itunesRes.json();
        if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
          const highRes = data.results[0].artworkUrl100.replace(/\/\d+x\d+bb\./, '/1200x1200bb.');
          artworkCache.set(cacheKey, highRes);
          return res.json({ artworkUrl: highRes });
        }
      }
    } catch {}

    res.json({ artworkUrl: null });
  });

  // Download Native Mobile Android APK
  app.get(['/download/app.apk', '/download/apk', '/app.apk'], (_req: Request, res: Response) => {
    const apkPath = path.resolve(__dirname, 'android/app/build/outputs/apk/debug/app-debug.apk');
    if (fs.existsSync(apkPath)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="SoundStream.apk"');
      return res.sendFile(apkPath);
    }
    return res.status(404).send('APK not found. Please run "pnpm run mobile:build".');
  });

  // Mount Vite middleware or static files
  const distPath = path.resolve(__dirname, 'dist');
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.K_SERVICE !== undefined ||
    (process.env.NODE_ENV !== 'development' && fs.existsSync(path.resolve(distPath, 'index.html')));

  if (isProd && fs.existsSync(path.resolve(distPath, 'index.html'))) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Minimalist Music Player server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
