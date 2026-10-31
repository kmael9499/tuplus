const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {window}=parseHTML(fs.readFileSync('dist/red-socios.html','utf8')), {document}=window;
Object.defineProperty(window,'location',{configurable:true,value:{hostname:'localhost',origin:'http://localhost:4321'}});
const field=n=>document.querySelector(`[name="${n}"]`);
// linkedom has no constraint-validation engine: emulate validity only for flow tests.
for(const el of document.querySelectorAll('input,select,textarea')){
 Object.defineProperty(el,'value',{value:'',writable:true});
 Object.defineProperty(el,'selectedOptions',{get(){return [...el.querySelectorAll('option')].filter(o=>o.getAttribute('value')===el.value)}});
 el.setCustomValidity=s=>el.error=s;el.checkValidity=()=>!el.error&&(!el.hasAttribute('required')||(el.type==='checkbox'?el.checked:!!el.value.trim()));el.reportValidity=()=>el.checkValidity();
}
const storage=new Map();
const requests=[];let nextResponse={ok:true,status:201},nextFailure=null;
const context=vm.createContext({history:{},matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},window,document,Node:window.Node,NodeFilter:{SHOW_TEXT:4},MutationObserver:window.MutationObserver,CustomEvent:window.CustomEvent,URLSearchParams,location:{search:"?country=PE&city=Lima&region=Lima"},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},fetch:async(url,options)=>{requests.push([url,options]);if(nextFailure){const err=nextFailure;nextFailure=null;throw err;}return nextResponse;},AbortController,setTimeout,clearTimeout,console});
for(const file of ['theme.js','config.js','i18n-data.js','partner-application-translations.js','partner-territory.js','i18n.js','partner-application.js'])vm.runInContext(fs.readFileSync('public/js/'+file,'utf8'),context);
const localConfigContext=vm.createContext({window:{location:{hostname:'localhost',origin:'http://localhost:4321'}}});
vm.runInContext(fs.readFileSync('public/js/config.js','utf8'),localConfigContext);
assert.equal(localConfigContext.window.TUPLUS_CONFIG.apiUrl,'http://localhost:4321','local development must target the same-origin API proxy');
document.dispatchEvent(new window.Event('DOMContentLoaded'));
const click=id=>document.querySelector(id).click();
const shown=()=>document.querySelector('.pa-panel:not([hidden])').getAttribute('data-panel');
assert.equal(field('city').value,'Lima');assert.equal(field('country').value,'PE');assert.equal(field('region').value,'Lima');assert.equal(shown(),'0');click('#pa-next');assert.equal(shown(),'0');
for(const [n,v] of Object.entries({fullName:'Prueba',email:'test@example.com',phone:'+51 000000000',profile:'company',role:'Ventas'}))field(n).value=v;
field('profile').dispatchEvent(new window.Event('change',{bubbles:true}));assert.equal(field('company').disabled,false);
click('#pa-next');assert.equal(shown(),'0');field('company').value='Empresa de prueba';click('#pa-next');assert.equal(shown(),'1');
for(const [n,v] of Object.entries({country:'other',city:'Ciudad de prueba',sector:'Comercio',experience:'1-3',clients:'4'}))field(n).value=v;
field('country').dispatchEvent(new window.Event('change',{bubbles:true}));assert.equal(field('otherCountry').disabled,false);click('#pa-next');assert.equal(shown(),'1');field('otherCountry').value='Chile';click('#pa-next');assert.equal(shown(),'1');field('solutions').value='web-commerce';field('solutions').checked=true;field('solutions').setAttribute('checked','');click('#pa-next');assert.equal(shown(),'1');field('country').value='PE';field('city').value='Lima';field('country').dispatchEvent(new window.Event('change',{bubbles:true}));click('#pa-next');assert.equal(shown(),'2');
for(const [n,v] of Object.entries({level:'advanced',hours:'10',start:'30',strategy:'Visitar negocios y presentar soluciones digitales.',goal:'Conseguir tres clientes durante los primeros meses.'}))field(n).value=v;
click('#pa-next');assert.equal(shown(),'3');assert.match(document.querySelector('#pa-review').textContent,/Empresa de prueba/);
let combinations=0;
for(const locale of ['es','en','zh','ru','pt','fr','ja','de']){
 window.TUPLUS_I18N.setLocale(locale);
 for(const theme of ['light','dark']){
  if(document.documentElement.dataset.theme!==theme)click('.theme-toggle');
  assert.equal(document.documentElement.dataset.theme,theme);
  assert.equal(document.querySelector('.theme-toggle').getAttribute('aria-pressed'),String(theme==='dark'));
  for(let step=0;step<4;step++){
   click('[data-go="'+step+'"]');assert.equal(shown(),String(step));
   for(const el of document.querySelectorAll('[data-i18n]'))assert.equal(el.textContent,window.TUPLUS_TRANSLATIONS[locale][el.getAttribute('data-i18n')],locale+' '+theme+' '+el.getAttribute('data-i18n'));
   for(const [name,value] of Object.entries({fullName:'Prueba',email:'test@example.com',company:'Empresa de prueba',city:'Lima',region:'Lima',otherCountry:'Chile',level:'advanced',hours:'10'}))assert.equal(field(name).value,value);
   assert.ok(!document.querySelector('main').textContent.includes('estimateText()'));
   assert.equal(document.querySelectorAll('.pa-panel:not([hidden])').length,1);
   combinations++;
  }
  assert.match(document.querySelector('#pa-review').textContent,/Lima/);
  assert.match(document.querySelector('#pa-review').textContent,/Lima/);
  assert.equal(document.querySelector('#pa-review h3').textContent,window.TUPLUS_TRANSLATIONS[locale]['application.2']);
 }
}
console.log('OK: '+combinations+' estados: 8 idiomas × 2 temas × 4 etapas, sin pérdida de datos.');
async function simulateSubmit(){
 field('confirmed').checked=false;formSubmit();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(requests.length,0,'must not send without consent');
 field('confirmed').checked=true;formSubmit();await new Promise(resolve=>setTimeout(resolve,0));
 assert.equal(requests.length,1);assert.equal(requests[0][0],'http://localhost:4321/api/postulaciones/partners');
 assert.equal(requests[0][1].method,'POST');assert.equal(requests[0][1].headers['Content-Type'],'application/json');
 const payload=JSON.parse(requests[0][1].body);
 assert.deepEqual(Object.keys(payload),['fullName','email','phone','profile','company','role','website','country','otherCountry','city','region','sector','experience','clients','solutions','level','hours','start','strategy','goal','confirmed']);
 assert.equal(payload.confirmed,true);assert.equal(payload.clients,4);assert.equal(payload.hours,10);assert.deepEqual(payload.solutions,['web-commerce']);assert.equal(payload.otherCountry,'');
 assert.equal(document.querySelector('#pa-result').hidden,false);assert.equal(document.querySelector('#pa-submit-error').hidden,true);
 click('[data-go="0"]');field('email').value='';formSubmit();assert.equal(shown(),'0');field('email').value='test@example.com';
 for(let i=0;i<3;i++)click('#pa-next');assert.equal(shown(),'3');field('confirmed').checked=true;
 nextResponse={ok:false,status:400};formSubmit();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(document.querySelector('#pa-result').hidden,true);assert.equal(document.querySelector('#pa-submit-error').hidden,false);assert.equal(requests.length,2);
 nextResponse={ok:false,status:429};formSubmit();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(document.querySelector('#pa-result').hidden,true);assert.equal(requests.length,3);
 nextFailure=new TypeError('simulated network failure');formSubmit();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(document.querySelector('#pa-result').hidden,true);assert.equal(requests.length,4);
 assert.equal(document.querySelector('input[type="file"]'),null);assert.equal(document.querySelector('#country-select'),null);
 assert.ok(!fs.readFileSync('dist/partner.html','utf8').includes('Natural Earth ?? 1:110m'));
 console.log('OK: '+combinations+' UI states and mocked fetch response handling (no database write), consent gate, payload, 400, 429, and network failure; no production request made.');
}
simulateSubmit().catch(err=>{console.error(err);process.exitCode=1;});
function formSubmit(){document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));}
