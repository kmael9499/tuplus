(() => {
 'use strict';
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 function render(){
  const off=media.matches;document.documentElement.dataset.motion=off?'off':'on';
  if(off)document.querySelectorAll('.reveal-pending').forEach(el=>el.classList.remove('reveal-pending'));
  document.dispatchEvent(new CustomEvent('tuplus:motion',{detail:{off}}));
 }
 media.addEventListener('change',render);render();
 if(!media.matches&&'IntersectionObserver' in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.remove('reveal-pending');observer.unobserve(entry.target);}}),{threshold:.08});
  document.querySelectorAll('.section-heading,.service-card,.solution-tile,.process-grid li,.about-copy,.solution-reference,.faq-grid,.contact-copy,.contact-form-card').forEach((el,i)=>{
   if(el.getBoundingClientRect().top<innerHeight)return;
   el.style.setProperty('--reveal-delay',`${(i%3)*65}ms`);el.classList.add('reveal-ready','reveal-pending');observer.observe(el);
  });
 }
})();
