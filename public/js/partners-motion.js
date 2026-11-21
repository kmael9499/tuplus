/* Entradas al bajar en Red Partner y Socios Comerciales, con el ritmo de la portada.
   El contenido es visible por defecto: solo se oculta lo que aún no está en pantalla. */
(() => {
  'use strict';
  const selectors = '.sc-head,.sc-who-panel,.sc-requirements-copy,.sc-req-overview,.sc-req-cta,.fq2-intro,.fq2-panel,.sc-apply-intro,#sc-form,.pa-intro,.pa-sidebar,#partner-form,.pp-steps>li,.pp-section-heading:not(.pp-reveal),.pp-map-panel';
  // Las tarjetas que entran juntas lo hacen en cascada.
  document.querySelectorAll('.pp-card,.pp-level,.pp-steps>li').forEach(el => {
    const index = [...el.parentElement.children].filter(item => item.matches('.pp-card,.pp-level,li')).indexOf(el);
    el.style.setProperty('--pm-delay', `${index * 70}ms`);
    if (!el.matches('.pp-reveal')) return;
    const clear = () => el.style.removeProperty('--pm-delay');
    el.addEventListener('transitionend', clear, { once: true });
  });
  // El colibrí del recorrido vuela hasta el nivel elegido.
  const route = document.querySelector('.pp-route');
  if (route) {
    const track = route.querySelector('.pp-route-track');
    const done = route.querySelector('.pp-route-done');
    const bird = route.querySelector('.pp-route-pos');
    const total = track.getTotalLength();
    const nodes = [...route.querySelectorAll('.pp-route-node')];
    const labels = [...route.querySelectorAll('.pp-route-label')];
    const radios = labels.map(label => document.querySelector('input[name="partner-level"][value="' + label.dataset.level + '"]'));
    // Longitud del camino hasta cada nodo.
    const stops = nodes.map(node => {
      const x = +node.getAttribute('cx'), y = +node.getAttribute('cy');
      let best = 0, min = Infinity;
      for (let i = 0; i <= 240; i++) {
        const point = track.getPointAtLength(total * i / 240);
        const distance = (point.x - x) ** 2 + (point.y - y) ** 2;
        if (distance < min) { min = distance; best = total * i / 240; }
      }
      return best;
    });
    let at = stops[0], frame = 0;
    const place = length => {
      const point = track.getPointAtLength(length);
      bird.setAttribute('transform', 'translate(' + point.x + ' ' + point.y + ')' + (length < at - .01 ? ' scale(-1 1)' : ''));
      done.style.setProperty('--pm-route', String(1 - length / total));
    };
    const select = () => {
      const index = radios.findIndex(radio => radio.checked);
      if (index < 0) return;
      nodes.forEach((node, i) => node.classList.toggle('is-on', i <= index));
      labels.forEach((label, i) => label.classList.toggle('is-on', i === index));
      const from = at, to = stops[index];
      cancelAnimationFrame(frame);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches || from === to) { at = to; place(to); return; }
      const start = performance.now();
      const step = now => {
        const t = Math.min((now - start) / 800, 1);
        const eased = 1 - (1 - t) ** 4;
        const current = from + (to - from) * eased;
        place(current);
        at = current;
        if (t < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };
    radios.forEach(radio => radio.addEventListener('change', select));
    labels.forEach((label, i) => label.addEventListener('click', () => { radios[i].checked = true; radios[i].dispatchEvent(new Event('change', { bubbles: true })); }));
    select();
    place(at);
  }
  // Portada: banderas en la lista de países. Si no cargan, queda el código del país.
  document.querySelectorAll('.pp-world-hero .pp-globe-country-list [data-country]').forEach(button => {
    const code = button.querySelector('.pp-country-code');
    const flag = new Image();
    flag.alt = '';
    flag.addEventListener('load', () => { code.append(flag); code.classList.add('has-flag'); });
    flag.src = 'https://flagcdn.com/w40/' + button.dataset.country.toLowerCase() + '.png';
  });
  // Territorios: banderas en las tarjetas y ficha del país elegido junto al globo.
  document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelector('.territory-cards');
    const select = document.getElementById('pp-territory-country');
    const map = document.querySelector('.pp-world-map');
    if (!cards || !select || !map) return;
    const flagUrl = code => 'https://flagcdn.com/w40/' + code.toLowerCase() + '.png';
    cards.querySelectorAll('.territory-country-symbol').forEach(symbol => {
      const flag = new Image();
      flag.alt = '';
      flag.addEventListener('load', () => { symbol.append(flag); symbol.classList.add('has-flag'); });
      flag.src = flagUrl(symbol.closest('[data-territory]').dataset.territory);
    });
    const chip = document.createElement('div');
    chip.className = 'pp-globe-chip';
    chip.setAttribute('aria-hidden', 'true');
    chip.setAttribute('translate', 'no');
    chip.hidden = true;
    const chipFlag = new Image(), chipName = document.createElement('b'), chipState = document.createElement('span');
    chipFlag.alt = '';
    chip.append(chipFlag, chipName, chipState);
    map.querySelector('.pp-globe').append(chip);
    const update = () => {
      const code = select.value;
      chip.hidden = !/^[A-Z]{2}$/.test(code);
      if (chip.hidden) return;
      const state = window.TUPLUS_TERRITORY.resolve(code);
      chip.dataset.state = state;
      chipFlag.src = flagUrl(code);
      chipName.textContent = new Intl.DisplayNames([window.TUPLUS_I18N.locale], { type: 'region' }).of(code);
      chipState.textContent = window.TUPLUS_I18N.t('territory.status.' + state);
    };
    chipFlag.addEventListener('error', () => { chipFlag.hidden = true; });
    select.addEventListener('change', update);
    document.addEventListener('tuplus:language-change', update);
    update();
  });
  // Socios: iniciales de los días del gráfico según el idioma.
  const days = [...document.querySelectorAll('.sc-chart-days > *')];
  if (days.length === 7) {
    const label = () => {
      const format = new Intl.DateTimeFormat(window.TUPLUS_I18N?.locale || 'es', { weekday: 'narrow', timeZone: 'UTC' });
      days.forEach((day, index) => { day.textContent = format.format(Date.UTC(2024, 0, 1 + index)); });
    };
    document.addEventListener('tuplus:language-change', label);
  }
  // Vista previa en vivo del mensaje, como en el contacto de la portada.
  const form = document.getElementById('sc-form');
  if (form) {
    const fields = [...document.querySelectorAll('.sc-preview [data-preview]')];
    const preview = () => fields.forEach(slot => {
      const input = form.elements[slot.dataset.preview];
      if (!input) return;
      slot.textContent = input.tagName === 'SELECT' ? (input.value ? input.selectedOptions[0].textContent.trim() : '') : input.value.trim().slice(0, 140);
    });
    form.addEventListener('input', preview);
    form.addEventListener('change', preview);
    form.addEventListener('reset', () => setTimeout(preview));
  }
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  // Las escenas solo se mueven mientras se ven.
  const live = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('pm-live', entry.isIntersecting)));
  document.querySelectorAll('.sc-steps-3d,.sc-who-panel,.sc-req-overview,.pp-about-net,.pp-benefits,.pp-level-layout,.pp-req-panel,.pp-world-map,.pp-world-hero,.territory-catalog,.sc-dashboard-preview').forEach(el => live.observe(el));
  // Requisitos: los pasos se completan uno tras otro al llegar a ellos.
  const steps = document.querySelector('#requisitos .pp-steps');
  if (steps && steps.getBoundingClientRect().top >= innerHeight) {
    steps.classList.add('pm-seq-wait');
    new IntersectionObserver((entries, observer) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();
      steps.classList.add('pm-seq-go');
      requestAnimationFrame(() => steps.classList.remove('pm-seq-wait'));
      setTimeout(() => document.querySelector('#requisitos .pp-button')?.classList.add('pm-seq-done-sweep'), 1700);
    }, { threshold: .35 }).observe(steps);
  }
  // Los trazos de los iconos se dibujan una sola vez.
  const drawn = new IntersectionObserver((entries, observer) => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    entry.target.classList.add('pm-drawn');
  }), { rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.pp-card > svg,.sc-req-card-icon svg').forEach(icon => {
    if (icon.getBoundingClientRect().top < innerHeight) return;
    icon.querySelectorAll('path,circle,rect').forEach(shape => shape.setAttribute('pathLength', '1'));
    icon.classList.add('pm-draw');
    drawn.observe(icon);
  });
  // La luz de los beneficios sigue al cursor.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) document.querySelectorAll('.pp-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      const box = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - box.left}px`);
      card.style.setProperty('--my', `${event.clientY - box.top}px`);
    });
  });
  const finish = (entries, observer) => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    observer.unobserve(entry.target);
    entry.target.classList.remove('pm-wait');
    entry.target.classList.add('pm-in');
    entry.target.addEventListener('animationend', event => {
      if (event.target === entry.target) entry.target.classList.remove('pm-in');
    });
  });
  const observer = new IntersectionObserver(finish, { rootMargin: '0px 0px -24px 0px' });
  document.querySelectorAll(selectors).forEach(el => {
    if (el.getBoundingClientRect().top < innerHeight) return;
    el.classList.add('pm-wait');
    observer.observe(el);
  });
  addEventListener('beforeprint', () => document.querySelectorAll('.pm-wait').forEach(el => el.classList.remove('pm-wait')));
})();
