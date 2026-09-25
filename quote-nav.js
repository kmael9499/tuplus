(() => {
 const header=document.querySelector('.quote-header'),toggle=header.querySelector('.quote-menu-toggle'),nav=header.querySelector('#quote-nav');
 const mobile=matchMedia('(max-width:700px)');
 function set(open,focus=false){
  open=open&&mobile.matches;
  header.classList.toggle('nav-open',open);toggle.setAttribute('aria-expanded',String(open));
  toggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');
  if(focus)toggle.focus();
 }
 toggle.addEventListener('click',()=>set(toggle.getAttribute('aria-expanded')!=='true'));
 nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>set(false)));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&header.classList.contains('nav-open'))set(false,true)});
 document.addEventListener('click',e=>{if(!header.contains(e.target))set(false)});
 header.addEventListener('focusout',e=>{if(e.relatedTarget&&!header.contains(e.relatedTarget))set(false)});
 mobile.addEventListener('change',()=>set(false));
})();
