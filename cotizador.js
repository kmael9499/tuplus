const WHATSAPP_NUMBER = window.TUPLUS_CONFIG.whatsapp;
// Tipo de cambio de referencia editable. Los precios base se mantienen en USD y se convierten en pantalla.
const fx = window.TUPLUS_FX;
const countries = window.TUPLUS_COUNTRIES;
const t = value=>window.TUPLUS_I18N?.t(value)||value;
const state = {
  step: 1,
  project: "landing",
  pages: 1,
  contentPro: false,
  features: new Set(),
  design: "clean",
  support: "30",
  rush: false,
  hosting: false,
  tax: false,
  country: "PE",
  currency: "PEN",
  currencyManual: false
};

const catalog = {
  landing: {label:"Landing page", base:295, pagesBase:1, pageRate:35, days:5},
  website: {label:"Sitio corporativo", base:450, pagesBase:5, pageRate:35, days:10},
  catalog: {label:"Catálogo online", base:600, pagesBase:5, pageRate:40, days:12},
  ecommerce: {label:"Tienda e-commerce", base:890, pagesBase:8, pageRate:45, days:16},
  webapp: {label:"Aplicación web / SaaS", base:1500, pagesBase:8, pageRate:55, days:25}
};
const features = {
  whatsapp:{label:"WhatsApp",price:25}, forms:{label:"Formularios",price:45}, seo:{label:"SEO inicial",price:80},
  analytics:{label:"Analítica",price:35}, booking:{label:"Reservas",price:110}, multilingual:{label:"Multidioma",price:120},
  payments:{label:"Pagos online",price:160}, blog:{label:"Blog / CMS",price:75}, maps:{label:"Mapa interactivo",price:30},
  automation:{label:"Automatización",price:180}, speed:{label:"Performance+",price:95}, security:{label:"Hardening",price:85}
};
const designs = {clean:{label:"Clean / inteligente",price:0},custom:{label:"Custom UI",price:180},premium:{label:"Premium motion",price:350}};
const supports = {"30":{label:"30 días",price:0},"90":{label:"90 días",price:75},"180":{label:"180 días",price:150}};

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const currencyMeta = Object.fromEntries(Object.keys(fx.rates).map(code=>[code,{code}]));
const money = usd=>fx.format(usd,state.currency);
const moneyCode = ()=>state.currency;
const baseUSD = (n) => `$${Math.round(n).toLocaleString("en-US")}`;

