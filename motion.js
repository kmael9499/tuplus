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
