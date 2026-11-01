const PortraitMotion = (() => {
  const wrapPhotoIndex = (index, length) => (index + length) % length;
  const shouldOpenViewer = distance => distance <= 6;

  const rectangleClipPath = pointCount => {
    const points = Array.from({ length: pointCount }, (_, index) => {
      const angle = index * Math.PI * 2 / pointCount;
      const radius = 0.5 / Math.max(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle)));
      return `${(50 + Math.cos(angle) * radius * 100).toFixed(2)}% ${(50 + Math.sin(angle) * radius * 100).toFixed(2)}%`;
    });
    return `polygon(${points.join(',')})`;
  };

  const transformBetween = (source, target) => {
    const x = source.left + source.width / 2 - target.left - target.width / 2;
    const y = source.top + source.height / 2 - target.top - target.height / 2;
    return `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${(source.width / target.width).toFixed(4)},${(source.height / target.height).toFixed(4)})`;
  };

  return { rectangleClipPath, shouldOpenViewer, transformBetween, wrapPhotoIndex };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = PortraitMotion;

if (typeof window !== 'undefined') {
/* Smooth in-page navigation, respecting reduced motion. */
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.getElementById(link.getAttribute('href').slice(1));
      if (!target) return;
      event.preventDefault();
      target.setAttribute('tabindex', '-1');
      target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      target.focus({ preventScroll: true });
    });
  });
})();

/* Section navigation state. */
(() => {
  const spyLinks = Array.from(document.querySelectorAll('[data-spy]'));
  if (!spyLinks.length) return;

  const sections = Array.from(new Set(
    spyLinks
      .map(link => document.querySelector(link.getAttribute('href')))
      .filter(Boolean)
  ));

  let sectionTops = [];
  let activeIndex = -2;

  function recalculate() {
    sectionTops = sections.map(section => Math.round(section.getBoundingClientRect().top + window.scrollY));
  }

  function setActive(index) {
    if (index === activeIndex) return;
    activeIndex = index;
    const id = sections[index]?.id;
    spyLinks.forEach(link => link.classList.toggle('is-active', link.getAttribute('href').slice(1) === id));
  }

  function update() {
    const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 1;
    if (atBottom) {
      setActive(sections.length - 1);
      return;
    }

    const activationY = window.scrollY + window.innerHeight * 0.35;
    let index = -1;
    sectionTops.forEach((top, candidate) => {
      if (top <= activationY) index = candidate;
    });
    setActive(index);
  }

  window.addEventListener('load', () => { recalculate(); update(); });
  window.addEventListener('resize', () => { recalculate(); update(); });
  window.addEventListener('scroll', update, { passive: true });
  setTimeout(() => { recalculate(); update(); }, 500);
  window.__recalcScrollSpy = () => { recalculate(); update(); };
})();

/* Project archive. */
(() => {
  const list = document.getElementById('project-list');
  const button = document.querySelector('.section-work .load-more');
  if (!list || !button) return;

  const INITIAL_VISIBLE = 4;
  const BATCH_SIZE = 4;
  const projects = Array.from(list.querySelectorAll(':scope > article'));

  function updateButton() {
    const hiddenCount = list.querySelectorAll('.project.is-hidden').length;
    const expanded = projects.length - hiddenCount > INITIAL_VISIBLE;
    button.textContent = hiddenCount ? 'More work' : 'Show less';
    button.dataset.mode = hiddenCount ? 'expand' : 'collapse';
    button.setAttribute('aria-expanded', String(expanded));
  }

  function showInitial() {
    projects.forEach((project, index) => project.classList.toggle('is-hidden', index >= INITIAL_VISIBLE));
    updateButton();
    window.__recalcScrollSpy?.();
  }

  function revealNext() {
    Array.from(list.querySelectorAll('.project.is-hidden')).slice(0, BATCH_SIZE).forEach(project => {
      project.classList.remove('is-hidden');
      project.classList.add('revealed');
      setTimeout(() => project.classList.remove('revealed'), 300);
    });
    updateButton();
    window.__recalcScrollSpy?.();
  }

  showInitial();
  button.addEventListener('click', () => {
    if (button.dataset.mode === 'collapse') showInitial();
    else revealNext();
  });
})();

