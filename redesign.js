(() => {
 const root=document.querySelector('.ux-hero');if(!root)return;
 const scene=root.querySelector('.ux-scene'),depth=root.querySelector('.ux-depth');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0;
 const reset=()=>{cancelAnimationFrame(frame);depth.style.removeProperty('--rx');depth.style.removeProperty('--ry');};
 scene.addEventListener('pointermove',event=>{
  if(reduced.matches||document.documentElement.dataset.motion==='off'||event.pointerType!=='mouse')return;
  cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   const rect=scene.getBoundingClientRect();depth.style.setProperty('--ry',`${-13+((event.clientX-rect.left)/rect.width-.5)*12}deg`);depth.style.setProperty('--rx',`${8-((event.clientY-rect.top)/rect.height-.5)*8}deg`);
  });
 });
 scene.addEventListener('pointerleave',reset);document.addEventListener('tuplus:motion',reset);
 const demos={web:['DISEÑO WEB','Ideas claras.<br>Marcas que<br>dejan huella.','Conoce el estudio ↗','01 — 05'],tienda:['TIENDA VIRTUAL','Objetos únicos.<br>Compras<br>más simples.','Ver colección ↗','02 — 05'],sistema:['SISTEMA DE GESTIÓN','Tu equipo.<br>Tus proyectos.<br>Todo conectado.','Explorar el panel ↗','04 — 05']};
 const keys=Object.keys(demos);let current=Math.max(0,keys.indexOf(scene.dataset.demo));let animation=null,revision=0;
 const body=root.querySelector('.ux-demo-body');
 async function show(index,direction){
  index=(index+keys.length)%keys.length;if(index===current)return;
  current=index;const own=++revision;animation?.cancel();
  const moving=!reduced.matches&&document.documentElement.dataset.motion!=='off'&&typeof body.animate==='function';
  if(moving){
   animation=body.animate([{opacity:1,transform:'translateX(0)'},{opacity:0,transform:`translateX(${-direction*18}px)`}],{duration:150,easing:'ease-in',fill:'forwards'});
   try{await animation.finished;}catch{}if(own!==revision)return;
  }
  const key=keys[index],values=demos[key];scene.dataset.demo=key;
  root.querySelector('.ux-demo-label').textContent=values[0];root.querySelector('.ux-demo-title').innerHTML=values[1];root.querySelector('.ux-demo-cta').textContent=values[2];root.querySelector('.ux-demo-bottom span:last-child').textContent=values[3];
  root.querySelectorAll('[data-demo-choice]').forEach(item=>item.setAttribute('aria-pressed',String(item.dataset.demoChoice===key)));
  animation?.cancel();
  if(moving)animation=body.animate([{opacity:0,transform:`translateX(${direction*18}px)`},{opacity:1,transform:'translateX(0)'}],{duration:320,easing:'cubic-bezier(.2,.65,.3,1)'});
 }
 root.querySelectorAll('[data-demo-choice]').forEach(button=>button.addEventListener('click',()=>{const next=keys.indexOf(button.dataset.demoChoice);show(next,next>current?1:-1);}));
 root.querySelectorAll('[data-demo-step]').forEach(button=>button.addEventListener('click',()=>{const step=Number(button.dataset.demoStep);show(current+step,step);}));
 root.querySelector('.ux-demo-controls').addEventListener('keydown',event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();const step=event.key==='ArrowRight'?1:-1;show(current+step,step);}});
 reduced.addEventListener('change',()=>{if(reduced.matches)animation?.cancel();});
})();
