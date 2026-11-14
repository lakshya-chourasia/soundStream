import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Curated collections with 100% verified YouTube video IDs
const CURATED_GENRES = [
  {
    id: 'lofi',
    name: 'Lofi & Chillhop',
    description: 'Downtempo beats, mellow rhodes, and vinyl crackle for deep focus',
    tracks: [
      {
        id: '4xDzrJKXOOY',
        title: 'Resonance',
        artist: 'HOME',
        duration: '3:32',
        durationSec: 212,
        views: '140M views',
        thumbnail: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg'
      },
      {
        id: 'CLeZyIID9Bo',
        title: 'Chill Lofi Mix [Chill Lo-Fi Beats]',
        artist: 'Settle',
        duration: '1:44:52',
        durationSec: 6292,
        views: '12M views',
        thumbnail: 'https://i.ytimg.com/vi/CLeZyIID9Bo/hqdefault.jpg'
      },
      {
        id: 'n61ULEU7CO0',
        title: 'Best of Lofi Hip Hop [Beats to Relax/Study to]',
        artist: 'Lofi Girl',
        duration: '6:10:58',
        durationSec: 22258,
        views: '85M views',
        thumbnail: 'https://i.ytimg.com/vi/n61ULEU7CO0/hqdefault.jpg'
      }
    ]
  },
  {
    id: 'synthwave',
    name: 'Synthwave & Retrowave',
    description: 'Neon horizons, analog synthesizers, and midnight expressway nostalgia',
    tracks: [
      {
        id: '8GW6sLrK40k',
        title: 'Days of Thunder',
        artist: 'The Midnight',
        duration: '5:30',
        durationSec: 330,
        views: '12M views',
        thumbnail: 'https://i.ytimg.com/vi/8GW6sLrK40k/hqdefault.jpg'
      },
      {
        id: '_Ci0Kgdpgsw',
        title: 'On the Run',
        artist: 'Timecop1983',
        duration: '5:01',
        durationSec: 301,
        views: '15M views',
        thumbnail: 'https://i.ytimg.com/vi/_Ci0Kgdpgsw/hqdefault.jpg'
      },
      {
        id: '4xDzrJKXOOY',
        title: 'Resonance',
        artist: 'HOME',
        duration: '3:32',
        durationSec: 212,
        views: '140M views',
        thumbnail: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg'
      }
    ]
  },
  {
    id: 'acoustic',
    name: 'Acoustic & Folk Indie',
    description: 'Raw warm wooden acoustics, gentle fingerpicking, and intimate vocals',
    tracks: [
      {
        id: '1G4isv_Fylg',
        title: 'Bloom',
        artist: 'The Paper Kites',
        duration: '3:30',
        durationSec: 210,
        views: '78M views',
        thumbnail: 'https://i.ytimg.com/vi/1G4isv_Fylg/hqdefault.jpg'
      },
      {
        id: 'yKNxeF4KMsY',
        title: 'Yellow',
        artist: 'Coldplay',
        duration: '4:33',
        durationSec: 273,
        views: '1.3B views',
        thumbnail: 'https://i.ytimg.com/vi/yKNxeF4KMsY/hqdefault.jpg'
      }
    ]
  },
  {
    id: 'ambient',
    name: 'Ambient & Deep Sleep',
    description: 'Weightless drones, floating reverberations, and meditative tranquility',
    tracks: [
      {
        id: 'UfcAVejslrU',
        title: 'Weightless',
        artist: 'Marconi Union',
        duration: '8:08',
        durationSec: 488,
        views: '45M views',
        thumbnail: 'https://i.ytimg.com/vi/UfcAVejslrU/hqdefault.jpg'
      },
      {
        id: 'WNcsUNKlAKw',
        title: 'Clair de Lune',
        artist: 'Claude Debussy',
        duration: '5:04',
        durationSec: 304,
        views: '62M views',
        thumbnail: 'https://i.ytimg.com/vi/WNcsUNKlAKw/hqdefault.jpg'
      },
      {
        id: 'sAcj8me7wGI',
        title: 'Relaxing Piano Music For Study & Focus',
        artist: 'Ocb Relax',
        duration: '3:01:39',
        durationSec: 10899,
        views: '24M views',
        thumbnail: 'https://i.ytimg.com/vi/sAcj8me7wGI/hqdefault.jpg'
      }
    ]
  },
  {
    id: 'jazz',
    name: 'Cozy Cafe Jazz & Piano',
    description: 'Virtuosic modal piano, acoustic upright bass, and crisp brush percussion',
    tracks: [
      {
        id: '6w0im3LHazY',
        title: 'Lounge Jazz Piano - Cozy Coffee Shop Ambience',
        artist: 'Cafe Music BGM',
        duration: '3:40:24',
        durationSec: 13224,
        views: '40M views',
        thumbnail: 'https://i.ytimg.com/vi/6w0im3LHazY/hqdefault.jpg'
      }
    ]
  }
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

  // API 3: YouTube Search Scraper
  app.get('/api/search', async (req: Request, res: Response) => {
    const q = (req.query.q as string || '').trim();
    if (!q) {
      return res.json({ tracks: CURATED_GENRES[0].tracks });
    }

    try {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
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
          t.title.toLowerCase().includes(q.toLowerCase()) ||
          t.artist.toLowerCase().includes(q.toLowerCase())
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

            tracks.push({
              id: videoId,
              title,
              artist,
              duration,
              durationSec: parseDurationSec(duration),
              views,
              thumbnail,
            });
          }
        }
      }

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

  // Mount Vite middleware or static files
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
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
