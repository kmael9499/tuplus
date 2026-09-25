const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=require('node:path').resolve(__dirname,'..')+'/';
const store=new Map(), elements=new Map();
const document={documentElement:{lang:'es'},querySelector(selector){if(!elements.has(selector))elements.set(selector,{textContent:'',innerHTML:'',value:'',checked:false});return elements.get(selector)}};
const context=vm.createContext({window:{},document,Intl,Date,setTimeout,clearTimeout,AbortController,console,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}});
for(const name of ['config.js','countries.js','currencies.js','js/i18n-data.js','js/quote-translations.js'])vm.runInContext(fs.readFileSync(base+name,'utf8'),context);
vm.runInContext(`window.TUPLUS_I18N={locale:'es',t:x=>x};`,context);
const source=fs.readFileSync(base+'cotizador.js','utf8');
vm.runInContext(source.slice(0,source.indexOf('$("#quoteForm").addEventListener')),context);
const run=s=>vm.runInContext(s,context);
let checks=0;
function eq(actual,expected){assert.equal(actual,expected);checks++}
for(const [key,total,pages]of [['landing',295,1],['website',450,5],['catalog',600,5],['ecommerce',890,8],['webapp',1500,8]]){
 run(`state.project='${key}';state.pages=${pages};`);eq(run('grandTotal()'),total);
 run('state.pages+=2');eq(run('grandTotal()'),total+run('catalog[state.project].pageRate')*2);
}
run(`Object.assign(state,{project:'website',pages:6,contentPro:true,design:'custom',support:'90',tax:true});state.features=new Set(['booking']);`);
eq(run('subtotal()'),970);eq(run('grandTotal()'),1145);
run('renderSummary()');assert.ok(elements.get('#summaryLines').innerHTML.includes('IGV 18%'));checks++;
run('state.tax=false;state.pages=5;state.contentPro=false;state.design="clean";state.support="30";state.features=new Set(Object.keys(features));');
eq(run('grandTotal()'),1490);
run('state.rush=true;state.hosting=true;state.tax=true;');eq(run('grandTotal()'),2112);
for(const code of run('Object.keys(currencyMeta)')){
 run(`state.currency='${code}';`);const text=run('money(295)');assert.ok(text.includes(code==='PEN'?'S/':code)&&!text.includes('NaN'));checks++;
}
run(`state.currency='JPY';state.currencyManual=true;save();state.currency='USD';load();`);eq(run('state.currency'),'JPY');
store.set('tuplusQuote',JSON.stringify({project:'<invalid>',features:['<script>','booking'],pages:999,design:'invalid',support:'invalid',currency:'BAD'}));
run('load()');eq(run('state.pages'),20);eq(run('state.currency'),'PEN');eq(run('state.features.size'),1);assert.ok(Number.isFinite(run('grandTotal()')));checks++;
for(const [id,value]of Object.entries({nombre:'Prueba',empresa:'Negocio',pais:'PE',email:'prueba@example.com',telefono:'+51 900000000',mensajeCliente:'Texto con & y ñ'}))document.querySelector('#'+id).value=value;
run('state.currency="EUR"');const quote=run('quoteText()');assert.ok(quote.includes('EUR')&&quote.includes('Perú')&&quote.includes('IGV'));checks++;
eq(new URL(run('whatsappUrl()')).searchParams.get('text'),quote);
for(const locale of ['en','pt','fr','de','ru','zh','ja']){
 run(`window.TUPLUS_I18N.t=x=>window.TUPLUS_TRANSLATIONS['${locale}'][x]||x;`);
 run('renderSummary()');assert.ok(!elements.get('#summaryPriceLabel').textContent.includes('INVERSIÓN ESTIMADA'));checks++;
}

eq(run('state.country'),'PE');
for(const code of run('countries.codes')){
 run(`setCountry('${code}')`);
 eq(run('state.currency'),run(`countries.currency('${code}')`));
 assert.ok(run('Object.hasOwn(currencyMeta,state.currency)'));checks++;
 eq(run('state.currencyManual'),false);
}
run('setCountry("MX");save();setCountry("PE");load()');eq(run('state.currency'),'MXN');eq(run('state.country'),'MX');
run('state.currency="EUR";state.currencyManual=true;save();state.currency="PEN";load()');eq(run('state.currency'),'EUR');
run('setCountry("PE")');eq(run('state.currency'),'PEN');eq(run('state.currencyManual'),false);
store.set('tuplusQuote',JSON.stringify({project:'website',pages:8,currency:'USD',features:['booking']}));
run('load()');eq(run('state.country'),'PE');eq(run('state.currency'),'PEN');eq(run('state.project'),'website');eq(run('state.pages'),8);eq(run('state.features.has("booking")'),true);
run('setCountry("CL");setCountry("INVALID")');eq(run('state.country'),'CL');eq(run('state.currency'),'CLP');
store.set('tuplusQuote','{invalid');run('load()');eq(run('state.currency'),'CLP');
run('window.TUPLUS_I18N.locale="ja"');eq(run('countries.name("PE")'),'ペルー');
console.log(`${checks} comprobaciones correctas: tarifas originales, extras, IGV, 20 monedas, 27 opciones de país, moneda automática/manual, migración, persistencia, datos inválidos, resumen, WhatsApp y 7 traducciones.`);
