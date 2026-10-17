/* Galería de las cinco soluciones: un panel abierto y los demás como franjas.
   Avanza sola (con barra de progreso), se abre al pasar el ratón o al tocar,
   y la imagen del panel abierto sigue suavemente al puntero.
   Sin JavaScript, portada.css muestra las cinco soluciones como tarjetas. */
(() => {
  'use strict';
  const gallery = document.querySelector('.sv-gallery');
  if (!gallery) return;
  const panels = [...gallery.querySelectorAll('.sv-panel')];
  const counter = document.querySelector('.sv-count b');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const DELAY = 6000;
  let current = 0, timer = 0, intent = 0, hovering = false, focused = false, visible = false;

  gallery.classList.add('is-ready');
  gallery.style.setProperty('--sv-delay', DELAY + 'ms');

  function activate(index) {
    index = (index + panels.length) % panels.length;
    if (index !== current) {
      panels[current].style.removeProperty('--sv-px');
      panels[current].style.removeProperty('--sv-py');
    }
    current = index;
    panels.forEach((panel, i) => {
      const open = i === index;
      panel.classList.toggle('is-active', open);
      panel.querySelector('.sv-tab').setAttribute('aria-expanded', String(open));
      panel.querySelector('.sv-body').inert = !open;
    });
    if (counter) counter.textContent = String(index + 1).padStart(2, '0');
    schedule();
  }

  // Avance automático: se detiene con el ratón encima, con el foco dentro, fuera de pantalla o con movimiento reducido.
  function schedule() {
    clearTimeout(timer);
    const run = !reduce.matches && visible && !hovering && !focused && !document.hidden;
    gallery.classList.remove('is-playing');
    if (!run) return;
    void gallery.offsetWidth; // reinicia la barra de progreso
    gallery.classList.add('is-playing');
    timer = setTimeout(() => activate(current + 1), DELAY);
  }

  panels.forEach((panel, index) => {
    const tab = panel.querySelector('.sv-tab');
    tab.addEventListener('click', () => activate(index));
    // Cerrado, un clic lo abre; abierto, toda la tarjeta lleva a la página de esa solución.
    panel.addEventListener('click', event => {
      if (event.target.closest('a')) return;
      if (index !== current) { activate(index); return; }
      const link = panel.querySelector('.sv-link');
      if (!link) return;
      if (event.ctrlKey || event.metaKey) window.open(link.href, '_blank', 'noopener');
      else location.href = link.href;
    });
    // Con ratón, basta con detenerse un instante sobre una franja para abrirla.
    panel.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || index === current) return;
      clearTimeout(intent);
      intent = setTimeout(() => activate(index), 160);
    });
    panel.addEventListener('pointerleave', () => clearTimeout(intent));
    // La imagen del panel abierto se desplaza un poco con el puntero.
    panel.addEventListener('pointermove', event => {
      if (index !== current || event.pointerType !== 'mouse' || reduce.matches) return;
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty('--sv-px', ((event.clientX - rect.left) / rect.width - .5) * -14 + 'px');
      panel.style.setProperty('--sv-py', ((event.clientY - rect.top) / rect.height - .5) * -10 + 'px');
    });
    panel.addEventListener('pointerleave', () => { panel.style.removeProperty('--sv-px'); panel.style.removeProperty('--sv-py'); });
  });

  gallery.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; schedule(); } });
  gallery.addEventListener('pointerleave', () => { hovering = false; schedule(); });
  gallery.addEventListener('focusin', event => { focused = event.target.matches(':focus-visible'); schedule(); });
  gallery.addEventListener('focusout', event => { if (!gallery.contains(event.relatedTarget)) { focused = false; schedule(); } });
  gallery.addEventListener('keydown', event => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft' && event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    if (!event.target.closest('.sv-tab')) return;
    event.preventDefault();
    const next = (panels.indexOf(event.target.closest('.sv-panel')) + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + panels.length) % panels.length;
    panels[next].querySelector('.sv-tab').focus();
  });
  document.addEventListener('visibilitychange', schedule);
  reduce.addEventListener?.('change', schedule);

  // Los paneles entran al aparecer en pantalla; el giro solo corre mientras se ven.
  if ('IntersectionObserver' in window && !reduce.matches) {
    gallery.classList.add('is-waiting');
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) gallery.classList.remove('is-waiting');
      schedule();
    }, {threshold: .3}).observe(gallery);
  } else visible = true;
  activate(0);
})();
