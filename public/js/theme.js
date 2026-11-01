/* Aplicar antes de pintar la página para evitar un destello claro. */
(() => {
  'use strict';
  const key = 'tuplus-theme';
  const system = matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  try { preference = localStorage.getItem(key); } catch {}
  if (!['light', 'dark'].includes(preference)) preference = null;
  const pageDefault = document.documentElement.dataset.defaultTheme;
  const defaultTheme = () => ['light', 'dark'].includes(pageDefault)
    ? pageDefault
    : (system.matches ? 'dark' : 'light');
  const translate = value => window.TUPLUS_I18N?.t(value) || value;
  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101b24' : '#122c3d');
    const button = document.querySelector('.theme-toggle');
    if (button) {
      const dark = theme === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      const action = dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
      button.title = translate(action);
      button.setAttribute('aria-label', translate(dark ? 'Modo claro' : 'Modo oscuro'));
      button.querySelector('span').textContent = dark ? '☀' : '☾';
    }
  }
  apply(preference || defaultTheme());
  document.addEventListener('DOMContentLoaded', () => {
    apply(document.documentElement.dataset.theme);
    document.querySelector('.theme-toggle')?.addEventListener('click', () => {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch {}
      apply(preference);
    });
  });
  document.addEventListener('tuplus:language-change', () => apply(document.documentElement.dataset.theme));
  system.addEventListener('change', () => {
    if (!preference) apply(defaultTheme());
  });
  addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = ['dark', 'light'].includes(event.newValue) ? event.newValue : null;
    apply(preference || defaultTheme());
  });
})();

/* Al recargar, empezar desde arriba en vez de donde se había quedado el scroll.
   Con «atrás/adelante» o un enlace con #sección, el navegador sigue llevando a su sitio. */
(() => {
  'use strict';
  if (!('scrollRestoration' in history)) return;
  const reload = performance.getEntriesByType?.('navigation')[0]?.type === 'reload' && !location.hash;
  history.scrollRestoration = reload ? 'manual' : 'auto';
  if (!reload) return;
  // En la primera recarga el navegador ya había decidido restaurar la posición: se deshace mientras carga.
  const top = () => scrollTo({top: 0, left: 0, behavior: 'instant'});
  addEventListener('scroll', top);
  document.addEventListener('DOMContentLoaded', top);
  addEventListener('load', () => { top(); removeEventListener('scroll', top); });
})();
