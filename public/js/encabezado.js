/* Menú móvil del encabezado en páginas que no cargan script.js (cotizador). Mismo comportamiento que la portada. */
(() => {
  'use strict';
  const nav = document.getElementById('main-nav');
  const menuButton = document.querySelector('.site-header .menu-toggle');
  const overlay = document.querySelector('.menu-overlay');
  if (!nav || !menuButton) return;
  const mobile = matchMedia('(max-width: 850px)');
  function setMenu(open, restoreFocus = false) {
    const isOpen = open && mobile.matches;
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú');
    nav.classList.toggle('open', isOpen);
    if (overlay) overlay.hidden = !isOpen;
    document.body.classList.toggle('menu-open', isOpen);
    if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  overlay?.addEventListener('click', () => setMenu(false, true));
  mobile.addEventListener('change', () => setMenu(false));
  // Al intentar desplazar la página con el menú abierto se cierra el menú.
  // El propio menú (#main-nav) sí puede desplazarse por dentro sin cerrarse.
  let touchStartY = null;
  const cerrarAlDesplazar = event => {
    if (menuButton.getAttribute('aria-expanded') !== 'true') return;
    if (event?.target?.closest?.('#main-nav')) return;
    if (event?.type === 'wheel' && Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    if (event?.type === 'touchmove') {
      const y = event.touches?.[0]?.clientY;
      if (touchStartY == null || y == null || Math.abs(y - touchStartY) < 12) return;
    }
    setMenu(false);
  };
  addEventListener('touchstart', event => { touchStartY = event.touches?.[0]?.clientY ?? null; }, {passive: true});
  addEventListener('scroll', cerrarAlDesplazar, {passive: true});
  addEventListener('wheel', cerrarAlDesplazar, {passive: true});
  addEventListener('touchmove', cerrarAlDesplazar, {passive: true});
  document.addEventListener('keydown', event => {
    if (menuButton.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') setMenu(false, true);
    if (event.key === 'Tab') {
      const focusables = [menuButton, ...Array.from(nav.querySelectorAll('a, summary')).filter(el => el.tagName === 'SUMMARY' || !el.closest('details:not([open])'))];
      const first = focusables[0], last = focusables.at(-1);
      if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
    }
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
})();
