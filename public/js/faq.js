/* Preguntas frecuentes de la portada y del cotizador: se abren con suavidad
   al pasar el cursor (o con clic, toque o teclado) y solo queda una abierta. */
(() => {
  'use strict';
  const items = [...document.querySelectorAll('.faq-list details, .xd-faq details')];
  if (!items.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const running = new WeakMap();

  // -- Abre o cierra una respuesta animando su altura --
  function slide(item, open) {
    const closing = item.classList.contains('is-closing');
    if (open ? item.open && !closing : !item.open || closing) return;
    const from = item.offsetHeight;
    running.get(item)?.cancel();
    item.classList.toggle('is-closing', !open);
    item.open = true;
    let to = item.offsetHeight;
    if (!open) { item.open = false; to = item.offsetHeight; item.open = true; }
    const done = () => {
      running.delete(item);
      item.style.overflow = '';
      if (!open) { item.open = false; item.classList.remove('is-closing'); }
    };
    if (reduce.matches || !item.animate) { done(); return; }
    item.style.overflow = 'hidden';
    const motion = item.animate({ height: [from + 'px', to + 'px'] }, { duration: open ? 380 : 300, easing: 'cubic-bezier(.3,.7,.2,1)' });
    running.set(item, motion);
    motion.onfinish = done;
  }
  // -- Solo una respuesta abierta a la vez --
  function show(item) {
    items.forEach(other => { if (other !== item) slide(other, false); });
    slide(item, true);
  }

  let x = -1, y = -1, moved = false, pending = null, timer = 0, openedAt = 0;
  const hover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  // Al cerrarse una respuesta la lista se desplaza bajo el cursor quieto: solo cuenta un movimiento real.
  if (hover) document.addEventListener('pointermove', e => {
    moved = e.clientX !== x || e.clientY !== y;
    x = e.clientX; y = e.clientY;
  }, { capture: true, passive: true });
  items.forEach(item => {
    const summary = item.querySelector('summary');
    if (!summary) return;
    const shown = () => item.open && !item.classList.contains('is-closing');
    // Clic, toque o teclado; un clic justo después de abrirse con el cursor no debe volver a cerrarla.
    summary.addEventListener('click', e => {
      e.preventDefault();
      if (!shown()) show(item);
      else if (performance.now() - openedAt > 600) slide(item, false);
    });
    if (!hover) return;
    // -- Con ratón, la pregunta se abre al pasar el cursor --
    summary.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || !moved || shown() || pending === item) return;
      pending = item;
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (pending !== item) return;
        pending = null;
        show(item);
        openedAt = performance.now();
      }, 120);
    });
    summary.addEventListener('pointerleave', () => { if (pending === item) { pending = null; clearTimeout(timer); } });
  });
})();