function pagesExtraCost(){
  const p = Math.max(1, Number(state.pages));
  const cfg = catalog[state.project];
  return Math.max(0, p - cfg.pagesBase) * cfg.pageRate;
}
function subtotal(){
  let sum = catalog[state.project].base + pagesExtraCost();
  if(state.contentPro) sum += 120;
  state.features.forEach(k => sum += features[k].price);
  sum += designs[state.design].price + supports[state.support].price;
  if(state.rush) sum += 180;
  if(state.hosting) sum += 120;
  return Math.round(sum);
}
function grandTotal(){
  const sub = subtotal();
  return state.tax ? Math.round(sub * 1.18) : sub;
}
function range(){
  const t = grandTotal();
  return {min: Math.max(0, Math.round(t * .94)), max: Math.round(t * 1.25 + 90)};
}
function deliveryDays(){
  let days = catalog[state.project].days;
  if(state.pages > catalog[state.project].pagesBase) days += Math.ceil((state.pages-catalog[state.project].pagesBase)/4);
  if(state.rush) days = Math.max(3, Math.ceil(days*.75));
  return `${days}–${days+3} ${t("días hábiles")}`;
}
function setCountry(code){
  if(!countries.has(code))return;
  state.country=code;state.currency=countries.currency(code);state.currencyManual=false;
}
function save(){
  try { localStorage.setItem("tuplusQuote", JSON.stringify({
    project:state.project,pages:state.pages,contentPro:state.contentPro,features:[...state.features],
    design:state.design,support:state.support,rush:state.rush,hosting:state.hosting,tax:state.tax,currency:state.currency,country:state.country,currencyManual:state.currencyManual,version:2
  })); } catch { /* El cálculo funciona aunque el navegador bloquee el guardado. */ }
}
function load(){
  try{
    const q = JSON.parse(localStorage.getItem("tuplusQuote") || "null");
    if(!q) return;
    state.project = Object.hasOwn(catalog,q.project) ? q.project : state.project;
    state.pages = Math.max(1,Math.min(20,Math.round(Number(q.pages)) || state.pages));
    state.contentPro = !!q.contentPro;
    state.features = new Set(Array.isArray(q.features) ? q.features.filter(k=>Object.hasOwn(features,k)) : []);
    state.design = Object.hasOwn(designs,q.design) ? q.design : state.design;
    state.support = Object.hasOwn(supports,q.support) ? q.support : state.support;
    state.rush = !!q.rush;
    state.hosting = !!q.hosting;
    state.tax = !!q.tax;
    state.country = countries.has(q.country) ? q.country : 'PE';
    state.currencyManual = q.version===2 && q.currencyManual===true && Object.hasOwn(currencyMeta,q.currency);
    state.currency = state.currencyManual ? q.currency : countries.currency(state.country);
  }catch{}
}
function updateCurrencyUI(){
  const code=state.currency, row=fx.rates[code];
  const select=$("#currencySelect");
  for(const option of select.options) option.textContent=`${option.value} · ${fx.name(option.value)}`;
  select.value=code;
  for(const id of ['countrySelect','pais']){
    const picker=$('#'+id);
    for(const option of picker.options)option.textContent=countries.name(option.value);
    picker.value=state.country;
  }
  $('#countryCurrencyHint').textContent=t(state.currencyManual?'Moneda elegida manualmente. Cambiar de país vuelve a ajustar la moneda.':'La moneda se ajusta al país que elijas.');
  $("#currencyHeadline").textContent=fx.name(code);
  $("#currencyRate").textContent=code==='USD'?t('Precios base en USD'):`1 USD = ${new Intl.NumberFormat(document.documentElement.lang,{maximumFractionDigits:4}).format(row.rate)} ${code} · ${row.date}`;
  ["heroCurrencyCode","heroEyebrowCurrency","summaryCurrencyTag","perkCurrency"].forEach(id=>{const el=$("#"+id);if(el)el.textContent=code});
  $("#estimatePill").textContent=`${code} · ${t('estimado')}`;
  $$(".option-price[data-usd]").forEach(el=>{
    el.setAttribute('translate','no');
    const prefix=el.closest('.choice-card')?t('desde')+' ':'+';
    el.textContent=prefix+money(Number(el.dataset.usd));
  });
}

