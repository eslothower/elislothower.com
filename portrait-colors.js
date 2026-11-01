const PortraitColors = (() => {
  const DEFAULT_GLOW = Object.freeze(['transparent', 'transparent']);
  const MIN_DISTANCE = 0.25;
  const MIN_CHROMA = 0.02;
  const MIN_HUE_DISTANCE = 90;
  const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

  const toLinear = value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };

  const toOklab = ([red, green, blue]) => {
    const r = toLinear(red);
    const g = toLinear(green);
    const b = toLinear(blue);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    ];
  };

  const distance = (first, second) => {
    const a = toOklab(first);
    const b = toOklab(second);
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  };

  const toHex = color => `#${color.map(value => value.toString(16).padStart(2, '0')).join('')}`;

  const toHsl = color => {
    const [red, green, blue] = color.map(value => value / 255);
    const maximum = Math.max(red, green, blue);
    const minimum = Math.min(red, green, blue);
    const chroma = maximum - minimum;
    const lightness = (maximum + minimum) / 2;
    let hue = 0;

    if (chroma) {
      if (maximum === red) hue = ((green - blue) / chroma) % 6;
      else if (maximum === green) hue = (blue - red) / chroma + 2;
      else hue = (red - green) / chroma + 4;
      hue = (hue * 60 + 360) % 360;
    }

    const saturation = chroma ? chroma / (1 - Math.abs(2 * lightness - 1)) : 0;
    return [hue, saturation, lightness];
  };

  const fromHsl = ([hue, saturation, lightness]) => {
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const section = ((hue % 360) + 360) % 360 / 60;
    const middle = chroma * (1 - Math.abs(section % 2 - 1));
    const offset = lightness - chroma / 2;
    let channels;
    if (section < 1) channels = [chroma, middle, 0];
    else if (section < 2) channels = [middle, chroma, 0];
    else if (section < 3) channels = [0, chroma, middle];
    else if (section < 4) channels = [0, middle, chroma];
    else if (section < 5) channels = [middle, 0, chroma];
    else channels = [chroma, 0, middle];
    return channels.map(value => Math.round((value + offset) * 255));
  };

  const enhance = (color, hueOffset = 0) => {
    const [hue, saturation, lightness] = toHsl(color);
    return fromHsl([
      hue + hueOffset,
      clamp(saturation * 1.35, 0.68, 0.88),
      clamp(lightness, 0.45, 0.58)
    ]);
  };

  const hueDistance = (first, second) => {
    const difference = Math.abs(first - second);
    return Math.min(difference, 360 - difference);
  };

  const pickGlowColors = pixels => {
    const bins = new Map();
    let opaquePixels = 0;

    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3] < 128) continue;

      const red = pixels[index];
      const green = pixels[index + 1];
      const blue = pixels[index + 2];
      const key = (red >> 5) << 6 | (green >> 5) << 3 | blue >> 5;
      const bin = bins.get(key) || { key, count: 0, red: 0, green: 0, blue: 0 };

      bin.count += 1;
      bin.red += red;
      bin.green += green;
      bin.blue += blue;
      bins.set(key, bin);
      opaquePixels += 1;
    }

    if (!opaquePixels) return [...DEFAULT_GLOW];

    const colors = [...bins.values()].map(bin => {
      const rgb = [bin.red, bin.green, bin.blue].map(total => Math.round(total / bin.count));
      const lab = toOklab(rgb);
      const [hue] = toHsl(rgb);
      const chroma = Math.hypot(lab[1], lab[2]);
      return {
        key: bin.key,
        count: bin.count,
        rgb,
        hue,
        lightness: lab[0],
        chroma,
        score: bin.count * chroma ** 2
      };
    });
    const minimumCount = Math.max(2, Math.ceil(opaquePixels * 0.01));
    const candidates = colors
      .filter(color => color.count >= minimumCount
        && color.chroma >= MIN_CHROMA
        && color.lightness >= 0.18
        && color.lightness <= 0.9)
      .sort((first, second) => second.score - first.score || second.count - first.count || first.key - second.key);

    if (!candidates.length) return [...DEFAULT_GLOW];

    const primary = candidates[0];
    const secondary = candidates.slice(1).find(color => (
      hueDistance(primary.hue, color.hue) >= MIN_HUE_DISTANCE
    ));
    const first = enhance(primary.rgb);
    let second = secondary ? enhance(secondary.rgb) : enhance(primary.rgb, 180);

    if (distance(first, second) < MIN_DISTANCE) second = enhance(primary.rgb, 180);
    return [toHex(first), toHex(second)];
  };

  return { DEFAULT_GLOW, pickGlowColors };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = PortraitColors;
