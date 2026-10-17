/* TUPLUS · selector de idioma con bandera al lado.
   Mantiene el <select id="site-language"> original (oculto) y le pasa la elección,
   así i18n.js sigue funcionando igual. Banderas dibujadas en SVG: no dependen de internet. */
(() => {
  'use strict';
  const sel = document.getElementById('site-language');
  const host = sel && sel.closest('.language-picker');
  if (!sel || !host) return;

  const star = (cx, cy, r, rot = -90) => {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (rot + i * 36) * Math.PI / 180, rr = i % 2 ? r * 0.4 : r;
      pts.push((cx + rr * Math.cos(a)).toFixed(2) + ',' + (cy + rr * Math.sin(a)).toFixed(2));
    }
    return `<polygon points="${pts.join(' ')}" fill="#ffde00"/>`;
  };
  const stripesUS = [0, 2, 4, 6].map(i => `<rect y="${(i * 16 / 7).toFixed(2)}" width="24" height="${(16 / 7).toFixed(2)}" fill="#b22234"/>`).join('');
  const dotsUS = [0, 1, 2].flatMap(r => [0, 1, 2, 3].map(c => `<circle cx="${1.6 + c * 2.4}" cy="${1.5 + r * 2.4}" r=".55" fill="#fff"/>`)).join('');
  const FLAGS = {
    es: '<rect width="24" height="16" fill="#c60b1e"/><rect y="4" width="24" height="8" fill="#ffc400"/>',
    us: `<rect width="24" height="16" fill="#fff"/>${stripesUS}<rect width="10.5" height="8.9" fill="#3c3b6e"/>${dotsUS}`,
    cn: `<rect width="24" height="16" fill="#de2910"/>${star(4.6, 4.6, 2.6)}${star(9.2, 2, .9, -70)}${star(10.8, 4, .9, -50)}${star(10.8, 6.6, .9, -30)}${star(9.2, 8.6, .9, -10)}`,
    ru: '<rect width="24" height="16" fill="#fff"/><rect y="5.33" width="24" height="5.34" fill="#0039a6"/><rect y="10.67" width="24" height="5.33" fill="#d52b1e"/>',
    br: '<rect width="24" height="16" fill="#009c3b"/><polygon points="12,1.8 22.2,8 12,14.2 1.8,8" fill="#ffdf00"/><circle cx="12" cy="8" r="3.5" fill="#002776"/><path d="M8.7 7.3Q12 6 15.3 8.9" stroke="#fff" stroke-width=".7" fill="none"/>',
    fr: '<rect width="24" height="16" fill="#fff"/><rect width="8" height="16" fill="#0055a4"/><rect x="16" width="8" height="16" fill="#ef4135"/>',
    jp: '<rect width="24" height="16" fill="#fff"/><circle cx="12" cy="8" r="4.6" fill="#bc002d"/>',
    de: '<rect width="24" height="5.34" fill="#000"/><rect y="5.33" width="24" height="5.34" fill="#dd0000"/><rect y="10.67" width="24" height="5.33" fill="#ffce00"/>'
  };
  const FLAG_OF = { es: 'es', en: 'us', zh: 'cn', ru: 'ru', pt: 'br', fr: 'fr', ja: 'jp', de: 'de' };
  const flag = code => `<svg class="lang-flag" viewBox="0 0 24 16" width="22" height="15" aria-hidden="true" focusable="false">${FLAGS[FLAG_OF[code]] || '<rect width="24" height="16" fill="#8a97a0"/>'}</svg>`;

  const options = [...sel.options].map(o => ({ code: o.value, name: o.textContent.trim() }));
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'lang-btn'; btn.setAttribute('aria-haspopup', 'listbox'); btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-label', sel.getAttribute('aria-label') || 'Idioma del sitio');
  const menu = document.createElement('ul');
  menu.className = 'lang-menu'; menu.setAttribute('role', 'listbox'); menu.hidden = true; menu.tabIndex = -1;
  menu.setAttribute('aria-label', btn.getAttribute('aria-label'));
  const items = options.map(o => {
    const li = document.createElement('li');
    li.setAttribute('role', 'option'); li.dataset.code = o.code; li.tabIndex = -1; li.translate = false;
    li.innerHTML = `${flag(o.code)}<span class="lang-opt-name">${o.name}</span>`;
    menu.appendChild(li); return li;
  });
  host.appendChild(btn); host.appendChild(menu);
  sel.classList.add('lang-native'); sel.tabIndex = -1; sel.setAttribute('aria-hidden', 'true');

  function sync() {
    const cur = options.find(o => o.code === sel.value) || options[0];
    btn.innerHTML = `${flag(cur.code)}<span class="lang-name">${cur.name}</span><span class="lang-code">${cur.code.toUpperCase()}</span><svg class="lang-caret" viewBox="0 0 10 6" width="10" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    items.forEach(li => li.setAttribute('aria-selected', li.dataset.code === cur.code ? 'true' : 'false'));
    document.documentElement.setAttribute('data-lang-ui', cur.code);
  }
  const isOpen = () => !menu.hidden;
  function open() {
    sync(); menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
    const cur = items.find(li => li.getAttribute('aria-selected') === 'true') || items[0]; cur.focus({ preventScroll: true });
  }
  function close(back) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (back) btn.focus({ preventScroll: true }); }
  function choose(li) {
    if (sel.value !== li.dataset.code) { sel.value = li.dataset.code; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    sync(); close(true);
  }
  btn.addEventListener('click', () => (isOpen() ? close(false) : open()));
  btn.addEventListener('keydown', e => { if (['ArrowDown', 'ArrowUp'].includes(e.key)) { e.preventDefault(); open(); } });
  menu.addEventListener('click', e => { const li = e.target.closest('li'); if (li) choose(li); });
  menu.addEventListener('keydown', e => {
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (i >= 0) choose(items[i]); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); }
    else if (e.key === 'Tab') close(false);
  });
  document.addEventListener('click', e => { if (isOpen() && !e.composedPath().includes(host)) close(false); });
  sel.addEventListener('change', sync);
  addEventListener('load', sync);
  sync(); setTimeout(sync, 250); setTimeout(sync, 1000);
})();
