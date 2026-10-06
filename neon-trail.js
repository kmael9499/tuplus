/* Estela de mouse en dorado neón. Se desactiva en táctil y con "reducir movimiento". */
(() => {
  'use strict';
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  if (mqReduce.matches || !mqFine.matches) return;

  const MAX = 140, LIFE = 750;
  const COLORS = ['255,211,107', '240,216,170', '225,195,139', '255,236,179'];
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483000';
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let dpr = 1, w = 0, h = 0, raf = 0, last = 0, lx = null, ly = null;
  const parts = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(x, y, n) {
    for (let i = 0; i < n; i++) {
      if (parts.length >= MAX) parts.shift();
      const a = Math.random() * Math.PI * 2, v = Math.random() * 0.6;
      parts.push({
        x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v + 0.12,
        r: 1 + Math.random() * 2, c: COLORS[(Math.random() * COLORS.length) | 0],
        t: performance.now()
      });
    }
  }

  function frame(now) {
    ctx.clearRect(0, 0, w, h);
    const dark = document.documentElement.dataset.theme !== 'light';
    ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i], age = (now - p.t) / LIFE;
      if (age >= 1) { parts.splice(i, 1); continue; }
      p.x += p.vx; p.y += p.vy; p.vx *= 0.98;
      const alpha = (1 - age) * (dark ? 0.9 : 0.75), r = p.r * (1 - age * 0.5);
      ctx.shadowColor = `rgba(${p.c},${alpha})`;
      ctx.shadowBlur = dark ? 12 : 6;
      ctx.fillStyle = dark ? `rgba(${p.c},${alpha})` : `rgba(176,128,32,${alpha})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, 6.2832); ctx.fill();
    }
    raf = parts.length ? requestAnimationFrame(frame) : 0;
    if (!raf) ctx.clearRect(0, 0, w, h);
  }

  function onMove(e) {
    const x = e.clientX, y = e.clientY;
    if (lx === null) { lx = x; ly = y; }
    const dx = x - lx, dy = y - ly, dist = Math.hypot(dx, dy);
    if (dist < 3) return;
    const steps = Math.min(Math.ceil(dist / 14), 6);
    for (let i = 1; i <= steps; i++) spawn(lx + dx * i / steps, ly + dy * i / steps, 1);
    lx = x; ly = y;
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function start() {
    document.body.appendChild(canvas);
    resize();
    addEventListener('resize', resize, { passive: true });
    addEventListener('pointermove', e => { if (e.pointerType === 'mouse') onMove(e); }, { passive: true });
    document.addEventListener('pointerleave', () => { lx = null; });
    document.addEventListener('visibilitychange', () => { if (document.hidden) { parts.length = 0; lx = null; } });
    mqReduce.addEventListener('change', e => { if (e.matches) { parts.length = 0; canvas.remove(); } else document.body.appendChild(canvas); });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
