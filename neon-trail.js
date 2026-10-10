/* Estela de mouse dorada (cola continua que se afina y se desvanece).
   Se desactiva en táctil y con "reducir movimiento". */
(() => {
  'use strict';
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  if (mqReduce.matches || !mqFine.matches) return;

  const LIFE = 650;      // ms que dura la cola
  const WIDTH = 7;       // grosor máximo en la cabeza (px)
  const MAXPTS = 90;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483000';
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let dpr = 1, w = 0, h = 0, raf = 0;
  let pts = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function frame(now) {
    ctx.clearRect(0, 0, w, h);
    pts = pts.filter(p => now - p.t < LIFE);
    const dark = document.documentElement.dataset.theme === 'dark';
    ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const k = 1 - (now - b.t) / LIFE;          // 1 = reciente, 0 = viejo
      if (k <= 0) continue;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.lineWidth = Math.max(0.6, WIDTH * k * k);
      ctx.strokeStyle = dark ? `rgba(255,${180 + 50 * k | 0},${90 + 60 * k | 0},${0.85 * k})` : `rgba(176,128,32,${0.8 * k})`;
      ctx.shadowColor = `rgba(255,211,107,${0.9 * k})`;
      ctx.shadowBlur = dark ? 16 : 8;
      ctx.stroke();
    }
    // núcleo claro en la cabeza de la cola
    if (pts.length) {
      const hd = pts[pts.length - 1], k = 1 - (now - hd.t) / LIFE;
      if (k > 0) {
        ctx.shadowBlur = dark ? 20 : 10; ctx.shadowColor = 'rgba(255,225,150,.95)';
        ctx.fillStyle = dark ? `rgba(255,244,214,${k})` : `rgba(176,128,32,${k})`;
        ctx.beginPath(); ctx.arc(hd.x, hd.y, 2.6 * k + 0.6, 0, 6.2832); ctx.fill();
      }
    }
    raf = pts.length ? requestAnimationFrame(frame) : 0;
    if (!raf) ctx.clearRect(0, 0, w, h);
  }

  function onMove(e) {
    const last = pts[pts.length - 1];
    if (last && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 2) return;
    pts.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (pts.length > MAXPTS) pts.shift();
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function start() {
    document.body.appendChild(canvas);
    resize();
    addEventListener('resize', resize, { passive: true });
    addEventListener('pointermove', e => { if (e.pointerType === 'mouse') onMove(e); }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pts = []; });
    mqReduce.addEventListener('change', e => { if (e.matches) { pts = []; canvas.remove(); } else document.body.appendChild(canvas); });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
