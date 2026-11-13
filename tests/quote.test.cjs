const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=require('node:path').resolve(__dirname,'..','public')+'/';
const store=new Map(), elements=new Map();
const document={documentElement:{lang:'es'},querySelector(selector){if(!elements.has(selector))elements.set(selector,{textContent:'',innerHTML:'',value:'',checked:false});return elements.get(selector)}};
const context=vm.createContext({window:{},document,Intl,Date,setTimeout,clearTimeout,AbortController,console,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}});
for(const name of ['js/config.js','js/countries.js','js/currencies.js','js/i18n-data.js','js/quote-translations.js'])vm.runInContext(fs.readFileSync(base+name,'utf8'),context);
vm.runInContext(`window.TUPLUS_I18N={locale:'es',t:x=>x};`,context);
const source=fs.readFileSync(base+'js/cotizador.js','utf8');
vm.runInContext(source.slice(0,source.indexOf('$("#quoteForm").addEventListener')),context);
const run=s=>vm.runInContext(s,context);
let checks=0;
function eq(actual,expected){assert.equal(actual,expected);checks++}
// Tarifario por niveles del PDF (soles, sin IGV): con lo incluido, el total es el precio del nivel.
const reset=()=>run(`Object.assign(state,{tier:'pro',blocks20:0,blocks50:0,contentPro:false,design:'clean',support:'30',rush:false,hosting:false,tax:false});state.features=new Set();`);
const tariff={landing:[1090,1490,1990],website:[1690,2790,3990],catalog:[2290,2990,3990],ecommerce:[3490,5490,7490]};
const included={landing:[6,9,12],website:[5,8,12],catalog:[5,8,12],ecommerce:[5,8,12]};
for(const [key,prices]of Object.entries(tariff)){
 ['pro','biz','corp'].forEach((tier,i)=>{
  reset();run(`setProject('${key}');setTier('${tier}')`);
  eq(run('state.pages'),included[key][i]);eq(run('grandTotal()'),prices[i]);
  // Bug corregido: por encima de lo incluido cada unidad suma (S/180 por página, S/90 por sección de landing).
  run('state.pages+=2');eq(run('grandTotal()'),prices[i]+(key==='landing'?90:180)*2);
  // Por debajo de lo incluido el nivel no cambia de precio.
  run('state.pages=1');eq(run('grandTotal()'),prices[i]);
 });
}
reset();run(`setProject('webapp')`);eq(run('state.tier'),'pro');eq(run('grandTotal()'),5090);run('state.pages=10');eq(run('grandTotal()'),5090+360);
// Cambiar de nivel arrastra el deslizador solo si el visitante no había pasado de lo incluido.
reset();run(`setProject('website');setTier('biz')`);eq(run('state.pages'),8);
run(`state.pages=15;setTier('corp')`);eq(run('state.pages'),15);
// Ejemplo del PDF: tienda inicial con 40 productos = S/3,490 + S/280 = S/3,770 netos; con IGV S/4,448.60.
reset();run(`setProject('ecommerce');state.blocks20=1`);eq(run('productCount()'),40);eq(run('grandTotal()'),3770);
run('state.tax=true');eq(run('grandTotal()'),Math.round(3770*1.18));
run('state.tax=false;state.blocks20=0;state.blocks50=2');eq(run('productCount()'),120);eq(run('grandTotal()'),3490+1300);
// Productos solo cuentan en catálogo y tienda.
run(`setProject('website');state.blocks50=2`);eq(run('productCount()'),0);eq(run('grandTotal()'),1690);
// Adicionales: blog incluido en Empresarial/Corporativo; la tienda incluye una pasarela y cobra la segunda.
reset();run(`setProject('website');setTier('biz');state.features=new Set(['blog','seo'])`);eq(run('grandTotal()'),2790+650);
run(`setTier('pro')`);eq(run('grandTotal()'),1690+450+650);
reset();run(`setProject('ecommerce');state.features=new Set(['payments'])`);eq(run('grandTotal()'),3490+450);
run(`setProject('landing');state.features=new Set(['payments','email'])`);eq(run('grandTotal()'),1090+180+120);
// Los adicionales con rango siguen por confirmar, pero Premium Motion suma su mínimo al estimado.
reset();run(`setProject('website');state.features=new Set(['security','maps']);state.design='premium'`);
eq(run('grandTotal()'),1690+1200);eq(run('pending().min'),600+600);eq(run('pending().max'),1200+600);eq(run('pending().open'),true);
run('renderSummary()');assert.ok(elements.get('#summaryLines').innerHTML.includes('Por confirmar tras diagnóstico'));assert.ok(elements.get('#summaryLines').innerHTML.includes('S/1,200'));assert.ok(elements.get('#summaryLines').innerHTML.includes('puede llegar a S/2,000'));checks++;
// Contenido profesional: S/150 por página, pack de 5 a S/650.
reset();run(`setProject('website');state.contentPro=true`);eq(run('grandTotal()'),1690+650);run('state.pages=7');eq(run('grandTotal()'),1690+360+650+300);
run(`setProject('landing');state.contentPro=true`);eq(run('grandTotal()'),1090+150);
// Entrega prioritaria: +20 % del valor real de la implementación, sin mínimo.
reset();run(`setProject('website');state.design='premium'`);eq(run('implementationCost()'),1690+1200);eq(run('grandTotal()'),2890);eq(run('pending().min'),0);
reset();run(`setProject('website');state.rush=false`);eq(run('rushAmount()'),338);eq(run('rushCost()'),0);
run('state.rush=true');eq(run('rushCost()'),338);eq(run('grandTotal()'),1690+338);
run(`setProject('landing')`);eq(run('grandTotal()'),1090+Math.round(1090*.20));
reset();run(`setProject('ecommerce');state.blocks20=1;state.features=new Set(['seo']);state.rush=true`);eq(run('rushCost()'),Math.round((3490+280+650)*.20));
// Plazos de referencia por tipo de proyecto (días hábiles) y con entrega urgente.
reset();
for(const [key,text,rush] of [['landing','14–16 días hábiles','11–12 días hábiles'],['website','20–30 días hábiles','15–23 días hábiles'],['catalog','30–45 días hábiles','23–34 días hábiles'],['ecommerce','30–45 días hábiles','23–34 días hábiles'],['webapp','15 días hábiles','12 días hábiles']]){
 run(`setProject('${key}');state.rush=false`);eq(run('deliveryDays()'),text);
 run('state.rush=true');eq(run('deliveryDays()'),rush);
}
// El plazo es fijo: páginas, productos, funciones, diseño y contenido extra no lo alargan.
for(const [key,text] of [['landing','14–16 días hábiles'],['website','20–30 días hábiles'],['catalog','30–45 días hábiles'],['ecommerce','30–45 días hábiles'],['webapp','15 días hábiles']]){
 reset();run(`setProject('${key}');state.pages=18;state.blocks20=3;state.blocks50=2;state.contentPro=true;state.design='premium';state.features=new Set(['seo','forms','booking','multilingual','blog','automation','geo'])`);
 eq(run('deliveryDays()'),text);
}
// Soporte mensual y alojamiento anual van aparte del total.
reset();run(`setProject('ecommerce');state.support='store';state.hosting=true`);eq(run('grandTotal()'),3790);eq(run('recurring().length'),2);
run(`Object.assign(state,{design:'custom',tax:true});state.features=new Set(['booking'])`);
eq(run('subtotal()'),3490+850+450);eq(run('grandTotal()'),Math.round((3490+850+450)*1.18));
run('renderSummary()');assert.ok(elements.get('#summaryLines').innerHTML.includes('IGV 18%'));checks++;
assert.ok(elements.get('#summaryLines').innerHTML.includes('Pagos recurrentes'));checks++;
// Una cotización guardada con el esquema anterior se migra sin errores.
store.set('tuplusQuote',JSON.stringify({project:'website',pages:6,features:['whatsapp','seo'],support:'90',design:'custom',currency:'USD',version:2}));
run('load()');eq(run('state.tier'),'pro');eq(run('state.support'),'30');eq(run('[...state.features].join()'),'seo');eq(run('state.blocks20'),0);
reset();run(`setProject('landing')`);
for(const code of run('Object.keys(currencyMeta)')){
 run(`state.currency='${code}';`);const text=run('money(1090)');assert.ok(text.includes(code==='PEN'?'S/':code)&&!text.includes('NaN'));checks++;
}
// Los precios están en soles: en PEN se muestran tal cual; en USD se convierten con el tipo de cambio.
run(`state.currency='PEN'`);assert.match(run('money(1090)'),/1,090|1 090|1090/);checks++;
run(`state.currency='USD'`);eq(run('amountIn(3392)'),Math.round(3392/run('fx.rates.PEN.rate')));
run(`state.currency='JPY';state.currencyManual=true;save();state.currency='USD';load();`);eq(run('state.currency'),'JPY');
store.set('tuplusQuote',JSON.stringify({project:'<invalid>',features:['<script>','booking'],pages:999,design:'invalid',support:'invalid',currency:'BAD'}));
run('load()');eq(run('state.pages'),20);eq(run('state.currency'),'PEN');eq(run('state.features.size'),1);assert.ok(Number.isFinite(run('grandTotal()')));checks++;
for(const [id,value]of Object.entries({nombre:'Prueba',empresa:'Negocio',pais:'PE',email:'prueba@example.com',telefono:'+51 900000000',mensajeCliente:'Texto con & y ñ'}))document.querySelector('#'+id).value=value;
run('state.currency="EUR"');const quote=run('quoteText()');assert.ok(quote.includes('EUR')&&quote.includes('Perú')&&quote.includes('IGV'));checks++;
eq(new URL(run('whatsappUrl()')).searchParams.get('text'),quote);
const paymentMessage=new URL(run(`whatsappUrl('Quisiera confirmar mi propuesta y recibir un enlace de pago de Culqi.')`)).searchParams.get('text');
assert.ok(paymentMessage.startsWith(quote));assert.match(paymentMessage,/enlace de pago de Culqi/);checks++;
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
// Descuentos: cupón y descuento por fecha no se suman, gana el mayor; sin descuento el total no cambia
run(`Object.assign(state,{project:'website',pages:5,contentPro:false,design:'clean',support:'30',rush:false,hosting:false,tax:false});state.features=new Set();`);
const base0=run('grandTotal()');
run(`promo.campaign={nombre:'Navidad',tipo:'porcentaje',valor:15};`);eq(run('grandTotal()'),Math.round(base0-base0*0.15));
run(`promo.coupon={codigo:'X10',tipo:'porcentaje',valor:10};`);eq(run('discountInfo().origin'),'campana');
run(`promo.coupon={codigo:'X30',tipo:'porcentaje',valor:30};`);eq(run('discountInfo().origin'),'cupon');eq(run('discountInfo().amount'),Math.round(base0*30)/100);
run(`promo.coupon={codigo:'GRANDE',tipo:'monto',valor:99999};`);eq(run('grandTotal()'),0);
run(`promo.coupon=null;promo.campaign=null;`);eq(run('grandTotal()'),base0);
console.log(`${checks} comprobaciones correctas: tarifario por niveles, páginas y productos extra, rangos por confirmar, recurrentes, IGV, 20 monedas, 27 opciones de país, moneda automática/manual, migración, persistencia, datos inválidos, resumen, WhatsApp y 7 traducciones.`);
