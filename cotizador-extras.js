/* TUPLUS cotizador: capa de mejoras (aditiva).
   Lee el estado de cotizador.js y acciona los mismos botones que el usuario. No toca neon-trail.js.
   Para desactivarla, quita los 2 enlaces de cotizador.html. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tt = v => (window.TUPLUS_I18N && window.TUPLUS_I18N.t && window.TUPLUS_I18N.t(v)) || v;
  const isEs = () => (document.documentElement.lang || 'es').startsWith('es');
  const S = () => { try { return state; } catch { return null; } };
  const say = m => { try { toast(m); } catch { /* opcional */ } };

  /* 1. Colibrí sobre la barra de progreso */
  function initBird() {
    const row = $('.progress-row'), track = $('.progress-track'), fill = $('#progressFill');
    if (!row || !track || !fill) return;
    const bird = document.createElement('div');
    bird.className = 'xt-bird';
    bird.setAttribute('aria-hidden', 'true');
    bird.innerHTML = '<img src="colibri.png" alt="">';
    row.appendChild(bird);
    const place = () => {
      const pct = parseFloat(fill.style.width) || 0;
      bird.style.left = (track.offsetLeft + track.offsetWidth * pct / 100) + 'px';
    };
    new MutationObserver(place).observe(fill, { attributes: true, attributeFilter: ['style'] });
    addEventListener('resize', place);
    addEventListener('load', place);
    place();
  }

  /* 2. El total "rueda" hacia el nuevo valor */
  const parse = t => {
    const m = /^(\D*?)(\d[\d.,\s\u00a0\u202f]*\d|\d)(\D*)$/.exec(t.trim());
    if (!m) return null;
    const uniq = [...new Set(m[2].replace(/\d/g, ''))];
    if (uniq.length > 1) return null;
    const sep = uniq[0] || '';
    if (sep && m[2].split(sep).slice(1).some(g => g.length !== 3)) return null;
    return { pre: m[1], suf: m[3], sep, n: parseInt(m[2].replace(/\D/g, ''), 10) };
  };
  const fmt = (n, sep) => sep ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep) : String(n);
  function roll(el) {
    if (!el) return;
    let shown = el.textContent, raf = 0;
    new MutationObserver(() => {
      const next = el.textContent;
      if (next === shown) return;
      cancelAnimationFrame(raf);
      const a = parse(shown), b = parse(next);
      if (reduce || !a || !b || a.pre !== b.pre || a.suf !== b.suf || a.sep !== b.sep) { shown = next; return; }
      const t0 = performance.now();
      (function step(now) {
        const k = Math.min(1, (now - t0) / 600), e = 1 - Math.pow(1 - k, 3);
        const txt = k < 1 ? b.pre + fmt(Math.round(a.n + (b.n - a.n) * e), b.sep) + b.suf : next;
        shown = txt;
        if (el.textContent !== txt) el.textContent = txt;
        if (k < 1) raf = requestAnimationFrame(step);
      })(t0);
    }).observe(el, { childList: true, characterData: true, subtree: true });
  }

  /* 3. Inclinación 3D y luz dorada en las tarjetas */
  function initTilt() {
    if (reduce) return;
    const CARD = ':is(.choice-card,.toggle-card,.feature-card,.radio-card,.toggle-line)';
    let raf = 0;
    document.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const c = e.target.closest && e.target.closest(CARD);
      if (!c) return;
      const cx = e.clientX, cy = e.clientY;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = c.getBoundingClientRect(), x = (cx - r.left) / r.width, y = (cy - r.top) / r.height;
        c.style.setProperty('--rx', ((.5 - y) * 7).toFixed(2) + 'deg');
        c.style.setProperty('--ry', ((x - .5) * 9).toFixed(2) + 'deg');
        c.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        c.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
    }, { passive: true });
    document.addEventListener('pointerout', e => {
      const c = e.target.closest && e.target.closest(CARD);
      if (c && !c.contains(e.relatedTarget)) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); }
    });
  }

  /* 4. Destello dorado al llegar a la cotización final */
  function burst() {
    if (reduce) return;
    const cx = innerWidth / 2, cy = Math.min(innerHeight * .35, 300);
    for (let i = 0; i < 28; i++) {
      const s = document.createElement('i'), a = Math.random() * 6.283, d = 80 + Math.random() * 180;
      s.className = 'xt-spark';
      s.style.cssText = `left:${cx}px;top:${cy}px;--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`;
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }
  function initBurst() {
    const v5 = $('.step-view[data-view="5"]');
    if (!v5) return;
    let was = v5.classList.contains('active');
    new MutationObserver(() => {
      const now = v5.classList.contains('active');
      if (now && !was) burst();
      was = now;
    }).observe(v5, { attributes: true, attributeFilter: ['class'] });
  }

  /* 5. Configuración: aplicar paquetes y enlaces (acciona los botones existentes) */
  function applyConfig(c) {
    const click = el => el && el.click();
    const q = (sel, v) => $(`${sel}="${CSS.escape(String(v))}"]`);
    click(q('#projectOptions .choice-card[data-key', c.p));
    const rg = $('#pagesRange');
    if (rg) {
      rg.value = Math.max(1, Math.min(20, Math.round(Number(c.g)) || 1));
      rg.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const want = Array.isArray(c.f) ? c.f : [];
    $$('.feature-card').forEach(b => {
      if (b.classList.contains('selected') !== want.includes(b.dataset.feature)) b.click();
    });
    click($(`.toggle-card[data-toggle="${c.c ? 'contentPro' : 'contentClient'}"]`));
    click(q('.radio-card[data-design', c.d));
    click(q('.radio-card[data-support', c.s));
    [['#rushToggle', c.r], ['#hostingToggle', c.h], ['#taxToggle', c.x]].forEach(([sel, v]) => {
      const el = $(sel);
      if (el && v !== undefined && el.classList.contains('active') !== !!v) el.click();
    });
  }
  const currentConfig = () => {
    const s = S();
    return { p: s.project, g: s.pages, f: [...s.features], d: s.design, s: s.support, r: +s.rush, h: +s.hosting, c: +s.contentPro, x: +s.tax };
  };

  const PRESETS = [
    { n: 'Esencial', d: 'Landing con contacto directo', c: { p: 'landing', g: 1, f: ['whatsapp', 'forms'], d: 'clean', s: '30', r: 0, h: 0, c: 0 } },
    { n: 'Profesional', d: 'Sitio de 6 páginas con SEO y analítica', tag: 'Más elegido', c: { p: 'website', g: 6, f: ['whatsapp', 'forms', 'seo', 'analytics'], d: 'custom', s: '90', r: 0, h: 0, c: 0 } },
    { n: 'Completo', d: 'Tienda con pagos, blog y Cloud', c: { p: 'ecommerce', g: 10, f: ['whatsapp', 'forms', 'seo', 'analytics', 'payments', 'blog'], d: 'premium', s: '180', r: 0, h: 1, c: 0 } }
  ];
  function initPresets() {
    const grid = $('#projectOptions');
    if (!grid) return;
    const box = document.createElement('div');
    box.className = 'xt-presets';
    box.innerHTML = '<div class="section-label">Paquetes rápidos</div><div class="xt-presets-grid">' +
      PRESETS.map((p, i) => `<button class="xt-preset" type="button" data-i="${i}"><b>${p.n}</b><small>${p.d}</small>${p.tag ? `<i class="xt-badge">${p.tag}</i>` : ''}</button>`).join('') + '</div>';
    grid.insertAdjacentElement('afterend', box);
    box.addEventListener('click', e => {
      const b = e.target.closest('.xt-preset');
      if (!b) return;
      applyConfig(PRESETS[+b.dataset.i].c);
      say('Paquete aplicado. Puedes ajustarlo en los siguientes pasos.');
    });
  }
  function fromHash() {
    const m = /^#q=(.+)$/.exec(location.hash);
    if (!m) return;
    try { applyConfig(JSON.parse(atob(decodeURIComponent(m[1])))); } catch { /* enlace inválido: se ignora */ }
  }

  /* 6. Resumen "Tu proyecto", IGV visible y copiar enlace */
  function initChips() {
    const row = $('.progress-row');
    if (!row) return;
    const bar = document.createElement('div');
    bar.className = 'xt-chips';
    row.insertAdjacentElement('afterend', bar);
    const render = () => {
      const s = S();
      if (!s) return;
      try {
        const n = s.features.size;
        bar.innerHTML =
          `<span class="xt-chip"><b>${tt(catalog[s.project].label)}</b></span>` +
          `<span class="xt-chip">${s.pages} ${tt(s.pages === 1 ? 'página' : 'páginas')}</span>` +
          `<span class="xt-chip">${n} ${tt(n === 1 ? 'función' : 'funciones')}</span>` +
          `<span class="xt-chip">${tt(designs[s.design].label)}</span>` +
          `<span class="xt-chip">&#9201; ${deliveryDays()}</span>` +
          '<span class="xt-grow"></span>' +
          `<button class="xt-chip" type="button" data-xt="igv" aria-pressed="${!!s.tax}">${tt(s.tax ? 'CON IGV' : 'SIN IGV')}</button>` +
          (isEs() ? '<button class="xt-chip" type="button" data-xt="copy">Copiar enlace</button>' : '');
      } catch { /* si algo cambia en cotizador.js, el resumen simplemente no se muestra */ }
    };
    bar.addEventListener('click', e => {
      const b = e.target.closest('[data-xt]');
      if (!b) return;
      if (b.dataset.xt === 'igv') { const t = $('#taxToggle'); if (t) t.click(); return; }
      const url = location.href.split('#')[0] + '#q=' + encodeURIComponent(btoa(JSON.stringify(currentConfig())));
      const done = () => say('Enlace copiado. Quien lo abra verá las mismas opciones.');
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, () => prompt('Copia tu enlace:', url));
      else prompt('Copia tu enlace:', url);
    });
    const later = () => setTimeout(render, 0);
    const form = $('#quoteForm');
    if (form) ['click', 'input', 'change'].forEach(ev => form.addEventListener(ev, later));
    const live = $('#liveTotal');
    if (live) new MutationObserver(later).observe(live, { childList: true, characterData: true, subtree: true });
    document.addEventListener('tuplus:language-change', later);
    render();
  }

  /* 7. Etiquetas y tooltips "¿qué es esto?" */
  const TIPS = {
    whatsapp: 'Botón para que tus clientes te escriban en un toque.',
    forms: 'Formularios que llegan a tu correo con los datos ordenados.',
    seo: 'Estructura y textos pensados para que Google te encuentre.',
    analytics: 'Mide visitas y clics para decidir con datos.',
    booking: 'Tus clientes piden cita o reserva desde la web.',
    multilingual: 'Tu web en más de un idioma, con selector.',
    payments: 'Cobro con tarjeta o billetera dentro de tu web.',
    blog: 'Publica artículos y novedades sin tocar código.',
    maps: 'Mapa con tu ubicación y cómo llegar.',
    automation: 'Conectamos tu web con tus herramientas para ahorrar trabajo manual.',
    speed: 'Ajustes para que la web cargue más rápido en celular.',
    security: 'Buenas prácticas para proteger tu web y tus datos.'
  };
  function initTips() {
    const addBadge = (sel, text) => {
      const el = $(sel);
      if (el && !el.querySelector('.xt-badge')) { const b = document.createElement('i'); b.className = 'xt-badge'; b.textContent = text; el.appendChild(b); }
    };
    addBadge('#projectOptions .choice-card[data-key="website"]', 'Más elegido');
    addBadge('.feature-card[data-feature="seo"]', 'Recomendado');
    const tip = document.createElement('div');
    tip.className = 'xt-tip';
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
    const show = c => {
      const text = TIPS[c.dataset.feature];
      if (!text || !isEs()) return;
      tip.textContent = text;
      const r = c.getBoundingClientRect();
      tip.style.left = Math.max(130, Math.min(innerWidth - 130, r.left + r.width / 2)) + 'px';
      tip.style.top = Math.max(60, r.top - 8) + 'px';
      tip.classList.add('on');
    };
    const hide = () => tip.classList.remove('on');
    document.addEventListener('pointerover', e => { if (e.pointerType === 'mouse') { const c = e.target.closest('.feature-card'); if (c) show(c); } });
    document.addEventListener('pointerout', e => { if (e.target.closest && e.target.closest('.feature-card')) hide(); });
    document.addEventListener('focusin', e => { const c = e.target.closest && e.target.closest('.feature-card'); if (c) show(c); });
    document.addEventListener('focusout', hide);
    addEventListener('scroll', hide, { passive: true });
  }

  [initBird, () => { roll($('#liveTotal')); roll($('#totalPrice')); }, initTilt, initBurst, initPresets, initChips, initTips, fromHash]
    .forEach(f => { try { f(); } catch (err) { console.warn('[cotizador-extras]', err); } });
})();
