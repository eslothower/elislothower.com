const test = require('node:test');
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const {
  rectangleClipPath,
  shouldOpenViewer,
  transformBetween,
  wrapPhotoIndex
} = require('../script');

test('portrait viewer motion keeps navigation and drag activation deterministic', () => {
  assert.equal(wrapPhotoIndex(10, 10), 0);
  assert.equal(wrapPhotoIndex(-1, 10), 9);
  assert.equal(shouldOpenViewer(6), true);
  assert.equal(shouldOpenViewer(6.01), false);

  const shape = rectangleClipPath(120);
  assert.equal((shape.match(/%/g) || []).length, 240);
  assert.equal(
    transformBetween(
      { left: 10, top: 20, width: 100, height: 75 },
      { left: 0, top: 0, width: 400, height: 300 }
    ),
    'translate(-140.00px,-92.50px) scale(0.2500,0.2500)'
  );
});

test('homepage photos link to full images with accessible descriptions', async () => {
  const html = await readFile(path.resolve(__dirname, '..', 'index.html'), 'utf8');
  const photos = [...html.matchAll(/<a href="([^"]+)" aria-label="View the full [^"]+">\s*<img src="([^"]+)"[^>]+alt="([^"]+)"/g)];
  assert.equal(photos.length, 5);
  for (const [, href, src, alt] of photos) {
    assert.equal(href, src);
    assert.ok(alt.length > 0);
    await readFile(path.resolve(__dirname, '..', src));
  }
});