/* Accessible mobile menu. */
(() => {
  const hamburger = document.querySelector('.hamburger');
  const drawer = document.getElementById('mobile-drawer');
  const scrim = document.querySelector('.mobile-scrim');
  if (!hamburger || !drawer || !scrim) return;

  drawer.setAttribute('inert', '');

  function setOpen(open, restoreFocus = true, moveFocus = true) {
    const shouldRestore = restoreFocus && drawer.contains(document.activeElement);
    drawer.classList.toggle('is-open', open);
    if (open) drawer.removeAttribute('inert');
    else drawer.setAttribute('inert', '');
    drawer.setAttribute('aria-hidden', String(!open));
    scrim.hidden = !open;
    hamburger.setAttribute('aria-expanded', String(open));
    hamburger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('no-scroll', open);

    if (open && moveFocus) requestAnimationFrame(() => drawer.querySelector('a')?.focus());
    else if (shouldRestore) hamburger.focus();
  }

  hamburger.addEventListener('click', event => {
    setOpen(!drawer.classList.contains('is-open'), true, event.detail === 0);
  });
  scrim.addEventListener('click', () => setOpen(false));
  drawer.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => setOpen(false, false)));

  document.addEventListener('keydown', event => {
    if (!drawer.classList.contains('is-open')) return;
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = [hamburger, ...drawer.querySelectorAll('a')];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const mobileViewport = window.matchMedia('(max-width: 991.98px)');
  const closeAtDesktop = event => {
    if (!event.matches && drawer.classList.contains('is-open')) setOpen(false, false);
  };
  if (mobileViewport.addEventListener) mobileViewport.addEventListener('change', closeAtDesktop);
  else mobileViewport.addListener(closeAtDesktop);
})();

