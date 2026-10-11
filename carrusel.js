// Carrusel aislado: sin dependencias. Gira de forma continua; las flechas, los puntos y el gesto lo llevan a una tarjeta.
document.querySelectorAll('.tpl-carousel').forEach((carousel) => {
  if (carousel.dataset.tplReady === 'true') return;
  carousel.dataset.tplReady = 'true';
  const slides = [...carousel.querySelectorAll('.tpl-slide')];
  const t = value => window.TUPLUS_I18N?.t(value) || value;
  const setText = (element, source) => {
    if (window.TUPLUS_I18N) window.TUPLUS_I18N.setText(element, source);
    else { element.setAttribute('data-i18n', source); element.textContent = source; }
  };
  const stage = carousel.querySelector('.tpl-stage');
  const dots = carousel.querySelector('.tpl-dots');
  if (!slides.length) return;
  const count = slides.length;
  const SPEED = 1 / 4.5;   // tarjetas por segundo mientras gira solo
  const JUMP = 480;        // ms que tarda en llegar a la tarjeta elegida
  const wrap = value => ((value % count) + count) % count;
  let current = Math.min(1, count - 1);
  let position = current;  // posición real, con decimales mientras gira
  let jump = null, labelled = -1;
  const controls = slides.map((slide, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tpl-dot';
    button.setAttribute('aria-label', `${t('Ver')} ${t(slide.dataset.title)}`);
    button.addEventListener('click', () => show(index));
    dots.append(button);
    return button;
  });
  // Textos y estados de la tarjeta que está al frente.
  function label() {
    labelled = current;
    slides.forEach((slide, i) => {
      slide.dataset.active = String(i === current);
      slide.setAttribute('aria-hidden', String(i !== current));
      controls[i].setAttribute('aria-current', String(i === current));
      controls[i].setAttribute('aria-label', `${t('Ver')} ${t(slide.dataset.title)}`);
    });
    setText(carousel.querySelector('.tpl-category'), slides[current].dataset.tplCategory);
    setText(carousel.querySelector('.tpl-name'), slides[current].dataset.title);
    carousel.querySelector('.tpl-count').textContent = `${String(current + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`;
  }
  // Coloca cada tarjeta según su distancia al frente; la que da la vuelta por detrás lo hace ya invisible.
  function render() {
    slides.forEach((slide, i) => {
      let offset = wrap(i - position);
      if (offset >= count / 2) offset -= count;
      const distance = Math.abs(offset);
      // La tarjeta del frente se mantiene sólida un tramo antes de empezar a atenuarse.
      const opacity = distance <= 1 ? 1 - .38 * Math.max(0, distance - .3) / .7 : Math.max(.3, .62 - .32 * (distance - 1));
      slide.style.setProperty('--offset', offset.toFixed(4));
      slide.style.setProperty('--scale', (1 - .14 * Math.min(1, distance)).toFixed(4));
      slide.style.setProperty('--opacity', (opacity * Math.min(1, Math.max(0, (count / 2 - distance) * 2))).toFixed(3));
      slide.style.setProperty('--layer', 100 - Math.round(distance * 10));
    });
    current = wrap(Math.round(position));
    if (current !== labelled) label();
  }
  function show(index) {
    let delta = wrap(index - position);
    if (delta > count / 2) delta -= count;
    if (live) jump = {from: position, to: position + delta, start: performance.now()};
    else { position = wrap(position + delta); render(); }
  }
  carousel.querySelectorAll('[data-tpl-step]').forEach(button => {
    button.addEventListener('click', () => show(current + Number(button.dataset.tplStep)));
  });
  carousel.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  let start = null;
  stage.addEventListener('pointerdown', event => { start = {x: event.clientX, y: event.clientY}; });
  stage.addEventListener('pointerup', event => {
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) show(current + (dx < 0 ? 1 : -1));
    start = null;
  });
  stage.addEventListener('pointercancel', () => { start = null; });
  // Giro continuo: solo espera con el dedo o el ratón apretado, con foco de teclado, fuera de pantalla o en otra pestaña.
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let live = false, visible = !('IntersectionObserver' in window), focused = false, frame = 0, last = 0;
  function tick(now) {
    frame = requestAnimationFrame(tick);
    const elapsed = Math.min(50, now - last) / 1000;
    last = now;
    if (jump) {
      const progress = Math.min(1, (now - jump.start) / JUMP);
      position = jump.from + (jump.to - jump.from) * (1 - Math.pow(1 - progress, 3));
      if (progress === 1) { position = wrap(jump.to); jump = null; }
    } else if (!start && !focused) position = wrap(position + SPEED * elapsed);
    render();
  }
  function sync() {
    const run = !reduce.matches && visible && !document.hidden && count > 1;
    if (run === live) return;
    live = run;
    cancelAnimationFrame(frame);
    // Sin giro, las tarjetas vuelven a su sitio exacto y se mueven con la transición de CSS.
    carousel.classList.toggle('tpl-live', live);
    if (live) { last = performance.now(); frame = requestAnimationFrame(tick); }
    else if (reduce.matches) { jump = null; position = current; render(); }
  }
  // Solo el foco de teclado lo detiene: tras un clic con ratón debe seguir girando.
  carousel.addEventListener('focusin', event => { focused = event.target.matches(':focus-visible'); });
  carousel.addEventListener('focusout', event => { focused = carousel.contains(event.relatedTarget) && focused; });
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', sync);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    sync();
  }, {threshold: .2}).observe(stage);
  render();
  sync();
  document.addEventListener('tuplus:language-change', label);
});
