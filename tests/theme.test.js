const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = file => readFileSync(path.resolve(__dirname, '..', file), 'utf8');

function setup({ stored = null, blocked = false, reduced = false, lightColor = '#ffffff' } = {}) {
  const classes = new Set();
  const root = {
    dataset: {},
    classList: {
      toggle(name, active) { if (active) classes.add(name); else classes.delete(name); },
      remove(name) { classes.delete(name); }
    }
  };
  const buttons = [0, 1].map(() => Object.assign(new EventTarget(), {
    hidden: true, attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; }
  }));
  const meta = { content: lightColor };
  const motion = { matches: reduced };
  const timers = new Map();
  let timerId = 0;
  const storage = {
    getItem() { if (blocked) throw new Error('Storage blocked'); return stored; },
    setItem(key, value) { if (blocked) throw new Error('Storage blocked'); stored = value; }
  };
  vm.runInNewContext(read('theme.js'), {
    document: { documentElement: root, querySelectorAll: () => buttons, querySelector: () => meta },
    localStorage: storage,
    window: {
      matchMedia: () => motion,
      setTimeout(callback) { timers.set(++timerId, callback); return timerId; },
      clearTimeout(id) { timers.delete(id); }
    }
  });
  return { root, buttons, meta, motion, classes, timers, stored: () => stored };
}

test('theme toggles animate, synchronize controls, persist, and restore the page color', () => {
  const page = setup();
  assert.equal(page.root.dataset.theme, 'light');
  assert.equal(page.classes.size, 0);
  assert.equal(page.stored(), null);
  assert.equal(page.buttons[0].hidden, false);
  page.buttons[0].dispatchEvent(new Event('click'));
  assert.equal(page.root.dataset.theme, 'dark');
  assert.equal(page.meta.content, '#111214');
  assert.equal(page.stored(), 'dark');
  assert.equal(page.classes.has('theme-animating'), true);
  for (const button of page.buttons) assert.equal(button.attributes['aria-pressed'], 'true');
  page.buttons[1].dispatchEvent(new Event('click'));
  assert.equal(page.root.dataset.theme, 'light');
  assert.equal(page.meta.content, '#ffffff');
  assert.equal(page.timers.size, 1);
  for (const finish of page.timers.values()) finish();
  assert.equal(page.classes.size, 0);
});

test('saved dark theme is restored without animation and legacy pages keep their light color', () => {
  const page = setup({ stored: 'dark', lightColor: '#f4f4f1' });
  assert.equal(page.root.dataset.theme, 'dark');
  assert.equal(page.classes.size, 0);
  page.buttons[0].dispatchEvent(new Event('click'));
  assert.equal(page.meta.content, '#f4f4f1');
  assert.equal(setup({ stored: 'invalid' }).root.dataset.theme, 'light');
});

test('blocked storage does not break toggling and reduced motion is respected live', () => {
  const page = setup({ blocked: true, reduced: true });
  page.buttons[0].dispatchEvent(new Event('click'));
  assert.equal(page.root.dataset.theme, 'dark');
  assert.equal(page.classes.size, 0);
  page.motion.matches = false;
  page.buttons[0].dispatchEvent(new Event('click'));
  assert.equal(page.root.dataset.theme, 'light');
  assert.equal(page.classes.has('theme-animating'), true);
});

test('footer mirrors contact links and every theme control loads the shared handler', () => {
  const html = read('index.html');
  const links = fragment => [...fragment.matchAll(/<a href="([^"]+)"/g)].map(match => match[1]);
  assert.deepEqual(links(html.match(/<footer[\s\S]*?<\/footer>/)[0]), links(html.match(/<nav[\s\S]*?<\/nav>/)[0]));
  for (const file of ['index.html', ...['algorithms', 'ecosim', 'matrices', 'prompt_engineering', 'project-template'].map(name => `projects/${name}.html`)]) {
    assert.match(read(file), /<script src="(?:\.\.\/)?theme\.js" defer><\/script>/);
  }
  assert.doesNotMatch(read('script.js'), /function applyTheme/);
});

test('brand text keeps balanced contrast of at least 4.5:1 in both themes', () => {
  const css = read('compact-home.css');
  const luminance = hex => {
    const [r, g, b] = hex.match(/../g).map(channel => {
      const value = parseInt(channel, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    return r * 0.2126 + g * 0.7152 + b * 0.0722;
  };
  for (const theme of ['light', 'dark']) {
    const root = theme === 'dark' ? /:root\[data-theme="dark"\]\s*\{[^}]*--bg:\s*#([\da-f]+)/ : /:root\s*\{[^}]*--bg:\s*#([\da-f]+)/;
    const hex = css.match(root)[1];
    const background = luminance(hex.length === 3 ? [...hex].map(c => c + c).join('') : hex);
    const selector = theme === 'dark' ? /^:root\[data-theme="dark"\] \.brand--([\w-]+) \{ color: #([\da-f]{6});/gm : /^\.brand--([\w-]+) \{ color: #([\da-f]{6});/gm;
    const brands = [...css.matchAll(selector)];
    assert.equal(brands.length, 5);
    const contrasts = brands.map(([, name, color]) => {
      const foreground = luminance(color);
      const contrast = (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
      assert.ok(contrast >= 4.5, `${theme} ${name}: ${contrast.toFixed(2)}:1`);
      return contrast;
    });
    assert.ok(Math.max(...contrasts) - Math.min(...contrasts) < 1.25, `${theme}: brand colors should have similar contrast`);
  }
});

test('logo masks inherit text color and remove white PNG backgrounds', () => {
  const html = read('index.html');
  const css = read('compact-home.css');
  assert.equal([...html.matchAll(/class="brand-icon" aria-hidden="true"/g)].length, 6);
  assert.match(css, /\.brand-icon \{[^}]*background: currentColor;/);
  assert.doesNotMatch(css, /invert\(|hue-rotate\(/);
  const matrix = html.match(/<feColorMatrix type="matrix" values="([^"]+)"/)[1].trim().split(/\s+/).map(Number);
  assert.equal(matrix.length, 20);
  const alpha = rgba => Math.max(0, Math.min(1, rgba.reduce((sum, channel, i) => sum + channel * matrix[15 + i], matrix[19])));
  assert.equal(alpha([1, 1, 1, 1]), 0);
  assert.equal(alpha([0, 0, 0, 0]), 0);
  assert.equal(alpha([196 / 255, 18 / 255, 48 / 255, 1]), 1);
  assert.equal(alpha([0.9, 1, 0, 1]), 1);
});
