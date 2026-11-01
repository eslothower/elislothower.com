(() => {
  const root = document.documentElement;
  const buttons = document.querySelectorAll('.theme-toggle, .topbar-theme');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const lightColor = themeColor?.content || '#ffffff';
  let initialTheme = root.dataset.theme || root.dataset.defaultTheme || 'light';
  try { initialTheme = localStorage.getItem('theme') || initialTheme; } catch {}

  function applyTheme(theme, persist = true) {
    const dark = theme === 'dark';
    root.classList.toggle('theme-animating', persist && !reducedMotion.matches);
    root.dataset.theme = dark ? 'dark' : 'light';
    buttons.forEach(button => {
      button.hidden = false;
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    });
    if (themeColor) themeColor.content = dark ? '#111214' : lightColor;
    if (persist) {
      try { localStorage.setItem('theme', root.dataset.theme); } catch {}
    }
    window.clearTimeout(applyTheme.timeout);
    if (persist) applyTheme.timeout = window.setTimeout(() => root.classList.remove('theme-animating'), 320);
  }

  applyTheme(initialTheme, false);
  buttons.forEach(button => button.addEventListener('click', () => {
    applyTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  }));
})();
