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
 // Las cinco vistas del portátil, en el orden de las soluciones. Giran solas una por una.
 const rawDemos={web:['DISEÑO WEB','Ideas claras.<br>Marcas que<br>dejan huella.','Conoce el estudio ↗','01 — 05'],tienda:['TIENDA VIRTUAL','Objetos únicos.<br>Compras<br>más simples.','Ver colección ↗','02 — 05'],automatizacion:['AUTOMATIZACIÓN','Menos tareas.<br>Más tiempo.<br>Todo fluye.','Ver el flujo ↗','03 — 05'],sistema:['SISTEMA DE GESTIÓN','Tu equipo.<br>Tus proyectos.<br>Todo conectado.','Explorar el panel ↗','04 — 05'],datos:['DATOS Y SEGURIDAD','Datos claros.<br>Decisiones<br>seguras.','Ver el tablero ↗','05 — 05']};
 const t=value=>window.TUPLUS_I18N?.t(value)||value;
 const setText=(element,source,rich=false)=>{
  if(window.TUPLUS_I18N)window.TUPLUS_I18N.setText(element,source,rich);
  else{element.setAttribute(rich?'data-i18n-html':'data-i18n',source);element[rich?'innerHTML':'textContent']=source;}
 };
 const keys=Object.keys(rawDemos);
 let demos={};
 let current=Math.max(0,keys.indexOf(scene.dataset.demo));let animation=null,revision=0;
 const refreshDemos=()=>{
  demos=Object.fromEntries(Object.entries(rawDemos).map(([key,values])=>[key,[t(values[0]),t(values[1]),t(values[2]),values[3]]]));
  const key=keys[current];
  if(key){
   const values=demos[key];
   setText(root.querySelector('.ux-demo-label'),rawDemos[key][0],false);
   setText(root.querySelector('.ux-demo-title'),rawDemos[key][1],true);
   setText(root.querySelector('.ux-demo-cta'),rawDemos[key][2],false);
   root.querySelector('.ux-demo-bottom span:last-child').textContent=values[3];
  }
 };
 refreshDemos();
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
  setText(root.querySelector('.ux-demo-label'),rawDemos[key][0],false);setText(root.querySelector('.ux-demo-title'),rawDemos[key][1],true);setText(root.querySelector('.ux-demo-cta'),rawDemos[key][2],false);root.querySelector('.ux-demo-bottom span:last-child').textContent=values[3];
  animation?.cancel();
  if(moving)animation=body.animate([{opacity:0,transform:`translateX(${direction*18}px)`},{opacity:1,transform:'translateX(0)'}],{duration:320,easing:'cubic-bezier(.2,.65,.3,1)'});
  schedule();
 }
 // Giro automático y continuo: pasa a la siguiente vista (laptop, celular o tablet) cada DELAY ms.
 // Solo se detiene fuera de pantalla, en otra pestaña o con movimiento reducido.
 const DELAY=1500;
 let timer=0,visible=true;
 function schedule(){
  clearTimeout(timer);
  const run=!reduced.matches&&document.documentElement.dataset.motion!=='off'&&!document.hidden&&visible;
  if(run)timer=setTimeout(()=>show(current+1,1),DELAY);
 }
 document.addEventListener('visibilitychange',schedule);
 document.addEventListener('tuplus:motion',schedule);
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.15}).observe(scene);
 reduced.addEventListener('change',()=>{if(reduced.matches)animation?.cancel();schedule();});
 schedule();
 document.addEventListener('tuplus:language-change', refreshDemos);
})();
