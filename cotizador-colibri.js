/* TUPLUS cotizador: colibrí completo y con vida (capa aditiva).
   1) Lo deja completo y visible encima de la tarjeta de país/moneda.
   2) Acciones: saluda, sigue el cursor, reacciona, señala el precio, celebra al final y descansa.
   Usa solo elementos que ya existen. No toca neon-trail.js ni brand-flight.js.
   Para desactivarla, quita los 2 enlaces de cotizador.html. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const stage = $('#heroStage');
  const scene = stage && $('.hummingbird-scene', stage);
  const core = scene && $('.bird-core', scene);
  const img = core && $('img', core);
  const card = stage && $('.currency-control', stage);
  if (!stage || !scene || !core || !img || !card) return;

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const GLOW0 = 'saturate(1.5) brightness(1.2) drop-shadow(0 0 6px #ffc83d) drop-shadow(0 0 20px rgba(255,190,50,.55))';
  const GLOW1 = 'saturate(1.9) brightness(1.5) drop-shadow(0 0 14px #ffe08a) drop-shadow(0 0 40px rgba(255,200,70,.95))';

  /* La etiqueta "ESTIMADO" sale de la escena y pasa a la esquina del escenario */
  const badge = $('.xd-pricebadge', scene) || $('.xd-pricebadge', stage);
  if (badge && badge.parentNode !== stage) stage.appendChild(badge);

  /* ---------- Estado ---------- */
  const pos = { x: 0, y: 0, r: 0 };           // desplazamiento del colibrí (px locales de la escena)
  let S = 1;                                    // escala aplicada a la escena
  let home = { x: 0, y: 0 }, bw = 160, bh = 160;
  let lim = { x0: 0, x1: 0, y0: 0, y1: 0 };     // zona por donde puede volar (coordenadas del escenario)
  let tw = null, cur = null, raf = 0, last = 0;
  let ptr = null, inView = false, greeted = false, fitted = false;
  let resting = false, restAnim = null, lastAct = performance.now(), lastTrail = 0, pendingFit = false, away = false;

  const clampT = (x, y) => ({ x: clamp(x, lim.x0, lim.x1), y: clamp(y, lim.y0, lim.y1) });
  const toLocal = (x, y) => ({ x: (x - home.x) / S, y: (y - home.y) / S });
  const stRect = () => stage.getBoundingClientRect();
  function birdRel() {
    const st = stRect(), b = img.getBoundingClientRect();
    return { x: b.left - st.left + b.width / 2, y: b.top - st.top + b.height / 2, w: b.width, h: b.height };
  }

  function render() {
    core.style.setProperty('--xc-x', pos.x.toFixed(2) + 'px');
    core.style.setProperty('--xc-y', pos.y.toFixed(2) + 'px');
    core.style.setProperty('--xc-r', pos.r.toFixed(2) + 'deg');
    const a = Math.abs(pos.x) + Math.abs(pos.y) > 14;
    if (a !== away) { away = a; scene.classList.toggle('xc-away', a); }
  }

  /* ---------- 1. Encaja el colibrí: completo, arriba de la tarjeta ---------- */
  function fit() {
    if (!img.offsetHeight || !card.offsetHeight) return;
    if (tw) { const r = tw.res; tw = null; r(); }
    if (cur) { cur.dead = true; cur = null; }
    pos.x = pos.y = pos.r = 0; render();
    stage.style.minHeight = '';
    scene.style.setProperty('--xc-s', '1');
    scene.style.setProperty('--xc-sy', '0px');
    S = 1;

    const cs = getComputedStyle(stage);
    const pad = cs.boxSizing === 'border-box' ? 0
      : (parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth)) || 0;
    let st = stRect(), cr = card.getBoundingClientRect();
    const pic = Math.min(img.offsetHeight, 300) * .95;
    const need = pic + 30, free = cr.top - st.top - 16;
    if (free < need) {                                  // la tarjeta creció y se come el espacio del colibrí
      const cap = 260, g = Math.min(need - free, cap);
      stage.style.minHeight = (st.height + g - pad) + 'px';
      if (need - free > cap) { S = clamp((free + cap - 30) / pic, .6, 1); scene.style.setProperty('--xc-s', S.toFixed(3)); }
      st = stRect(); cr = card.getBoundingClientRect();
    }
    let b = img.getBoundingClientRect();
    const top = st.top + 12, bottom = Math.max(top + 50, cr.top - 12);
    if (b.bottom > bottom + 4 || b.top < top - 4) {      // lo centramos en el espacio libre
      const dy = (top + bottom) / 2 - (b.top + b.height / 2);
      scene.style.setProperty('--xc-sy', dy.toFixed(1) + 'px');
      b = img.getBoundingClientRect();
    }
    bw = b.width; bh = b.height;
    home = { x: b.left - st.left + bw / 2, y: b.top - st.top + bh / 2 };
    const hw = bw * .3, hh = bh * .32;
    lim = { x0: hw + 8, x1: st.width - hw - 8, y0: hh + 8, y1: Math.max(hh + 10, cr.top - st.top - 12 - hh) };
    if (lim.y1 < lim.y0) lim.y1 = lim.y0;
    fitted = true;
    if (reduce) return;
    kick();
    if (inView && !greeted) { greeted = true; request('greet', 2, greet); }
  }

  /* ---------- Motor de movimiento ---------- */
  const kick = () => { if (!raf && !reduce) raf = requestAnimationFrame(tick); };

  function fly(to, ms, ez = easeIO, path) {
    return new Promise(res => {
      if (tw) tw.res();
      tw = { f: { x: pos.x, y: pos.y, r: pos.r }, t: { x: to.x ?? pos.x, y: to.y ?? pos.y, r: to.r ?? pos.r }, t0: performance.now(), ms, ez, path, res };
      kick();
    });
  }

  function tick(now) {
    raf = 0;
    if (document.hidden) { last = 0; return; }
    const dt = last ? Math.min(48, now - last) : 16.7; last = now;
    let more = false;
    if (tw) {
      const k = clamp((now - tw.t0) / tw.ms, 0, 1), e = tw.ez(k), p = tw.path ? tw.path(k) : null;
      pos.x = lerp(tw.f.x, tw.t.x, e) + (p && p.x || 0);
      pos.y = lerp(tw.f.y, tw.t.y, e) + (p && p.y || 0);
      pos.r = lerp(tw.f.r, tw.t.r, e) + (p && p.r || 0);
      if (k > .04 && k < .96 && now - lastTrail > 90) { lastTrail = now; trail(); }
      if (k >= 1) { const r = tw.res; tw = null; r(); }
      more = true;
    } else if (!cur && fitted) {                         // libre: sigue el cursor o vuelve a su lugar
      const f = 1 - Math.pow(1 - .085, dt / 16.7), fr = 1 - Math.pow(1 - .12, dt / 16.7);
      let t = { x: 0, y: 0 };
      if (ptr && !resting) {
        const c = clampT(ptr.x + 34, ptr.y - 26);
        t = toLocal(c.x, c.y); t.y += Math.sin(now / 340) * 2.5;
      }
      const dx = t.x - pos.x, dy = t.y - pos.y;
      pos.x += dx * f; pos.y += dy * f;
      pos.r += (clamp(dx * .35, -16, 16) - pos.r) * fr;
      more = !!ptr || Math.abs(dx) > .25 || Math.abs(dy) > .25 || Math.abs(pos.r) > .3;
      if (!more) { pos.x = t.x; pos.y = t.y; pos.r = 0; }
    }
    render();
    if (more) kick(); else last = 0;
  }

  /* Cada acción tiene prioridad: final > precio > reacción > saludo. Una más importante interrumpe a una menor. */
  function request(name, pri, fn) {
    if (reduce || !fitted) return false;
    if (cur && cur.pri >= pri) return false;
    if (cur) { cur.dead = true; if (tw) { const r = tw.res; tw = null; r(); } }
    const c = { name, pri, dead: false };
    cur = c;
    (async () => {
      try { await fn(c); } catch (e) { console.warn('[colibri]', e); }
      if (cur === c) { cur = null; if (pendingFit) { pendingFit = false; fit(); } kick(); }
    })();
    return true;
  }

  /* ---------- Efectos (conviven con cualquier movimiento) ---------- */
  function spawnPollen(n, x, y, spread = 70, drop = 26) {
    if (reduce) return;
    const f = document.createDocumentFragment();
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i'), a = Math.random() * 6.283, d = 14 + Math.random() * spread;
      p.className = 'xc-pollen';
      p.style.cssText = `left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d + drop).toFixed(0)}px;--s:${(3 + Math.random() * 4).toFixed(1)}px;--t:${(800 + Math.random() * 700).toFixed(0)}ms`;
      f.appendChild(p);
      setTimeout(() => p.remove(), 1600);
    }
    stage.appendChild(f);
  }
  function trail() { const b = birdRel(); spawnPollen(1, b.x - 8 + Math.random() * 16, b.y + 6 + Math.random() * 10, 14, 8); }

  function flutter(ms = 700) {                           // aleteo rápido + destello dorado
    if (reduce || !img.animate) return;
    img.animate([{ transform: 'scaleX(1) skewX(0deg)' }, { transform: 'scaleX(.8) skewX(7deg)' }],
      { duration: 55, iterations: Math.max(2, Math.round(ms / 55)), direction: 'alternate', composite: 'add' });
    img.animate([{ filter: GLOW0 }, { filter: GLOW1, offset: .35 }, { filter: GLOW0 }], { duration: ms + 200, easing: 'ease-out' });
  }

  /* ---------- Acciones ---------- */
  async function greet(c) {                              // saluda al entrar: vuelo corto y se posa
    pos.x = (-bw * .6 - home.x) / S; pos.y = 0; pos.r = -16; render();
    flutter(1200);
    await fly({ x: 0, y: 0, r: 0 }, 2000, easeOut, k => ({ y: -Math.sin(k * Math.PI) * 38 * (1 - k * .4), r: Math.sin(k * Math.PI) * 10 }));
    if (c.dead) return;
    spawnPollen(10, home.x, home.y + bh * .25);
    flutter(500);
  }

  async function hop(c) {                                // reacciona al cambiar país o moneda
    await fly({ y: pos.y - 12 }, 170, easeOut);
    if (c.dead) return;
    await fly({ y: pos.y + 12 }, 280, easeIO);
  }

  async function pricePoint(c) {                         // señala el precio: vuela a la etiqueta y se posa un segundo
    if (!badge) return;
    const st = stRect(), b = badge.getBoundingClientRect();
    const t = clampT(b.left - st.left - bw * .28, b.top - st.top + b.height / 2 + 4), L = toLocal(t.x, t.y);
    flutter(500);
    await fly({ x: L.x, y: L.y, r: -8 }, 900, easeIO, k => ({ y: -Math.sin(k * Math.PI) * 16 }));
    if (c.dead) return;
    if (badge.animate) {
      const sh = '0 14px 34px rgba(18,44,61,.35),';
      badge.animate([{ boxShadow: sh + '0 0 24px rgba(225,195,139,.25)' }, { boxShadow: sh + '0 0 46px rgba(255,214,120,.95)' }, { boxShadow: sh + '0 0 24px rgba(225,195,139,.25)' }], { duration: 1000 });
    }
    spawnPollen(8, t.x, t.y);
    await wait(1100);
    if (c.dead) return;
    await fly({ x: 0, y: 0, r: 0 }, 1100, easeIO);
  }

  async function celebrate(c) {                          // se emociona al final: vuelta en el aire
    flutter(1600);
    const A = 36;
    await fly({ r: 360 }, 1500, easeIO, k => ({ x: Math.sin(k * 6.283) * A * .9, y: -(1 - Math.cos(k * 6.283)) * A * .7 }));
    if (c.dead) return;
    pos.r = 0; render();
    const b = birdRel(); spawnPollen(16, b.x, b.y + bh * .2, 90, 30);
    await wait(450);
    if (c.dead) return;
    await fly({ x: 0, y: 0, r: 0 }, 1000, easeIO);
  }

  function celebrateProgressBird() {                     // el colibrí de la barra da una vuelta y va al botón de WhatsApp
    const pb = $('.xt-bird'), btn = $('#whatsappBtn');
    if (reduce || !pb || !pb.animate) return;
    const K = (x, y, r, o) => ({ transform: `translate(${x}px,${y}px) rotate(${r}deg)`, offset: o, easing: 'ease-in-out' });
    const a = pb.getBoundingClientRect();
    let tx = 0, ty = 0, goes = false;
    if (btn) {
      const t = btn.getBoundingClientRect();
      if (t.top < innerHeight && t.bottom > 0) {
        goes = true;
        tx = (t.left + Math.min(46, t.width * .2)) - (a.left + a.width / 2);
        ty = (t.top - 18) - (a.top + a.height / 2);
      }
    }
    const loop = [K(0, 0, 0, 0), K(0, -20, -30, .07), K(30, -48, 80, .14), K(0, -64, 180, .22), K(-30, -48, 270, .30), K(0, -20, 345, .37), K(0, 0, 360, goes ? .42 : 1)];
    const trip = goes ? [K(tx * .5, ty * .5 - 26, 360, .58), K(tx, ty, 360, .70), K(tx, ty - 7, 360, .78), K(tx, ty, 360, .86), K(0, 0, 360, 1)] : [];
    pb.animate([...loop, ...trip], { duration: goes ? 4200 : 1500, composite: 'add' });
    if (goes && btn.animate) {
      btn.animate([{ boxShadow: '0 0 0 0 rgba(225,195,139,0)' }, { boxShadow: '0 0 0 12px rgba(225,195,139,.35)' }, { boxShadow: '0 0 0 0 rgba(225,195,139,0)' }],
        { duration: 900, iterations: 2, delay: 2800 });
    }
  }

  /* ---------- Descansa: sin actividad, se queda quieto con las alas lentas ---------- */
  function rest() {
    if (resting || cur || tw || ptr) return;
    resting = true; scene.classList.add('xc-rest');
    if (img.animate) restAnim = img.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(.93) skewX(2deg)' }],
      { duration: 1100, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out', composite: 'add' });
    kick();
  }
  function wake() {
    lastAct = performance.now();
    if (!resting) return;
    resting = false; scene.classList.remove('xc-rest');
    if (restAnim) { restAnim.cancel(); restAnim = null; }
    kick();
  }

  /* ---------- Conexiones ---------- */
  // Sigue el cursor (o el dedo) dentro del escenario
  const setPtr = e => { const st = stRect(); ptr = { x: e.clientX - st.left, y: e.clientY - st.top }; kick(); };
  const clearPtr = () => { ptr = null; kick(); };
  if (!reduce) {
    stage.addEventListener('pointermove', setPtr, { passive: true });
    stage.addEventListener('pointerdown', setPtr, { passive: true });
    stage.addEventListener('pointerleave', clearPtr);
    stage.addEventListener('pointercancel', clearPtr);
    ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(ev => addEventListener(ev, wake, { passive: true, capture: true }));
    setInterval(() => { if (inView && !resting && !cur && !tw && !ptr && performance.now() - lastAct > 7000) rest(); }, 1000);
    document.addEventListener('visibilitychange', () => { last = 0; if (!document.hidden) kick(); });
  }

  // Reacciona al cambiar país o moneda (también cuando lo hacen los botones PEN, USD, EUR...)
  ['#countrySelect', '#currencySelect'].forEach(sel => {
    const el = $(sel);
    if (el) el.addEventListener('change', () => { if (!inView || reduce) return; flutter(750); request('react', 3, hop); });
  });

  // Señala el precio cuando cambia "ESTIMADO" (espera a que termine de contar)
  const live = $('#liveTotal');
  if (live && !reduce) {
    let tm = 0, born = performance.now();
    new MutationObserver(() => {
      clearTimeout(tm);
      tm = setTimeout(() => { if (inView && performance.now() - born > 3500) request('price', 4, pricePoint); }, 420);
    }).observe(live, { childList: true, characterData: true, subtree: true });
  }

  // Cambios de etapa: polen al avanzar; en la última, celebra
  const stepsBox = $('.steps'), steps = $$('.step');
  if (stepsBox && steps.length && !reduce) {
    const idx = () => steps.findIndex(s => s.classList.contains('active'));
    let lastStep = idx();
    new MutationObserver(() => {
      const i = idx(); if (i < 0 || i === lastStep) return;
      const up = i > lastStep; lastStep = i; wake();
      if (up && inView) { const b = birdRel(); spawnPollen(14, b.x, b.y + bh * .2); flutter(600); }
      if (up && i === steps.length - 1) setTimeout(() => { if (inView) request('final', 5, celebrate); celebrateProgressBird(); }, 650);
    }).observe(stepsBox, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }

  // Visible en pantalla: saluda la primera vez y hace compacto el botón flotante de WhatsApp
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => {
      inView = es[0].isIntersecting;
      document.body.classList.toggle('xc-wa-compact', inView);
      if (inView) { wake(); kick(); if (!greeted && fitted && !reduce) { greeted = true; request('greet', 2, greet); } }
    }, { threshold: .15 }).observe(stage);
  }

  // Re-encaja cuando cambia el tamaño o el contenido de la tarjeta
  let fr = 0;
  const refit = () => {
    cancelAnimationFrame(fr);
    fr = requestAnimationFrame(() => { if (cur || tw) { pendingFit = true; return; } fit(); });
  };
  if ('ResizeObserver' in window) new ResizeObserver(refit).observe(card);
  addEventListener('resize', refit);
  addEventListener('load', refit);
  document.addEventListener('tuplus:language-change', () => setTimeout(refit, 120));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  if (!img.complete) img.addEventListener('load', refit);
  refit();
})();
