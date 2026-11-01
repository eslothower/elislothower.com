const test = require('node:test');
const assert = require('node:assert/strict');
const { readdir, readFile } = require('node:fs/promises');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const extensions = /\.(?:avif|gif|jpe?g|png|webp)$/i;

test('portrait fallback manifest matches the slide directory', async () => {
  const files = (await readdir(path.join(root, 'assets/images/portrait-slides')))
    .filter(file => extensions.test(file))
    .sort();
  const manifest = JSON.parse(await readFile(path.join(root, 'assets/images/portrait-slides.json'), 'utf8'));

  assert.deepEqual(manifest, files);
});
