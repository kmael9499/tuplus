const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const {window}=parseHTML(fs.readFileSync('dist/red-socios.html','utf8')), {document}=window;
const field=n=>document.querySelector(`[name="${n}"]`);
// linkedom has no constraint-validation engine: emulate validity only for flow tests.
for(const el of document.querySelectorAll('input,select,textarea')){
 Object.defineProperty(el,'value',{value:'',writable:true});
 Object.defineProperty(el,'selectedOptions',{get(){return [...el.querySelectorAll('option')].filter(o=>o.getAttribute('value')===el.value)}});
 el.setCustomValidity=s=>el.error=s;el.checkValidity=()=>!el.error&&(!el.hasAttribute('required')||(el.type==='checkbox'?el.checked:!!el.value.trim()));el.reportValidity=()=>el.checkValidity();
}
const storage=new Map();
const context=vm.createContext({history:{},matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener(){},window,document,Node:window.Node,NodeFilter:{SHOW_TEXT:4},MutationObserver:window.MutationObserver,CustomEvent:window.CustomEvent,URLSearchParams,location:{search:"?country=PE&city=Lima&region=Lima"},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},console});
for(const file of ['theme.js','i18n-data.js','partner-application-translations.js','partner-territory.js','i18n.js','partner-application.js'])vm.runInContext(fs.readFileSync('public/js/'+file,'utf8'),context);
document.dispatchEvent(new window.Event('DOMContentLoaded'));
const click=id=>document.querySelector(id).click();
const shown=()=>document.querySelector('.pa-panel:not([hidden])').getAttribute('data-panel');
assert.equal(field('city').value,'Lima');assert.equal(field('country').value,'PE');assert.equal(field('region').value,'Lima');assert.equal(shown(),'0');click('#pa-next');assert.equal(shown(),'0');
for(const [n,v] of Object.entries({fullName:'Prueba',email:'test@example.com',phone:'+51 000000000',profile:'company',role:'Ventas'}))field(n).value=v;
field('profile').dispatchEvent(new window.Event('change',{bubbles:true}));assert.equal(field('company').disabled,false);
click('#pa-next');assert.equal(shown(),'0');field('company').value='Empresa de prueba';click('#pa-next');assert.equal(shown(),'1');
for(const [n,v] of Object.entries({country:'other',city:'Ciudad de prueba',sector:'Comercio',experience:'1-3',clients:'4'}))field(n).value=v;
field('country').dispatchEvent(new window.Event('change',{bubbles:true}));assert.equal(field('otherCountry').disabled,false);click('#pa-next');assert.equal(shown(),'1');field('otherCountry').value='Chile';click('#pa-next');assert.equal(shown(),'1');field('solutions').checked=true;click('#pa-next');assert.equal(shown(),'2');
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
   for(const [name,value] of Object.entries({fullName:'Prueba',email:'test@example.com',company:'Empresa de prueba',city:'Ciudad de prueba',region:'Lima',otherCountry:'Chile',level:'advanced',hours:'10'}))assert.equal(field(name).value,value);
   assert.ok(!document.querySelector('main').textContent.includes('estimateText()'));
   assert.equal(document.querySelectorAll('.pa-panel:not([hidden])').length,1);
   combinations++;
  }
  assert.match(document.querySelector('#pa-review').textContent,/Chile/);
  assert.match(document.querySelector('#pa-review').textContent,/Ciudad de prueba/);
  assert.equal(document.querySelector('#pa-review h3').textContent,window.TUPLUS_TRANSLATIONS[locale]['application.2']);
 }
}
console.log('OK: '+combinations+' estados: 8 idiomas × 2 temas × 4 etapas, sin pérdida de datos.');
field('confirmed').checked=true;formSubmit();assert.equal(document.querySelector('#pa-result').hidden,false);
click('[data-go="0"]');field('email').value='';formSubmit();assert.equal(shown(),'0');
assert.equal(document.querySelector('input[type="file"]'),null);assert.equal(document.querySelector('#country-select'),null);
assert.ok(!fs.readFileSync('dist/partner.html','utf8').includes('Natural Earth · 1:110m'));
console.log('OK: application conditional fields, required steps, solution selection, editable review, 8 languages, preserved answers and removed blocks. Native browser validity requires visual QA.');
function formSubmit(){document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));}
