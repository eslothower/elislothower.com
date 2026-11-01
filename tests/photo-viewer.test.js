const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = readFileSync(path.resolve(__dirname, '..', 'photo-viewer.js'), 'utf8');

function setup({ reducedMotion = false, supported = true } = {}) {
  const element = () => Object.assign(new EventTarget(), {
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { document.activeElement = this; }
  });
  const thumbnail = { alt: 'Mountains beside a lake', naturalWidth: 1600, naturalHeight: 1200 };
  const image = {};
  const button = element();
  const link = Object.assign(element(), {
    href: 'https://example.test/mountain-lake.jpg',
    querySelector: () => thumbnail
  });
  let animations = 0;
  const viewer = Object.assign(element(), {
    id: 'photo-viewer', open: false,
    querySelector: selector => selector === 'img' ? image : button,
    showModal: supported ? function () { this.open = true; } : undefined,
    close() { this.open = false; this.dispatchEvent(new Event('close')); },
    animate() { animations++; return { finished: Promise.resolve() }; }
  });
  const classes = new Set();
  const document = {
    activeElement: link,
    body: { classList: { add: name => classes.add(name), remove: name => classes.delete(name) } },
    getElementById: () => viewer,
    querySelectorAll: () => [link]
  };
  vm.runInNewContext(script, { document, window: { matchMedia: () => ({ matches: reducedMotion }) } });
  const click = (target, options = {}) => {
    const event = Object.assign(new Event('click', { cancelable: true }), { button: 0, ...options });
    target.dispatchEvent(event);
    return event;
  };
  return { viewer, image, button, link, document, classes, click, animations: () => animations };
}

test('photos open in a modal; X closes it and restores focus and scrolling', async () => {
  const page = setup();
  assert.equal(page.click(page.link).defaultPrevented, true);
  assert.equal(page.viewer.open, true);
  assert.equal(page.image.src, page.link.href);
  assert.equal(page.image.alt, 'Mountains beside a lake');
  assert.equal(page.image.width, 1600);
  assert.equal(page.document.activeElement, page.button);
  assert.equal(page.classes.has('viewer-open'), true);
  assert.equal(page.link.attributes['aria-haspopup'], 'dialog');
  page.click(page.button);
  page.click(page.button);
  await new Promise(setImmediate);
  assert.equal(page.animations(), 1);
  assert.equal(page.viewer.open, false);
  assert.equal(page.classes.has('viewer-open'), false);
  assert.equal(page.document.activeElement, page.link);
});

test('Escape and backdrop close without animation when reduced motion is requested', () => {
  const page = setup({ reducedMotion: true });
  page.click(page.link);
  const cancel = new Event('cancel', { cancelable: true });
  page.viewer.dispatchEvent(cancel);
  assert.equal(cancel.defaultPrevented, true);
  assert.equal(page.viewer.open, false);
  page.click(page.link);
  page.click(page.viewer);
  assert.equal(page.viewer.open, false);
  assert.equal(page.animations(), 0);
});

test('modified clicks and unsupported browsers retain direct image links', () => {
  for (const options of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
    const page = setup();
    assert.equal(page.click(page.link, options).defaultPrevented, false);
    assert.equal(page.viewer.open, false);
  }
  const page = setup({ supported: false });
  assert.equal(page.click(page.link).defaultPrevented, false);
});
