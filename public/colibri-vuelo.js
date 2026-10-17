/* Colibrí de la portada: al cargar la página se reproduce una vez su vuelo,
   siga o no el scroll, se posa sobre el colibrí del logo y se funde con él.
   videos/colibri-vuelo.mp4 (scripts/build-colibri-video.py) trae el color en la
   mitad superior y la transparencia en la inferior; aquí se vuelven a unir. */
(()=>{
 'use strict';
 const art=document.querySelector('.site-header .brand-art');
 if(!art||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const W=960,H=540,RATIO=W/H;
 // El ave posada y el símbolo del logo miran igual: se hacen coincidir pico con pico y cola con cola.
 const BODY=[.53,.53];        // centro del ave posada (entre pico y cola), en fracción del encuadre
 const SYMBOL=[495.5/2172,393.5/724]; // ese mismo centro en el símbolo del logo
 const FIT=.589;              // ancho del encuadre, en anchos de logo, con el que ambas aves miden lo mismo
 const TILT=8.5*Math.PI/180;  // giro que iguala la inclinación del ave con la del símbolo
 const LANDING=.68;           // desde aquí el encuadre viaja hacia el logo
 const screen=document.createElement('canvas');
 screen.className='colibri-vuelo';screen.setAttribute('aria-hidden','true');screen.width=W;screen.height=H;
 const gl2=screen.getContext('webgl2'),gl=gl2||screen.getContext('webgl');
 if(!gl)return;
 function shader(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);return s}
 const program=gl.createProgram();
 gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}'));
 gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision mediump float;uniform sampler2D t;varying vec2 uv;void main(){float y=clamp(uv.y,.004,.996)*.5;float a=texture2D(t,vec2(uv.x,y+.5)).g;gl_FragColor=vec4(min(texture2D(t,vec2(uv.x,y)).rgb,vec3(a)),a);}'));
 gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
 gl.useProgram(program);
 gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 gl.enableVertexAttribArray(0);gl.bindAttribLocation(program,0,'p');gl.vertexAttribPointer(gl.getAttribLocation(program,'p'),2,gl.FLOAT,false,0,0);
 gl.bindTexture(gl.TEXTURE_2D,gl.createTexture());
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 // Con mipmaps (WebGL2) el ave no se pixela al encogerse hasta el tamaño del logo.
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl2?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);
 const video=document.createElement('video');
 video.muted=true;video.playsInline=true;video.preload='auto';
 video.setAttribute('muted','');video.setAttribute('playsinline','');
 video.src='videos/colibri-vuelo.mp4?v=20261011-2';
 let frame=0,done=false;
 const clamp=v=>Math.max(0,Math.min(1,v));
 const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
 const lerp=(a,b,t)=>a+(b-a)*t;
 function finish(){
  if(done)return;done=true;
  cancelAnimationFrame(frame);screen.remove();
  video.pause();video.removeAttribute('src');video.load();
 }
 function draw(){
  frame=requestAnimationFrame(draw);
  if(video.readyState<2)return;
  const progress=video.ended?1:clamp(video.currentTime/video.duration);
  const vw=document.documentElement.clientWidth,vh=innerHeight;
  // Escenario de vuelo: cubre la ventana y la rebasa un poco por los lados y por abajo, para que
  // el corte del encuadre (donde el video se desvanece) quede fuera de la vista.
  // En pantallas verticales no llega a cubrirla y se centra donde pasa el ave, algo a la derecha.
  const stageW=Math.max(vw*1.06,Math.min(vh*1.1*RATIO,vw*1.5)),stageH=stageW/RATIO;
  const stageX=Math.max(vw-stageW,Math.min(0,vw/2-stageW*(vw<vh?.56:.5))),stageY=vh-stageH*.95;
  const logo=art.getBoundingClientRect();
  const t=ease(clamp((progress-LANDING)/(1-LANDING)));
  const scale=stageW*Math.pow(logo.width*FIT/stageW,t)/W,width=scale*W;
  const angle=TILT*t,cos=Math.cos(angle),sin=Math.sin(angle);
  // El centro del ave viaja desde su sitio en el escenario hasta el centro del símbolo.
  const bx=BODY[0]*W*scale,by=BODY[1]*H*scale;
  const x=lerp(stageX+stageW*BODY[0],logo.left+logo.width*SYMBOL[0],t)-(bx*cos-by*sin);
  const y=lerp(stageY+stageH*BODY[1],logo.top+logo.height*SYMBOL[1],t)-(bx*sin+by*cos);
  // El lienzo guarda solo los píxeles que se ven.
  const wanted=Math.min(W,Math.ceil(width*Math.min(devicePixelRatio||1,3)));
  if(wanted>screen.width*1.15||wanted<screen.width*.87){screen.width=wanted;screen.height=Math.round(wanted/RATIO)}
  gl.viewport(0,0,screen.width,screen.height);
  // Abierta como archivo local (file://) el navegador no deja leer el video: se retira sin más.
  try{gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,video)}catch(error){finish();return}
  if(gl2)gl.generateMipmap(gl.TEXTURE_2D);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  screen.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) rotate(${angle.toFixed(4)}rad) scale(${scale.toFixed(5)})`;
  screen.style.opacity='1';
 }
 // Ya posado, se queda un instante sobre el símbolo y se funde con él: el logo responde con un destello dorado.
 video.addEventListener('ended',()=>setTimeout(()=>{
  screen.classList.add('is-leaving');art.classList.add('colibri-landed');
  screen.addEventListener('transitionend',finish,{once:true});
  setTimeout(finish,1400);
  setTimeout(()=>art.classList.remove('colibri-landed'),1600);
 },500));
 video.addEventListener('error',finish);
 document.body.appendChild(screen);
 video.play().then(draw,finish);
})();
