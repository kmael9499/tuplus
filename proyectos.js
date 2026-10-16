/* Sección "De la idea a la pantalla".
   La escena se queda fija mientras se baja y avanza con el scroll:
   1. Las cinco tarjetas abiertas en abanico, bajo el título.
   2. Cada concepto pasa al frente: su página se genera (boceto → diseño) y su información aparece línea a línea.
   3. Al final, las cinco tarjetas se reúnen con la invitación a cotizar.
   Mientras está fija, avanza sola (un concepto tras otro); el scroll la acelera.
   Con movimiento reducido (o sin JavaScript) se muestra la versión estática de proyectos.css. */
(() => {
  'use strict';
  const film = document.querySelector('.tp-film');
  if (!film) return;
  const scene = film.querySelector('.tp-scene');
  const intro = film.querySelector('.tp-intro');
  const final = film.querySelector('.tp-final');
  const bottom = film.querySelector('.tp-bottom');
  const header = document.querySelector('.site-header');
  const concepts = [...film.querySelectorAll('.tp-concept')].map(element => {
    const info = element.querySelector('.tp-info');
    return {
      plane: element.querySelector('.tp-plane'),
      info,
      lines: [...info.children].flatMap(child => child.matches('ul') ? [...child.children] : [child])
    };
  });
  const chapters = [...film.querySelectorAll('.tp-chapters li')];
  // Cuenta regresiva de la página de campaña (ilustrativa).
  const countdown = film.querySelector('[data-countdown]');
  if (countdown) {
    let left = 2 * 3600 + 14 * 60 + 37;
    const pad = n => String(n).padStart(2, '0');
    setInterval(() => {
      if (document.hidden) return;
      left = left > 0 ? left - 1 : 2 * 3600 + 14 * 60 + 37;
      countdown.textContent = `${pad(Math.floor(left / 3600))}:${pad(Math.floor(left % 3600 / 60))}:${pad(left % 60)}`;
    }, 1000);
  }
  const stage = film.querySelector('.tp-stage');
  const tr = value => window.TUPLUS_I18N?.t(value) || value;
  // Cada concepto se genera a su manera, según lo que es: boceto propio, forma de aparecer y mensaje.
  const KINDS = [
    {gen: 'web', doing: 'Generando página', done: 'Página lista'},
    {gen: 'shop', doing: 'Cargando productos', done: 'Tienda lista'},
    {gen: 'launch', doing: 'Lanzando campaña', done: 'Campaña en línea'},
    {gen: 'system', doing: 'Conectando datos', done: 'Panel conectado'},
    {gen: 'catalog', doing: 'Armando catálogo', done: 'Catálogo listo'}
  ];
  const SKELETONS = {
    web: b => `<div class="tp-skel-nav">${b()}${b()}${b()}</div><div class="tp-skel-text">${b()}${b()}${b()}${b()}${b()}</div>${b('tp-skel-art')}<div class="tp-skel-foot">${b()}${b()}${b()}</div>`,
    shop: b => `<div class="tp-skel-nav">${b()}${b()}${b()}</div>${b('tp-skel-hero')}<div class="tp-skel-foot">${b()}${b()}${b()}</div>`,
    launch: b => `<div class="tp-skel-nav">${b()}${b()}</div><div class="tp-skel-text">${b()}${b()}${b()}${b()}${b()}</div>${b('tp-skel-ring')}<div class="tp-skel-foot">${b()}</div>`,
    system: b => `<div class="tp-skel-side">${b()}${b()}${b()}${b()}${b()}</div><div class="tp-skel-main">${b('tp-skel-h')}<div class="tp-skel-kpis">${b()}${b()}${b()}</div>${b('tp-skel-chart')}</div>`,
    catalog: b => `<div class="tp-skel-nav">${b()}${b()}</div><div class="tp-skel-center">${b()}${b()}${b()}<div class="tp-skel-dots">${b()}${b()}${b()}</div>${b()}</div>`
  };
  concepts.forEach((item, index) => {
    const card = item.plane.querySelector('.tp-card');
    const kind = KINDS[index % KINDS.length];
    card.dataset.gen = kind.gen;
    item.kind = kind;
    // En la tienda, las piezas aparecen una tras otra.
    if (kind.gen === 'shop') card.querySelectorAll('.tpl-mini-nav,.tpl-shop-hero,.tpl-products>div').forEach((piece, i) => piece.style.setProperty('--pk', i));
    let k = 0;
    const bar = (cls = '') => `<i${cls ? ` class="${cls}"` : ''} style="--k:${k++}"></i>`;
    const skel = document.createElement('div');
    skel.className = 'tp-skel tp-skel-' + kind.gen; skel.setAttribute('aria-hidden', 'true');
    skel.innerHTML = SKELETONS[kind.gen](bar);
    const scan = document.createElement('span');
    scan.className = 'tp-scan'; scan.setAttribute('aria-hidden', 'true');
    card.append(skel, scan);
    const hud = document.createElement('div');
    hud.className = 'tp-build'; hud.setAttribute('aria-hidden', 'true');
    hud.innerHTML = '<span class="tp-build-dot"></span><span data-build-text></span><span class="tp-build-bar"><i></i></span><b data-build-pct>0%</b>';
    item.plane.append(hud);
    Object.assign(item, {card, hud, hudText: hud.querySelector('[data-build-text]'), hudPct: hud.querySelector('[data-build-pct]'), state: ''});
  });
  const count = concepts.length;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // Línea de tiempo en "tramos": entrada (1) + un tramo por concepto + cierre.
  const INTRO = 1, OUTRO = 1.2, TOTAL = INTRO + count + OUTRO;
  const clamp = value => Math.min(1, Math.max(0, value));
  const ease = value => value < .5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
  const span = (t, from, to) => ease(clamp((t - from) / (to - from)));
  const mix = (a, b, k) => a + (b - a) * k;
  const blend = (a, b, k) => ({x: mix(a.x, b.x, k), y: mix(a.y, b.y, k), s: mix(a.s, b.s, k), r: mix(a.r, b.r, k), ry: mix(a.ry, b.ry, k), o: mix(a.o, b.o, k)});

  let active = false, geo = null, travel = 1, top = 0, target = 0, shown = 0, frame = 0, last = 0;
  // Vista completa: la escena queda en su estado final y deja de estar fija, así al subir no se
  // rebobina. Vuelve a reproducirse solo si se sube por encima de ella y luego se baja de nuevo.
  let finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    const html = document.documentElement, keep = scrollY - travel;
    html.style.overflowAnchor = 'none';
    film.style.height = geo.H + 'px';
    void film.offsetHeight;
    window.scrollTo({top: Math.max(0, keep), behavior: 'instant'});
    requestAnimationFrame(() => { html.style.overflowAnchor = ''; });
  }
  function rearm() {
    finished = false; target = shown = 0;
    measure();
  }

  // Medidas de la escena y de cada pose clave.
  function measure() {
    if (!active) return;
    top = header && getComputedStyle(header).position !== 'static' ? header.offsetHeight : 0;
    const H = innerHeight - top;
    film.style.setProperty('--tp-top', top + 'px');
    film.style.setProperty('--tp-h', H + 'px');
    const W = scene.clientWidth, mobile = W <= 600;
    const gutter = parseFloat(getComputedStyle(bottom).marginLeft) || 20;
    const floor = H - bottom.offsetHeight - (mobile ? 16 : 22);

    // Abanico inicial, bajo el título.
    const fanTop = intro.offsetTop + intro.offsetHeight + (mobile ? 26 : 34);
    const fanS = Math.min((mobile ? .84 : .48) * W / 440, (floor - fanTop) / 310);
    const fanY = fanTop + 155 * fanS;

    // Concepto al frente: tarjeta a la derecha y su información a la izquierda (arriba y abajo en móvil).
    let focus, infoTop;
    if (mobile) {
      const s = .86 * W / 440;
      focus = {x: W / 2, y: 22 + 155 * s, s, r: 0, ry: 0, o: 1};
      infoTop = () => focus.y + 155 * s + 46; // deja sitio al estado de la generación
    } else {
      const infoRight = gutter + Math.min(W * .32, 420);
      const left = infoRight + W * .03, right = W - W * .1;
      const s = Math.min((right - left) / 440, (floor - 70) / 310);
      focus = {x: (left + right) / 2, y: 30 + (floor - 30) / 2, s, r: 0, ry: 0, o: 1};
      infoTop = height => focus.y - height / 2;
    }
    const peekS = focus.s * .62;
    const peek = {x: W + 220 * peekS - W * (mobile ? .07 : .06), y: focus.y + 24, s: peekS, r: 6, ry: -22, o: .55};
    const beyond = {...peek, x: W + 440 * focus.s, o: 0};
    const exit = {x: focus.x - W * .6, y: focus.y - 30, s: focus.s * .7, r: -10, ry: 24, o: 0};

    // Cierre: las cinco en fila (en abanico de mano en móvil) bajo el texto final.
    const finalBottom = final.offsetTop + final.offsetHeight + (mobile ? 24 : 34);
    const rowH = floor - finalBottom;
    const gap = 18;
    const rowS = mobile ? Math.min(.42, rowH / 310 * .8) : Math.min((W - 2 * gutter - 4 * gap) / count / 440, rowH / 310 * .9);
    const row = index => {
      const offset = index - (count - 1) / 2;
      return mobile
        ? {x: W / 2 + offset * W * .17, y: finalBottom + rowH / 2 + Math.abs(offset) * 14, s: rowS, r: offset * 7, ry: 0, o: 1}
        : {x: W / 2 + offset * (440 * rowS + gap), y: finalBottom + rowH / 2 + Math.abs(offset) * 8, s: rowS, r: offset * 1.6, ry: 0, o: 1};
    };

    // Posición de cada concepto en el abanico: el primero al centro, los demás alternando a los lados.
    const fan = index => {
      const slot = index === 0 ? 0 : (index % 2 ? 1 : -1) * Math.ceil(index / 2);
      const side = Math.sign(slot), far = Math.abs(slot);
      if (!far) return {x: W / 2, y: fanY, s: fanS, r: -2, ry: 0, o: 1};
      return {
        x: W / 2 + side * W * (far === 1 ? (mobile ? .62 : .32) : (mobile ? .92 : .5)),
        y: fanY + 310 * fanS * .06 * far,
        s: fanS * (far === 1 ? .74 : .58),
        r: side * (far === 1 ? 9 : 15), ry: -side * (far === 1 ? 15 : 24),
        o: far === 1 || !mobile ? 1 : 0
      };
    };
    const flyout = pose => ({...pose, x: pose.x + Math.sign(pose.x - W / 2) * 352 * pose.s, r: pose.r * 2.2, o: 0});

    geo = {W, H, mobile, focus, peek, beyond, exit, fan, flyout, row, infoTop};
    concepts.forEach(item => { item.height = item.info.offsetHeight; });
    travel = Math.round(innerHeight * (mobile ? .75 : .8) * TOTAL);
    film.style.height = H + (finished ? 0 : travel) + 'px';
    scrolled();
    shown = target;
    paint();
  }

  // Pose de una tarjeta según su distancia al concepto que está al frente.
  function sequence(distance) {
    const {exit, focus, peek, beyond} = geo;
    if (distance <= -1) return exit;
    if (distance <= 0) return blend(exit, focus, distance + 1);
    if (distance <= 1) return blend(focus, peek, distance);
    if (distance <= 2) return blend(peek, beyond, distance - 1);
    return beyond;
  }

  function place(element, pose) {
    element.style.transform = `translate3d(${(pose.x - 220).toFixed(1)}px,${(pose.y - 155).toFixed(1)}px,0) rotate(${pose.r.toFixed(2)}deg) rotateY(${pose.ry.toFixed(2)}deg) scale(${pose.s.toFixed(4)})`;
    element.style.opacity = pose.o.toFixed(3);
    element.style.visibility = pose.o < .005 ? 'hidden' : 'visible';
  }

  function paint() {
    if (!geo) return;
    const t = shown * TOTAL;
    const outro = t - INTRO - count;
    // Concepto al frente (con decimales durante el cambio).
    const local = t - INTRO;
    const step = Math.min(count - 1, Math.max(0, Math.floor(local)));
    const front = step + (step < count - 1 ? span(local - step, .7, 1) : 0);

    concepts.forEach((item, index) => {
      let pose = sequence(index - front);
      if (t < INTRO) {
        const start = geo.fan(index);
        const goal = pose.o > 0 ? pose : geo.flyout(start);
        pose = blend(start, goal, span(t, 0, .95));
      } else if (outro > 0) {
        const goal = geo.row(index);
        const from = pose.o > 0 ? pose : {...goal, y: goal.y + 120, o: 0};
        pose = blend(from, goal, span(outro - .05 * index, 0, .7));
      }
      place(item.plane, pose);

      // Las cinco se ven completas; cada una se construye desde cero solo cuando queda sola al frente.
      const turn = local - index;
      const skel = 1;
      // Completa hasta su turno; al quedar sola al frente se reinicia en boceto y se construye desde cero.
      const reveal = outro > 0 ? 1 : turn < -.22 ? 1 : turn < -.12 ? 1 - (turn + .22) / .1 : clamp((turn + .12) / .6);
      const scanning = Math.min(1, reveal * 14, (1 - reveal) * 14);
      item.card.style.setProperty('--tp-skel', skel.toFixed(3));
      item.card.style.setProperty('--tp-reveal', reveal.toFixed(4));
      item.card.style.setProperty('--tp-scanning', scanning.toFixed(3));
      const isFront = t > .5 && outro < .3 && Math.round(front) === index;
      item.plane.classList.toggle('is-front', isFront);
      item.plane.style.setProperty('--tp-hud', isFront && outro < .05 ? '1' : '0');
      item.plane.style.setProperty('--tp-b', reveal.toFixed(3));
      const state = reveal >= 1 ? 'done' : 'building';
      if (state !== item.state) { item.state = state; item.hud.classList.toggle('is-done', reveal >= 1); item.hudText.textContent = tr(reveal >= 1 ? item.kind.done : item.kind.doing); }
      item.hudPct.textContent = Math.round(reveal * 100) + '%';
      item.plane.style.zIndex = outro > 0 ? String(10 - Math.abs(index - 2)) : String(isFront ? 10 : 5 - Math.min(4, Math.abs(Math.round((index - front) * 2))));

      // Información: cada línea aparece al bajar un poco más y todas se van antes del cambio.
      const u = local - index;
      const leave = index < count - 1 ? span(u, .68, .88) : span(outro, 0, .3);
      let visible = false;
      item.lines.forEach((line, j) => {
        const show = span(u, -.08 + .085 * j, .1 + .085 * j);
        const o = show * (1 - leave);
        if (o > .005) visible = true;
        line.style.setProperty('--o', o.toFixed(3));
        line.style.setProperty('--y', (14 * (1 - show) - 18 * leave).toFixed(1) + 'px');
      });
      item.info.style.visibility = visible ? 'visible' : 'hidden';
      item.info.style.setProperty('--tp-info-top', geo.infoTop(item.height).toFixed(1) + 'px');
    });

    stage.style.setProperty('--tp-gx', geo.focus.x.toFixed(0) + 'px');
    stage.style.setProperty('--tp-gy', geo.focus.y.toFixed(0) + 'px');
    stage.style.setProperty('--tp-glow', (span(t, .6, 1) * (1 - span(outro, 0, .4))).toFixed(3));
    const introOut = span(t, 0, .6);
    intro.style.opacity = (1 - introOut).toFixed(3);
    intro.style.transform = `translateY(${(-60 * introOut).toFixed(1)}px)`;
    intro.style.visibility = introOut > .995 ? 'hidden' : 'visible';
    const finalIn = span(outro, .5, .95);
    final.style.opacity = finalIn.toFixed(3);
    final.style.transform = `translateY(${(20 * (1 - finalIn)).toFixed(1)}px)`;
    final.style.visibility = finalIn < .005 ? 'hidden' : 'visible';

    const current = t < .5 ? -1 : Math.round(front);
    chapters.forEach((chapter, index) => chapter.classList.toggle('is-active', index === current));
    film.style.setProperty('--tp-progress', shown.toFixed(4));
  }

  function scrolled() {
    if (!active) return;
    if (finished) {
      // Ya fuera de la vista por debajo (se subió por encima de ella): lista para verse otra vez al bajar.
      if (film.getBoundingClientRect().top > innerHeight) { rearm(); return; }
      target = 1;
    } else target = clamp((top - film.getBoundingClientRect().top) / travel);
    if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick); }
  }
  // El movimiento sigue al scroll con un poco de suavidad, como en la portada de galería.
  function tick(now) {
    const elapsed = Math.min(64, now - last) / 1000;
    last = now;
    shown += (target - shown) * Math.min(1, elapsed * 8);
    if (Math.abs(target - shown) * travel < .4) shown = target;
    paint();
    frame = shown === target ? 0 : requestAnimationFrame(tick);
    if (!frame && shown >= 1 && !finished) finish();
  }

  // Los nombres de la barra inferior llevan a su concepto.
  chapters.forEach((chapter, index) => chapter.querySelector('button')?.addEventListener('click', () => {
    if (!active) return;
    if (finished) { finished = false; measure(); }
    const start = film.getBoundingClientRect().top + scrollY - top;
    scrollTo({top: start + (INTRO + index + .5) / TOTAL * travel, behavior: 'smooth'});
  }));

  function setup() {
    const want = !reduce.matches;
    if (want === active) return;
    active = want;
    film.classList.toggle('is-film', active);
    if (active) { measure(); return; }
    cancelAnimationFrame(frame); frame = 0; geo = null;
    film.style.removeProperty('height');
    for (const element of [intro, final, ...concepts.flatMap(item => [item.plane, item.card, item.info, ...item.lines])]) element.removeAttribute('style');
    chapters.forEach(chapter => chapter.classList.remove('is-active'));
  }

  window.addEventListener('scroll', scrolled, {passive: true});
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  document.fonts?.ready.then(measure);
  document.addEventListener('tuplus:language-change', () => { concepts.forEach(item => { item.state = ''; }); requestAnimationFrame(measure); });
  reduce.addEventListener?.('change', setup);

  // Avance automático: mientras la escena está fija, la página baja sola al ritmo de una
  // construcción por concepto (como en las páginas de soluciones). Girar la rueda hacia abajo
  // lo acelera; subir o tocar la pantalla lo pausa un momento.
  const UNIT_SECONDS = 4.3, FAST_SECONDS = 1.8; // tramo de concepto / tramos de entrada y cierre
  let autoFrame = 0, autoLast = 0, carry = 0, pausedUntil = 0, inView = false, touching = false;
  const pause = ms => { pausedUntil = performance.now() + ms; };
  function autoTick(now) {
    autoFrame = requestAnimationFrame(autoTick);
    const dt = Math.min(250, now - autoLast) / 1000; autoLast = now;
    if (!active || reduce.matches || document.hidden || touching || now < pausedUntil) return;
    const rect = film.getBoundingClientRect();
    const pinned = rect.top <= top + 1 && target < .995;
    if (!pinned) { carry = 0; return; }
    const units = shown * TOTAL;
    const seconds = units < INTRO * .9 || units > INTRO + count ? FAST_SECONDS : UNIT_SECONDS;
    carry += travel / TOTAL * dt / seconds;
    if (carry >= 1) {
      const px = Math.floor(carry); carry -= px;
      window.scrollTo({top: scrollY + px, behavior: 'instant'});
      lastY = scrollY;
    }
  }
  const runAuto = () => {
    cancelAnimationFrame(autoFrame);
    if (inView && active && !reduce.matches) { autoLast = performance.now(); autoFrame = requestAnimationFrame(autoTick); }
  };
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { inView = entries[0].isIntersecting; runAuto(); }).observe(film);
  window.addEventListener('wheel', event => { if (event.deltaY < 0) pause(2500); }, {passive: true});
  // Un enlace del menú (o cualquier subida: barra de desplazamiento, scroll suave) no debe
  // competir con el avance automático, que la devolvería hacia abajo.
  document.addEventListener('click', event => { if (event.target.closest?.('a[href*="#"]')) pause(3000); }, true);
  let lastY = scrollY;
  window.addEventListener('scroll', () => { if (scrollY < lastY - 1) pause(1500); lastY = scrollY; }, {passive: true});
  window.addEventListener('keydown', event => { if (['ArrowUp', 'PageUp', 'Home'].includes(event.key)) pause(2500); });
  window.addEventListener('touchstart', () => { touching = true; }, {passive: true});
  window.addEventListener('touchend', () => { touching = false; pause(1200); }, {passive: true});
  reduce.addEventListener?.('change', runAuto);
  setup();
})();