function sync(){
  updateCurrencyUI();
  $$("#projectOptions .choice-card").forEach(el => el.classList.toggle("selected", el.dataset.key===state.project));
  $("#pagesRange").value=state.pages; $("#pagesValue").textContent=state.pages;
  $$(".toggle-card").forEach(el => el.classList.toggle("selected", el.dataset.toggle==="contentPro" ? state.contentPro : !state.contentPro));
  $$(".feature-card").forEach(el => el.classList.toggle("selected", state.features.has(el.dataset.feature)));
  $$(".radio-card[data-design]").forEach(el => el.classList.toggle("selected", el.dataset.design===state.design));
  $$(".radio-card[data-support]").forEach(el => el.classList.toggle("selected", el.dataset.support===state.support));
  $("#rushToggle").classList.toggle("active", state.rush); $("#rushToggle").setAttribute("aria-pressed", state.rush);
  $("#hostingToggle").classList.toggle("active", state.hosting); $("#hostingToggle").setAttribute("aria-pressed", state.hosting);
  $("#taxToggle").classList.toggle("active", state.tax); $("#taxToggle").setAttribute("aria-pressed", state.tax);
  $("#taxToggle").querySelector("span").textContent = "";
  $$(".choice-card,.toggle-card,.feature-card,.radio-card").forEach(el=>el.setAttribute("aria-pressed",String(el.classList.contains("selected"))));
  $("#sideProjectName").textContent = catalog[state.project].label;
  const live=$("#liveTotal"), value=money(grandTotal());
  if(live.textContent!==value){
    live.textContent=value;
    if(live.animate&&!matchMedia('(prefers-reduced-motion:reduce)').matches){live.getAnimations().forEach(a=>a.cancel());live.animate([{opacity:.4,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:260,easing:'ease-out'});}
  }
  $("#liveTotal").setAttribute("aria-label", `${t("Estimado")} ${money(grandTotal())}`);
}
function renderProgress(){
  const pct = state.step*20;
  $(".progress-track").setAttribute("aria-valuenow",pct);
  $("#progressFill").style.width = `${pct}%`;
  $("#progressLabel").textContent = `${t("Paso")} ${state.step} ${t("de")} 5`;
  $("#progressPercent").textContent = `${pct}%`;
  $$(".step").forEach(el => {
    const step=Number(el.dataset.step);
    el.classList.toggle("active", step===state.step);
    el.classList.toggle("completed", step<state.step);
    el.setAttribute("aria-current", step===state.step ? "step" : "false");
  });
  $$(".step-view").forEach(el => el.classList.toggle("active", Number(el.dataset.view)===state.step));
  $("#backBtn").disabled = state.step===1;
  $("#nextLabel").textContent = state.step===5 ? "Editar" : "Continuar";
  if(state.step===5) renderSummary();
  $("#liveTotal").textContent = money(grandTotal());
}
function renderSummary(){
  const total=grandTotal(), sub=subtotal(), r=range();
  $("#totalPrice").textContent=money(total);
  $("#rangePrice").textContent=`${t("Rango orientativo")}: ${money(r.min)} — ${money(r.max)}`;
  $("#summaryPriceLabel").textContent=`${t("INVERSIÓN ESTIMADA")} · ${moneyCode()} · ${t(state.tax ? "CON IGV" : "SIN IGV")}`;
  const rows=[
    [catalog[state.project].label, money(catalog[state.project].base)],
    [`${state.pages} ${t(state.pages===1?"página":"páginas")}`, pagesExtraCost()?money(pagesExtraCost()):"Incluido"],
    [state.contentPro?"Contenido profesional":"Contenido entregado por el cliente", state.contentPro?money(120):"Sin recargo"],
    ...[...state.features].map(k=>[features[k].label,money(features[k].price)]),
    [`${t("Diseño")} · ${t(designs[state.design].label)}`, designs[state.design].price?money(designs[state.design].price):"Incluido"],
    [`${t("Soporte")} · ${t(supports[state.support].label)}`, supports[state.support].price?money(supports[state.support].price):"Incluido"],
    ["Entrega prioritaria", state.rush?money(180):"—"],
    ["Pack Cloud anual", state.hosting?money(120):"—"],
  ];
  rows.push(["Entrega estimada", deliveryDays()]);
  if(state.tax) rows.push(["IGV 18%", money(Math.round(sub*.18))]);
  $("#summaryLines").innerHTML=rows.map(([a,b])=>`<div class="summary-line"><span>${t(a)}</span><strong>${t(b)}</strong></div>`).join("");
}
function toast(msg){
  const el=$("#toast"); el.textContent=t(msg); el.classList.add("show");
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove("show"),2600);
}
function go(n){
  state.step=Math.max(1,Math.min(5,n)); renderProgress(); sync();
  const heading=document.querySelector(".step-view.active h2"); heading.tabIndex=-1; heading.focus({preventScroll:true});
  document.querySelector(".quote-layout").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth",block:"start"});
}
function validateContact(requireConsent=false){
  for(const id of ["nombre","empresa","pais","email","telefono"]){if(!$("#"+id).value.trim()){toast("Completa tus datos de contacto, empresa y país.");$("#"+id).focus();return false;}}
  if(requireConsent && !$("#consentimiento").checked){toast("Autoriza el uso de tus datos antes de abrir WhatsApp.");$("#consentimiento").focus();return false;}
  const name=$("#nombre").value.trim(), email=$("#email").value.trim(), phone=$("#telefono").value.trim();
  if(!name || !email || !phone){ toast("Completa nombre, correo y WhatsApp para continuar."); return false; }
  if(!/^\S+@\S+\.\S+$/.test(email)){ toast("Revisa el correo electrónico."); return false; }
  if(!/^\+?[\d\s().-]{7,30}$/.test(phone)||phone.replace(/\D/g,'').length<7||phone.replace(/\D/g,'').length>15){toast("Revisa el teléfono e incluye el código de país.");$("#telefono").focus();return false;}
  return true;
}
function quoteText(){
  const r=range(), selected=[...state.features].map(k=>t(features[k].label)).join(', ')||t('Ninguna adicional');
  const line=(label,value)=>`${t(label)}: ${value}`;
  return [
    'TUPLUS — '+t('COTIZACIÓN WEB'),'',
    line('Proyecto',t(catalog[state.project].label)),line('Páginas',state.pages),
    line('Contenido profesional',t(state.contentPro?'Sí':'No')),line('Funciones',selected),
    line('Diseño',t(designs[state.design].label)),line('Soporte',t(supports[state.support].label)),
    line('Entrega prioritaria',t(state.rush?'Sí':'No')),line('Pack Cloud anual',t(state.hosting?'Sí':'No')),
    line('IGV',t(state.tax?'CON IGV':'SIN IGV')),line('Entrega estimada',deliveryDays()),'',
    line('Cambio de referencia',`1 USD = ${fx.rates[state.currency].rate} ${state.currency} (${fx.rates[state.currency].date})`),
    line('INVERSIÓN ESTIMADA',money(grandTotal())),line('Rango orientativo',`${money(r.min)} — ${money(r.max)}`),'',
    line('Tu nombre',$("#nombre").value.trim()),line('Empresa o actividad',$("#empresa").value.trim()),
    line('País',countries.name(state.country)),line('Correo electrónico',$("#email").value.trim()),
    line('Teléfono / WhatsApp',$("#telefono").value.trim()),line('Mensaje',$("#mensajeCliente").value.trim()||'—'),'',
    t('La cifra es orientativa y se confirma al validar el alcance final.')
  ].join('\n');
}
function whatsappUrl(){
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(quoteText())}`;
}
function downloadTxt(){
  if(!validateContact()) return;
  const blob=new Blob([quoteText()],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url; a.download=`tuplus-cotizacion-${state.project}.txt`; a.click(); URL.revokeObjectURL(url);
  toast("Resumen descargado.");
}
function sendToBackend(){
  if(!window.TUPLUS_CONFIG.quoteBackendEnabled) return;
  // Optional PHP endpoint. The UI remains functional even on static hosting.
  try{
    const payload={
      nombre:$("#nombre").value.trim(), email:$("#email").value.trim(), telefono:$("#telefono").value.trim(),
      proyecto:catalog[state.project].label,paginas:state.pages,contenido_pro:state.contentPro,moneda:state.currency,total_usd:grandTotal(),total_mostrado:money(grandTotal()),
      pais:state.country,consentimiento:$("#consentimiento").checked,cambio:`${fx.rates[state.currency].rate} (${fx.rates[state.currency].date})`,funciones:[...state.features],diseno:designs[state.design].label,soporte:supports[state.support].label,
      prioritaria:state.rush,cloud:state.hosting,igv:state.tax,total:grandTotal(),notas:`Empresa: ${$("#empresa").value.trim()} | País: ${countries.name(state.country)} (${state.country}) | ${$("#mensajeCliente").value.trim()}`
    };
    fetch("procesar_cotizacion.php",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).then(async response=>{const result=await response.json();if(!response.ok||result.status!=="success")throw new Error("save");}).catch(()=>toast("No se pudo guardar en el servidor. Tu resumen sigue disponible por WhatsApp o descarga."));
  }catch{}
}
$("#quoteForm").addEventListener("submit",e=>e.preventDefault());
for(const code of Object.keys(currencyMeta)){
 const option=document.createElement('option');option.value=code;option.textContent=`${code} · ${fx.name(code)}`;$("#currencySelect").append(option);
}
for(const id of ['countrySelect','pais']){
 const select=$('#'+id);
 for(const code of countries.codes){const option=document.createElement('option');option.value=code;option.textContent=countries.name(code);select.append(option);}
 select.addEventListener('change',e=>{setCountry(e.target.value);save();sync();renderProgress()});
}
load(); sync(); renderProgress();
$("#currencySelect").addEventListener('change',e=>{state.currency=e.target.value;state.currencyManual=true;save();sync();renderProgress()});
$("#refreshRates").addEventListener('click',async e=>{
  const button=e.currentTarget;button.disabled=true;button.setAttribute('aria-busy','true');
  const updated=await fx.refresh();sync();renderProgress();
  toast(updated?'Tipos de cambio actualizados.':'Sin conexión. Conservamos la referencia fechada que ves en pantalla.');
  button.disabled=false;button.removeAttribute('aria-busy');
});
document.addEventListener('tuplus:language-change',()=>{sync();renderProgress()});
window.addEventListener('beforeprint',renderSummary);
$$("#projectOptions .choice-card").forEach(el=>el.addEventListener("click",()=>{state.project=el.dataset.key;state.pages=catalog[state.project].pagesBase;save();sync();renderProgress()}));
$("#pagesRange").addEventListener("input",e=>{state.pages=Number(e.target.value);save();sync();});
$$(".toggle-card").forEach(el=>el.addEventListener("click",()=>{state.contentPro=el.dataset.toggle==="contentPro";save();sync();}));
$$(".feature-card").forEach(el=>el.addEventListener("click",()=>{const k=el.dataset.feature; state.features.has(k)?state.features.delete(k):state.features.add(k); save(); sync();}));
$$(".radio-card[data-design]").forEach(el=>el.addEventListener("click",()=>{state.design=el.dataset.design;save();sync();}));
$$(".radio-card[data-support]").forEach(el=>el.addEventListener("click",()=>{state.support=el.dataset.support;save();sync();}));
$("#rushToggle").addEventListener("click",()=>{state.rush=!state.rush;save();sync();});
$("#hostingToggle").addEventListener("click",()=>{state.hosting=!state.hosting;save();sync();});
$("#taxToggle").addEventListener("click",()=>{state.tax=!state.tax;save();sync();});
$$(".step").forEach(el=>el.addEventListener("click",()=>go(Number(el.dataset.step))));
$("#nextBtn").addEventListener("click",()=>state.step<5?go(state.step+1):go(1));
$("#backBtn").addEventListener("click",()=>go(state.step-1));
$("#whatsappBtn").addEventListener("click",()=>{if(!validateContact(true))return; sendToBackend(); window.open(whatsappUrl(),"_blank","noopener"); toast("Abriendo WhatsApp con tu cotización.");});
$("#downloadBtn").addEventListener("click",downloadTxt);
$("#printBtn").addEventListener("click",()=>window.print());

function syncFloatingWhatsApp(){
  const href=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola TUPLUS, quiero información sobre una cotización web.")}`;
  $("#floatingWhatsapp").href=href;
}
syncFloatingWhatsApp();

// Subtle 3D tilt on large screens.
const stage=$("#heroStage");
if(stage && matchMedia("(pointer:fine)").matches && !matchMedia("(prefers-reduced-motion:reduce)").matches){
  stage.addEventListener("pointermove",(e)=>{
    const r=stage.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
    const scene=stage.querySelector(".scene");
    scene.style.transform=`translate3d(${x*10}px,${y*8}px,0) rotateX(${y*-7}deg) rotateY(${x*9}deg)`;
  });
  stage.addEventListener("pointerleave",()=>{stage.querySelector(".scene").style.transform="";});
}
