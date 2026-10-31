/* Diseño web, "Del diagnóstico a la entrega": cada paso es una pestaña del navegador.
   Las pestañas avanzan solas mientras la sección está a la vista; un clic o el teclado eligen una. */
(() => {
  'use strict';
  const list = document.querySelector('[data-solution="web"] .sl-steps');
  if (!list) return;
  const tabs = [...list.children];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0, timer = 0, visible = false, hovering = false;
  function show(index) {
    current = (index + tabs.length) % tabs.length;
    tabs.forEach((tab, i) => {
      tab.classList.toggle('is-active', i === current);
      tab.setAttribute('aria-selected', String(i === current));
    });
  }
  function schedule() {
    clearInterval(timer);
    if (visible && !hovering && !reduce.matches) timer = setInterval(() => show(current + 1), 3000);
  }
  tabs.forEach((tab, i) => {
    tab.tabIndex = 0;
    tab.addEventListener('click', () => { show(i); schedule(); });
    tab.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(i); schedule(); }
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { show(i + (event.key === 'ArrowRight' ? 1 : -1)); tabs[current].focus(); schedule(); }
    });
  });
  list.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; schedule(); } });
  list.addEventListener('pointerleave', () => { hovering = false; schedule(); });
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }, {threshold: .3}).observe(list);
  else { visible = true; schedule(); }
  show(0);
})();
