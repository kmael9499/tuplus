
(() => {
  'use strict';
  const key = 'tuplus-theme';
  const system = matchMedia('(prefers-color-scheme: dark)');
  let preference = null;
  try { preference = localStorage.getItem(key); } catch {}
  if (!['light', 'dark'].includes(preference)) preference = null;
  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#101b24' : '#122c3d');
    const button = document.querySelector('.theme-toggle');
    if (button) {
      const dark = theme === 'dark';
      button.setAttribute('aria-pressed', String(dark));
      button.title = dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
      button.querySelector('span').textContent = dark ? '☀' : '☾';
    }
  }
  apply(preference || (system.matches ? 'dark' : 'light'));
  document.addEventListener('DOMContentLoaded', () => {
    apply(document.documentElement.dataset.theme);
    document.querySelector('.theme-toggle')?.addEventListener('click', () => {
      preference = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, preference); } catch {}
      apply(preference);
    });
  });
  system.addEventListener('change', () => {
    if (!preference) apply(system.matches ? 'dark' : 'light');
  });
  addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = ['dark', 'light'].includes(event.newValue) ? event.newValue : null;
    apply(preference || (system.matches ? 'dark' : 'light'));
  });
})();
