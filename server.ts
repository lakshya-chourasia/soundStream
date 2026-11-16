import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Live Hindi Audio Radio Channels (Real-Time Icecast / SHOUTcast / Live Audio Streams)
const LIVE_HINDI_AUDIO_CHANNELS = [
  {
    id: 'live-mirchi-fm',
    title: 'Radio Mirchi 98.3 FM Live',
    artist: 'Radio Mirchi (Official Live Stream)',
    duration: 'LIVE',
    durationSec: 0,
    views: 'Live Broadcast',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=500&auto=format&fit=crop&q=60',
    streamUrl: 'https://vm65162.streamerr.co/listen/mirchi/radio.mp3',
    isOfficial: true,
    isLiveRadio: true,
  },
  {
    id: 'live-mirchi-top20',
    title: 'Mirchi Top 20 Live Stream',
    artist: 'Radio Mirchi Countdown',
    duration: 'LIVE',
    durationSec: 0,
    views: 'Live Broadcast',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=60',
    streamUrl: 'https://drive.uber.radio/uber/bollywoodnow/icecast.audio',
    isOfficial: true,
    isLiveRadio: true,
  },
  {
    id: 'live-hits-bollywood',
    title: 'Hits Of Bollywood Radio Live',
    artist: 'Bollywood Hits 24/7',
    duration: 'LIVE',
    durationSec: 0,
    views: 'Live Broadcast',
    thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=60',
    streamUrl: 'http://stream.zeno.fm/8ty8szwpwfeuv',
    isOfficial: true,
    isLiveRadio: true,
  },
  {
    id: 'live-retro-90s',
    title: 'Retro Bollywood 90s Live Radio',
    artist: '90s Superhit Classics',
    duration: 'LIVE',
    durationSec: 0,
    views: 'Live Broadcast',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60',
    streamUrl: 'https://stream-143.zeno.fm/fdgs82xkzhhvv',
    isOfficial: true,
    isLiveRadio: true,
  },
  {
    id: 'live-bombay-beats',
    title: 'Bombay Beats India Live',
    artist: '1.FM Bombay Beats',
    duration: 'LIVE',
    durationSec: 0,
    views: 'Live Broadcast',
    thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&auto=format&fit=crop&q=60',
    streamUrl: 'http://strm112.1.fm/bombaybeats_mobile_mp3',
    isOfficial: true,
    isLiveRadio: true,
  },
  {
    id: 'live-fnf-hindi',
    title: 'FNF FM Hindi Live',
    artist: 'Non-Stop Desi Bollywood',
    duration: 'LIVE',
    durationSec: 0,
    views: 'Live Broadcast',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=60',
    streamUrl: 'http://192.99.8.192:5032/;stream',
    isOfficial: true,
    isLiveRadio: true,
  },
  {
    id: 'live-lata-mangeshkar',
    title: 'Hits Of Lata Mangeshkar Radio Live',
    artist: 'Evergreen Melodies Live',
    duration: 'LIVE',
    durationSec: 0,
    views: 'Live Broadcast',
    thumbnail: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=500&auto=format&fit=crop&q=60',
    streamUrl: 'http://stream.zeno.fm/g95zm67prfhvv',
    isOfficial: true,
    isLiveRadio: true,
  },
  {
    id: 'live-bollywood-2010s',
    title: 'Bollywood 2010s Decade Radio',
    artist: 'Modern Bollywood Chartbusters',
    duration: 'LIVE',
    durationSec: 0,
    views: 'Live Broadcast',
    thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&auto=format&fit=crop&q=60',
    streamUrl: 'https://drive.uber.radio/uber/bollywood2010s/icecast.audio',
    isOfficial: true,
    isLiveRadio: true,
  },
];

