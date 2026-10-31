/* Decorative particles confined to the Partner footer. No canvas or global pointer listeners. */
(() => {
  const footer = document.querySelector('.partners-page .site-footer');
  if (!footer || footer.querySelector('.partner-footer-particles')) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div');
  layer.className = 'partner-footer-particles';
  layer.setAttribute('aria-hidden', 'true');
  layer.setAttribute('translate', 'no');
  for (let i = 0; i < 24; i++) {
    const dot = document.createElement('span');
    dot.style.setProperty('--x', ((i * 37 + 5) % 100) + '%');
    dot.style.setProperty('--y', ((i * 23 + 9) % 96) + '%');
    dot.style.setProperty('--size', (2 + i % 3) + 'px');
    dot.style.setProperty('--duration', (12 + i % 9) + 's');
    dot.style.setProperty('--delay', (-i * 1.7) + 's');
    dot.style.setProperty('--drift', (i % 2 ? 14 : -14) + 'px');
    layer.append(dot);
  }
  footer.classList.add('partner-footer-animated');
  footer.prepend(layer);
  let visible = !('IntersectionObserver' in window);
  function update() {
    layer.hidden = reduce.matches;
    layer.dataset.running = String(visible && !document.hidden && !reduce.matches);
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      update();
    }, {threshold: 0});
    observer.observe(footer);
  }
  document.addEventListener('visibilitychange', update);
  reduce.addEventListener('change', update);
  update();
})();
