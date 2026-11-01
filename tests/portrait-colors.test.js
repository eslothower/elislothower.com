const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_GLOW, pickGlowColors } = require('../portrait-colors');

const pixels = (...groups) => new Uint8ClampedArray(groups.flatMap(([count, color]) => (
  Array.from({ length: count }, () => color).flat()
)));

const hslFor = hex => {
  const channels = hex.match(/[\da-f]{2}/gi).map(value => Number.parseInt(value, 16) / 255);
  const maximum = Math.max(...channels);
  const minimum = Math.min(...channels);
  const chroma = maximum - minimum;
  const lightness = (maximum + minimum) / 2;
  let hue = 0;

  if (chroma) {
    if (maximum === channels[0]) hue = ((channels[1] - channels[2]) / chroma) % 6;
    else if (maximum === channels[1]) hue = (channels[2] - channels[0]) / chroma + 2;
    else hue = (channels[0] - channels[1]) / chroma + 4;
    hue = (hue * 60 + 360) % 360;
  }

  return [hue, chroma ? chroma / (1 - Math.abs(2 * lightness - 1)) : 0];
};

const assertVibrantAndDistinct = colors => {
  const [first, second] = colors.map(hslFor);
  const hueDifference = Math.abs(first[0] - second[0]);

  assert.ok(first[1] >= 0.67);
  assert.ok(second[1] >= 0.67);
  assert.ok(Math.min(hueDifference, 360 - hueDifference) >= 90);
};

test('portrait glows favor vibrant, separated image hues', () => {
  const varied = pickGlowColors(pixels(
    [600, [30, 90, 220, 255]],
    [300, [35, 95, 215, 255]],
    [124, [230, 120, 40, 255]]
  ));
  const profile = pickGlowColors(pixels(
    [155, [78, 81, 79, 255]],
    [76, [108, 108, 80, 255]],
    [67, [79, 82, 49, 255]],
    [60, [241, 243, 248, 255]],
    [59, [135, 148, 55, 255]],
    [58, [46, 46, 45, 255]],
    [58, [143, 150, 74, 255]],
    [36, [136, 153, 172, 255]]
  ));
  const muted = pickGlowColors(pixels(
    [600, [180, 170, 149, 255]],
    [250, [142, 142, 85, 255]],
    [174, [208, 171, 144, 255]]
  ));
  const narrow = pickGlowColors(pixels(
    [800, [95, 127, 159, 255]],
    [224, [96, 128, 160, 255]]
  ));
  const noisy = pickGlowColors(pixels(
    [1023, [100, 120, 140, 255]],
    [1, [255, 0, 0, 255]]
  ));
  const lowChroma = pickGlowColors(pixels(
    [600, [186, 198, 213, 255]],
    [424, [120, 120, 120, 255]]
  ));
  const grayscale = pickGlowColors(pixels([1024, [120, 120, 120, 255]]));
  const transparent = pickGlowColors(pixels([1024, [255, 0, 0, 0]]));

  assert.deepEqual(varied, ['#0f54eb', '#f1761d']);
  assert.deepEqual(profile, ['#abc125', '#4b90dd']);
  assert.deepEqual(muted, ['#c1c125', '#2525c1']);
  assert.deepEqual(narrow, ['#297fd5', '#d57f29']);
  assert.deepEqual(noisy, ['#2678ca', '#ca7826']);
  assert.deepEqual(lowChroma, ['#4b8cdd', '#dd9c4b']);
  [varied, profile, muted, narrow, noisy, lowChroma].forEach(assertVibrantAndDistinct);
  assert.deepEqual(grayscale, DEFAULT_GLOW);
  assert.deepEqual(transparent, DEFAULT_GLOW);
});