/* The portrait is the page's one playful gesture. */
(async () => {
  const portrait = document.querySelector('[data-portrait-motion]');
  const blob = portrait?.querySelector('.portrait-blob');
  const initialImage = blob?.querySelector('img');
  const viewer = document.getElementById('portrait-viewer');
  const viewerStage = viewer?.querySelector('.portrait-viewer-stage');
  const viewerImage = viewer?.querySelector('.portrait-viewer-photo');
  const viewerClose = viewer?.querySelector('.portrait-viewer-close');
  const viewerPrevious = viewer?.querySelector('.portrait-viewer-previous');
  const viewerNext = viewer?.querySelector('.portrait-viewer-next');
  const viewerCaption = viewer?.querySelector('.portrait-viewer-caption');
  const viewerStatus = viewer?.querySelector('.portrait-viewer-status');
  if (!portrait || !blob || !initialImage || !viewer || !viewerStage || !viewerImage || !viewerClose || !viewerPrevious || !viewerNext || !viewerCaption || !viewerStatus) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PHOTO_DWELL = 5000;
  const MORPH_DURATION = 1150;
  const PHOTO_SWAP_AT = MORPH_DURATION * 0.28;
  const VIEWER_OPEN_DURATION = 820;
  const VIEWER_CLOSE_DURATION = 620;
  const loadedAt = performance.now();
  const slideDirectory = new URL('assets/images/portrait-slides/', document.baseURI);
  const slideManifest = new URL('assets/images/portrait-slides.json', document.baseURI);
  const imagePath = /\.(?:avif|gif|jpe?g|png|webp)$/i;
  const photoCaptions = {
    'eli-portrait.jpg': 'Machu Picchu — Summer 2025.',
    'chichen-itza.webp': 'Chichén Itzá — Spring 2024',
    'kayak-sunset.webp': 'Kayaking — as often as possible',
    'llama.jpeg': 'Llamas — Peru, Summer 2025',
    'machu-picchu-landscape.webp': 'Another shot of Machu Picchu — Summer 2025',
    'sandstone-lake.webp': 'Lake Powell — Summer 2017',
    'snowy-mountain-lake.webp': 'Humantay Ccocha — Summer 2025',
    'sunset-kayaking.webp': 'A lake — Summer 2024',
    'throwing-clay.webp': 'Still learning, but this one made it off the wheel — 2026',
    'tropical-beach.webp': 'Trinidad — Spring 2025',
    'zion-cliffs.webp': 'Zion National Park — Summer 2017'
  };
  const pointCount = 180;
  const viewerShape = PortraitMotion.rectangleClipPath(pointCount);
  const waveAngles = [0, 0.65, 1.22, 1.95, 2.55, 3.18, 3.78, 4.25, 4.92, 5.55, Math.PI * 2];
  const clamp = value => Math.max(-1, Math.min(1, value));
  const ease = value => value ** 3 * (value * (value * 6 - 15) + 10);
  const mix = (start, end, amount) => start + (end - start) * amount;

  const slideSourceFor = value => {
    try {
      const source = new URL(value, slideDirectory);
      const relativePath = source.pathname.slice(slideDirectory.pathname.length);
      if (source.origin !== slideDirectory.origin || !source.pathname.startsWith(slideDirectory.pathname)) return null;
      if (!relativePath || relativePath.includes('/') || !imagePath.test(relativePath)) return null;
      source.search = '';
      source.hash = '';
      return source.href;
    } catch {
      return null;
    }
  };

  const discoverSlides = async () => {
    try {
      const response = await fetch(slideDirectory, { cache: 'no-store' });
      if (response.ok) {
        const listing = new DOMParser().parseFromString(await response.text(), 'text/html');
        const sources = [...listing.querySelectorAll('a[href]')]
          .map(link => slideSourceFor(link.getAttribute('href')))
          .filter(Boolean);
        if (sources.length) return [...new Set(sources)].sort();
      }
    } catch {
      // Some static preview servers reject directory requests instead of returning an empty listing.
    }

    try {
      const manifestResponse = await fetch(slideManifest, { cache: 'no-store' });
      if (!manifestResponse.ok) throw new Error(`Portrait manifest returned ${manifestResponse.status}`);
      const sources = (await manifestResponse.json()).map(slideSourceFor).filter(Boolean);
      return [...new Set(sources)].sort();
    } catch (error) {
      console.warn('Portrait slides could not be discovered.', error);
      return [];
    }
  };

  const filenameFor = source => decodeURIComponent(new URL(source).pathname.split('/').pop() || '');

  const labelFor = source => {
    const filename = filenameFor(source);
    const label = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
    return label ? label[0].toUpperCase() + label.slice(1) : '';
  };

  const radiiFor = source => {
    const path = new URL(source).pathname;
    let seed = 2166136261;
    for (let index = 0; index < path.length; index += 1) seed = Math.imul(seed ^ path.charCodeAt(index), 16777619);

    const radii = waveAngles.slice(0, -1).map((_, index) => {
      const phase = (seed >>> 0) * 0.0001 + index * 1.73;
      return 0.405 + 0.025 * Math.sin(phase) + 0.012 * Math.sin(phase * 0.57 + index * 2.1);
    });
    return [...radii, radii[0]];
  };

  const profileSource = initialImage.currentSrc || initialImage.src;
  let currentX = 0;
  let currentY = 0;
  let targetX = 0;
  let targetY = 0;
  let dragAmount = 0;
  let dragTarget = 0;
  let dragDirectionX = 1;
  let dragDirectionY = 0;
  let targetDragX = 1;
  let targetDragY = 0;
  let dragPointerId;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragBaseSize = 1;
  let dragDistance = 0;
  let suppressViewerClick = false;
  let frame;
  let currentPhoto = 0;
  let visiblePhoto = 0;
  let activeSlot = 0;
  let morphFrom = radiiFor(profileSource);
  let morphTo = morphFrom;
  let transition;
  let photos;
  let photoSlots;
  let photoTimer;
  let schedulePhotoTransition;
  let viewerAnimation;
  let viewerIndex = 0;
  let viewerState = 'closed';

  const renderShape = time => {
    const magnitude = Math.hypot(currentX, currentY);
    const x = magnitude > 1 ? currentX / magnitude : currentX;
    const y = magnitude > 1 ? currentY / magnitude : currentY;
    const dragMagnitude = Math.hypot(dragDirectionX, dragDirectionY) || 1;
    const directionX = dragDirectionX / dragMagnitude;
    const directionY = dragDirectionY / dragMagnitude;
    const dragAngle = Math.atan2(directionY, directionX);
    const phase = (time - loadedAt) * 0.002;
    const morphRaw = transition ? Math.max(0, Math.min(1, (time - transition.startedAt) / MORPH_DURATION)) : 1;
    const morphProgress = ease(morphRaw);
    const morphBurst = transition ? Math.sin(Math.PI * morphRaw) : 0;
    const morphPhase = (transition?.nextIndex ?? currentPhoto) * 0.83;
    const points = [];
    let segment = 0;

    for (let index = 0; index < pointCount; index += 1) {
      const angle = index * Math.PI * 2 / pointCount;
      while (angle > waveAngles[segment + 1]) segment += 1;
      const startAngle = waveAngles[segment];
      const endAngle = waveAngles[segment + 1];
      const startRadius = mix(morphFrom[segment], morphTo[segment], morphProgress);
      const endRadius = mix(morphFrom[segment + 1], morphTo[segment + 1], morphProgress);
      const progress = (angle - startAngle) / (endAngle - startAngle);
      const blend = ease(progress);
      const endPhase = segment + 1 === waveAngles.length - 1 ? 0 : segment + 1;
      const start = startRadius + 0.01 * Math.sin(phase + segment * 1.7);
      const end = endRadius + 0.01 * Math.sin(phase + endPhase * 1.7);
      const baseRadius = start + (end - start) * blend
        + 0.015 * (x * Math.cos(3 * angle) + y * Math.sin(3 * angle))
        + morphBurst * (0.026 * Math.sin(2 * angle + morphPhase) + 0.012 * Math.sin(5 * angle - morphPhase));
      const angleDistance = Math.abs(Math.atan2(Math.sin(angle - dragAngle), Math.cos(angle - dragAngle)));
      const pull = ease(Math.max(0, 1 - angleDistance / 1.25));
      const edgeRadius = 0.49 / Math.max(Math.abs(Math.cos(angle)), Math.abs(Math.sin(angle)));
      const radius = baseRadius + (edgeRadius - baseRadius) * 0.28 * dragAmount * pull;
      points.push(`${(50 + Math.cos(angle) * radius * 100).toFixed(2)}% ${(50 + Math.sin(angle) * radius * 100).toFixed(2)}%`);
    }

    portrait.style.setProperty('--portrait-shape', `polygon(${points.join(',')})`);

    if (dragAmount > 0.001) {
      const along = 1 + 0.36 * dragAmount;
      const across = 1 - 0.08 * dragAmount;
      const xx = along * directionX ** 2 + across * directionY ** 2;
      const xy = (along - across) * directionX * directionY;
      const yy = along * directionY ** 2 + across * directionX ** 2;
      blob.style.transform = `matrix(${xx.toFixed(4)},${xy.toFixed(4)},${xy.toFixed(4)},${yy.toFixed(4)},0,0)`;
    } else {
      blob.style.transform = '';
    }
  };

  renderShape(loadedAt);
  portrait.classList.add('is-wavy');

  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleCanvas.height = 32;
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
  const colorTools = typeof PortraitColors === 'undefined' ? null : PortraitColors;
  const defaultGlow = colorTools ? [...colorTools.DEFAULT_GLOW] : ['transparent', 'transparent'];
  const analysisCache = new Map();
  const analyzeImage = source => {
    if (!analysisCache.has(source)) {
      analysisCache.set(source, new Promise(resolve => {
        const image = new Image();
        let settled = false;
        const finish = result => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          resolve(result);
        };
        const timeout = window.setTimeout(() => finish(null), 8000);
        image.onload = () => {
          const position = source.endsWith('/sunset-kayaking.webp')
            ? '50% 70%'
            : image.naturalHeight > image.naturalWidth ? '50% 40%' : '50% 50%';
          if (!sampleContext || !colorTools) {
            finish({ glow: [...defaultGlow], position });
            return;
          }

          try {
            sampleContext.clearRect(0, 0, 32, 32);
            sampleContext.drawImage(image, 0, 0, 32, 32);
            const pixels = sampleContext.getImageData(0, 0, 32, 32).data;
            finish({ glow: colorTools.pickGlowColors(pixels), position });
          } catch {
            finish({ glow: [...defaultGlow], position });
          }
        };
        image.onerror = () => finish(null);
        image.decoding = 'async';
        image.src = source;
      }));
    }
    return analysisCache.get(source);
  };

  const slideSourcesPromise = discoverSlides();
  const profileAnalysis = await analyzeImage(profileSource);
  if (profileAnalysis) {
    initialImage.style.objectPosition = profileAnalysis.position;
    portrait.style.setProperty('--portrait-glow-a', profileAnalysis.glow[0]);
    portrait.style.setProperty('--portrait-glow-b', profileAnalysis.glow[1]);
  }

  const slideSources = await slideSourcesPromise;
  const sources = [profileSource, ...slideSources.filter(source => source !== profileSource)];
  const analyses = new Array(sources.length);
  analyses[0] = profileAnalysis;
  let nextSource = 1;
  await Promise.all(Array.from({ length: Math.min(2, sources.length - 1) }, async () => {
    while (nextSource < sources.length) {
      const index = nextSource;
      nextSource += 1;
      analyses[index] = await analyzeImage(sources[index]);
    }
  }));
  photos = sources.flatMap((source, index) => {
    const analysis = analyses[index];
    if (!analysis && index > 0) return [];

    return [{
      src: source,
      alt: index === 0 ? initialImage.alt : labelFor(source),
      caption: photoCaptions[filenameFor(source)] || labelFor(source),
      radii: radiiFor(source),
      ...(analysis || { glow: [...defaultGlow], position: '50% 50%' })
    }];
  });

  initialImage.style.objectPosition = photos[0].position;
  portrait.style.setProperty('--portrait-glow-a', photos[0].glow[0]);
  portrait.style.setProperty('--portrait-glow-b', photos[0].glow[1]);

  const inactiveImage = initialImage.cloneNode();
  inactiveImage.classList.remove('is-active');
  inactiveImage.removeAttribute('fetchpriority');
  inactiveImage.removeAttribute('width');
  inactiveImage.removeAttribute('height');
  inactiveImage.alt = '';
  inactiveImage.setAttribute('aria-hidden', 'true');
  inactiveImage.decoding = 'async';
  blob.append(inactiveImage);
  photoSlots = [initialImage, inactiveImage];

  const preparePhotoSlot = (index, slot) => {
    const image = photoSlots[slot];
    const photo = photos[index];
    image.src = photo.src;
    image.alt = photo.alt;
    image.style.objectPosition = photo.position;
  };

  const showPhoto = (nextIndex, nextSlot) => {
    const previousImage = photoSlots[activeSlot];
    const nextImage = photoSlots[nextSlot];
    const nextPhoto = photos[nextIndex];

    previousImage.classList.remove('is-active');
    previousImage.setAttribute('aria-hidden', 'true');
    nextImage.classList.add('is-active');
    nextImage.removeAttribute('aria-hidden');
    portrait.style.setProperty('--portrait-glow-a', nextPhoto.glow[0]);
    portrait.style.setProperty('--portrait-glow-b', nextPhoto.glow[1]);
    activeSlot = nextSlot;
    visiblePhoto = nextIndex;
  };

  const setPortraitPhoto = index => {
    if (visiblePhoto !== index) {
      const nextSlot = 1 - activeSlot;
      preparePhotoSlot(index, nextSlot);
      showPhoto(index, nextSlot);
    }

    currentPhoto = index;
    morphFrom = photos[index].radii;
    morphTo = morphFrom;
    transition = undefined;
    renderShape(performance.now());
  };

  schedulePhotoTransition = delay => {
    window.clearTimeout(photoTimer);
    if (photos.length < 2 || viewer.open) return;
    photoTimer = window.setTimeout(() => {
      photoTimer = undefined;
      const nextIndex = PortraitMotion.wrapPhotoIndex(currentPhoto + 1, photos.length);
      const nextSlot = 1 - activeSlot;
      const nextPhoto = photos[nextIndex];

      preparePhotoSlot(nextIndex, nextSlot);

      if (reducedMotion) {
        showPhoto(nextIndex, nextSlot);
        currentPhoto = nextIndex;
        schedulePhotoTransition(PHOTO_DWELL);
        return;
      }

      morphFrom = photos[currentPhoto].radii;
      morphTo = nextPhoto.radii;
      transition = { startedAt: performance.now(), nextIndex, nextSlot, swapped: false };
    }, delay);
  };

  const blobShape = () => {
    const shape = getComputedStyle(blob).clipPath;
    return shape === 'none' ? viewerShape : shape;
  };

  const viewerFrames = (sourceBounds, targetBounds, sourceShape) => [
    {
      transform: PortraitMotion.transformBetween(sourceBounds, targetBounds),
      clipPath: sourceShape
    },
    {
      transform: 'translate(0,0) scale(1,1)',
      clipPath: viewerShape
    }
  ];

  const showViewerPhoto = index => {
    viewerIndex = PortraitMotion.wrapPhotoIndex(index, photos.length);
    const photo = photos[viewerIndex];
    viewerImage.src = photo.src;
    viewerImage.alt = photo.alt;
    viewerCaption.textContent = photo.caption;
    viewerStatus.textContent = `${viewerIndex + 1} / ${photos.length}`;
  };

  const openViewer = async () => {
    if (viewerState !== 'closed') return;

    window.clearTimeout(photoTimer);
    currentPhoto = visiblePhoto;
    morphFrom = photos[visiblePhoto].radii;
    morphTo = morphFrom;
    transition = undefined;
    viewerState = 'opening';
    showViewerPhoto(visiblePhoto);

    const sourceBounds = blob.getBoundingClientRect();
    const sourceShape = blobShape();
    viewer.showModal();
    document.body.classList.add('viewer-open');
    blob.setAttribute('aria-expanded', 'true');
    viewerStage.style.clipPath = viewerShape;
    viewerStage.style.webkitClipPath = viewerShape;
    const targetBounds = viewerStage.getBoundingClientRect();
    viewerClose.focus({ preventScroll: true });

    if (reducedMotion) {
      viewerState = 'open';
      return;
    }

    viewer.animate([
      { opacity: 0 },
      { opacity: 1 }
    ], { duration: 300, easing: 'ease-out' });

    const animation = viewerStage.animate(viewerFrames(sourceBounds, targetBounds, sourceShape), {
      duration: VIEWER_OPEN_DURATION,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      fill: 'both'
    });
    viewerAnimation = animation;
    await animation.finished.catch(() => {});
    if (viewerAnimation !== animation || viewerState !== 'opening') return;

    viewerStage.style.transform = 'none';
    animation.cancel();
    viewerAnimation = undefined;
    viewerState = 'open';
  };

  const closeViewer = async () => {
    if (viewerState === 'closed' || viewerState === 'closing') return;

    const interruptedOpening = viewerState === 'opening';
    viewerState = 'closing';
    window.clearTimeout(photoTimer);
    setPortraitPhoto(viewerIndex);

    const sourceBounds = blob.getBoundingClientRect();
    const sourceShape = blobShape();
    const targetBounds = viewerStage.getBoundingClientRect();
    const currentStyle = getComputedStyle(viewerStage);
    const currentTransform = currentStyle.transform === 'none'
      ? 'translate(0,0) scale(1,1)'
      : currentStyle.transform;
    const currentClipPath = currentStyle.clipPath;
    viewerAnimation?.cancel();

    if (!reducedMotion) {
      viewer.animate([
        { opacity: Number.parseFloat(getComputedStyle(viewer).opacity) || 1, offset: 0 },
        { opacity: 1, offset: 0.55 },
        { opacity: 0, offset: 1 }
      ], { duration: VIEWER_CLOSE_DURATION, easing: 'linear' });

      const frames = interruptedOpening
        ? [
            { transform: currentTransform, clipPath: currentClipPath },
            { transform: PortraitMotion.transformBetween(sourceBounds, targetBounds), clipPath: sourceShape }
          ]
        : viewerFrames(sourceBounds, targetBounds, sourceShape);
      const animation = viewerStage.animate(frames, {
        duration: VIEWER_CLOSE_DURATION,
        direction: interruptedOpening ? 'normal' : 'reverse',
        easing: interruptedOpening ? 'cubic-bezier(0.55, 0, 0.82, 0.42)' : 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'both'
      });
      viewerAnimation = animation;
      await animation.finished.catch(() => {});
      if (viewerAnimation !== animation || viewerState !== 'closing') return;
      animation.cancel();
    }

    viewerAnimation = undefined;
    viewer.close();
    document.body.classList.remove('viewer-open');
    blob.setAttribute('aria-expanded', 'false');
    viewerStage.style.removeProperty('transform');
    viewerStage.style.removeProperty('clip-path');
    viewerStage.style.removeProperty('-webkit-clip-path');
    viewerState = 'closed';
    blob.focus({ preventScroll: true });
    schedulePhotoTransition(PHOTO_DWELL);
  };

  const moveViewer = amount => {
    if (!viewer.open || viewerState === 'closing') return;
    showViewerPhoto(viewerIndex + amount);
  };

  viewerPrevious.hidden = photos.length < 2;
  viewerNext.hidden = photos.length < 2;
  blob.addEventListener('click', event => {
    if (suppressViewerClick && event.detail > 0) {
      suppressViewerClick = false;
      return;
    }
    suppressViewerClick = false;
    openViewer();
  });
  viewerClose.addEventListener('click', closeViewer);
  viewerPrevious.addEventListener('click', () => moveViewer(-1));
  viewerNext.addEventListener('click', () => moveViewer(1));
  viewer.addEventListener('click', event => {
    if (event.target === viewer) closeViewer();
  });
  viewer.addEventListener('cancel', event => {
    event.preventDefault();
    closeViewer();
  });
  viewer.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveViewer(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveViewer(1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeViewer();
    }
  });

  function renderMotion(time) {
    currentX += (targetX - currentX) * 0.14;
    currentY += (targetY - currentY) * 0.14;
    dragAmount += (dragTarget - dragAmount) * (dragPointerId === undefined ? 0.11 : 0.2);
    dragDirectionX += (targetDragX - dragDirectionX) * 0.18;
    dragDirectionY += (targetDragY - dragDirectionY) * 0.18;

    if (transition) {
      const elapsed = time - transition.startedAt;

      if (!transition.swapped && elapsed >= PHOTO_SWAP_AT) {
        showPhoto(transition.nextIndex, transition.nextSlot);
        transition.swapped = true;
      }

      if (elapsed >= MORPH_DURATION) {
        currentPhoto = transition.nextIndex;
        morphFrom = morphTo;
        transition = undefined;
        schedulePhotoTransition(PHOTO_DWELL - MORPH_DURATION);
      }
    }

    if (!viewer.open) renderShape(time);

    if (!reducedMotion) frame = requestAnimationFrame(renderMotion);
  }

  const setMotion = (x, y) => {
    targetX = clamp(x);
    targetY = clamp(y);
  };

  renderMotion(performance.now());
  const firstTransitionDelay = loadedAt + PHOTO_DWELL - performance.now() - (reducedMotion ? 0 : PHOTO_SWAP_AT);
  schedulePhotoTransition(Math.max(0, firstTransitionDelay));

  if (reducedMotion) return;

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !frame) frame = requestAnimationFrame(renderMotion);
    else if (!entry.isIntersecting && frame) {
      cancelAnimationFrame(frame);
      frame = undefined;
    }
  });
  observer.observe(portrait);

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

  blob.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || !event.isPrimary || event.button !== 0 || dragPointerId !== undefined) return;
    const bounds = blob.getBoundingClientRect();
    const initialX = event.clientX - bounds.left - bounds.width / 2;
    const initialY = event.clientY - bounds.top - bounds.height / 2;
    const initialDistance = Math.hypot(initialX, initialY);

    if (initialDistance > 1) {
      dragDirectionX = targetDragX = initialX / initialDistance;
      dragDirectionY = targetDragY = initialY / initialDistance;
    }

    dragStartX = event.clientX;
    dragStartY = event.clientY;
    dragBaseSize = Math.min(bounds.width, bounds.height);
    dragDistance = 0;
    suppressViewerClick = false;
    dragPointerId = event.pointerId;
    targetX = targetY = 0;
    blob.setPointerCapture(event.pointerId);
    portrait.classList.add('is-dragging');
  });

  blob.addEventListener('pointermove', event => {
    if (event.pointerId !== dragPointerId) return;
    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;
    const distance = Math.hypot(deltaX, deltaY);
    dragDistance = Math.max(dragDistance, distance);

    if (distance > 1) {
      targetDragX = deltaX / distance;
      targetDragY = deltaY / distance;
    }

    dragTarget = Math.min(1, distance / (dragBaseSize * 0.42));
    event.preventDefault();
  });

  const endDrag = event => {
    if (event.pointerId !== dragPointerId) return;
    const pointerId = dragPointerId;
    if (event.type === 'pointerup' && !PortraitMotion.shouldOpenViewer(dragDistance)) suppressViewerClick = true;
    dragPointerId = undefined;
    dragTarget = 0;
    portrait.classList.remove('is-dragging');
    if (blob.hasPointerCapture(pointerId)) blob.releasePointerCapture(pointerId);
  };

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  blob.addEventListener('lostpointercapture', endDrag);

  const hero = portrait.closest('.section-intro');
  hero?.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || dragPointerId !== undefined) return;
    const bounds = portrait.getBoundingClientRect();
    setMotion((event.clientX - bounds.left - bounds.width / 2) / (bounds.width * 0.8), (event.clientY - bounds.top - bounds.height / 2) / (bounds.height * 0.8));
  }, { passive: true });
  hero?.addEventListener('pointerleave', () => {
    if (dragPointerId === undefined) setMotion(0, 0);
  });
})();

document.querySelectorAll('[data-year]').forEach(element => {
  element.textContent = new Date().getFullYear();
});
}
