(() => {
  const viewer = document.getElementById('photo-viewer');
  if (!viewer || typeof viewer.showModal !== 'function') return;

  const image = viewer.querySelector('img');
  const closeButton = viewer.querySelector('button');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let opener;
  let closing = false;

  document.querySelectorAll('figure a').forEach(link => {
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', viewer.id);
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const thumbnail = link.querySelector('img');
      image.src = link.href;
      image.alt = thumbnail.alt;
      image.width = thumbnail.naturalWidth;
      image.height = thumbnail.naturalHeight;
      opener = link;
      viewer.showModal();
      document.body.classList.add('viewer-open');
      closeButton.focus({ preventScroll: true });
    });
  });

  const closeViewer = async () => {
    if (!viewer.open || closing) return;
    closing = true;
    if (!reducedMotion.matches) {
      await viewer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140 }).finished.catch(() => {});
    }
    viewer.close();
  };

  closeButton.addEventListener('click', closeViewer);
  viewer.addEventListener('click', event => {
    if (event.target === viewer) closeViewer();
  });
  viewer.addEventListener('cancel', event => {
    event.preventDefault();
    closeViewer();
  });
  viewer.addEventListener('close', () => {
    document.body.classList.remove('viewer-open');
    closing = false;
    opener?.focus({ preventScroll: true });
  });
})();
