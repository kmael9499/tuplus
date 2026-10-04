// Carrusel aislado: sin dependencias, sin reproducción automática.
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
  let current = Math.min(1, slides.length - 1);
  const controls = slides.map((slide, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tpl-dot';
    button.setAttribute('aria-label', `${t('Ver')} ${t(slide.dataset.title)}`);
    button.addEventListener('click', () => show(index));
    dots.append(button);
    return button;
  });
  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      let offset = (i - current + slides.length) % slides.length;
      if (offset > slides.length / 2) offset -= slides.length;
      slide.style.setProperty('--offset', offset);
      slide.style.setProperty('--scale', offset === 0 ? 1 : .86);
      slide.style.setProperty('--opacity', offset === 0 ? 1 : Math.abs(offset) === 1 ? .62 : .3);
      slide.style.setProperty('--layer', 3 - Math.abs(offset));
      slide.dataset.active = String(offset === 0);
      slide.setAttribute('aria-hidden', String(offset !== 0));
      controls[i].setAttribute('aria-current', String(i === current));
    });
    setText(carousel.querySelector('.tpl-category'), slides[current].dataset.tplCategory);
    setText(carousel.querySelector('.tpl-name'), slides[current].dataset.title);
    slides.forEach((slide, i) => controls[i].setAttribute('aria-label', `${t('Ver')} ${t(slide.dataset.title)}`));
    carousel.querySelector('.tpl-count').textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
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
  show(current);
  document.addEventListener('tuplus:language-change', () => show(current));
});
