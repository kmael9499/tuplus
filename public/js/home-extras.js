/* TUPLUS portada: línea de avance + botón "volver arriba" (réplica del cotizador). */
(() => {
  'use strict';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LABELS = {
    es: 'Subir', en: 'Back to top', zh: '回到顶部', ru: 'Наверх',
    pt: 'Voltar ao topo', fr: 'Haut de page', ja: 'トップへ', de: 'Nach oben'
  };
  const label = () => {
    const l = (document.documentElement.lang || 'es').toLowerCase().slice(0, 2);
    return LABELS[l] || LABELS.es;
  };

  /* Línea dorada de avance */
  const bar = document.createElement('div');
  bar.className = 'xd-scroll';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);

  /* Botón circular */
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'xd-top';
  btn.setAttribute('aria-label', label());
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>';
  document.body.appendChild(btn);

  let ticking = false;

  const update = () => {
    ticking = false;
    const h = document.documentElement;
    const y = window.pageYOffset || h.scrollTop || 0;
    const max = (h.scrollHeight - h.clientHeight) || 1;
    bar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, y / max)) + ')';
    btn.classList.toggle('on', y > 700);
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  const toTop = e => {
    if (e) e.preventDefault();
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  btn.addEventListener('click', toTop);

  /* El enlace "Volver arriba ↑" del footer sube hasta el inicio, igual que el botón */
  document.querySelectorAll('.footer-bottom a[href="#contenido"]').forEach(a => {
    a.addEventListener('click', toTop);
  });

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  addEventListener('orientationchange', () => setTimeout(update, 200));
  addEventListener('load', update);

  /* La página cambia de alto (imágenes, acordeones): recalcula el avance */
  if ('ResizeObserver' in window) new ResizeObserver(onScroll).observe(document.body);

  /* Idioma: actualiza el texto accesible del botón */
  const relabel = () => btn.setAttribute('aria-label', label());
  document.addEventListener('tuplus:language-change', () => setTimeout(relabel, 0));
  new MutationObserver(relabel).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  update();
})();
