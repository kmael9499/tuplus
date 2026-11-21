
(()=>{
 const root=document.querySelector('.site-header .brand-art, .quote-header .brand-art');
 if(!root) return;
 const original=root.querySelector('img');
 const screen=document.createElement('canvas');screen.width=2172;screen.height=724;
 screen.className='brand-flight';screen.setAttribute('aria-hidden','true');
 const ctx=screen.getContext('2d');if(!ctx||!original)return;
 const sourceUrl=original.src.replace(/logo-claro\.png.*$/,'logo-completo.webp'); // misma imagen, resolución completa
 root.appendChild(screen);
 // En la portada el colibrí del logo da un vuelo grande por toda la pantalla antes de posarse.
 const FULL=!!root.closest('.site-header')&&!!document.querySelector('.ux-hero');
 let big=null,bctx=null;
 let hasPlayed=false;
 const dark=()=>document.documentElement.dataset.theme==='dark';
 const source=new Image(); let frame=0,started=0;
 source.onload=()=>{
  const w=source.naturalWidth,h=source.naturalHeight;
  function layer(){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
  const full=layer(),f=full.getContext('2d',{willReadFrequently:true});f.drawImage(source,0,0);
  const pixels=f.getImageData(0,0,w,h);
  let bx0=w,by0=h,bx1=0,by1=0,lx0=w,ly0=h,lx1=0,ly1=0; // cajas del ave y de las letras: solo se repinta lo que ocupan
  for(let i=0,n=pixels.data.length;i<n;i+=4){const p=pixels.data;if(p[i+3]){const gold=p[i]>100&&p[i]>p[i+2]*1.25&&p[i+1]>p[i+2]*1.12;if(!gold&&dark()){p[i]=255;p[i+1]=255;p[i+2]=255}
   const px=(i>>2)%w,py=((i>>2)/w)|0;
   if(px>=680&&py>=260){if(px<lx0)lx0=px;if(px>lx1)lx1=px;if(py<ly0)ly0=py;if(py>ly1)ly1=py}else{if(px<bx0)bx0=px;if(px>bx1)bx1=px;if(py<by0)by0=py;if(py>by1)by1=py}}}
  const box=(x0,y0,x1,y1,pad=3)=>{x0=Math.max(0,x0-pad);y0=Math.max(0,y0-pad);x1=Math.min(w,x1+1+pad);y1=Math.min(h,y1+1+pad);return{x:x0,y:y0,w:Math.max(1,x1-x0),h:Math.max(1,y1-y0)}};
  const BB=box(bx0,by0,bx1,by1),LB=box(lx0,ly0,lx1,ly1);
  const cropDraw=(c,img,r)=>c.drawImage(img,r.x,r.y,r.w,r.h,r.x,r.y,r.w,r.h);
  f.putImageData(pixels,0,0);
  const letters=layer(),bird=layer();
  const textArea=new Path2D();textArea.rect(680,260,w-680,h-260);
  let c=letters.getContext('2d');c.save();c.clip(textArea);c.drawImage(full,0,0);c.restore();
  c=bird.getContext('2d');c.drawImage(full,0,0);c.globalCompositeOperation='destination-out';c.fill(textArea);c.globalCompositeOperation='source-over';
  const warped=layer(),warpContext=warped.getContext('2d');
  function drawWings(time, amount, target) {
   // Deform the continuous silhouette around a fixed hinge. No cutout edges.
   warpContext.clearRect(BB.x,BB.y,BB.w,BB.h);
   const hinge=395;
   if(BB.y+BB.h>hinge)warpContext.drawImage(bird,BB.x,hinge,BB.w,BB.y+BB.h-hinge,BB.x,hinge,BB.w,BB.y+BB.h-hinge);
   const beat=(1-Math.cos(time*38))*.5;
   warpContext.save();warpContext.imageSmoothingEnabled=false;
   const warpEnd=Math.min(BB.x+BB.w,500); // más allá de x=500 la influencia es 0: columnas sin deformar
   for(let x=BB.x;x<warpEnd;x++) {
    const distance=Math.max(0,Math.min(1,(500-x)/340));
    const influence=distance*distance*(3-2*distance);
    const compression=1-.48*beat*influence*amount;
    const height=hinge*compression;
    warpContext.drawImage(bird,x,0,1,hinge,x,hinge-height,1,height);
   }
   if(BB.x+BB.w>warpEnd){const tx=Math.max(warpEnd,BB.x),tw=BB.x+BB.w-tx;warpContext.drawImage(bird,tx,0,tw,hinge,tx,0,tw,hinge)}
   warpContext.restore();
   cropDraw(target||ctx,warped,BB);
  }
  const scale=1,ox=0,oy=0;
  const ease=t=>1-Math.pow(1-t,3);
  const BIRD_W=680;                       // ancho del ave dentro de la imagen del logo
  const ease3=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,lerp=(a,b,t)=>a+(b-a)*t;
  const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
  function hermite(keys,p,k){
   let i=0;while(i<keys.length-2&&p>keys[i+1].p)i++;
   const a=keys[i],b=keys[i+1],pa=keys[Math.max(0,i-1)],pb=keys[Math.min(keys.length-1,i+2)];
   const h=b.p-a.p,u=Math.max(0,Math.min(1,(p-a.p)/h)),u2=u*u,u3=u2*u;
   const m0=(b[k]-pa[k])/(b.p-pa.p)*h,m1=(pb[k]-a[k])/(pb.p-a.p)*h;
   return (2*u3-3*u2+1)*a[k]+(u3-2*u2+u)*m0+(-2*u3+3*u2)*b[k]+(u3-u2)*m1;
  }
  const FLY_START=.3,FLY_TIME=7.8,FLASH=1.3;
  // El nombre aparece a medida que el colibrí pasa sobre él: borde suave con luz dorada en el frente.
  const TEXT_X=680;
  // A mitad de pantalla escribe el nombre en grande; brilla y luego viaja encogiéndose hasta su sitio en el logo.
  const BIG_SWEEP=[.37,.58],BIG_SHINE=[.58,.67],TRAVEL=[.68,.97];
  let arrived=false;
  const lit=layer(),lc=lit.getContext('2d');
  function band(center,size,alpha,core){
   const g=lc.createLinearGradient(center-size,0,center+size,0),col=dark()?'255,200,90':'214,142,18';
   g.addColorStop(0,`rgba(${col},0)`);g.addColorStop(.5,`rgba(${core||col},${alpha})`);g.addColorStop(1,`rgba(${col},0)`);
   lc.fillStyle=g;lc.fillRect(center-size,LB.y,size*2,LB.h);
  }
  function drawLetters(edge,shine){
   const img=composeLetters(edge,shine);if(img)cropDraw(ctx,img,LB);
  }
  function composeLetters(edge,shine){
   if(edge<=TEXT_X)return null;
   lc.globalCompositeOperation='source-over';lc.clearRect(LB.x,LB.y,LB.w,LB.h);cropDraw(lc,letters,LB);
   if(edge<w){
    lc.globalCompositeOperation='destination-in';
    const m=lc.createLinearGradient(edge-120,0,edge,0);m.addColorStop(0,'#000');m.addColorStop(1,'rgba(0,0,0,0)');
    lc.fillStyle=m;lc.fillRect(LB.x,LB.y,LB.w,LB.h);
    lc.globalCompositeOperation='source-atop';band(edge-70,190,.95);
   }
   if(shine!=null){lc.globalCompositeOperation='source-atop';band(shine,170,.9,dark()?'255,246,220':'236,170,40')}
   lc.globalCompositeOperation='source-over';
   return lit;
  }
  // Polvo dorado que va soltando el ave mientras escribe el nombre.
  let sparks=[],lastT=0;
  function sparkles(t,emit,x,y,size){
   const dt=Math.min(.05,Math.max(0,t-lastT));lastT=t;
   const m=Math.max(1,Math.min(3,size/90));
   if(emit)for(let i=0;i<(m>1.5?3:2);i++)sparks.push({x:x+(Math.random()-.5)*size*.5,y:y+(Math.random()-.1)*size*.35,vx:(Math.random()-.5)*28*m,vy:(6+Math.random()*26)*m,life:0,max:.5+Math.random()*.7*m,r:(.8+Math.random()*1.6)*m});
   sparks=sparks.filter(s=>(s.life+=dt)<s.max);
   if(!sparks.length)return;
   const dk=dark(),col=dk?'255,214,120':'196,126,8';
   bctx.save();bctx.globalCompositeOperation=dk?'lighter':'source-over';
   for(const s of sparks){
    s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=24*dt;
    const a=1-s.life/s.max,r=s.r*(.5+.5*a),tw=.6+.4*Math.sin(s.life*40);
    bctx.fillStyle=`rgba(${col},${a*tw})`;bctx.beginPath();
    bctx.moveTo(s.x,s.y-r*2.4);bctx.lineTo(s.x+r*.45,s.y-r*.45);bctx.lineTo(s.x+r*2.4,s.y);bctx.lineTo(s.x+r*.45,s.y+r*.45);
    bctx.lineTo(s.x,s.y+r*2.4);bctx.lineTo(s.x-r*.45,s.y+r*.45);bctx.lineTo(s.x-r*2.4,s.y);bctx.lineTo(s.x-r*.45,s.y-r*.45);bctx.fill();
   }
   bctx.restore();
  }
  function prepBig(){
   const vw=document.documentElement.clientWidth,vh=innerHeight,dpr=Math.min(window.devicePixelRatio||1,2);
   if(!big){big=document.createElement('canvas');big.setAttribute('aria-hidden','true');big.className='brand-flight-full';
    big.style.cssText='position:fixed;left:0;top:0;pointer-events:none;z-index:41';document.body.appendChild(big);bctx=big.getContext('2d')}
   if(big.width!==Math.round(vw*dpr)||big.height!==Math.round(vh*dpr)){big.width=Math.round(vw*dpr);big.height=Math.round(vh*dpr);big.style.width=vw+'px';big.style.height=vh+'px'}
   bctx.setTransform(dpr,0,0,dpr,0,0);bctx.clearRect(0,0,vw,vh);bctx.imageSmoothingQuality='high';
   return {vw,vh};
  }
  // Destello tecnológico al posarse: núcleo de luz, anillos, rayo horizontal y chispas.
  function drawFlash(q,cx,cy,R){
   const dark=document.documentElement.dataset.theme==='dark',e=1-Math.pow(1-q,3);
   // Tema oscuro: luz que se suma al fondo. Tema claro: ámbar profundo y más grueso para que contraste con el fondo crema.
   const col=dark?'255,211,107':'196,126,8',core=dark?'255,244,214':'214,138,12';
   bctx.save();bctx.globalCompositeOperation=dark?'lighter':'source-over';
   const ga=(1-q)*Math.min(1,q/.1)*(dark?.95:.85),gr=R*(dark?2.4:3.2)*(.6+.8*e);
   const g=bctx.createRadialGradient(cx,cy,0,cx,cy,gr);
   g.addColorStop(0,`rgba(${core},${ga})`);g.addColorStop(.4,`rgba(${col},${ga*(dark?.55:.6)})`);g.addColorStop(1,`rgba(${col},0)`);
   bctx.fillStyle=g;bctx.beginPath();bctx.arc(cx,cy,gr,0,6.2832);bctx.fill();
   const lw=dark?1:1.7;
   for(const d of [0,.16]){const qq=(q-d)/(1-d);if(qq<=0)continue;
    bctx.strokeStyle=`rgba(${col},${(1-qq)*(dark?.9:1)})`;bctx.lineWidth=(2.4*(1-qq)+.6)*lw*(dark?1:1.3);
    bctx.beginPath();bctx.arc(cx,cy,R*(.5+2.8*(1-Math.pow(1-qq,3))),0,6.2832);bctx.stroke()}
   const sw=R*10*(q<.22?q/.22:Math.max(0,1-(q-.22)/.78)),sa=(1-q)*(dark?.95:.95),sh=dark?2.4:3.6;
   if(sw>1){const h=bctx.createLinearGradient(cx-sw/2,0,cx+sw/2,0);
    h.addColorStop(0,`rgba(${col},0)`);h.addColorStop(.5,`rgba(${core},${sa})`);h.addColorStop(1,`rgba(${col},0)`);
    bctx.fillStyle=h;bctx.fillRect(cx-sw/2,cy-sh/2,sw,sh)}
   bctx.lineCap='round';
   for(let i=0;i<14;i++){const a=i/14*6.2832+.3,dist=R*(.7+3.1*e)*(.7+.3*((i*7)%5)/4),len=R*.45*(1-q);
    bctx.strokeStyle=`rgba(${col},${(1-q)})`;bctx.lineWidth=(1.8*(1-q)+.5)*lw*(dark?1:1.4);
    bctx.beginPath();bctx.moveTo(cx+Math.cos(a)*dist,cy+Math.sin(a)*dist);bctx.lineTo(cx+Math.cos(a)*(dist+len),cy+Math.sin(a)*(dist+len));bctx.stroke()}
   bctx.restore();
  }
  // Halo de luz en el punto donde va apareciendo el nombre.
  function halo(ex,ey,R){
   const dk=dark(),col=dk?'255,206,110':'214,142,18';
   const g=bctx.createRadialGradient(ex,ey,0,ex,ey,R);g.addColorStop(0,`rgba(${col},${dk?.55:.35})`);g.addColorStop(1,`rgba(${col},0)`);
   bctx.save();bctx.globalCompositeOperation=dk?'lighter':'source-over';bctx.fillStyle=g;bctx.fillRect(ex-R,ey-R,R*2,R*2);bctx.restore();
  }
  function flyFull(t){
   const p=(t-FLY_START)/FLY_TIME;
   if(p>=1){
    cropDraw(ctx,bird,BB);
    const q=(t-FLY_START-FLY_TIME)/FLASH;
    // Al posarse, un brillo recorre el nombre de izquierda a derecha.
    const sq=(q-.12)/.75;
    drawLetters(1e4,sq>0&&sq<1?TEXT_X-250+(screen.width-TEXT_X+500)*smooth(sq):null);
    if(q>=1){sparks=[];if(big){big.remove();big=null;bctx=null}return true}
    prepBig();const r2=screen.getBoundingClientRect(),k2=r2.width/screen.width;
    drawFlash(q,r2.left+450*k2,r2.top+330*k2,Math.max(BIRD_W*k2,24));
    sparkles(t,false);
    return false;
   }
   if(p<=0)return false;
   const {vw,vh}=prepBig();
   const r=screen.getBoundingClientRect(),sL=r.width/screen.width,K=vw<700?1.5:1,cap=Math.min(vw*.5,560);
   // Puntos sobre el logo, en píxeles de la imagen del logo.
   const L=(p,X,Y,s)=>({p,x:r.left+X*sL,y:r.top+Y*sL,w:BIRD_W*sL*s});
   // El nombre grande, centrado en la pantalla (mismas coordenadas que la imagen del logo, escaladas).
   const k=Math.min(vw*.62,860)/1360,gL=vw/2-1365*k,gT=vh*.47-380*k;
   const G=(p,X,Y,s)=>({p,x:gL+X*k,y:gT+Y*k,w:BIRD_W*k*s});
   const keys=[
    {p:0,x:vw*.12,y:vh*.80,w:Math.min(vw*.34*K,cap)},
    {p:.12,x:vw*.46,y:vh*.34,w:vw*.05*K},
    {p:.26,x:vw*.82,y:vh*.28,w:Math.min(vw*.30*K,cap)},
    // Rasante sobre el nombre grande, escribiéndolo a su paso.
    G(.37,380,255,1.15),G(.44,900,240,1.05),G(.51,1420,240,1.05),G(.58,2060,220,1),
    // Revolotea sobre el nombre mientras brilla y lo acompaña hasta el logo.
    G(.67,1800,40,.8),L(.86,1150,60,1.6),L(1,450,330,1)];
   const fin=Math.max(smooth((p-.8)/.1),smooth((p-.33)/.04)*(1-smooth((p-.58)/.05)));
   const x=hermite(keys,p,'x'),y=hermite(keys,p,'y')+Math.sin(t*6.5)*7*(1-fin),w=Math.max(10,hermite(keys,p,'w')),s=w/BIRD_W;
   const ang=(-.10+.14*Math.sin(t*2.4))*(1-fin);
   const gx=(x-gL)/k,inBig=p>=BIG_SWEEP[0]&&p<=BIG_SWEEP[1]+.01;
   // Mientras el nombre grande está en pantalla, el fondo se oscurece para que se lea con claridad.
   const veil=smooth((p-BIG_SWEEP[0]+.03)/.05)*(1-smooth((p-TRAVEL[0])/.14));
   if(veil>0){
    const bg=dark()?'5,12,20':'250,246,238',cx=vw/2,cy=gT+380*k,rx=1000*k;
    bctx.fillStyle=`rgba(${bg},${(dark()?.62:.7)*veil})`;bctx.fillRect(0,0,vw,vh);
    const g=bctx.createRadialGradient(cx,cy,0,cx,cy,rx);
    g.addColorStop(0,`rgba(${bg},${.7*veil})`);g.addColorStop(.6,`rgba(${bg},${.4*veil})`);g.addColorStop(1,`rgba(${bg},0)`);
    bctx.save();bctx.fillStyle=g;bctx.translate(cx,cy);bctx.scale(1,.42);bctx.translate(-cx,-cy);bctx.fillRect(cx-rx,cy-rx,rx*2,rx*2);bctx.restore();
   }
   const u=Math.max(0,Math.min(1,(p-TRAVEL[0])/(TRAVEL[1]-TRAVEL[0])));
   if(p>=BIG_SWEEP[0]&&p<TRAVEL[1]){
    const sh=(p-BIG_SHINE[0])/(BIG_SHINE[1]-BIG_SHINE[0]);
    const img=composeLetters(p>BIG_SWEEP[1]?1e4:gx+60,sh>0&&sh<1?TEXT_X-250+(screen.width-TEXT_X+500)*smooth(sh):null);
    if(img){
     // Del centro de la pantalla al nombre del logo: arco suave, se encoge y deja una estela de luz.
     const place=v=>{const e=ease3(v);return{x:lerp(vw/2,r.left+1365*sL,e),y:lerp(gT+380*k,r.top+380*sL,e)-vh*.06*Math.sin(Math.PI*e),z:k*Math.pow(sL/k,e)}};
     const glow=dark()?'rgba(255,196,90,.6)':'rgba(255,255,255,.95)';
     for(const [lag,a] of u>0&&u<1?[[.09,.14],[.045,.28],[0,1]]:[[0,1]]){
      const pl=place(Math.max(0,u-lag));
      bctx.save();bctx.globalAlpha=a;bctx.shadowColor=glow;bctx.shadowBlur=a<1?0:Math.max(6,40*pl.z);
      bctx.translate(pl.x,pl.y);bctx.scale(pl.z,pl.z);bctx.translate(-1365,-380);
      cropDraw(bctx,img,LB);bctx.restore();
     }
    }
    if(inBig&&gx>TEXT_X-100)halo(gL+(gx+20)*k,gT+370*k,150*k);
   }
   bctx.save();bctx.globalAlpha=Math.min(1,p*12);bctx.translate(x,y);bctx.rotate(ang);bctx.scale(s,s);bctx.translate(-450,-330);
   drawWings(t,1-smooth((p-.9)/.1),bctx);
   bctx.restore();
   // El nombre se posa en el logo con un estallido de chispas sobre las letras.
   if(p>=TRAVEL[1]){
    drawLetters(1e4,TEXT_X-250+(screen.width-TEXT_X+500)*Math.min(1,(p-TRAVEL[1])/(1-TRAVEL[1])));
    if(!arrived){arrived=true;
     for(let i=0;i<26;i++){const X=TEXT_X+Math.random()*(screen.width-TEXT_X-120),Y=290+Math.random()*180,a=Math.random()*6.2832,v=20+Math.random()*50;
      sparks.push({x:r.left+X*sL,y:r.top+Y*sL,vx:Math.cos(a)*v,vy:Math.sin(a)*v-10,life:0,max:.5+Math.random()*.6,r:.8+Math.random()*1.4})}
    }
   }
   sparkles(t,inBig||(u>0&&u<1),x,y,w);
   return false;
  }
  function draw(now){
   const t=(now-started)/1000;ctx.clearRect(0,0,screen.width,screen.height);ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);
   if(FULL){const done=flyFull(t);ctx.restore();if(!done)frame=requestAnimationFrame(draw);return}
   const progress=Math.min(1,t/1.05);ctx.globalAlpha=progress;ctx.save();ctx.translate(0,18*(1-ease(progress)));cropDraw(ctx,letters,LB);ctx.restore();ctx.globalAlpha=1;
   if(t>=3.5){cropDraw(ctx,bird,BB);ctx.restore();return}
   const p=Math.max(0,Math.min(1,(t-.35)/3.15));
   const q=ease(p),dx=-1050*(1-q),dy=-150*Math.sin(p*Math.PI)+160*(1-q),angle=-.15*(1-q);
   ctx.save();ctx.globalAlpha=Math.min(1,p*9);ctx.translate(450+dx,330+dy);ctx.rotate(angle);ctx.translate(-450,-330);
   const fade=1-Math.max(0,(p-.78)/.22);
   drawWings(t,fade);ctx.restore();ctx.restore();frame=requestAnimationFrame(draw);
  }
  function play(){cancelAnimationFrame(frame);started=performance.now();if(matchMedia('(prefers-reduced-motion:reduce)').matches)started-=20000;draw(performance.now())}
  root.classList.add('brand-flight-ready');
  if(hasPlayed){cancelAnimationFrame(frame);draw(performance.now());}else{hasPlayed=true;play();}
 };
 // Decorativa: no debe competir con el primer pintado ni con la carga. Arranca tras `load` y en tiempo ocioso.
 const startLoad=()=>{source.src=sourceUrl};
 const whenIdle=()=>'requestIdleCallback' in window?requestIdleCallback(startLoad,{timeout:1500}):setTimeout(startLoad,200);
 if(document.readyState==='complete')whenIdle();else addEventListener('load',whenIdle,{once:true});
 let lastTheme=dark();
 new MutationObserver(()=>{const nextTheme=dark();if(nextTheme===lastTheme)return;lastTheme=nextTheme;if(source.complete&&source.naturalWidth)source.onload();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
})();
