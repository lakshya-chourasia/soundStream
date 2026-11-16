import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatTime,
  parseDurationToSeconds,
  extractYouTubeId,
  getNextTrackIndex,
  getPrevTrackIndex,
  cleanTrackTitle,
  parseLrcLyrics,
  findActiveLyricIndex,
  getDynamicTrackTag,
  getFullSingerName,
} from './playerUtils.js';

test('formatTime correctly formats seconds into mm:ss and hh:mm:ss', () => {
  assert.equal(formatTime(0), '0:00');
  assert.equal(formatTime(9), '0:09');
  assert.equal(formatTime(45), '0:45');
  assert.equal(formatTime(60), '1:00');
  assert.equal(formatTime(75), '1:15');
  assert.equal(formatTime(273), '4:33');
  assert.equal(formatTime(3600), '1:00:00');
  assert.equal(formatTime(3665), '1:01:05');
  assert.equal(formatTime(-10), '0:00');
});

test('parseDurationToSeconds correctly parses various YouTube duration strings', () => {
  assert.equal(parseDurationToSeconds('0:00'), 0);
  assert.equal(parseDurationToSeconds('3:45'), 225);
  assert.equal(parseDurationToSeconds('4:33'), 273);
  assert.equal(parseDurationToSeconds('1:02:15'), 3735);
  assert.equal(parseDurationToSeconds('invalid'), 0);
});

test('extractYouTubeId extracts IDs from varied valid YouTube URLs and raw IDs', () => {
  // Raw 11-char ID
  assert.equal(extractYouTubeId('yKNxeF4KMsY'), 'yKNxeF4KMsY');
  assert.equal(extractYouTubeId('dQw4w9WgXcQ'), 'dQw4w9WgXcQ');

  // Standard watch URLs
  assert.equal(
    extractYouTubeId('https://www.youtube.com/watch?v=yKNxeF4KMsY'),
    'yKNxeF4KMsY'
  );
  assert.equal(
    extractYouTubeId('https://www.youtube.com/watch?v=yKNxeF4KMsY&t=45s'),
    'yKNxeF4KMsY'
  );

  // Short youtu.be URLs
  assert.equal(
    extractYouTubeId('https://youtu.be/yKNxeF4KMsY?si=abc123xyz'),
    'yKNxeF4KMsY'
  );

  // Embed URLs
  assert.equal(
    extractYouTubeId('https://www.youtube.com/embed/yKNxeF4KMsY'),
    'yKNxeF4KMsY'
  );

  // Music YouTube URLs
  assert.equal(
    extractYouTubeId('https://music.youtube.com/watch?v=yKNxeF4KMsY'),
    'yKNxeF4KMsY'
  );

  // Shorts URLs
  assert.equal(
    extractYouTubeId('https://youtube.com/shorts/yKNxeF4KMsY'),
    'yKNxeF4KMsY'
  );

  // Invalid strings
  assert.equal(extractYouTubeId(''), null);
  assert.equal(extractYouTubeId('https://google.com'), null);
  assert.equal(extractYouTubeId('not-a-youtube-url'), null);
});

test('getNextTrackIndex handles sequential, repeat all, and repeat one modes', () => {
  const queueLen = 5;

  // Sequential progression
  assert.equal(getNextTrackIndex(0, queueLen, 'off', false), 1);
  assert.equal(getNextTrackIndex(1, queueLen, 'off', false), 2);
  assert.equal(getNextTrackIndex(3, queueLen, 'off', false), 4);
  assert.equal(getNextTrackIndex(4, queueLen, 'off', false), null); // End of queue

  // Repeat All
  assert.equal(getNextTrackIndex(4, queueLen, 'all', false), 0);

  // Repeat One
  assert.equal(getNextTrackIndex(2, queueLen, 'one', false), 2);
});

test('getPrevTrackIndex restarts track if playing > 3s, or goes to prev track', () => {
  const queueLen = 4;
  // If > 3 seconds, should return same index to restart track
  assert.equal(getPrevTrackIndex(2, queueLen, 12), 2);

  // If <= 3 seconds, should go to previous track
  assert.equal(getPrevTrackIndex(2, queueLen, 1.5), 1);
  assert.equal(getPrevTrackIndex(0, queueLen, 0.5), 3); // Wraps around
});

