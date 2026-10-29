/* Páginas de soluciones: movimiento común y la sección exclusiva de cada solución. */
(() => {
  'use strict';
  const page = document.querySelector('.sl-page');
  if (!page) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const t = value => window.TUPLUS_I18N?.t(value) || value;
  const locale = () => { const lang = document.documentElement.lang || 'es'; return lang === 'es' ? 'es-PE' : lang; };
  const io = (element, callback, options = {threshold: .25}) => {
    if (!('IntersectionObserver' in window)) { callback(true); return; }
    new IntersectionObserver(entries => entries.forEach(entry => callback(entry.isIntersecting, entry)), options).observe(element);
  };
  const ease = k => 1 - Math.pow(1 - k, 3);
  // Precios de ejemplo: se escriben en soles y se muestran en la moneda del idioma elegido,
  // con los mismos tipos de cambio de referencia que usa el cotizador (currencies.js).
  const LANG_CURRENCY = {es: 'PEN', en: 'USD', pt: 'BRL', fr: 'EUR', de: 'EUR', zh: 'CNY', ja: 'JPY', ru: 'RUB'};
  const currency = () => LANG_CURRENCY[(document.documentElement.lang || 'es').slice(0, 2)] || 'USD';
  function price(pen) {
    const code = currency(), rates = window.TUPLUS_FX?.rates;
    if (code === 'PEN' || !rates?.[code]) return 'S/ ' + Math.round(pen).toLocaleString('es-PE');
    const value = pen / rates.PEN.rate * rates[code].rate;
    return new Intl.NumberFormat(locale(), {style: 'currency', currency: code, maximumFractionDigits: 0}).format(Math.round(value));
  }
  const paintPrices = () => page.querySelectorAll('[data-price]').forEach(element => { element.textContent = price(Number(element.dataset.price)); });
  paintPrices();
  document.addEventListener('tuplus:language-change', paintPrices);
  // Cuenta animada hasta un valor (con decimales opcionales).
  function countTo(element, to, {from = 0, decimals = 0, duration = 1400, format} = {}) {
    if (reduce.matches) { element.textContent = format ? format(to) : Number(to).toLocaleString(locale(), {minimumFractionDigits: decimals, maximumFractionDigits: decimals}); return; }
    const start = performance.now();
    cancelAnimationFrame(element._count);
    const step = now => {
      const k = Math.min(1, (now - start) / duration), value = from + (to - from) * ease(k);
      element.textContent = format ? format(value) : value.toLocaleString(locale(), {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
      if (k < 1) element._count = requestAnimationFrame(step);
    };
    element._count = requestAnimationFrame(step);
  }

  // Aparición al bajar.
  page.querySelectorAll('[data-reveal]').forEach(element => io(element, visible => { if (visible) element.classList.add('is-in'); }, {threshold: .15}));
  page.querySelectorAll('[data-steps]').forEach(element => io(element, visible => { if (visible) element.classList.add('is-in'); }, {threshold: .4}));
  page.querySelectorAll('[data-count]').forEach(element => {
    let done = false;
    io(element, visible => { if (visible && !done) { done = true; countTo(element, Number(element.dataset.count), {decimals: Number(element.dataset.decimals || 0)}); } });
  });

  // La imagen del inicio se inclina un poco siguiendo al puntero.
  page.querySelectorAll('[data-tilt]').forEach(figure => {
    const frame = figure.querySelector('.sl-visual-frame');
    figure.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || reduce.matches) return;
      const rect = figure.getBoundingClientRect();
      frame.style.setProperty('--ry', ((event.clientX - rect.left) / rect.width - .5) * 10 + 'deg');
      frame.style.setProperty('--rx', ((event.clientY - rect.top) / rect.height - .5) * -8 + 'deg');
    });
    figure.addEventListener('pointerleave', () => { frame.style.removeProperty('--rx'); frame.style.removeProperty('--ry'); });
  });

  // Ciclo que solo corre mientras su sección se ve.
  function loop(element, delay, tick) {
    let timer = 0, visible = false;
    const run = () => { clearInterval(timer); if (visible && !document.hidden && !reduce.matches) timer = setInterval(tick, delay); };
    io(element, v => { visible = v; run(); }, {threshold: .2});
    document.addEventListener('visibilitychange', run);
    return {restart: run};
  }

  const solution = page.dataset.solution;

  // Marca el paso activo de una lista y reinicia su barra de avance.
  const mark = (items, index, duration) => items.forEach((li, i) => {
    li.style.setProperty('--sl-step', duration + 'ms');
    const on = i === index;
    if (on && li.classList.contains('is-active')) { li.classList.remove('is-active'); void li.offsetWidth; }
    li.classList.toggle('is-active', on);
  });
  const time = () => new Date().toLocaleTimeString(locale(), {hour: '2-digit', minute: '2-digit', second: '2-digit'});

  /* 01 · Diseño web: la web se construye sola, etapa por etapa. */
  if (solution === 'web') {
    const build = page.querySelector('[data-build]');
    const browser = build.querySelector('.sl-browser');
    const steps = [...build.querySelectorAll('.sl-build-steps li')];
    const tags = [...build.querySelectorAll('[data-tag]')];
    const label = build.querySelector('[data-build-label]');
    const STEP = 2600;
    let stage = 0;
    const set = next => {
      stage = next;
      browser.dataset.stage = String(next);
      mark(steps, next - 1, STEP);
      tags.forEach(tag => tag.classList.toggle('is-on', Number(tag.dataset.tag) === next));
      label.textContent = `0${next} · ${steps[next - 1].querySelector('strong').textContent}`;
      build.style.setProperty('--sl-build', String(next / 4));
    };
    const player = loop(build, STEP, () => set(stage % 4 + 1));
    steps.forEach(li => li.addEventListener('click', () => { set(Number(li.dataset.step)); player.restart(); }));
    document.addEventListener('tuplus:language-change', () => set(stage || 1));
    set(reduce.matches ? 4 : 1);
  }

  /* 02 · Tiendas virtuales: el recorrido de compra se reproduce solo. */
  if (solution === 'commerce') {
    const shop = page.querySelector('[data-shop]');
    const screens = [...shop.querySelectorAll('.sl-screen')];
    const steps = [...shop.querySelectorAll('.sl-shop-steps li')];
    const cart = shop.querySelector('[data-cart]');
    const phone = shop.querySelector('.sl-phone');
    const orders = shop.querySelector('[data-orders]');
    let current = -1, items = 0, count = 36;
    const show = index => {
      current = (index + screens.length) % screens.length;
      screens.forEach((screen, i) => { screen.classList.toggle('is-active', i === current); screen.classList.toggle('is-left', i < current); });
      mark(steps, current, 2800);
      phone.style.setProperty('--sl-shop', String((current + 1) / screens.length));
      if (current === 0) { items = 0; cart.textContent = '0'; }
      if (current === 1) setTimeout(() => { items = 1; cart.textContent = String(items); cart.classList.remove('is-pop'); void cart.offsetWidth; cart.classList.add('is-pop'); }, 1100);
      if (current === 3) { count++; orders.textContent = String(count); orders.classList.remove('is-bump'); void orders.offsetWidth; orders.classList.add('is-bump'); }
    };
    const player = loop(shop, 2800, () => show(current + 1));
    steps.forEach((li, i) => li.addEventListener('click', () => { show(i); player.restart(); }));
    show(0);
  }

  /* 03 · Automatización: un pulso recorre el flujo y enciende cada paso. */
  if (solution === 'automation') {
    const flow = page.querySelector('[data-flow]');
    const nodes = [...flow.querySelectorAll('.sl-node')];
    const pulse = flow.querySelector('.sl-pulse');
    const PER = 1000, PAUSE = 1600;
    let start = 0, frame = 0, visible = false, reached = -1, cycle = -1;
    // Lo que pasa en cada paso: una línea en el registro y, desde el aviso, su resultado.
    const log = page.querySelector('[data-log]');
    const results = [...page.querySelectorAll('[data-result]')];
    const processed = page.querySelector('[data-processed]');
    const messages = ['Consulta recibida desde el formulario', 'Cliente registrado en la base', 'WhatsApp enviado al cliente', 'Tarea creada para Ventas', 'Reporte semanal actualizado'];
    let count = 47;
    const emit = index => {
      const item = document.createElement('li');
      const stamp = document.createElement('time'); stamp.textContent = time();
      const text = document.createElement('span'); text.textContent = t(messages[index]);
      item.append(stamp, text); log.prepend(item);
      while (log.children.length > 6) log.lastElementChild.remove();
      results.forEach(card => { if (Number(card.dataset.result) === index) card.classList.add('is-on'); });
      if (index === 0) { count++; processed.textContent = String(count); }
    };
    const centers = () => nodes.map(node => {
      const icon = node.querySelector('.sl-node-icon'), base = flow.getBoundingClientRect(), r = icon.getBoundingClientRect();
      return [r.left - base.left + r.width / 2, r.top - base.top + r.height / 2];
    });
    let points = [];
    const tick = now => {
      frame = requestAnimationFrame(tick);
      if (!start) start = now;
      const total = PER * (nodes.length - 1) + PAUSE;
      const loopNo = Math.floor((now - start) / total);
      const elapsed = (now - start) % total;
      if (loopNo !== cycle) { cycle = loopNo; reached = -1; results.forEach(card => card.classList.remove('is-on')); }
      const travel = Math.min(1, elapsed / (PER * (nodes.length - 1)));
      const position = travel * (nodes.length - 1);
      const i = Math.min(nodes.length - 2, Math.floor(position)), k = position - i;
      const [x1, y1] = points[i], [x2, y2] = points[i + 1];
      pulse.style.transform = `translate(${x1 + (x2 - x1) * k}px,${y1 + (y2 - y1) * k}px)`;
      pulse.style.opacity = elapsed > PER * (nodes.length - 1) + PAUSE * .6 ? '0' : '1';
      nodes.forEach((node, n) => node.classList.toggle('is-lit', n <= position + .05 && elapsed < PER * (nodes.length - 1) + PAUSE * .8));
      while (reached < Math.min(nodes.length - 1, Math.floor(position + .05))) emit(++reached);
    };
    const run = () => {
      cancelAnimationFrame(frame);
      if (reduce.matches) { nodes.forEach(n => n.classList.add('is-lit')); if (!log.children.length) messages.forEach((m, i) => emit(i)); return; }
      if (visible && !document.hidden) { points = centers(); start = 0; cycle = -1; frame = requestAnimationFrame(tick); }
    };
    io(flow, v => { visible = v; run(); }, {threshold: .3});
    addEventListener('resize', () => { points = centers(); });
    document.addEventListener('visibilitychange', run);

    // Comparación antes / después.
    const compare = page.querySelector('[data-compare]');
    const toggle = compare.querySelector('.sl-switch');
    const metrics = [...compare.querySelectorAll('[data-metric]')];
    const setMode = (mode, animate = true) => {
      const after = mode === 'after';
      compare.dataset.mode = mode;
      toggle.setAttribute('aria-checked', String(after));
      toggle.setAttribute('aria-label', t(after ? 'Ver sin automatización' : 'Ver con automatización'));
      metrics.forEach(m => {
        const from = Number(m.textContent.replace(/\D/g, '')) || 0;
        const to = Number(after ? m.dataset.after : m.dataset.before);
        if (animate) countTo(m, to, {from, duration: 1100}); else m.textContent = String(to);
      });
    };
    toggle.addEventListener('click', () => setMode(compare.dataset.mode === 'after' ? 'before' : 'after'));
    setMode('before', false);
    let shown = false;
    io(compare, v => { if (v && !shown) { shown = true; setTimeout(() => setMode('after'), reduce.matches ? 0 : 900); } }, {threshold: .5});
  }

  /* 04 · Sistemas a medida: un panel vivo que pasa por cada área del negocio. */
  if (solution === 'systems') {
    const dash = page.querySelector('[data-dash]');
    const tabs = [...dash.querySelectorAll('[role="tab"]')];
    const areas = [...dash.querySelectorAll('[data-area]')];
    const mods = [...dash.querySelectorAll('[data-mod]')];
    const labels = [...dash.querySelectorAll('[data-kpi-label]')];
    const values = [...dash.querySelectorAll('[data-kpi]')];
    const bars = [...dash.querySelectorAll('.sl-bars i')];
    const feed = dash.querySelector('[data-feed]');
    const ring = dash.querySelector('.sl-goal-ring'), goal = dash.querySelector('[data-goal]');
    const toast = dash.querySelector('[data-toast]'), toastText = toast.querySelector('span');
    const user = dash.querySelector('[data-user]'), avatar = dash.querySelector('[data-avatar]');
    const STEP = 6000;
    const percent = v => Math.round(v) + '%';
    const roles = [
      {name: 'Gerencia', goal: 82, kpis: [['Ingresos del mes', 48200, price], ['Proyectos activos', 12], ['Satisfacción', 96, percent]], bars: [42, 58, 51, 66, 72, 61, 84],
        feed: ['Reporte mensual listo', 'Meta de ventas al 82%', 'Nuevo proyecto aprobado', 'Presupuesto actualizado']},
      {name: 'Ventas', goal: 64, kpis: [['Cotizaciones enviadas', 34], ['Clientes nuevos', 18], ['Tasa de cierre', 42, percent]], bars: [30, 44, 62, 48, 70, 76, 58],
        feed: ['Cotización #318 enviada', 'Nuevo cliente registrado', () => `${t('Venta cerrada:')} ${price(2400)}`, 'Seguimiento agendado']},
      {name: 'Operaciones', goal: 91, kpis: [['Pedidos en curso', 27], ['Tareas completadas', 86], ['Entregas a tiempo', 98, percent]], bars: [64, 52, 70, 58, 80, 68, 74],
        feed: ['Pedido #2041 despachado', 'Inventario actualizado', 'Tarea asignada a Ana', 'Entrega confirmada']}
    ];
    let role = -1, feedIndex = 0, toastTimer = 0;
    const push = (notify = true) => {
      const list = roles[role].feed, entry = list[feedIndex++ % list.length], text = typeof entry === 'function' ? entry() : t(entry), item = document.createElement('li');
      item.textContent = text;
      feed.prepend(item);
      while (feed.children.length > 4) feed.lastElementChild.remove();
      if (!notify || reduce.matches) return;
      toastText.textContent = text;
      toast.classList.add('is-on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('is-on'), 1600);
    };
    const select = index => {
      role = index;
      tabs.forEach((tab, i) => tab.setAttribute('aria-selected', String(i === index)));
      mark(areas, index, STEP);
      mods.forEach(mod => mod.classList.toggle('is-on', mod.dataset.mod.split(' ').includes(String(index))));
      const data = roles[index];
      user.textContent = t(data.name); avatar.textContent = t(data.name).charAt(0);
      data.kpis.forEach(([label, value, format], i) => { labels[i].textContent = t(label); countTo(values[i], value, {format: format || (v => Math.round(v).toLocaleString(locale()))}); });
      countTo(goal, data.goal, {format: v => { ring.style.setProperty('--p', v.toFixed(1)); return Math.round(v) + '%'; }});
      bars.forEach((bar, i) => { bar.style.setProperty('--h', '6%'); requestAnimationFrame(() => requestAnimationFrame(() => bar.style.setProperty('--h', data.bars[i] + '%'))); });
      feed.textContent = ''; feedIndex = 0;
      for (let i = 0; i < 3; i++) push(false);
    };
    let started = false;
    const cycle = loop(dash, STEP, () => { if (role >= 0) select((role + 1) % roles.length); });
    const pick = i => { select(i); cycle.restart(); };
    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => pick(i));
      tab.addEventListener('keydown', event => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        const next = (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        tabs[next].focus(); pick(next);
      });
    });
    areas.forEach((li, i) => li.addEventListener('click', () => pick(i)));
    io(dash, v => { if (v && !started) { started = true; select(0); cycle.restart(); } }, {threshold: .3});
    loop(dash, 2000, () => { if (role >= 0) push(); });
    document.addEventListener('tuplus:language-change', () => { if (role >= 0) select(role); });
  }

  /* 05 · Datos y seguridad: cada capa se ilumina y muestra lo que hace. */
  if (solution === 'data-security') {
    const shield = page.querySelector('[data-shield]');
    const items = [...shield.querySelectorAll('.sl-layers li')];
    const rings = [...shield.querySelectorAll('.sl-ring')];
    const screens = [...shield.querySelectorAll('[data-detail]')];
    const core = shield.querySelector('[data-core]');
    const cipher = shield.querySelector('[data-cipher]');
    const bar = shield.querySelector('[data-backup-bar]'), pct = shield.querySelector('[data-backup-pct]'), backupText = shield.querySelector('[data-backup-text]');
    const STEP = 3200, ICONS = ['🔒', '🔐', '💾', '📡'];
    const plain = cipher.textContent, glyphs = 'A9#xQ7$kP2!mZ4&rT8%wL5';
    let current = -1, timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const light = index => {
      current = index;
      timers.forEach(clearTimeout); timers = [];
      mark(items, index, STEP);
      const layer = items[index].dataset.layer;
      rings.forEach(ring => ring.classList.toggle('is-on', ring.dataset.layer === layer));
      screens.forEach((screen, i) => screen.classList.toggle('is-on', i === index));
      core.textContent = ICONS[index];
      if (index === 1) { // el dato se cifra letra por letra
        cipher.textContent = plain;
        [...plain].forEach((_, i) => later(() => { cipher.textContent = [...plain].map((c, j) => j <= i && c !== ' ' ? glyphs[(j * 7 + i) % glyphs.length] : c).join(''); }, 500 + i * 55));
      }
      if (index === 2) { // copia de seguridad que avanza hasta completarse
        backupText.textContent = t('Copiando…');
        for (let k = 0; k <= 20; k++) later(() => {
          bar.style.setProperty('--w', k * 5 + '%'); pct.textContent = k * 5 + '%';
          if (k === 20) backupText.textContent = t('Copia completada ✓');
        }, 300 + k * 90);
      }
    };
    let hold = false;
    items.forEach((li, i) => {
      li.addEventListener('pointerenter', () => { hold = true; if (current !== i) light(i); });
      li.addEventListener('pointerleave', () => { hold = false; });
      li.addEventListener('click', () => light(i));
    });
    loop(shield, STEP, () => { if (!hold) light((current + 1) % items.length); });
    light(0);
    // "Última copia": se completa una nueva copia cada cierto tiempo.
    const ago = page.querySelector('[data-ago]');
    let phase = 0;
    loop(ago, 3000, () => {
      phase = (phase + 1) % 4;
      ago.textContent = phase === 2 ? t('Copiando…') : phase === 3 ? t('ahora mismo') : t('hace 2 min');
    });
  }
})();