const CURATED_GENRES = [
  {
    id: 'hindi-live-radio',
    name: 'Live Hindi Radio Channels',
    description: '24/7 Live streaming audio channels from Radio Mirchi, Bombay Beats, and Bollywood live feeds',
    tracks: LIVE_HINDI_AUDIO_CHANNELS,
  },
  {
    id: 'official-hits',
    name: 'Top Global Official Music Videos',
    description: 'Master studio official music videos from top worldwide artists',
    tracks: [
      {
        id: 'kJQP7kiw5Fk',
        title: 'Despacito (Official Music Video)',
        artist: 'Luis Fonsi ft. Daddy Yankee',
        duration: '4:42',
        durationSec: 282,
        views: '8.4B views',
        thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg',
      },
      {
        id: 'JGwWNGJdvx8',
        title: 'Shape of You (Official Music Video)',
        artist: 'Ed Sheeran',
        duration: '4:24',
        durationSec: 264,
        views: '6.2B views',
        thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
      },
      {
        id: 'fJ9rUzIMcZQ',
        title: 'Bohemian Rhapsody (Official Video Remastered)',
        artist: 'Queen',
        duration: '6:00',
        durationSec: 360,
        views: '1.7B views',
        thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
      },
      {
        id: '4NRXx6U8ABQ',
        title: 'Blinding Lights (Official Music Video)',
        artist: 'The Weeknd',
        duration: '4:22',
        durationSec: 262,
        views: '800M views',
        thumbnail: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
      },
      {
        id: 'yKNxeF4KMsY',
        title: 'Yellow (Official Video)',
        artist: 'Coldplay',
        duration: '4:33',
        durationSec: 273,
        views: '1.3B views',
        thumbnail: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg',
      },
    ],
  },
  {
    id: 'synthwave',
    name: 'Synthwave & Retrowave (Official Videos)',
    description: 'Neon horizons, analog synthesizers, and midnight expressway nostalgia',
    tracks: [
      {
        id: 'a6P40S5K4c4',
        title: 'Days of Thunder (Official Video)',
        artist: 'The Midnight',
        duration: '5:30',
        durationSec: 330,
        views: '12M views',
        thumbnail: 'https://i.ytimg.com/vi/a6P40S5K4c4/hqdefault.jpg',
      },
      {
        id: '_Ci0Kgdpgsw',
        title: 'On the Run (Official Video)',
        artist: 'Timecop1983',
        duration: '5:01',
        durationSec: 301,
        views: '15M views',
        thumbnail: 'https://i.ytimg.com/vi/_Ci0Kgdpgsw/hqdefault.jpg',
      },
      {
        id: '8GW6sLrK40k',
        title: 'Resonance (Official Video)',
        artist: 'HOME',
        duration: '3:32',
        durationSec: 212,
        views: '140M views',
        thumbnail: 'https://i.ytimg.com/vi/8GW6sLrK40k/hqdefault.jpg',
      },
    ],
  },
  {
    id: 'indie-rock',
    name: 'Indie & Alt Rock (Official Music Videos)',
    description: 'Iconic anthems and guitar driven official videos',
    tracks: [
      {
        id: 'gGdGFtwCNBE',
        title: 'Mr. Brightside (Official Music Video)',
        artist: 'The Killers',
        duration: '3:48',
        durationSec: 228,
        views: '560M views',
        thumbnail: 'https://i.ytimg.com/vi/gGdGFtwCNBE/hqdefault.jpg',
      },
      {
        id: 'bpOSxM0rNPM',
        title: 'Do I Wanna Know? (Official Video)',
        artist: 'Arctic Monkeys',
        duration: '4:26',
        durationSec: 266,
        views: '1.6B views',
        thumbnail: 'https://i.ytimg.com/vi/bpOSxM0rNPM/hqdefault.jpg',
      },
      {
        id: '1G4isv_Fylg',
        title: 'Bloom (Official Music Video)',
        artist: 'The Paper Kites',
        duration: '3:30',
        durationSec: 210,
        views: '78M views',
        thumbnail: 'https://i.ytimg.com/vi/1G4isv_Fylg/hqdefault.jpg',
      },
    ],
  },
  {
    id: 'pop-dance',
    name: 'Electronic & Pop Dance (Official Videos)',
    description: 'High energy dance visuals and festival anthems',
    tracks: [
      {
        id: 'YykjpeuMNEk',
        title: 'Hymn For The Weekend (Official Video)',
        artist: 'Coldplay ft. Beyoncé',
        duration: '4:20',
        durationSec: 260,
        views: '2.1B views',
        thumbnail: 'https://i.ytimg.com/vi/YykjpeuMNEk/hqdefault.jpg',
      },
      {
        id: 'kOkQ4T5WO9E',
        title: 'This Is What You Came For (Official Video)',
        artist: 'Calvin Harris ft. Rihanna',
        duration: '4:00',
        durationSec: 240,
        views: '2.7B views',
        thumbnail: 'https://i.ytimg.com/vi/kOkQ4T5WO9E/hqdefault.jpg',
      },
      {
        id: 'ALZHF5UqnU4',
        title: 'Alone (Official Music Video)',
        artist: 'Marshmello',
        duration: '3:20',
        durationSec: 200,
        views: '2.4B views',
        thumbnail: 'https://i.ytimg.com/vi/ALZHF5UqnU4/hqdefault.jpg',
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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API 1: Curated Genres and Starter Tracks
  app.get('/api/curated', (_req: Request, res: Response) => {
    res.json({
      genres: CURATED_GENRES,
      featured: CURATED_GENRES[0].tracks,
    });
  });

  // API 1B: Popular Hindi Live Audio Radio Stations
  app.get('/api/radio', (_req: Request, res: Response) => {
    res.json({
      stations: LIVE_HINDI_AUDIO_CHANNELS,
    });
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

      res.json({ tracks: tracks.slice(0, 25) });
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