test('cleanTrackTitle strips video bloat and extracts artist', () => {
  const res1 = cleanTrackTitle('Coldplay - Yellow (Official Video)');
  assert.equal(res1.title, 'Yellow');
  assert.equal(res1.artistFromTitle, 'Coldplay');

  const res2 = cleanTrackTitle('Lofi Girl - Synthwave Beats [Visualizer]');
  assert.equal(res2.title, 'Synthwave Beats');
  assert.equal(res2.artistFromTitle, 'Lofi Girl');

  const res3 = cleanTrackTitle('Acoustic Breeze (Lyrics)');
  assert.equal(res3.title, 'Acoustic Breeze');
});

test('parseLrcLyrics accurately converts LRC timestamps and text into sorted lyric lines', () => {
  const lrc = `
    [00:15.50] Look at the stars
    [00:19.20] Look how they shine for you
    [00:24.00] And everything you do
  `;
  const parsed = parseLrcLyrics(lrc);
  assert.equal(parsed.length, 3);
  assert.equal(parsed[0].time, 15.5);
  assert.equal(parsed[0].text, 'Look at the stars');
  assert.equal(parsed[1].time, 19.2);
  assert.equal(parsed[1].text, 'Look how they shine for you');
  assert.equal(parsed[2].time, 24);
  assert.equal(parsed[2].text, 'And everything you do');

  // Empty input returns empty array
  assert.deepEqual(parseLrcLyrics(''), []);
});

test('findActiveLyricIndex detects correct current line based on playback time', () => {
  const lines = [
    { time: 10, text: 'First line' },
    { time: 20, text: 'Second line' },
    { time: 30, text: 'Third line' },
  ];

  assert.equal(findActiveLyricIndex(lines, 0), -1);
  assert.equal(findActiveLyricIndex(lines, 9.8), 0); // within 0.25s anticipation
  assert.equal(findActiveLyricIndex(lines, 15), 0);
  assert.equal(findActiveLyricIndex(lines, 20.5), 1);
  assert.equal(findActiveLyricIndex(lines, 35), 2);
});

test('getDynamicTrackTag accurately generates relevant dynamic hashtags', () => {
  assert.equal(getDynamicTrackTag('Days of Thunder', 'The Midnight'), '#SYNTHWAVE');
  assert.equal(getDynamicTrackTag('Someone Like You', 'Adele'), '#RELATIONSHIPS');
  assert.equal(getDynamicTrackTag('Yellow', 'Coldplay'), '#ALT-ROCK');
  assert.equal(getDynamicTrackTag('Alone', 'Marshmello'), '#RELATIONSHIPS');
  assert.equal(getDynamicTrackTag('Resonance', 'HOME'), '#CHILLOUT');
  assert.equal(getDynamicTrackTag('Bloom', 'The Paper Kites'), '#ACOUSTIC');
  assert.equal(getDynamicTrackTag('Shape of You', 'Ed Sheeran', '6.2B views'), '#GLOBAL-HIT');
});

test('getFullSingerName correctly maps stage names, mononyms, and bands to full singer names', () => {
  assert.equal(getFullSingerName('Adele'), 'Adele Adkins');
  assert.equal(getFullSingerName('Coldplay'), 'Chris Martin (Coldplay)');
  assert.equal(getFullSingerName('Queen'), 'Freddie Mercury (Queen)');
  assert.equal(getFullSingerName('The Weeknd'), 'Abel Tesfaye (The Weeknd)');
  assert.equal(getFullSingerName('The Killers'), 'Brandon Flowers (The Killers)');
  assert.equal(getFullSingerName('Arctic Monkeys'), 'Alex Turner (Arctic Monkeys)');
  assert.equal(getFullSingerName('Avicii', 'Wake Me Up'), 'Aloe Blacc (Avicii)');
  assert.equal(getFullSingerName('Haim'), 'Danielle Haim (HAIM)');
  assert.equal(getFullSingerName('Ed Sheeran'), 'Edward Christopher Sheeran');
  assert.equal(getFullSingerName('Harry Styles'), 'Harry Edward Styles');
  assert.equal(getFullSingerName('Dua Lipa'), 'Dua Lipa');
});

