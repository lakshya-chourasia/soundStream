import express from 'express';
import type { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { randomInt, randomBytes } from 'node:crypto';
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
        id: 'raiQjmyZMC0',
        title: 'Someone Like You',
        artist: 'Adele Adkins',
        duration: '4:45',
        durationSec: 285,
        views: '2.2B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/eb/ca/25/ebca2596-cd1e-b295-91a3-771c868d0a79/191404113868.png/1200x1200bb.jpg',
      },
      {
        id: 'zmsS_6sP5c4',
        title: 'If I Could Change You',
        artist: 'Danielle Haim (HAIM)',
        duration: '3:50',
        durationSec: 230,
        views: '45M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music114/v4/f1/0c/21/f10c2105-fed1-b727-fb61-b0c96cc73eea/886444152648.jpg/1200x1200bb.jpg',
      },
      {
        id: 'kYFjF3v1U7c',
        title: 'Go slow',
        artist: 'Gorgon City ft. Kaskade (Ryan Raddon)',
        duration: '3:45',
        durationSec: 225,
        views: '28M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music113/v4/fb/c9/72/fbc972b5-3b37-058a-6818-63604315bf22/19UMGIM36996.rgb.jpg/1200x1200bb.jpg',
      },
      {
        id: 'f-X8f_d1n3Y',
        title: 'Losing my mind',
        artist: 'Philip George',
        duration: '3:15',
        durationSec: 195,
        views: '18M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music118/v4/06/6e/d9/066ed9f2-5eec-324e-90cc-7c0e8dd89c79/05037128232506.rgb.jpg/1200x1200bb.jpg',
      },
      {
        id: 'XXYlFuWEuKI',
        title: 'Save Your Tears',
        artist: 'Abel Tesfaye (The Weeknd)',
        duration: '3:35',
        durationSec: 215,
        views: '1.2B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/1200x1200bb.jpg',
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
        id: '2Vv-BfVoq4g',
        title: 'Perfect',
        artist: 'Edward Christopher Sheeran',
        duration: '4:23',
        durationSec: 263,
        views: '3.6B views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/15/e6/e8/15e6e8a4-4190-6a8b-86c3-ab4a51b88288/190295851286.jpg/1200x1200bb.jpg',
      },
    ],
  },
  {
    id: 'official-hits',
    name: 'Top Global Official Music Videos',
    description: 'Master studio official music videos from top worldwide artists',
    tracks: [
      {
        id: '81qmmlsIE3k',
        title: 'Tum Hi Ho (From "Aashiqui 2")',
        artist: 'Arijit Singh, Mithoon',
        duration: '4:22',
        durationSec: 262,
        views: '850M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/bb/23/ee/bb23eeed-0c35-4f1d-2b11-485622777ae4/8902894353007_cover.jpg/1200x1200bb.jpg',
      },
      {
        id: 'wnWgkY1LGW4',
        title: 'Sanam Teri Kasam',
        artist: 'Himesh Reshammiya, Ankit Tiwari, Palak Muchhal',
        duration: '5:14',
        durationSec: 314,
        views: '420M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/44/65/2a/44652a17-ed54-7224-ca3e-281a2f704412/196871079150.jpg/1200x1200bb.jpg',
      },
      {
        id: 'lBvbNxiVmZA',
        title: 'Raanjhan (From "Do Patti")',
        artist: 'Sachet-Parampara, Parampara Tandon, Kausar Munir',
        duration: '3:30',
        durationSec: 210,
        views: '110M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/99/a9/ca/99a9caf7-5d9f-5890-3fdf-e3ff8c860e79/8903431018915_cover.jpg/1200x1200bb.jpg',
      },
      {
        id: '3Cp2QTBZAFQ',
        title: 'Finding Her',
        artist: 'Kushagra & Bharath',
        duration: '3:40',
        durationSec: 220,
        views: '35M views',
        thumbnail: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/0e/4f/58/0e4f5828-64f8-26d5-ebde-661b6fee89fe/5034644353067.jpg/1200x1200bb.jpg',
      },
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
const KNOWN_RESTRICTED_IDS = new Set<string>(['hLQl3WQQoQ0', 'f-X8f_d1n3Y']);

// ─────────────────────────────────────────────────────────────────────────────
// TRUE-ENTROPY OFFICIAL SINGERS RANDOM MUSIC DISCOVERY ENGINE
// Preserves full CSPRNG randomness on every load/refresh while guaranteeing
// verified official singers, Official Artist Channels, VEVO & Topic masters.
// ─────────────────────────────────────────────────────────────────────────────

function csprngShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function csprngPick<T>(items: T[]): T {
  return items[randomInt(0, items.length)];
}

const RANDOM_MOODS = [
  { label: 'Midnight Drive', tag: '#MIDNIGHT', desc: 'Late-night studio cuts and hypnotic vocal grooves' },
  { label: 'Golden Hour', tag: '#GOLDENHOUR', desc: 'Warm sunset melodies from iconic recording artists' },
  { label: 'Rainy Window', tag: '#RAINYMOOD', desc: 'Intimate vocal performances and soulful ballads' },
  { label: 'Velvet Lounge', tag: '#VELVET', desc: 'Smooth harmonies, warm basslines, and lush production' },
  { label: 'After Hours', tag: '#AFTERHOURS', desc: 'Deep nocturnal rhythms and moody studio masters' },
  { label: 'Electric Pulse', tag: '#ELECTRIC', desc: 'High-voltage hooks, crisp percussion, and chart-topping energy' },
  { label: 'Sunrise Drift', tag: '#SUNRISE', desc: 'Bright uplifting anthems and effortless morning vocals' },
  { label: 'Ocean Breeze', tag: '#COASTAL', desc: 'Sunlit melodies, relaxed tempos, and coastal grooves' },
  { label: 'Neon Mirage', tag: '#NEON', desc: 'Shimmering synth-pop and nocturnal studio anthems' },
  { label: 'Sunday Slow', tag: '#SUNDAY', desc: 'Unrushed acoustic cuts and soul-warming vocals' },
  { label: 'Rooftop Dusk', tag: '#ROOFTOP', desc: 'Twilight beats, stylish hooks, and skyline atmosphere' },
  { label: 'Stargazer', tag: '#COSMIC', desc: 'Expansive studio soundscapes and dreamy vocal textures' },
  { label: 'Quiet Storm', tag: '#QUIETSTORM', desc: 'Velvety chords, classic voices, and heartfelt lyricism' },
  { label: 'Desert Highway', tag: '#ROADTRIP', desc: 'Open-road anthems, driving guitars, and soaring choruses' },
  { label: 'Ember Glow', tag: '#EMBER', desc: 'Rich analog warmth, timeless singers, and iconic hooks' },
  { label: 'Urban Echo', tag: '#CITYNIGHTS', desc: 'Crisp modern production and signature artist vocals' },
];

interface OfficialGenreBucket {
  genre: string;
  tag: string;
  artists: string[];
}

const OFFICIAL_SINGER_BUCKETS: OfficialGenreBucket[] = [
  {
    genre: 'Global Pop Icons',
    tag: '#POP',
    artists: [
      'The Weeknd', 'Dua Lipa', 'Bruno Mars', 'Billie Eilish', 'Adele',
      'Ed Sheeran', 'Taylor Swift', 'Harry Styles', 'Rihanna', 'Lady Gaga',
      'Ariana Grande', 'Post Malone', 'Sabrina Carpenter', 'Olivia Rodrigo',
      'Beyoncé', 'Sam Smith', 'Sia', 'Shawn Mendes', 'Charlie Puth',
      'Miley Cyrus', 'Lana Del Rey', 'Lorde', 'Troye Sivan', 'Halsey',
      'Benson Boone', 'Teddy Swims', 'Tate McRae', 'Chappell Roan',
    ],
  },
  {
    genre: 'R&B & Neo-Soul',
    tag: '#RNBSOUL',
    artists: [
      'SZA', 'Frank Ocean', 'Daniel Caesar', 'Giveon', 'Alicia Keys',
      'John Legend', 'Sade', 'Amy Winehouse', 'Stevie Wonder', 'Marvin Gaye',
      'Anderson .Paak', 'Silk Sonic', 'Leon Bridges', 'Snoh Aalegra',
      'Kali Uchis', 'Steve Lacy', 'Omar Apollo', 'Jorja Smith',
      'Summer Walker', 'Brent Faiyaz', 'Khalid', 'H.E.R.', 'RAYE', 'Erykah Badu',
    ],
  },
  {
    genre: 'Indie & Alternative',
    tag: '#INDIE',
    artists: [
      'Arctic Monkeys', 'Tame Impala', 'Coldplay', 'Radiohead', 'Gorillaz',
      'The Strokes', 'Cigarettes After Sex', 'The Neighbourhood', 'The 1975',
      'Glass Animals', 'Hozier', 'Noah Kahan', 'Bon Iver', 'Clairo',
      'Joji', 'Mac DeMarco', 'Men I Trust', 'Beach House', 'Laufey',
      'Mitski', 'Phoebe Bridgers', 'The Marías', 'Vance Joy', 'Cage The Elephant',
      'Foster The People', 'Rex Orange County', 'beabadoobee',
    ],
  },
  {
    genre: 'Rock & Timeless Anthems',
    tag: '#ROCK',
    artists: [
      'Queen', 'Fleetwood Mac', 'Pink Floyd', 'Oasis', 'The Killers',
      'Linkin Park', 'Red Hot Chili Peppers', 'Foo Fighters', 'Green Day',
      'Nirvana', 'Muse', 'Imagine Dragons', 'OneRepublic', 'U2',
      'Bruce Springsteen', 'David Bowie', 'Elton John', 'Prince',
      'Michael Jackson', 'Whitney Houston', 'George Michael', 'Phil Collins',
    ],
  },
  {
    genre: 'Hip-Hop & Rap',
    tag: '#HIPHOP',
    artists: [
      'Kendrick Lamar', 'Drake', 'Travis Scott', 'J. Cole', 'Tyler, The Creator',
      'Eminem', 'Kid Cudi', 'Mac Miller', 'A$AP Rocky', 'Childish Gambino',
      'Future', 'Metro Boomin', 'OutKast', 'Ms. Lauryn Hill', 'Nas',
      'Central Cee', 'Dave', 'Stormzy', 'Doja Cat', '21 Savage',
    ],
  },
  {
    genre: 'Electronic & Dance',
    tag: '#ELECTRONIC',
    artists: [
      'Daft Punk', 'Calvin Harris', 'Avicii', 'Disclosure', 'Fred again..',
      'Flume', 'ODESZA', 'Kygo', 'Zedd', 'Martin Garrix', 'RÜFÜS DU SOL',
      'KAYTRANADA', 'Peggy Gou', 'M83', 'Empire of the Sun', 'MGMT',
      'Parcels', 'Justice', 'David Guetta', 'Swedish House Mafia',
    ],
  },
  {
    genre: 'Bollywood & Indian Soul',
    tag: '#BOLLYWOOD',
    artists: [
      'Arijit Singh', 'Shreya Ghoshal', 'A. R. Rahman', 'Atif Aslam',
      'Sonu Nigam', 'KK', 'Mohit Chauhan', 'Pritam', 'Vishal-Shekhar',
      'Jubin Nautiyal', 'Armaan Malik', 'Darshan Raval', 'Anuv Jain',
      'Prateek Kuhad', 'Amit Trivedi', 'Sunidhi Chauhan', 'Kailash Kher',
      'Papon', 'Lucky Ali', 'Sachet-Parampara', 'Rekha Bhardwaj', 'Shankar Mahadevan',
    ],
  },
  {
    genre: 'Punjabi & Desi Wave',
    tag: '#PUNJABI',
    artists: [
      'Diljit Dosanjh', 'AP Dhillon', 'Karan Aujla', 'Shubh', 'Sidhu Moose Wala',
      'Guru Randhawa', 'Harrdy Sandhu', 'Badshah', 'Divine', 'Ritviz',
      'King', 'Talwiinder', 'PropheC', 'Amrinder Gill', 'Satinder Sartaaj',
    ],
  },
  {
    genre: 'Latin & Reggaeton',
    tag: '#LATIN',
    artists: [
      'Bad Bunny', 'Shakira', 'KAROL G', 'ROSALÍA', 'Rauw Alejandro',
      'Feid', 'J Balvin', 'Luis Fonsi', 'Peso Pluma', 'Maluma',
      'Enrique Iglesias', 'Ricky Martin', 'Camila Cabello', 'Camilo',
    ],
  },
  {
    genre: 'Afrobeats & Global Groove',
    tag: '#AFROBEATS',
    artists: [
      'Burna Boy', 'Wizkid', 'Rema', 'Tems', 'Ayra Starr',
      'Davido', 'Asake', 'Ckay', 'Omah Lay', 'Fireboy DML',
      'Stromae', 'Angèle', 'Tyla',
    ],
  },
  {
    genre: 'K-Pop & J-Pop Official',
    tag: '#ASIANPOP',
    artists: [
      'BTS', 'BLACKPINK', 'NewJeans', 'Jung Kook', 'IU', 'TWICE',
      'Stray Kids', 'SEVENTEEN', 'Fujii Kaze', 'YOASOBI', 'Kenshi Yonezu',
      'Ado', 'Official HIGE DANDism', 'Lisa', 'Jimin', 'V',
    ],
  },
];

// Known unofficial fan-upload, lyric-repost, slowed/reverb, and compilation channels to reject
const UNOFFICIAL_CHANNEL_PATTERN =
  /\b(7clouds|unique\s*vibes|vibe\s*music|shadow\s*music|chilltracks|royal\s*music|dopelyrics|syrebralvibes|taj\s*tracks|cloudkid|mrsuicidesheep|trap\s*nation|bass\s*nation|proximity|koala\s*kontrol|wave\s*music|latin\s*hype|cumbia\s*drive|lofi\s*girl|chilledcow|audio\s*library|nocopyrightsounds|ncs\b|lyrics?\s*channel|lyric\s*box|music\s*lyrics|song\s*lyrics|slowed|reverb|nightcore|sped\s*up|8d\s*tunes|8d\s*audio|karaoke|sing\s*king|piano\s*tutorials?|guitar\s*lessons?|type\s*beat|beats\s*by|ai\s*covers?|ai\s*music|suno|udio|jukebox|status\s*video|whatsapp\s*status|fan\s*club|fan\s*page|bollywood\s*classics\s*mix|nonstop\s*hits)\b/i;

// Verified major official music labels & broadcasters that publish genuine official singer releases
const OFFICIAL_LABEL_CHANNEL_PATTERN =
  /\b(vevo|t-series|sony\s*music|zee\s*music|yrf\b|yash\s*raj|tips\s*official|saregama|universal\s*music|warner\s*music|atlantic\s*records|republic\s*records|interscope|columbia\s*records|rca\s*records|def\s*jam|capitol\s*records|island\s*records|epic\s*records|parlophone|virgin\s*records|motown|blue\s*note|xl\s*recordings|4ad|domino\s*recording|sub\s*pop|ninja\s*tune|stones\s*throw|fueled\s*by\s*ramen|hybe\s*labels|jyp\s*entertainment|smtown|yg\s*entertainment|coke\s*studio|88rising|spinnin|monstercat|ultra\s*music|armada\s*music|anjunabeats|speed\s*records|white\s*hill\s*music|desi\s*melodies|dm\s*-\s*desi\s*melodies|times\s*music|eros\s*now\s*music|jjust\s*music|colorsxstudios|npr\s*music|vevo\s*official)\b/i;

// Unofficial / non-studio track title indicators to exclude from official singer discovery
const UNOFFICIAL_TITLE_PATTERN =
  /\b(cover\b|karaoke|instrumental\b|slowed|reverb|8d\s*audio|nightcore|sped\s*up|pitched|type\s*beat|fan\s*made|fan\s*video|ai\s*cover|ai\s*version|tribute\b|piano\s*version|piano\s*cover|guitar\s*cover|violin\s*cover|acoustic\s*cover|reaction|tutorial|how\s*to\s*play|parody|podcast|interview|behind\s*the\s*scenes|making\s*of|teaser\b|trailer\b|promo\b|status\b|whatsapp|ringtone|lofi\s*flip|lo-fi\s*remix|mashup|jukebox|nonstop|full\s*album|playlist|megamix|compilation|1\s*hour|10\s*hours|24\/7|live\s*stream|mixtape|mix\b|radio|beats\s*to|study\s*music|sleep\s*music|shorts?)\b/i;

// Rolling in-memory pool of live verified official tracks discovered during runtime
const liveDiscoveredPool = new Map<string, any>();
const recentServedIds: string[] = [];
const recentArtistSeeds: string[] = [];

function recordServedTracks(ids: string[]) {
  for (const id of ids) {
    if (!id) continue;
    recentServedIds.push(id);
  }
  if (recentServedIds.length > 240) {
    recentServedIds.splice(0, recentServedIds.length - 240);
  }
}

function addToLivePool(tracks: any[]) {
  for (const t of tracks) {
    if (!t?.id || KNOWN_RESTRICTED_IDS.has(t.id) || !t.isOfficial) continue;
    liveDiscoveredPool.set(t.id, t);
  }
  if (liveDiscoveredPool.size > 650) {
    const excess = liveDiscoveredPool.size - 650;
    const keys = liveDiscoveredPool.keys();
    for (let i = 0; i < excess; i++) {
      const k = keys.next().value;
      if (k) liveDiscoveredPool.delete(k);
    }
  }
}

function parseExcludeSet(excludeParam: unknown): Set<string> {
  const set = new Set<string>(KNOWN_RESTRICTED_IDS);
  if (typeof excludeParam === 'string' && excludeParam.trim()) {
    for (const part of excludeParam.split(',')) {
      const id = part.trim();
      if (id) set.add(id);
    }
  }
  return set;
}

function pickRandomOfficialArtists(bucket: OfficialGenreBucket, count: number): string[] {
  const fresh = csprngShuffle(
    bucket.artists.filter((a) => !recentArtistSeeds.includes(a))
  );
  const pool = fresh.length >= count ? fresh : csprngShuffle(bucket.artists);
  const chosen = pool.slice(0, count);
  for (const a of chosen) {
    recentArtistSeeds.push(a);
  }
  if (recentArtistSeeds.length > 90) {
    recentArtistSeeds.splice(0, recentArtistSeeds.length - 90);
  }
  return chosen;
}

function buildOfficialSingerQuery(artist: string): string {
  const mode = randomInt(0, 3);
  if (mode === 0) return `${artist} official music video`;
  if (mode === 1) return `${artist} official audio`;
  return `${artist} songs official`;
}

function buildProceduralArchetypes(count: number) {
  const shuffledBuckets = csprngShuffle(OFFICIAL_SINGER_BUCKETS);
  const shuffledMoods = csprngShuffle(RANDOM_MOODS);
  const picked: Array<{
    id: string;
    name: string;
    description: string;
    tag: string;
    artists: string[];
    queries: string[];
  }> = [];

  for (let i = 0; i < Math.min(count, shuffledBuckets.length); i++) {
    const bucket = shuffledBuckets[i];
    const mood = shuffledMoods[i % shuffledMoods.length];
    const artists = pickRandomOfficialArtists(bucket, 2);

    const styleVariant = randomInt(0, 3);
    const title =
      styleVariant === 0
        ? `${mood.label}: ${bucket.genre}`
        : styleVariant === 1
        ? `${bucket.genre} Spotlight`
        : `${bucket.genre} · ${mood.label}`;

    picked.push({
      id: `rand-${randomBytes(4).toString('hex')}`,
      name: title,
      description: `Official releases featuring ${artists.join(', ')} and more — ${mood.desc.toLowerCase()}`,
      tag: randomInt(0, 2) === 0 ? bucket.tag : mood.tag,
      artists,
      queries: artists.map((a) => buildOfficialSingerQuery(a)),
    });
  }

  return picked;
}

function cleanOfficialChannelName(rawChannel: string): string {
  return rawChannel
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/VEVO$/i, '')
    .replace(/\s+Official$/i, '')
    .trim();
}

async function scrapeYouTubeMusic(
  rawQuery: string,
  options: {
    limit?: number;
    singleTracksOnly?: boolean;
    officialOnly?: boolean;
    excludeIds?: Set<string>;
  } = {}
): Promise<any[]> {
  const {
    limit = 16,
    singleTracksOnly = false,
    officialOnly = false,
    excludeIds = KNOWN_RESTRICTED_IDS,
  } = options;

  const officialQuery = /official\s*(music\s*)?(video|audio)|songs?\s+official/i.test(rawQuery)
    ? rawQuery
    : `${rawQuery} official music video`;

  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(officialQuery)}`;
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(5500),
  });

  if (!response.ok) {
    throw new Error(`YouTube responded with status ${response.status}`);
  }

  const html = await response.text();
  const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/ytInitialData\s*=\s*({.+?});/);
  if (!match) return [];

  const data = JSON.parse(match[1]);
  const sections = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents || [];
  const tracks: any[] = [];
  const seenLocal = new Set<string>();

  for (const sec of sections) {
    const renderers = sec.itemSectionRenderer?.contents || [];
    for (const item of renderers) {
      if (!item.videoRenderer) continue;
      const v = item.videoRenderer;
      const videoId = v.videoId;
      if (!videoId || seenLocal.has(videoId) || KNOWN_RESTRICTED_IDS.has(videoId) || excludeIds.has(videoId)) {
        continue;
      }

      const title = v.title?.runs?.map((r: any) => r.text).join('') || v.title?.simpleText || 'Unknown Title';
      const rawChannel = v.ownerText?.runs?.map((r: any) => r.text).join('') || 'YouTube Artist';
      const duration = v.lengthText?.simpleText || '';
      const durationSec = parseDurationSec(duration);
      const views = v.viewCountText?.simpleText || '';
      const thumbs = v.thumbnail?.thumbnails || [];
      const thumbnail = thumbs[thumbs.length - 1]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      const lowerTitle = title.toLowerCase();
      const lowerChannel = rawChannel.toLowerCase();

      const hasVerifiedArtistBadge = !!v.ownerBadges?.some(
        (b: any) => b.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_VERIFIED_ARTIST'
      );
      const hasVerifiedBadge = !!v.ownerBadges?.some(
        (b: any) => b.metadataBadgeRenderer?.style === 'BADGE_STYLE_TYPE_VERIFIED'
      );
      const isTopicChannel = /\s*-\s*topic$/i.test(rawChannel);
      const isVevoChannel = /vevo/i.test(rawChannel);
      const isKnownLabelChannel = OFFICIAL_LABEL_CHANNEL_PATTERN.test(rawChannel);
      const isUnofficialChannel = UNOFFICIAL_CHANNEL_PATTERN.test(rawChannel);

      // Strictly block obvious non-music uploads everywhere
      const isDisqualified =
        lowerTitle.includes('1 hour') ||
        lowerTitle.includes('10 hours') ||
        lowerTitle.includes('reaction') ||
        lowerTitle.includes('tutorial') ||
        lowerTitle.includes('how to play') ||
        lowerTitle.includes('parody') ||
        lowerTitle.includes('podcast') ||
        lowerTitle.includes('interview') ||
        lowerTitle.includes('behind the scenes') ||
        lowerTitle.includes('making of');

      if (isDisqualified) continue;

      // True official singer/label verification (never fooled by fan channels typing "Official" in title)
      const isVerifiedOfficialSource =
        !isUnofficialChannel &&
        (hasVerifiedArtistBadge ||
          isTopicChannel ||
          isVevoChannel ||
          isKnownLabelChannel ||
          (hasVerifiedBadge &&
            (lowerTitle.includes('official music video') ||
              lowerTitle.includes('official video') ||
              lowerTitle.includes('official audio') ||
              lowerTitle.includes('official lyric video'))));

      if (singleTracksOnly) {
        const isMixOrCompilation =
          !duration ||
          duration === 'Live' ||
          durationSec < 95 ||
          durationSec > 540 ||
          UNOFFICIAL_TITLE_PATTERN.test(lowerTitle);
        if (isMixOrCompilation) continue;
      }

      if (officialOnly) {
        if (!isVerifiedOfficialSource) continue;
        // Also exclude fan lyric videos unless uploaded directly by the Official Artist Channel
        if (!hasVerifiedArtistBadge && !isTopicChannel && /\blyrics?\b/i.test(lowerTitle) && !isKnownLabelChannel) {
          continue;
        }
      }

      const displayArtist = cleanOfficialChannelName(rawChannel) || rawChannel;

      seenLocal.add(videoId);
      tracks.push({
        id: videoId,
        title,
        artist: displayArtist,
        duration: duration || 'Live',
        durationSec,
        views,
        thumbnail,
        isOfficial: isVerifiedOfficialSource,
      });
    }
  }

  if (singleTracksOnly || officialOnly) {
    const official = csprngShuffle(tracks.filter((t) => t.isOfficial));
    const result = officialOnly
      ? official.slice(0, limit)
      : [...official, ...csprngShuffle(tracks.filter((t) => !t.isOfficial))].slice(0, limit);
    addToLivePool(result);
    return result;
  }

  tracks.sort((a, b) => {
    if (a.isOfficial && !b.isOfficial) return -1;
    if (!a.isOfficial && b.isOfficial) return 1;
    return 0;
  });

  addToLivePool(tracks.filter((t) => t.isOfficial && t.durationSec >= 95 && t.durationSec <= 540));
  return tracks.slice(0, limit);
}

function getAllFallbackTracks(excludeIds: Set<string>): any[] {
  const combined = new Map<string, any>();
  for (const t of liveDiscoveredPool.values()) {
    if (!KNOWN_RESTRICTED_IDS.has(t.id) && !excludeIds.has(t.id) && t.isOfficial) {
      combined.set(t.id, t);
    }
  }
  for (const g of CURATED_GENRES) {
    for (const t of g.tracks) {
      if (!KNOWN_RESTRICTED_IDS.has(t.id) && !excludeIds.has(t.id) && !combined.has(t.id)) {
        combined.set(t.id, { ...t, isOfficial: true });
      }
    }
  }
  return csprngShuffle(Array.from(combined.values()));
}

function getCanonicalTrackKey(rawTitle: string): string {
  return rawTitle
    .toLowerCase()
    .replace(/\s*[\(\[]\s*[^\)\]]*(official|video|audio|lyric|visualizer|hd|4k|live|remaster|vevo|m\/v|mv|performance|session)[^\)\]]*[\)\]]/gi, '')
    .replace(/\s*\|.*$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

async function generateRandomUniverse(clientExclude: Set<string>) {
  const seed = randomBytes(6).toString('hex');
  const recentSet = new Set<string>([...clientExclude, ...recentServedIds.slice(-90)]);
  const archetypes = buildProceduralArchetypes(4);

  // Query 2 randomly chosen official singers per collection in parallel (8 verified singer searches total)
  const scrapeResults = await Promise.all(
    archetypes.map(async (arch) => {
      const settled = await Promise.allSettled(
        arch.queries.map((q) =>
          scrapeYouTubeMusic(q, {
            limit: 10,
            singleTracksOnly: true,
            officialOnly: true,
            excludeIds: recentSet,
          })
        )
      );
      const merged: any[] = [];
      for (const r of settled) {
        if (r.status === 'fulfilled') merged.push(...r.value);
      }
      return csprngShuffle(merged);
    })
  );

  const usedGlobalIds = new Set<string>();
  const usedGlobalTitles = new Set<string>();
  const fallbackPool = getAllFallbackTracks(recentSet);
  const emergencyPool = getAllFallbackTracks(KNOWN_RESTRICTED_IDS);

  const genres = archetypes.map((arch, idx) => {
    const liveTracks = scrapeResults[idx] || [];
    const collectionTracks: any[] = [];

    for (const t of csprngShuffle(liveTracks)) {
      if (collectionTracks.length >= 7) break;
      const canon = getCanonicalTrackKey(t.title || '');
      if (
        !usedGlobalIds.has(t.id) &&
        !KNOWN_RESTRICTED_IDS.has(t.id) &&
        (!canon || !usedGlobalTitles.has(canon))
      ) {
        usedGlobalIds.add(t.id);
        if (canon) usedGlobalTitles.add(canon);
        collectionTracks.push(t);
      }
    }

    // Supplement cleanly from verified official pool if a YouTube query returned fewer than 6 unique tracks
    const supplementSources = [fallbackPool, emergencyPool];
    for (const source of supplementSources) {
      if (collectionTracks.length >= 6) break;
      for (const t of source) {
        if (collectionTracks.length >= 6) break;
        const canon = getCanonicalTrackKey(t.title || '');
        if (
          !usedGlobalIds.has(t.id) &&
          !KNOWN_RESTRICTED_IDS.has(t.id) &&
          (!canon || !usedGlobalTitles.has(canon))
        ) {
          usedGlobalIds.add(t.id);
          if (canon) usedGlobalTitles.add(canon);
          collectionTracks.push(t);
        }
      }
    }

    return {
      id: arch.id,
      name: arch.name,
      description: arch.description,
      tag: arch.tag,
      tracks: csprngShuffle(collectionTracks),
    };
  });

  const shuffledGenres = csprngShuffle(genres.filter((g) => g.tracks.length > 0));
  const allUniverseTracks = csprngShuffle(shuffledGenres.flatMap((g) => g.tracks));

  const featured = allUniverseTracks.slice(0, 4);
  const popular = csprngShuffle(allUniverseTracks).slice(0, 9);
  const randomStarter =
    allUniverseTracks.length > 0
      ? csprngPick(allUniverseTracks)
      : csprngPick(CURATED_GENRES.flatMap((g) => g.tracks).filter((t) => !KNOWN_RESTRICTED_IDS.has(t.id)));

  recordServedTracks(allUniverseTracks.map((t) => t.id));

  return {
    seed,
    generatedAt: Date.now(),
    genres: shuffledGenres,
    featured,
    popular,
    randomStarter,
  };
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Report playback-restricted video to filter across all clients
  app.post('/api/report-restricted', (req: Request, res: Response) => {
    const { videoId } = req.body;
    if (videoId && typeof videoId === 'string') {
      KNOWN_RESTRICTED_IDS.add(videoId);
      liveDiscoveredPool.delete(videoId);
      console.warn(`[Restricted Video Added to Blacklist]: ${videoId}`);
    }
    res.json({ ok: true, count: KNOWN_RESTRICTED_IDS.size });
  });

  // API 1: Totally Random Music Universe (Fresh collections, spotlight, popular, and starter every single time)
  const handleRandomFeed = async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const excludeSet = parseExcludeSet(req.query.exclude);
    try {
      const universe = await generateRandomUniverse(excludeSet);
      res.json(universe);
    } catch (err: any) {
      console.error('Random universe generation error:', err?.message);
      const fallbackShuffled = csprngShuffle(CURATED_GENRES).map((g) => ({
        ...g,
        tracks: csprngShuffle(g.tracks.filter((t) => !KNOWN_RESTRICTED_IDS.has(t.id))),
      }));
      const flat = csprngShuffle(fallbackShuffled.flatMap((g) => g.tracks));
      res.json({
        seed: randomBytes(6).toString('hex'),
        generatedAt: Date.now(),
        genres: fallbackShuffled,
        featured: flat.slice(0, 4),
        popular: flat.slice(0, 9),
        randomStarter: flat[0] || CURATED_GENRES[0].tracks[0],
      });
    }
  };

  app.get('/api/curated', handleRandomFeed);
  app.get('/api/random-feed', handleRandomFeed);

  // API 2: Totally Random Live Recommendations (Fresh unseen songs every call)
  app.get('/api/recommendations', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const trackId = (req.query.trackId as string || '').trim();
    const limit = Math.min(20, Math.max(4, parseInt(req.query.limit as string || '10', 10)));
    const excludeSet = parseExcludeSet(req.query.exclude);
    if (trackId) excludeSet.add(trackId);

    try {
      // Pick 2 random official singer buckets (up to 3 random singers) for totally fresh official recommendations
      const seeds = buildProceduralArchetypes(2);
      const queries = seeds.flatMap((s) => s.queries).slice(0, 3);
      const liveResults = await Promise.allSettled(
        queries.map((q) =>
          scrapeYouTubeMusic(q, {
            limit: 10,
            singleTracksOnly: true,
            officialOnly: true,
            excludeIds: excludeSet,
          })
        )
      );

      const uniqueMap = new Map<string, any>();
      const usedRecTitles = new Set<string>();
      for (const r of liveResults) {
        if (r.status === 'fulfilled') {
          for (const t of csprngShuffle(r.value)) {
            const canon = getCanonicalTrackKey(t.title || '');
            if (
              !uniqueMap.has(t.id) &&
              !excludeSet.has(t.id) &&
              !KNOWN_RESTRICTED_IDS.has(t.id) &&
              (!canon || !usedRecTitles.has(canon))
            ) {
              uniqueMap.set(t.id, t);
              if (canon) usedRecTitles.add(canon);
            }
          }
        }
      }

      // Blend with unseen discovered official pool & catalog if needed
      if (uniqueMap.size < limit) {
        for (const t of getAllFallbackTracks(excludeSet)) {
          if (uniqueMap.size >= limit) break;
          if (!uniqueMap.has(t.id)) uniqueMap.set(t.id, t);
        }
      }
      if (uniqueMap.size < limit) {
        for (const t of getAllFallbackTracks(KNOWN_RESTRICTED_IDS)) {
          if (uniqueMap.size >= limit) break;
          if (!uniqueMap.has(t.id) && t.id !== trackId) uniqueMap.set(t.id, t);
        }
      }

      const recommendations = csprngShuffle(Array.from(uniqueMap.values())).slice(0, limit);
      recordServedTracks(recommendations.map((t) => t.id));

      res.json({
        seed: randomBytes(4).toString('hex'),
        recommendations,
      });
    } catch (err: any) {
      console.error('Error generating random recommendations:', err);
      const fallback = getAllFallbackTracks(excludeSet).slice(0, limit);
      res.json({ seed: randomBytes(4).toString('hex'), recommendations: fallback });
    }
  });

  // API 2b: Instant Surprise / Totally Random Official Singer Track (+ fresh random up-next batch)
  app.get('/api/random-track', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    const excludeSet = parseExcludeSet(req.query.exclude);

    try {
      const [arch] = buildProceduralArchetypes(1);
      const settled = await Promise.allSettled(
        arch.queries.map((q) =>
          scrapeYouTubeMusic(q, {
            limit: 10,
            singleTracksOnly: true,
            officialOnly: true,
            excludeIds: excludeSet,
          })
        )
      );
      const live: any[] = [];
      for (const r of settled) {
        if (r.status === 'fulfilled') live.push(...r.value);
      }

      const unseenPool = [...csprngShuffle(live), ...getAllFallbackTracks(excludeSet)];
      const deduped: any[] = [];
      const seen = new Set<string>();
      for (const t of unseenPool) {
        if (!t?.id || seen.has(t.id) || excludeSet.has(t.id) || KNOWN_RESTRICTED_IDS.has(t.id)) continue;
        seen.add(t.id);
        deduped.push(t);
      }

      const finalPool = deduped.length > 0 ? deduped : getAllFallbackTracks(KNOWN_RESTRICTED_IDS);
      const picked = csprngPick(finalPool.slice(0, Math.min(6, finalPool.length))) || finalPool[0];
      const upNext = csprngShuffle(finalPool.filter((t) => t.id !== picked?.id)).slice(0, 6);

      if (picked) recordServedTracks([picked.id, ...upNext.map((t) => t.id)]);

      res.json({
        seed: randomBytes(4).toString('hex'),
        vibe: arch.name,
        track: picked,
        upNext,
      });
    } catch (err: any) {
      console.error('Random track error:', err?.message);
      const fallback = getAllFallbackTracks(KNOWN_RESTRICTED_IDS);
      res.json({
        seed: randomBytes(4).toString('hex'),
        vibe: 'Random Discovery',
        track: fallback[0] || CURATED_GENRES[0].tracks[0],
        upNext: fallback.slice(1, 6),
      });
    }
  });

  // API 2c: Search Autocomplete Suggestions
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
        signal: AbortSignal.timeout(4000),
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
      return res.json({ tracks: getAllFallbackTracks(KNOWN_RESTRICTED_IDS).slice(0, 12) });
    }

    try {
      const results = await scrapeYouTubeMusic(rawQ, { limit: 25, singleTracksOnly: false });
      if (results.length > 0) {
        return res.json({ tracks: results });
      }
      const matched = getAllFallbackTracks(KNOWN_RESTRICTED_IDS).filter(
        (t) =>
          t.title.toLowerCase().includes(rawQ.toLowerCase()) ||
          t.artist.toLowerCase().includes(rawQ.toLowerCase())
      );
      return res.json({
        tracks: matched.length > 0 ? matched : getAllFallbackTracks(KNOWN_RESTRICTED_IDS).slice(0, 12),
      });
    } catch (err: any) {
      console.error('Search error:', err.message);
      res.json({ tracks: getAllFallbackTracks(KNOWN_RESTRICTED_IDS).slice(0, 12) });
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
  const lyricsCache = new Map<string, { payload: any; expiresAt: number }>();
  const inFlightLyrics = new Map<string, Promise<any>>();
  const geminiCooldownUntil = new Map<string, number>();
  let sharedGeminiClient: any = null;

  async function getServerGeminiClient() {
    if (!process.env.GEMINI_API_KEY) return null;
    if (!sharedGeminiClient) {
      const { GoogleGenAI } = await import('@google/genai');
      sharedGeminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return sharedGeminiClient;
  }

  function parseQuotaCooldownMs(err: any): number {
    const msg = String(err?.message || '');
    const retryMatch = msg.match(/"retryDelay"\s*:\s*"(\d+)s"/i) || msg.match(/retry in\s+(\d+)h(\d+)m/i);
    if (retryMatch) {
      if (retryMatch.length >= 3 && retryMatch[2]) {
        const hours = parseInt(retryMatch[1], 10) || 0;
        const mins = parseInt(retryMatch[2], 10) || 0;
        return Math.min(Math.max((hours * 3600 + mins * 60) * 1000, 60_000), 6 * 3600 * 1000);
      }
      const secs = parseInt(retryMatch[1], 10);
      if (Number.isFinite(secs) && secs > 0) {
        return Math.min(Math.max(secs * 1000, 60_000), 6 * 3600 * 1000);
      }
    }
    return 30 * 60 * 1000; // Default 30-minute cooldown on 429 RESOURCE_EXHAUSTED
  }

  function isQuotaError(err: any): boolean {
    const status = err?.status ?? err?.code;
    const msg = String(err?.message || '');
    return status === 429 || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
  }

  function normalizeForCompare(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function pickBestLrclibMatch(items: any[], cleanTrack: string, primaryArtist: string) {
    if (!Array.isArray(items) || items.length === 0) return null;
    const targetTrack = normalizeForCompare(cleanTrack);
    const targetArtist = normalizeForCompare(primaryArtist);

    let best: any = null;
    let bestScore = -1;

    for (const item of items) {
      if (!item || (!item.syncedLyrics && !item.plainLyrics && !item.instrumental)) continue;
      const itemTrack = normalizeForCompare(item.trackName || '');
      const itemArtist = normalizeForCompare(item.artistName || '');

      let score = 0;
      if (itemTrack === targetTrack) score += 60;
      else if (itemTrack.includes(targetTrack) || targetTrack.includes(itemTrack)) score += 35;

      if (targetArtist && itemArtist) {
        if (itemArtist === targetArtist) score += 40;
        else if (itemArtist.includes(targetArtist) || targetArtist.includes(itemArtist)) score += 25;
      }

      if (item.syncedLyrics) score += 15;
      else if (item.plainLyrics) score += 8;

      if (score > bestScore) {
        bestScore = score;
        best = item;
      }
    }

    return bestScore >= 35 ? best : null;
  }

  app.get('/api/lyrics', async (req: Request, res: Response) => {
    const rawTrack = (req.query.track as string || '').trim();
    const rawArtist = (req.query.artist as string || '').trim();
    const durationSec = req.query.durationSec ? parseInt(req.query.durationSec as string, 10) : 0;

    if (!rawTrack) {
      return res.status(400).json({ error: 'Missing track parameter' });
    }

    // Clean track title (strip common YouTube / edition / featured suffixes)
    let cleanTrack = rawTrack
      .replace(/\s*[\(\[]\s*(?:Official\s*(?:Music\s*)?)?(?:Video|Audio|Lyric\s*Video|HD|4K|Visualizer|Lyrics?|Remaster(?:ed)?(?:\s*\d+)?|Deluxe(?:\s*Edition)?|Acoustic|Live|Extended\s*Mix|Full\s*Song|Slowed.*|Reverb.*)\s*[\)\]]/gi, '')
      .replace(/\s*[\(\[]\s*(?:feat\.?|ft\.?|with)\s+[^\)\]]+[\)\]]/gi, '')
      .replace(/\s+(?:feat\.?|ft\.?)\s+.*$/i, '')
      .replace(/\s*\|.*$/, '')
      .trim();

    let cleanArtist = rawArtist
      .replace(/ - Topic$/i, '')
      .replace(/VEVO$/i, '')
      .replace(/\bOfficial\b/gi, '')
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

    const primaryArtist = cleanArtist
      .split(/\s*(?:,|&|\bfeat\.?\b|\bft\.?\b|\bx\b|×|\/)\s*/i)[0]
      .trim();

    const cacheKey = `${normalizeForCompare(cleanTrack)}::${normalizeForCompare(primaryArtist || cleanArtist)}`;
    const now = Date.now();
    const cached = lyricsCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return res.json(cached.payload);
    }

    const resolveLyrics = async () => {
      const lrclibHeaders = { 'User-Agent': 'MelophilePlayer/1.0' };

      // Step 1: Direct lookup on LRCLIB (with duration, then without duration if YouTube duration differs)
      if (primaryArtist) {
        const directUrls: string[] = [];
        const baseDirect = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTrack)}&artist_name=${encodeURIComponent(primaryArtist)}`;
        if (durationSec > 0) directUrls.push(`${baseDirect}&duration=${durationSec}`);
        directUrls.push(baseDirect);

        for (const directUrl of directUrls) {
          try {
            const lrclibRes = await fetch(directUrl, {
              headers: lrclibHeaders,
              signal: AbortSignal.timeout(4000),
            });
            if (lrclibRes.ok) {
              const data = await lrclibRes.json();
              if (data.syncedLyrics || data.plainLyrics || data.instrumental) {
                return {
                  track: data.trackName || cleanTrack,
                  artist: data.artistName || primaryArtist,
                  plainLyrics: data.plainLyrics || null,
                  syncedLyrics: data.syncedLyrics || null,
                  instrumental: !!data.instrumental,
                  source: 'lrclib',
                };
              }
            }
          } catch {
            // Try next strategy
          }
        }
      }

      // Step 2: Structured search on LRCLIB (track_name + artist_name, then general q)
      const searchQueries: string[] = [];
      if (primaryArtist) {
        searchQueries.push(
          `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTrack)}&artist_name=${encodeURIComponent(primaryArtist)}`
        );
        searchQueries.push(
          `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTrack} ${primaryArtist}`)}`
        );
      } else {
        searchQueries.push(`https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTrack)}`);
      }

      for (const searchUrl of searchQueries) {
        try {
          const searchRes = await fetch(searchUrl, {
            headers: lrclibHeaders,
            signal: AbortSignal.timeout(4000),
          });
          if (searchRes.ok) {
            const items = await searchRes.json();
            const match = pickBestLrclibMatch(items, cleanTrack, primaryArtist);
            if (match) {
              return {
                track: match.trackName || cleanTrack,
                artist: match.artistName || primaryArtist || cleanArtist,
                plainLyrics: match.plainLyrics || null,
                syncedLyrics: match.syncedLyrics || null,
                instrumental: !!match.instrumental,
                source: 'lrclib-search',
              };
            }
          }
        } catch {
          // Try next strategy
        }
      }

      // Step 3: Free secondary lyrics source (lyrics.ovh) before invoking AI fallback
      if (primaryArtist && cleanTrack) {
        try {
          const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(primaryArtist)}/${encodeURIComponent(cleanTrack)}`;
          const ovhRes = await fetch(ovhUrl, { signal: AbortSignal.timeout(3500) });
          if (ovhRes.ok) {
            const ovhData = await ovhRes.json();
            const rawOvhLyrics = typeof ovhData?.lyrics === 'string' ? ovhData.lyrics.trim() : '';
            if (rawOvhLyrics) {
              const cleanedOvh = rawOvhLyrics.replace(/^Paroles de la chanson .*?\n+/i, '').trim();
              if (cleanedOvh) {
                return {
                  track: cleanTrack,
                  artist: primaryArtist,
                  plainLyrics: cleanedOvh,
                  syncedLyrics: null,
                  instrumental: false,
                  source: 'lyrics-ovh',
                };
              }
            }
          }
        } catch {
          // Continue to optional Gemini fallback
        }
      }

      // Step 4: Optional Gemini fallback (lightweight model with quota circuit breaker)
      let quotaExceeded = false;
      const fallbackModel = 'gemini-3.1-flash-lite';
      const cooldownExpires = geminiCooldownUntil.get(fallbackModel) || 0;

      if (process.env.GEMINI_API_KEY) {
        if (Date.now() < cooldownExpires) {
          quotaExceeded = true;
        } else {
          try {
            const ai = await getServerGeminiClient();
            if (ai) {
              const response = await ai.models.generateContent({
                model: fallbackModel,
                contents: `Provide the official lyrics for the song "${cleanTrack}" by "${primaryArtist || cleanArtist}". If it is an instrumental track with no singing, respond only with "[Instrumental]". If you are unsure or do not know the verified lyrics, respond only with "[NotFound]". Otherwise return only the formatted lyrics with clean line breaks.`,
              });
              const text = (response.text || '').trim();
              if (text.includes('[Instrumental]')) {
                return {
                  track: cleanTrack,
                  artist: primaryArtist || cleanArtist,
                  plainLyrics: null,
                  syncedLyrics: null,
                  instrumental: true,
                  source: 'gemini',
                };
              }
              if (text && !text.includes('[NotFound]')) {
                return {
                  track: cleanTrack,
                  artist: primaryArtist || cleanArtist,
                  plainLyrics: text,
                  syncedLyrics: null,
                  instrumental: false,
                  source: 'gemini',
                };
              }
            }
          } catch (geminiErr: any) {
            if (isQuotaError(geminiErr)) {
              quotaExceeded = true;
              const cooldownMs = parseQuotaCooldownMs(geminiErr);
              geminiCooldownUntil.set(fallbackModel, Date.now() + cooldownMs);
            }
          }
        }
      }

      // Step 5: Graceful fallback when lyrics are not available
      return {
        track: cleanTrack,
        artist: primaryArtist || cleanArtist,
        plainLyrics: null,
        syncedLyrics: null,
        instrumental: false,
        notFound: true,
        quotaExceeded,
      };
    };

    try {
      let pending = inFlightLyrics.get(cacheKey);
      if (!pending) {
        pending = resolveLyrics().finally(() => {
          inFlightLyrics.delete(cacheKey);
        });
        inFlightLyrics.set(cacheKey, pending);
      }

      const payload = await pending;
      const ttlMs = payload.notFound ? 15 * 60 * 1000 : 24 * 60 * 60 * 1000;
      lyricsCache.set(cacheKey, { payload, expiresAt: Date.now() + ttlMs });

      // Bound cache size cleanly
      if (lyricsCache.size > 400) {
        const oldestKey = lyricsCache.keys().next().value;
        if (oldestKey) lyricsCache.delete(oldestKey);
      }

      return res.json(payload);
    } catch (err: any) {
      console.error('Lyrics endpoint error:', err.message);
      return res.status(500).json({ error: 'Failed to fetch lyrics' });
    }
  });

  // API 6: Multi-Source Ultra-High-Resolution Poster Discovery (iTunes + Deezer + maxres)
  const artworkCacheFile = path.resolve(__dirname, '.artwork-cache.json');
  const artworkCache = new Map<string, string>();

  // Hydrate server disk cache on startup
  try {
    if (fs.existsSync(artworkCacheFile)) {
      const data = JSON.parse(fs.readFileSync(artworkCacheFile, 'utf-8'));
      Object.entries(data).forEach(([k, v]) => {
        if (typeof v === 'string') artworkCache.set(k.toLowerCase(), v);
      });
      console.log(`[Server ArtworkCache] Loaded ${artworkCache.size} persistent posters from disk`);
    }
  } catch {}

  let saveArtworkDiskTimer: any = null;
  function persistArtworkToDisk() {
    if (saveArtworkDiskTimer) clearTimeout(saveArtworkDiskTimer);
    saveArtworkDiskTimer = setTimeout(() => {
      try {
        const obj = Object.fromEntries(artworkCache.entries());
        fs.writeFileSync(artworkCacheFile, JSON.stringify(obj, null, 2), 'utf-8');
      } catch {}
    }, 2000);
  }

  // Spotify Web API token cache
  let spotifyToken: string | null = null;
  let spotifyTokenExpiry = 0;

  async function getSpotifyToken(): Promise<string | null> {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientId || !clientSecret) return null;
    if (spotifyToken && Date.now() < spotifyTokenExpiry) return spotifyToken;
    try {
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      });
      if (res.ok) {
        const data = await res.json();
        spotifyToken = data.access_token;
        spotifyTokenExpiry = Date.now() + ((data.expires_in || 3600) - 60) * 1000;
        return spotifyToken;
      }
    } catch {}
    return null;
  }

  async function searchSpotifyArtwork(title: string, artist: string): Promise<string | null> {
    const token = await getSpotifyToken();
    if (!token) return null;
    try {
      const q = `${title} ${artist}`.trim();
      const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=1`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(3500),
      });
      if (res.ok) {
        const data = await res.json();
        const item = data.tracks?.items?.[0];
        const img = item?.album?.images?.[0]?.url;
        if (img) return img;
      }
    } catch {}
    return null;
  }

  async function resolveArtwork(trackTitle: string, artistName: string, videoId?: string): Promise<string | null> {
    const cleanTrack = (trackTitle || '')
      .replace(/\s*[\(\[]\s*(?:Official\s*(?:Music\s*)?)?(?:Video|Audio|Lyric\s*Video|HD|4K|Visualizer|Lyrics?)\s*[\)\]]/gi, '')
      .replace(/\s*\|.*$/, '')
      .trim();

    let cleanArtist = (artistName || '')
      .replace(/ - Topic$/i, '')
      .replace(/VEVO$/i, '')
      .replace(/Official$/i, '')
      .trim();

    const monikerMatch = cleanArtist.match(/\(([^)]+)\)/);
    if (monikerMatch && monikerMatch[1].trim()) {
      const moniker = monikerMatch[1].trim();
      const isExcluded = /(?:records?|entertainment|label|sony|warner|universal|music|ent|prod|topic|official|remaster|deluxe|live|audio|video|explicit|version)/i.test(moniker);
      if (!isExcluded) {
        cleanArtist = moniker;
      } else {
        cleanArtist = cleanArtist.replace(/\s*[\(\[].*?[\)\]]/g, '').trim();
      }
    } else {
      const lower = cleanArtist.toLowerCase();
      if (lower.includes('edward christopher sheeran')) cleanArtist = 'Ed Sheeran';
      else if (lower.includes('harry edward styles')) cleanArtist = 'Harry Styles';
      else if (lower.includes('adele adkins')) cleanArtist = 'Adele';
      else if (lower.includes('austin richard post')) cleanArtist = 'Post Malone';
      else cleanArtist = cleanArtist.replace(/\s*[\(\[].*?[\)\]]/g, '').trim();
    }

    const cacheKey = `${cleanTrack}::${cleanArtist}`.toLowerCase();
    if (artworkCache.has(cacheKey)) {
      return artworkCache.get(cacheKey)!;
    }

    const query = `${cleanTrack} ${cleanArtist}`.trim();
    if (!query) return null;

    // Source 1: Spotify Web API Official Album Artwork
    const spotifyArt = await searchSpotifyArtwork(cleanTrack, cleanArtist);
    if (spotifyArt) {
      artworkCache.set(cacheKey, spotifyArt);
      persistArtworkToDisk();
      return spotifyArt;
    }

    // Source 2: Apple Music / iTunes Store Search (Lossless 1200x1200bb)
    try {
      const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;
      const itunesRes = await fetch(itunesUrl, { signal: AbortSignal.timeout(3500) });
      if (itunesRes.ok) {
        const data = await itunesRes.json();
        if (data.results && data.results.length > 0 && data.results[0].artworkUrl100) {
          const highRes = data.results[0].artworkUrl100.replace(/\/\d+x\d+bb\./, '/1200x1200bb.');
          artworkCache.set(cacheKey, highRes);
          persistArtworkToDisk();
          return highRes;
        }
      }
    } catch {}

    // Source 3: Deezer API Search (Official studio master cover_xl 1000x1000)
    try {
      const deezerUrl = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`;
      const deezerRes = await fetch(deezerUrl, { signal: AbortSignal.timeout(3500) });
      if (deezerRes.ok) {
        const data = await deezerRes.json();
        const item = data.data?.[0];
        const cover = item?.album?.cover_xl || item?.album?.cover_big;
        if (cover) {
          artworkCache.set(cacheKey, cover);
          persistArtworkToDisk();
          return cover;
        }
      }
    } catch {}

    // Source 4: High-Resolution YouTube Poster fallback
    if (videoId) {
      const maxresUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
      artworkCache.set(cacheKey, maxresUrl);
      persistArtworkToDisk();
      return maxresUrl;
    }

    return null;
  }

  // Single track highres artwork (with 7-day browser Cache-Control)
  app.get('/api/highres-artwork', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    const rawTrack = (req.query.track as string || '').trim();
    const rawArtist = (req.query.artist as string || '').trim();
    const videoId = (req.query.videoId as string || '').trim();
    const artworkUrl = await resolveArtwork(rawTrack, rawArtist, videoId);
    res.json({ artworkUrl });
  });

  // Batch highres artwork resolution for lists (with 7-day browser Cache-Control)
  app.post('/api/batch-artwork', async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
    const items = Array.isArray(req.body.items) ? req.body.items.slice(0, 20) : [];
    const results: Record<string, string> = {};

    await Promise.all(
      items.map(async (item: any) => {
        if (!item || !item.id) return;
        const art = await resolveArtwork(item.title, item.artist, item.id);
        if (art) results[item.id] = art;
      })
    );

    res.json({ artworks: results });
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
