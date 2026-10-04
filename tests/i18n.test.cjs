const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const {parseHTML}=require('linkedom');
const base=path.resolve(__dirname,'..');
const pause=()=>new Promise(resolve=>setTimeout(resolve,0));
let checks=0;
async function test(file){
 const {window}=parseHTML(fs.readFileSync(path.join(base,file),'utf8'));
 const document=window.document;
 const picker=document.getElementById('site-language');
 if(picker)Object.defineProperty(picker,'value',{value:'es',writable:true});
 const store=new Map();
 const context=vm.createContext({window,document,Node:window.Node,NodeFilter:{SHOW_TEXT:4},MutationObserver:window.MutationObserver,CustomEvent:window.CustomEvent,localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},matchMedia:()=>({matches:true,addEventListener(){}}),requestAnimationFrame:()=>0,cancelAnimationFrame(){},console});
 for(const script of ['js/i18n-data.js','js/quote-translations.js',...(file==='index.html'?['carrusel.js','redesign.js']:[]),'i18n.js'])vm.runInContext(fs.readFileSync(path.join(base,script),'utf8'),context,{filename:script});
 const api=window.TUPLUS_I18N;
 for(const locale of ['ja','zh','en','zh','ja','es','ja','zh','es']){
  api.setLocale(locale);await pause();
  assert.equal(document.documentElement.lang,locale==='zh'?'zh-CN':locale);checks++;
  for(const node of document.querySelectorAll('[data-i18n]')){assert.equal(node.textContent,api.t(node.getAttribute('data-i18n')));checks++;}
  if(file==='index.html'){
   const contact=document.getElementById('contact-title');
   if(locale==='ja'||locale==='zh'){assert.match(contact.textContent,locale==='ja'?/こんにちは/:/你好/);assert.doesNotMatch(contact.textContent,/\ba\b|hola|empiezan/);checks+=2;}
   for(let step=0;step<6;step++){
    document.querySelector('[data-tpl-step="1"]').click();await pause();
    const category=document.querySelector('.tpl-category');assert.equal(category.textContent,api.t(category.getAttribute('data-i18n')));checks++;
    if(locale==='ja'||locale==='zh'){assert.doesNotMatch(category.textContent,/[a-záéíóú]/i);checks++;}
   }
   for(let step=0;step<3;step++){
    document.querySelector('[data-demo-step="1"]')?.click();await pause();
    const title=document.querySelector('.ux-demo-title');
    if(title){assert.equal(title.innerHTML,api.t(title.getAttribute('data-i18n-html')));checks++;}
   }
  }
 }
 // A component overwrites a translated text node with another Spanish source.
 const probe=document.createElement('p');probe.textContent='Conceptos de proyectos';document.body.append(probe);await pause();
 api.setLocale('ja');await pause();assert.equal(probe.textContent,api.t('Conceptos de proyectos'));checks++;
 probe.textContent='Sistemas a medida';api.setLocale('zh');await pause();assert.equal(probe.textContent,api.t('Sistemas a medida'));checks++;
 api.setLocale('es');await pause();assert.equal(probe.textContent,'Sistemas a medida');checks++;
 console.log(file+': OK');
}
(async()=>{for(const file of ['index.html','cotizador.html','privacidad.html','404.html',...fs.readdirSync(path.join(base,'soluciones')).filter(x=>x.endsWith('.html')).map(x=>'soluciones/'+x)])await test(file);console.log(checks+' comprobaciones de traducción correctas');})().catch(error=>{console.error(error);process.exitCode=1;});

