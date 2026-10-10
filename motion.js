(() => {
 'use strict';
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 let observer;
 const selectors='.section-heading,.service-card,.solution-tile,.process-grid li,.about-mark,.about-copy,.solution-reference,.solution-method .container,.faq-grid,.contact-copy,.contact-form-card,.tpl-heading,.tpl-stage,.tpl-controls,.tpl-caption,.footer-grid>div';
 function init(){
  observer?.disconnect();
  document.documentElement.dataset.motion=media.matches?'off':'on';
  document.querySelectorAll('.reveal-pending').forEach(el=>el.classList.remove('reveal-pending'));
  document.dispatchEvent(new CustomEvent('tuplus:motion',{detail:{off:media.matches}}));
  if(media.matches||!('IntersectionObserver' in window))return;
  observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');observer.unobserve(entry.target)}
  }),{threshold:0,rootMargin:'0px 0px -24px 0px'});
  document.querySelectorAll(selectors).forEach((el,i)=>{
   el.style.setProperty('--reveal-delay',`${i%3*65}ms`);el.classList.add('reveal-ready');
   if(el.getBoundingClientRect().top>=innerHeight){el.classList.add('reveal-pending');observer.observe(el)}
  });
 }
 media.addEventListener('change',init);init();
 window.addEventListener('beforeprint',()=>document.querySelectorAll('.reveal-pending').forEach(el=>el.classList.remove('reveal-pending')));
})();

/* ===== Contadores animados + validación en vivo (secciones Somos TUplus y Contacto) ===== */
(() => {
  'use strict';

  // -- Contadores: suben desde 0 al entrar en pantalla --
  const nums = document.querySelectorAll('[data-count]');
  if (nums.length) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const show = el => {
      const target = Number(el.dataset.count) || 0;
      if (reduce.matches || document.documentElement.dataset.motion === 'off') { el.textContent = target; return; }
      const dur = 1100, t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(e => { if (e.isIntersecting) { show(e.target); obs.unobserve(e.target); } });
      }, { threshold: 0.6 });
      nums.forEach(n => io.observe(n));
    } else nums.forEach(show);
  }

  // -- Validación en vivo del formulario de contacto --
  const form = document.getElementById('contact-form');
  if (!form) return;
  const contact = form.elements.contact;
  const required = ['name', 'company', 'country', 'message'];
  const mark = (el, ok) => {
    const field = el.closest('label');
    if (!field) return;
    field.classList.toggle('is-valid', ok === true);
    field.classList.toggle('is-invalid', ok === false);
  };
  const validate = (el, touched) => {
    if (!el.name) return;
    const val = (el.value || '').trim();
    if (required.includes(el.name)) {
      if (!val) mark(el, touched ? false : undefined);
      else mark(el, true);
    } else if (el === contact) {
      if (!val) mark(el, touched ? false : undefined);
      else mark(el, window.TuplusQuote?.validContact?.(val) ?? true);
    }
  };
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('blur', () => validate(el, true));
    el.addEventListener('input', () => validate(el, el.closest('label')?.classList.contains('is-invalid')));
  });
})();
