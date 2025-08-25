/* =========================================
   script.js — full file (v6)
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
      if (prefersReduced) {
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      el.focus({ preventScroll: true });
    });
  });
})();

/* Scroll-spy with IntersectionObserver + bottom-of-page guard */
(() => {
  const spyLinks = Array.from(document.querySelectorAll('[data-spy]'));
  if (!spyLinks.length) return;

  const sections = spyLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const idFromEl = (el) => el && el.id;
  const CONTACT_ID = 'contact';

  const setActive = (id) => {
    spyLinks.forEach(link => {
      const match = link.getAttribute('href').slice(1) === id;
      link.classList.toggle('is-active', match);
    });
  };

  /* 1) Observer highlights earlier (top third of viewport) */
  const observer = new IntersectionObserver((entries) => {
    // Track which entries are currently intersecting; prefer the one nearest the viewport top
    const vpTop = 0; // use boundingClientRect.top proximity to 0
    let candidate = null;
    let bestDistance = Infinity;

    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const dist = Math.abs(entry.boundingClientRect.top - vpTop);
        if (dist < bestDistance) {
          bestDistance = dist;
          candidate = entry.target;
        }
      }
    });

    if (candidate) setActive(idFromEl(candidate));
  }, {
    // Activate when the section is anywhere in the top ~40% to ~100% of viewport
    root: null,
    rootMargin: '-40% 0px -10% 0px',
    threshold: [0, 0.01, 0.1, 0.25, 0.5, 0.75, 1]
  });

  sections.forEach(sec => observer.observe(sec));

  /* 2) Bottom-of-page guard: if we're at the end, force Contact active */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;

      const doc = document.documentElement;
      const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= doc.scrollHeight - 1;
      if (atBottom) {
        // Only force if the Contact section exists
        const contactEl = document.getElementById(CONTACT_ID);
        if (contactEl) setActive(CONTACT_ID);
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  // Run once on load (in case the first view is already bottom on tiny screens)
  onScroll();
})();

// Put this helper above or inside your theme toggle IIFE:
function updateThemeImages(theme) {
  const attr = theme === 'dark' ? 'data-src-dark' : 'data-src-light';
  document.querySelectorAll('img[data-src-light][data-src-dark]').forEach(img => {
    const next = img.getAttribute(attr);
    if (next && img.src !== new URL(next, document.baseURI).href) {
      img.src = next;
    }
  });
}


/* Theme toggle: DEFAULT = light (ignores system pref unless user saved),
   persists choice, overrides via [data-theme] */
(() => {
  const root = document.documentElement;
  const btn = document.querySelector('.theme-toggle');
  if (!btn) return;

  const stored = localStorage.getItem('theme');
  const initial = stored || 'light';  // default to LIGHT
  applyTheme(initial);

  btn.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') || initial;
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  function applyTheme(theme) {
    const root = document.documentElement;
    root.classList.add('theme-animating');

    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const isDark = theme === 'dark';
    btn.setAttribute('aria-pressed', String(isDark));
    btn.textContent = isDark ? 'Light mode' : 'Dark mode';

    // NEW: swap themed images
    updateThemeImages(theme);

    window.clearTimeout(applyTheme._t);
    applyTheme._t = window.setTimeout(() => {
      root.classList.remove('theme-animating');
    }, 400);
  }


})();

/* Swap résumé file icon to opposite theme on hover/focus */
(() => {
  const root = document.documentElement;
  const currentTheme = () => root.getAttribute('data-theme') || 'light';

  function pickSrc(img, theme) {
    return theme === 'dark' ? img.getAttribute('data-src-dark')
                            : img.getAttribute('data-src-light');
  }
  function swapTo(img, theme) {
    const next = pickSrc(img, theme);
    if (next) img.src = next;
  }

  document.querySelectorAll('.pill--outline .pill-icon').forEach(img => {
    const pill = img.closest('.pill--outline');
    if (!pill) return;

    const onEnter = () => swapTo(img, currentTheme() === 'dark' ? 'light' : 'dark');
    const onLeave = () => swapTo(img, currentTheme());

    pill.addEventListener('mouseenter', onEnter);
    pill.addEventListener('focusin', onEnter);
    pill.addEventListener('mouseleave', onLeave);
    pill.addEventListener('focusout', onLeave);
  });
})();

