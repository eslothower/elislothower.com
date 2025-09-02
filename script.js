/* =========================================
   script.js — v14 (dynamic projects)
   ========================================= */

/* Smooth in-page scrolling (respect reduced motion) */
(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const targetId = a.getAttribute('href').slice(1);
      const el = document.getElementById(targetId);
      if (!el) return;
      e.preventDefault();
      el.setAttribute('tabindex', '-1');
      el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
      el.focus({ preventScroll: true });
    });
  });
})();

/* Monotonic scroll-spy using scroll position (no IO jitter) */
(() => {
  const spyLinks = Array.from(document.querySelectorAll('[data-spy]'));
  if (!spyLinks.length) return;

  const sections = spyLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  let sectionTops = [];
  let activeIndex = -1;

  function recalc() {
    sectionTops = sections.map(sec => Math.round(sec.getBoundingClientRect().top + window.scrollY));
  }

  function setActiveByIndex(i) {
    if (i === activeIndex || i < 0 || i >= sections.length) return;
    activeIndex = i;
    const id = sections[i].id;
    spyLinks.forEach(link => {
      const match = link.getAttribute('href').slice(1) === id;
      link.classList.toggle('is-active', match);
    });
  }

  function onScroll() {
    const doc = document.documentElement;
    const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= doc.scrollHeight - 1;
    if (atBottom) { setActiveByIndex(sections.length - 1); return; }

    const activationY = window.scrollY + window.innerHeight * 0.35;

    let i = sectionTops.findIndex(top => top > activationY);
    if (i === -1) i = sections.length;
    setActiveByIndex(Math.max(0, i - 1));
  }

  window.addEventListener('load', () => { recalc(); onScroll(); });
  window.addEventListener('resize', () => { recalc(); onScroll(); });
  setTimeout(() => { recalc(); onScroll(); }, 300);
  setTimeout(() => { recalc(); onScroll(); }, 1000);
  window.addEventListener('scroll', onScroll, { passive: true });

  window.__recalcScrollSpy = () => { recalc(); onScroll(); };
})();

/* Swap themed images when the theme changes */
function updateThemeImages(theme) {
  const attr = theme === 'dark' ? 'data-src-dark' : 'data-src-light';
  document.querySelectorAll('img[data-src-light][data-src-dark]').forEach(img => {
    const next = img.getAttribute(attr);
    if (next && img.src !== new URL(next, document.baseURI).href) {
      img.src = next;
    }
  });
}

/* Theme toggle: DEFAULT = light (ignores system pref unless user saved) */
(() => {
  const root = document.documentElement;
  const desktopBtn = document.querySelector('.theme-toggle');     // desktop rail button (text+icon)
  const topbarIconBtn = document.querySelector('.topbar-theme');  // top-left icon on mobile

  const stored = localStorage.getItem('theme');
  const initial = stored || 'light';
  applyTheme(initial);

  function applyTheme(theme) {
    root.classList.add('theme-animating');
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const isDark = theme === 'dark';
    const label = isDark ? 'Light mode' : 'Dark mode';

    // Update desktop button label + aria state
    desktopBtn?.setAttribute('aria-pressed', String(isDark));
    desktopBtn?.querySelector('.theme-label')?.replaceChildren(document.createTextNode(label));

    // Swap icons globally (including sun/moon)
    updateThemeImages(theme);

    window.clearTimeout(applyTheme._t);
    applyTheme._t = window.setTimeout(() => {
      root.classList.remove('theme-animating');
    }, 400);
  }

  function toggleTheme() {
    const current = root.getAttribute('data-theme') || initial;
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  desktopBtn?.addEventListener('click', toggleTheme);
  topbarIconBtn?.addEventListener('click', toggleTheme);
})();

/* LOAD MORE — reveal up to 3 per click; when all shown, switch to SHOW LESS
   Robust to any number of <article> nodes and missing .project class. */
(() => {
  const list = document.getElementById('project-list');
  const btn = document.querySelector('.section-work .load-more');
  if (!list || !btn) return;

  const INITIAL_VISIBLE = 3;
  const BATCH = 3;

  // Return a normalized array of project <article> nodes (adds .project if missing)
  function getProjects() {
    const articles = Array.from(list.querySelectorAll(':scope > article'));
    articles.forEach(el => el.classList.add('project')); // ensure class for CSS specificity
    return articles;
  }

  function enforceInitial() {
    const projects = getProjects();
    projects.forEach((el, idx) => {
      if (idx < INITIAL_VISIBLE) el.classList.remove('is-hidden');
      else el.classList.add('is-hidden');
    });
    updateButtonState();
    recalcSpy();
  }

  function revealNextBatch() {
    const hidden = Array.from(list.querySelectorAll('.project.is-hidden'));
    const toShow = hidden.slice(0, BATCH);
    toShow.forEach(el => {
      el.classList.remove('is-hidden');
      el.classList.add('revealed');
      setTimeout(() => el.classList.remove('revealed'), 300);
    });
    updateButtonState();
    recalcSpy();
  }

  function collapseToInitial() {
    const projects = getProjects();
    projects.forEach((el, idx) => {
      if (idx >= INITIAL_VISIBLE) el.classList.add('is-hidden');
    });
    updateButtonState();
    recalcSpy();
  }

  function updateButtonState() {
    const total = getProjects().length;
    const remaining = list.querySelectorAll('.project.is-hidden').length;
    if (remaining === 0 && total > INITIAL_VISIBLE) {
      btn.textContent = 'SHOW LESS';
      btn.dataset.mode = 'collapse';
      btn.removeAttribute('disabled');
      btn.removeAttribute('aria-disabled');
    } else {
      btn.textContent = 'LOAD MORE';
      btn.dataset.mode = 'expand';
      btn.removeAttribute('disabled');
      btn.removeAttribute('aria-disabled');
    }
  }

  function handleClick() {
    if (btn.dataset.mode === 'collapse') collapseToInitial();
    else revealNextBatch();
  }

  function recalcSpy() {
    if (typeof window.__recalcScrollSpy === 'function') {
      window.__recalcScrollSpy();
    } else {
      window.dispatchEvent(new Event('resize'));
    }
  }

  // Init: normalize and show only the first 3
  enforceInitial();
  btn.addEventListener('click', handleClick);
})();

/* MOBILE HAMBURGER — open/close drawer */
(() => {
  const burger = document.querySelector('.hamburger');
  const drawer = document.getElementById('mobile-drawer');
  const scrim  = document.querySelector('.mobile-scrim');
  if (!burger || !drawer || !scrim) return;

  function setOpen(open) {
    drawer.classList.toggle('is-open', open);
    scrim.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('no-scroll', open);
    if (typeof window.__recalcScrollSpy === 'function') window.__recalcScrollSpy();
  }

  burger.addEventListener('click', () => setOpen(!drawer.classList.contains('is-open')));
  scrim.addEventListener('click', () => setOpen(false));
  drawer.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => setOpen(false));
  });
})();

