/* Secciones inferiores de la portada (ver secciones-v2.css):
   - Cómo trabajamos: los pasos avanzan solos mientras la sección está a la vista; clic o teclado eligen uno.
   - Somos TUPLUS: luz que sigue al cursor sobre cada tarjeta.
   - Contacto: la vista previa del mensaje se llena con lo que se escribe en el formulario. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // -- Cómo trabajamos --
  const stage = document.querySelector('.pr2-stage');
  if (stage) {
    const steps = [...stage.querySelectorAll('.pr2-steps > li')];
    const scenes = [...stage.querySelectorAll('.pr2-scene')];
    let current = 0;
    function show(index) {
      current = (index + steps.length) % steps.length;
      stage.dataset.step = String(current);
      steps.forEach((step, i) => {
        const on = i === current;
        step.classList.toggle('is-active', on);
        step.querySelector('.pr2-tab').setAttribute('aria-expanded', String(on));
      });
      // Volver a mostrar la escena reinicia sus animaciones.
      scenes.forEach((scene, i) => scene.classList.toggle('is-active', i === current));
      elapsed = 0; paint();
    }
    // Cada paso dura STEP_MS; la barra del paso activo muestra cuánto falta para el siguiente.
    const STEP_MS = 7000;
    let elapsed = 0, last = performance.now();
    const paint = () => steps.forEach((step, i) => step.style.setProperty('--p', i === current ? (reduce.matches ? 1 : Math.min(1, elapsed / STEP_MS)).toFixed(3) : '0'));
    setInterval(() => {
      const now = performance.now(), dt = Math.min(250, now - last); last = now;
      if (reduce.matches || stage.classList.contains('is-paused') || document.hidden) return;
      elapsed += dt;
      if (elapsed >= STEP_MS) show(current + 1); else paint();
    }, 50);
    steps.forEach((step, i) => {
      step.querySelector('.pr2-tab').addEventListener('click', () => show(i));
    });
    const setPaused = () => stage.classList.toggle('is-paused', !visible || hovering);
    let visible = false, hovering = false;
    stage.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; setPaused(); } });
    stage.addEventListener('pointerleave', () => { hovering = false; setPaused(); });
    if ('IntersectionObserver' in window) {
      let first = true;
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && first) { first = false; show(0); }
        setPaused();
      }, {threshold: .35}).observe(stage);
    } else visible = true;
    show(0); setPaused();
  }

  // -- Somos TUPLUS: brillo bajo el cursor --
  document.querySelectorAll('.ab2-tile').forEach(tile => tile.addEventListener('pointermove', event => {
    const rect = tile.getBoundingClientRect();
    tile.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    tile.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }));

  // -- Contacto: vista previa del mensaje --
  const form = document.getElementById('contact-form');
  const preview = document.querySelector('.ct2-preview');
  if (form && preview) {
    const fields = [...preview.querySelectorAll('[data-preview]')];
    const update = () => fields.forEach(slot => {
      const field = form.elements[slot.dataset.preview];
      let value = (field?.value || '').trim();
      if (slot.dataset.preview === 'message' && value.length > 120) value = value.slice(0, 117) + '…';
      if (slot.textContent !== value) slot.textContent = value;
    });
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    update();
  }
})();
