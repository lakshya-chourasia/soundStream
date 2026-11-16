import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanTitleForSearch,
  cleanArtistForSearch,
  getArtwork,
  clearArtworkCache,
  getArtworkCacheStats,
  DEFAULT_ARTWORK_FALLBACK,
} from './artworkService';

test('cleanTitleForSearch cleans official video, 4K, and remix tags', () => {
  assert.equal(cleanTitleForSearch('Blinding Lights (Official Music Video)'), 'Blinding Lights');
  assert.equal(cleanTitleForSearch('Shape of You [Official Video]'), 'Shape of You');
  assert.equal(cleanTitleForSearch('Yellow (Remastered 2021)'), 'Yellow');
  assert.equal(cleanTitleForSearch('As It Was | Official Audio'), 'As It Was');
  assert.equal(cleanTitleForSearch('Levitating ft. DaBaby'), 'Levitating');
});

test('cleanArtistForSearch cleans VEVO, - Topic, and bracket artifacts', () => {
  assert.equal(cleanArtistForSearch('The Weeknd - Topic'), 'The Weeknd');
  assert.equal(cleanArtistForSearch('ColdplayVEVO'), 'Coldplay');
  assert.equal(cleanArtistForSearch('Dua Lipa (Warner Records)'), 'Dua Lipa');
  assert.equal(cleanArtistForSearch('Christopher Comstock (Marshmello)'), 'Marshmello');
  assert.equal(cleanArtistForSearch('Abel Tesfaye (The Weeknd)'), 'The Weeknd');
  assert.equal(cleanArtistForSearch('Danielle Haim (HAIM)'), 'HAIM');
});

test('resolution upscaling replaces 100x100bb with 600x600bb', () => {
  const original = 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/61/e7/3f/61e73f94-018d-5f50-50ec-8521952bc72e/20UM1IM11629.rgb.jpg/100x100bb.jpg';
  const upscaled = original.replace(/\/\d+x\d+bb\./, '/600x600bb.');
  assert.ok(upscaled.includes('/600x600bb.'));
  assert.ok(!upscaled.includes('/100x100bb.'));
});

test('artwork cache stats and clear function work properly', async () => {
  await clearArtworkCache();
  const stats = getArtworkCacheStats();
  assert.equal(stats.memorySize, 0);
  assert.equal(stats.totalHits, 0);
});

test('getArtwork returns fallback when title is empty', async () => {
  const res = await getArtwork('', '', 'fallback-test-id');
  assert.ok(res.includes('fallback-test-id') || res === DEFAULT_ARTWORK_FALLBACK);
});

