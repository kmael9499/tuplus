/* TUPLUS cotizador: colibrí dorado que cruza la pantalla (aditivo).
   Usa tu mismo colibri.png (diseño ilustrado, minimalista y dorado, sin cambios).
   Las alas se mueven deformando la propia imagen; se acerca (crece) y se aleja (se achica). */
(() => {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = t => t * t * (3 - 2 * t);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const dpr = Math.min(2, window.devicePixelRatio || 1);

  const wrap = document.createElement('div');
  wrap.className = 'xv-fly';
  wrap.setAttribute('aria-hidden', 'true');
  const cv = document.createElement('canvas');
  wrap.appendChild(cv);
  document.body.appendChild(wrap);
  const ctx = cv.getContext('2d');
  if (!ctx) return;

  let ready = false, flying = false, W = 220, bh = 0, padPx = 0, cw = 0, ch = 0, hinge = 0, src = null, bdh = 0;
  const HINGE = .56, AMP = .42, PAD = .3;

  const img = new Image();
  img.onload = () => {
    W = innerWidth < 700 ? 150 : 230;
    const ratio = img.naturalHeight / img.naturalWidth, H = Math.round(W * ratio);
    cw = Math.round(W * dpr); bh = Math.round(H * dpr); padPx = Math.round(bh * PAD); ch = bh + padPx;
    hinge = Math.round(bh * HINGE); bdh = bh - hinge;
    cv.width = cw; cv.height = ch; cv.style.width = W + 'px'; cv.style.height = Math.round(ch / dpr) + 'px';
    src = document.createElement('canvas'); src.width = cw; src.height = bh;
    src.getContext('2d').drawImage(img, 0, 0, cw, bh);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ready = true;
    setTimeout(launch, 3500);
  };
  img.onerror = () => wrap.remove();
  img.src = 'colibri.png';

  function drawBird(ph, amp) {            // alas: deforma la imagen alrededor de una bisagra
    ctx.clearRect(0, 0, cw, ch);
    const sw = Math.max(2, Math.round(2 * dpr)), sin = Math.sin(ph) * amp;
    for (let x = 0; x < cw; x += sw) {
      const w = Math.min(sw, cw - x), inf = smooth(clamp((.68 - x / cw) / .62, 0, 1)), s = 1 + AMP * sin * inf, uh = hinge * s;
      ctx.drawImage(src, x, 0, w, hinge, x, padPx + hinge - uh, w, uh);
      ctx.drawImage(src, x, hinge, w, bdh, x, padPx + hinge, w, bdh);
    }
  }

  function dust(x, y, size) {
    const d = document.createElement('i');
    d.className = 'xv-dust';
    d.style.cssText = `--x:${x.toFixed(0)}px;--y:${y.toFixed(0)}px;--dx:${rnd(-30, 30).toFixed(0)}px;--dy:${rnd(8, 46).toFixed(0)}px;--s:${(size * rnd(.7, 1.3)).toFixed(1)}px;--t:${rnd(800, 1400).toFixed(0)}ms`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1500);
  }

  function launch() {
    if (!ready || flying || document.hidden || document.querySelector('dialog[open]')) { schedule(8000); return; }
    flying = true;
    const vw = innerWidth, vh = innerHeight, dir = Math.random() < .5 ? 1 : -1;      // 1: izquierda→derecha
    const sx = dir > 0 ? -W : vw + W, ex = dir > 0 ? vw + W : -W;
    const y0 = rnd(.55, .8) * vh, y1 = rnd(.15, .4) * vh, ym = rnd(.2, .55) * vh;
    const cx = vw * rnd(.4, .6), cy = ym - rnd(.1, .3) * vh;
    const D = rnd(7000, 9000), t0 = performance.now();
    let lastDust = 0;
    const pt = k => ({ x: (1 - k) * (1 - k) * sx + 2 * (1 - k) * k * cx + k * k * ex, y: (1 - k) * (1 - k) * y0 + 2 * (1 - k) * k * cy + k * k * y1 });

    (function frame(now) {
      const k = clamp((now - t0) / D, 0, 1), p = pt(k), p2 = pt(Math.min(1, k + .01));
      const depth = Math.pow(Math.sin(Math.PI * k), 1.3), s = .3 + 1.2 * depth;            // se acerca y se aleja
      const ang = clamp(Math.atan2(p2.y - p.y, (p2.x - p.x) * dir) * 57.3, -22, 22) * .8;
      const ph = (now - t0) / 1000 * Math.PI * 2 * 9, amp = 1 - .35 * depth;                // más aleteo lejos, planeo cerca
      drawBird(ph, amp);
      const bob = Math.sin(ph) * 3 * s, op = clamp(Math.min(k / .06, (1 - k) / .08), 0, 1);
      wrap.style.opacity = op.toFixed(2);
      wrap.style.transform = `translate3d(${(p.x - W / 2).toFixed(1)}px,${(p.y - ch / dpr / 2 + bob).toFixed(1)}px,0) rotate(${(dir * ang).toFixed(1)}deg) scaleX(${dir}) scale(${s.toFixed(3)})`;
      if (now - lastDust > 70 && k > .03 && k < .97) { lastDust = now; dust(p.x - dir * W * s * .35, p.y + W * s * .12, 3 + 5 * depth); }
      if (k < 1 && !document.hidden) requestAnimationFrame(frame);
      else { wrap.style.opacity = 0; flying = false; schedule(rnd(32000, 52000)); }
    })(t0);
  }

  let timer = 0;
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(launch, ms); }

  const v5 = document.querySelector('.step-view[data-view="5"]');   // al llegar al final, vuela de nuevo
  if (v5) {
    let was = v5.classList.contains('active');
    new MutationObserver(() => {
      const now = v5.classList.contains('active');
      if (now && !was) setTimeout(launch, 700);
      was = now;
    }).observe(v5, { attributes: true, attributeFilter: ['class'] });
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !flying) schedule(4000); });
})();
