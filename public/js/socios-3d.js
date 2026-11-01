/* TUPLUS — efectos 3D e interacciones de Socios Comerciales. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function all(selector) {
    return Array.prototype.slice.call(document.querySelectorAll(selector));
  }

  /* 1. Cinta de soluciones en movimiento continuo. */
  var band = document.querySelector('.sc-marquee-inner');
  if (band && !reduce) {
    var set = document.createElement('div');
    set.className = 'sc-marquee-set';
    while (band.firstChild) set.appendChild(band.firstChild);

    var track = document.createElement('div');
    track.className = 'sc-marquee-track';
    track.appendChild(set);
    for (var i = 0; i < 3; i++) {
      var copy = set.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    }
    band.appendChild(track);
    band.classList.add('is-moving');
  }

  // Los efectos siguientes son solo para computadoras con mouse.
  if (reduce || !fine) return;

  /* 2. Inclinación 3D con brillo que sigue al mouse. */
  function tilt(el, max) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;
      var y = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', ((x - 0.5) * max).toFixed(2) + 'deg');
      el.style.setProperty('--rx', ((0.5 - y) * max).toFixed(2) + 'deg');
      el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
      el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      el.style.setProperty('--glare', '1');
    });
    el.addEventListener('pointerleave', function () {
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--glare', '0');
    });
  }

  all('.sc-solution-card, .sc-steps-3d li, .sc-req-card').forEach(function (card) {
    tilt(card, 4);
  });

  var dashboard = document.querySelector('.sc-dashboard-preview');
  if (dashboard) tilt(dashboard, 3);

  /* 3. Luz dorada que sigue al mouse en la portada. */
  var hero = document.querySelector('.sc-hero-next');
  if (hero) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--hx', (((e.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
      hero.style.setProperty('--hy', (((e.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
    });
  }

  /* 4. Botones dorados que se acercan al mouse como un imán. */
  all('.sc-button-primary, .sc-req-cta').forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      btn.style.setProperty('--tx', ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px');
      btn.style.setProperty('--ty', ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px');
    });
    btn.addEventListener('pointerleave', function () {
      btn.style.setProperty('--tx', '0px');
      btn.style.setProperty('--ty', '0px');
    });
  });
})();