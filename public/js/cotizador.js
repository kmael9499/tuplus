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
let reached = 1; // paso más lejano al que se llegó avanzando en orden

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
/* Descuentos: cupón y descuento por fecha NO se suman, se aplica el mayor.
   Las reglas finales las valida el backend; aquí solo se muestra el efecto. */
function subtotalUsd(){ return subtotal(); }
const promo = { coupon: null, campaign: null };
function promoAmount(p, sub){
  if(!p) return 0;
  const v = Number(p.valor);
  if(!(v > 0) || !(sub > 0)) return 0;
  const raw = p.tipo === 'porcentaje' ? sub * Math.min(v, 100) / 100 : Math.min(v, sub);
  return Math.round(raw * 100) / 100;
}
function discountInfo(){
  const sub = subtotal();
  const dCoupon = promoAmount(promo.coupon, sub), dCampaign = promoAmount(promo.campaign, sub);
  if(promo.coupon && dCoupon >= dCampaign && dCoupon > 0) return { origin: 'cupon', label: promo.coupon.codigo, amount: dCoupon };
  if(promo.campaign && dCampaign > 0) return { origin: 'campana', label: promo.campaign.nombre, amount: dCampaign };
  return { origin: null, label: '', amount: 0 };
}
function grandTotal(){
  const net = Math.max(0, subtotal() - discountInfo().amount);
  return state.tax ? Math.round(net * 1.18) : Math.round(net);
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
  const countryCollator=new Intl.Collator(window.TUPLUS_I18N?.locale||document.documentElement.lang||'es',{sensitivity:'base'});
  for(const id of ['countrySelect','pais']){
    const picker=$('#'+id);
    for(const option of picker.options)option.textContent=countries.name(option.value);
    Array.from(picker.options).sort((a,b)=>countryCollator.compare(a.textContent.trim(),b.textContent.trim())).forEach(option=>picker.append(option));
    picker.value=state.country;
  }
  $('#countryCurrencyHint').textContent=t(state.currencyManual?'Moneda elegida manualmente. Cambiar de país vuelve a ajustar la moneda.':'La moneda se ajusta al país que elijas.');
  $("#currencyHeadline").textContent=fx.name(code);
  $("#currencyRate").textContent=code==='USD'?t('Precios base en USD'):`1 USD = ${new Intl.NumberFormat(document.documentElement.lang,{maximumFractionDigits:4}).format(row.rate)} ${code} · ${row.date}`;
  ["heroCurrencyCode","heroEyebrowCurrency","summaryCurrencyTag","perkCurrency"].forEach(id=>{const el=$("#"+id);if(el)el.textContent=code});
  $("#estimatePill").textContent=`${code} · ${t('estimado')} · ${t(state.tax?'CON IGV':'SIN IGV')}`;
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
function contactComplete(){
  const v=id=>($("#"+id)?.value||"").trim();
  const phone=v("telefono"), digits=phone.replace(/\D/g,"");
  return ["nombre","empresa","pais","email","telefono"].every(id=>v(id))
    && /^\S+@\S+\.\S+$/.test(v("email"))
    && /^\+?[\d\s().-]{7,30}$/.test(phone) && digits.length>=7 && digits.length<=15;
}
function progressPct(){ return state.step===5 && !contactComplete() ? 80 : state.step*20; }
function renderPercent(){
  const pct=progressPct();
  $(".progress-track").setAttribute("aria-valuenow",pct);
  $("#progressFill").style.width=`${pct}%`;
  $("#progressPercent").textContent=`${pct}%`;
}
function renderProgress(){
  const pct = progressPct();
  $(".progress-track").setAttribute("aria-valuenow",pct);
  $("#progressFill").style.width = `${pct}%`;
  $("#progressLabel").textContent = t("Paso {step} de {total}").replace("{step}",state.step).replace("{total}",5);
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
  const disc = discountInfo();
  if(disc.amount) rows.push([`Descuento · ${disc.label}`, `−${money(disc.amount)}`]);
  if(state.tax) rows.push(["IGV 18%", money(Math.round((sub-disc.amount)*.18))]);
  $("#summaryLines").innerHTML=rows.map(([a,b])=>`<div class="summary-line"><span>${t(a)}</span><strong>${t(b)}</strong></div>`).join("");
}
function toast(msg){
  const el=$("#toast"); el.textContent=t(msg); el.classList.add("show");
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove("show"),2600);
}
function go(n){
  n=Math.max(1,Math.min(5,n));
  if(n>reached){ toast("Completa los pasos anteriores antes de continuar."); return; }
  state.step=n; renderProgress(); sync();
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
    line('IGV',t(state.tax?'CON IGV':'SIN IGV')),line('Entrega estimada',deliveryDays()),
    ...(discountInfo().amount?[line('Descuento · '+discountInfo().label,'−'+money(discountInfo().amount))]:[]),'',
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
function apiBase(){ return String(window.TUPLUS_CONFIG.apiUrl || '').replace(/\/+$/,''); }
function sendToBackend(){
  // Devuelve una promesa: true = guardado, false = falló, null = guardado desactivado en config.
  if(!window.TUPLUS_CONFIG.quoteBackendEnabled) return Promise.resolve(null);
  const api = apiBase();
  const disc = discountInfo();
  try{
    const payload={
      nombre:$("#nombre").value.trim(), email:$("#email").value.trim(), telefono:$("#telefono").value.trim(),
      proyecto:catalog[state.project].label,paginas:state.pages,contenido_pro:state.contentPro,moneda:state.currency,total_usd:grandTotal(),total_mostrado:money(grandTotal()),
      pais:state.country,consentimiento:$("#consentimiento").checked,cambio:`${fx.rates[state.currency].rate} (${fx.rates[state.currency].date})`,funciones:[...state.features],diseno:designs[state.design].label,soporte:supports[state.support].label,
      prioritaria:state.rush,cloud:state.hosting,igv:state.tax,total:grandTotal(),notas:`Empresa: ${$("#empresa").value.trim()} | País: ${countries.name(state.country)} (${state.country}) | ${$("#mensajeCliente").value.trim()}`,
      cupon:promo.coupon?promo.coupon.codigo:'',descuento:disc.amount,campana:disc.origin==='campana'?disc.label:''
    };
    // Con apiUrl se usa la API Node; sin ella, el PHP anterior.
    const url = api ? api+"/api/cotizaciones" : "procesar_cotizacion.php";
    const ctrl = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(), 12000); // si el servidor no responde en 12 s, se considera fallo
    return fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:ctrl.signal})
      .then(async response=>{
        const result=await response.json();
        if(!response.ok||(result.status!=="success"&&result.estado!=="correcto")) throw new Error("save");
        return true;
      })
      .catch(()=>{ toast("No se pudo guardar en el servidor. Tu resumen sigue disponible por WhatsApp o descarga."); return false; })
      .finally(()=>clearTimeout(timer));
  }catch{ return Promise.resolve(false); }
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
$("#nextBtn").addEventListener("click",()=>{if(state.step<5){reached=Math.max(reached,state.step+1);go(state.step+1);}else go(1);});
$("#backBtn").addEventListener("click",()=>go(state.step-1));
["nombre","empresa","pais","email","telefono"].forEach(id=>{$("#"+id).addEventListener("input",renderPercent);$("#"+id).addEventListener("change",renderPercent);});
$("#whatsappBtn").addEventListener("click",async()=>{
  if(!validateContact(true))return;
  const win=window.open("","_blank"); // se abre dentro del clic para que el navegador no lo bloquee
  toast("Guardando tu cotización...");
  const saved=await sendToBackend();
  const url=whatsappUrl();
  if(win){win.opener=null;win.location.href=url;}else{window.location.href=url;}
  if(saved!==false) toast("Abriendo WhatsApp con tu cotización.");
});
document.getElementById("downloadBtn")?.addEventListener("click", (e) => {
  e.preventDefault();

  try {
    const jsPDFClass = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
    if (!jsPDFClass) {
      alert("Error: jsPDF no esta cargado.");
      return;
    }

    const doc = new jsPDFClass({
      orientation: "p",
      unit: "mm",
      format: "a4"
    });

    const total = Number(typeof grandTotal === "function" ? grandTotal() : (grandTotal || 0));
    const subtotal = (total / 1.18).toFixed(2);
    const igv = (total - subtotal).toFixed(2);
    const moneda = (typeof state !== "undefined" && state?.currency) || "PEN";
    const servicio = (typeof catalog !== "undefined" && typeof state !== "undefined" && catalog?.[state?.project]?.label) || "Servicio Web Especializado";

    const pintarHeader = (titulo) => {
      doc.setFillColor(15, 23, 42); 
      doc.rect(0, 0, 210, 20, "F");
      doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(11);
      doc.text("TUPLUS SOLUCIONES", 14, 13);
      doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(203, 213, 225);
      doc.text(titulo, 196, 13, { align: "right" });
    };

    
    pintarHeader("RESUMEN EJECUTIVO (1/2)");

    const nombreCliente = document.getElementById("nombre")?.value?.trim() || "Particular";
    const empresaCliente = document.getElementById("empresa")?.value?.trim() || "—";

    doc.setTextColor(15, 23, 42).setFont("helvetica", "bold").setFontSize(10);
    doc.text(`Cliente: ${nombreCliente}`, 14, 30);
    doc.text(`Empresa: ${empresaCliente}`, 14, 36);
    doc.text(`Fecha: ${new Date().toLocaleDateString("es-PE")}`, 196, 30, { align: "right" });

    
    let y = 44;
    doc.setFillColor(15, 23, 42);
    doc.rect(14, y, 182, 8, "F");
    doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(9.5);
    doc.text("Concepto", 18, y + 5.5);
    doc.text("Modalidad", 95, y + 5.5);
    doc.text("Total", 192, y + 5.5, { align: "right" });

    
    const filas = [
      { c1: servicio, c2: "Desarrollo & Despliegue", c3: `${moneda} ${subtotal}`, isTotal: false },
      { c1: "Subtotal (Base Imponible)", c2: "—", c3: `${moneda} ${subtotal}`, isTotal: false },
      { c1: "IGV (18%)", c2: "—", c3: `${moneda} ${igv}`, isTotal: false },
      { c1: "TOTAL ESTIMADO", c2: "—", c3: `${moneda} ${total.toFixed(2)}`, isTotal: true }
    ];

    y += 8;
    filas.forEach((f) => {
      if (f.isTotal) {
        doc.setFillColor(15, 23, 42);
        doc.rect(14, y, 182, 8, "F");
        doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(9.5);
      } else {
        doc.setFillColor(248, 250, 252);
        doc.rect(14, y, 182, 8, "F");
        doc.setDrawColor(226, 232, 240);
        doc.line(14, y + 8, 196, y + 8);
        doc.setTextColor(15, 23, 42).setFont("helvetica", "normal").setFontSize(9);
      }
      doc.text(f.c1, 18, y + 5.5);
      doc.text(f.c2, 95, y + 5.5);
      doc.text(f.c3, 192, y + 5.5, { align: "right" });
      y += 8;
    });

    
    const yBar = y + 14;
    doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(15, 23, 42);
    doc.text("Distribución de Inversión (Neto vs IGV):", 14, yBar);
    doc.setFillColor(37, 99, 235);
    doc.rect(14, yBar + 4, 155, 6, "F");
    doc.setFillColor(203, 213, 225);
    doc.rect(169, yBar + 4, 27, 6, "F");

    
    doc.addPage();
    pintarHeader("HOJA DE RUTA Y PRÓXIMOS PASOS (2/2)");

    let y2 = 30;
    
    doc.setFillColor(37, 99, 235);
    doc.rect(14, y2, 182, 8, "F");
    doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(9);
    doc.text("Fase", 18, y2 + 5.5);
    doc.text("Descripción del Entregable", 65, y2 + 5.5);

    const fases = [
      ["1. Planificación & Diseño", "Estructura, diseño responsive y definición de contenidos."],
      ["2. Desarrollo & Código", "Maquetación funcional, lógica e interactividad."],
      ["3. Pruebas & Calidad", "Pruebas multidispositivo, rendimiento y revisión final."],
      ["4. Publicación", "Configuración de hosting, dominio y despliegue."]
    ];

    y2 += 8;
    fases.forEach(([fase, desc]) => {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y2, 182, 8, "F");
      doc.setDrawColor(226, 232, 240);
      doc.line(14, y2 + 8, 196, y2 + 8);
      doc.setTextColor(15, 23, 42).setFont("helvetica", "bold").setFontSize(8.5);
      doc.text(fase, 18, y2 + 5.5);
      doc.setFont("helvetica", "normal").setTextColor(71, 85, 105);
      doc.text(desc, 65, y2 + 5.5);
      y2 += 8;
    });

    const yPasos = y2 + 14;
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(15, 23, 42);
    doc.text("Próximos Pasos para Iniciar:", 14, yPasos);
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(71, 85, 105);
    doc.text("1. Confirmar la aceptación formal de esta cotización.", 14, yPasos + 7);
    doc.text("2. Compartir logotipo y material gráfico de la empresa.", 14, yPasos + 13);
    doc.text("3. Agendar reunión.", 14, yPasos + 19);

    
    doc.save(`Resumen_Cotizacion_${nombreCliente}.pdf`);

  } catch (err) {
    console.error("Error al generar PDF:", err);
    alert("Error al generar: " + (err?.message || err));
  }
});


(document.getElementById("printBtn") || document.querySelector("#printBtn"))?.addEventListener("click", () => {
  const jsPDFClass = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  if (!jsPDFClass) {
    alert("Error: jsPDF no está cargado.");
    return;
  }

  const doc = new jsPDFClass({
    orientation: "p",
    unit: "mm",
    format: "a4"
  });

  const total = Number(typeof grandTotal === "function" ? grandTotal() : (grandTotal || 0));
  const subtotal = (total / 1.18).toFixed(2);
  const igv = (total - subtotal).toFixed(2);
  const moneda = (typeof state !== "undefined" && state?.currency) || "PEN";
  const numDoc = "F001-" + Math.floor(100000 + Math.random() * 900000);

  
  doc.setFillColor(15, 23, 42); 
  doc.rect(0, 0, 210, 28, "F");
  doc.setFillColor(37, 99, 235); 
  doc.rect(0, 28, 210, 1.5, "F");

  
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 5, 48, 18, 2, 2, "F");

  const logo = document.querySelector(".brand-light") || document.querySelector("header img") || document.querySelector(".bird-core img");
  if (logo && logo.complete && logo.naturalWidth > 0) {
    try {
      doc.addImage(logo, "PNG", 16, 7, 44, 14);
    } catch (e) {
      console.warn("Logo no cargo:", e);
    }
  }

  
  doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(13);
  doc.text("TUPLUS SOLUCIONES", 70, 14);
  doc.setFont("helvetica", "normal").setFontSize(8.5).setTextColor(203, 213, 225);
  doc.text("Servicios Digitales & Desarrollo de Software", 70, 20);

  
  const yCard = 37;
  doc.setFillColor(248, 250, 252); 
  doc.roundedRect(14, yCard, 182, 25, 2, 2, "F");

  const nombreCliente = document.getElementById("nombre")?.value?.trim() || "Particular";
  const empresaCliente = document.getElementById("empresa")?.value?.trim() || "—";
  const fechaHoy = new Date().toLocaleDateString("es-PE");

  doc.setTextColor(15, 23, 42).setFont("helvetica", "bold").setFontSize(9);
  doc.text(`COMPROBANTE: ${numDoc}`, 20, yCard + 7);
  doc.text(`FECHA: ${fechaHoy}`, 190, yCard + 7, { align: "right" });

  doc.text("Cliente / Partner:", 20, yCard + 14);
  doc.setFont("helvetica", "normal").setTextColor(71, 85, 105);
  doc.text(nombreCliente, 58, yCard + 14);

  doc.setFont("helvetica", "bold").setTextColor(15, 23, 42);
  doc.text("Empresa / Razón Social:", 20, yCard + 20);
  doc.setFont("helvetica", "normal").setTextColor(71, 85, 105);
  doc.text(empresaCliente, 68, yCard + 20);

  
  let servicio = (typeof catalog !== "undefined" && typeof state !== "undefined" && catalog?.[state?.project]?.label) || "Servicio Web Especializado";
  if (servicio.toLowerCase().includes("landing")) {
    servicio = "Diseño y Desarrollo Web";
  } else if (servicio.toLowerCase().includes("corporativo")) {
    servicio = "Desarrollo Web - Sitio Corporativo Profesional";
  }

  let yTable = 68;

  
  doc.setFillColor(15, 23, 42);
  doc.rect(14, yTable, 182, 9, "F");
  doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(9.5);
  doc.text("Concepto", 18, yTable + 6);
  doc.text("Cantidad", 120, yTable + 6, { align: "center" });
  doc.text("Precio", 152, yTable + 6, { align: "right" });
  doc.text("Total", 192, yTable + 6, { align: "right" });

  
  yTable += 9;
  doc.setFillColor(255, 255, 255);
  doc.rect(14, yTable, 182, 10, "F");
  doc.setDrawColor(241, 245, 249);
  doc.line(14, yTable + 10, 196, yTable + 10);

  doc.setTextColor(51, 65, 85).setFont("helvetica", "normal").setFontSize(9);
  doc.text(servicio, 18, yTable + 6.5);
  doc.text("1", 120, yTable + 6.5, { align: "center" });
  doc.text(`${moneda} ${subtotal}`, 152, yTable + 6.5, { align: "right" });
  doc.text(`${moneda} ${subtotal}`, 192, yTable + 6.5, { align: "right" });

 
  yTable += 10;
  doc.setFillColor(255, 255, 255);
  doc.rect(14, yTable, 182, 10, "F");
  doc.setTextColor(15, 23, 42).setFont("helvetica", "bold").setFontSize(9.5);
  doc.text("Subtotal", 18, yTable + 6.5);
  doc.text(`${moneda} ${subtotal}`, 192, yTable + 6.5, { align: "right" });

  
  yTable += 10;
  doc.setFillColor(255, 255, 255);
  doc.rect(14, yTable, 182, 10, "F");
  doc.setTextColor(15, 23, 42).setFont("helvetica", "bold").setFontSize(9.5);
  doc.text("IGV (18%)", 18, yTable + 6.5);
  doc.text(`${moneda} ${igv}`, 192, yTable + 6.5, { align: "right" });

  
  yTable += 10;
  doc.setFillColor(15, 23, 42);
  doc.rect(14, yTable, 182, 10, "F");
  doc.setTextColor(255, 255, 255).setFont("helvetica", "bold").setFontSize(9.5);
  doc.text("TOTAL A PAGAR", 18, yTable + 6.5);
  doc.text(`${moneda} ${total.toFixed(2)}`, 192, yTable + 6.5, { align: "right" });

  
  const terminosY = yTable + 18;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, terminosY, 182, 22, 2, 2, "F");

  doc.setFont("helvetica", "bold").setFontSize(8.5).setTextColor(15, 23, 42);
  doc.text("Información Adicional:", 18, terminosY + 6);

  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(100, 116, 139);
  doc.text("• Gracias por confiar en nosotros para el desarrollo de este proyecto.", 18, terminosY + 11);
  doc.text("• Para consultas, avances de proyecto o soporte, por WhatsApp.", 18, terminosY + 16);

  
  window.open(URL.createObjectURL(doc.output("blob")), "_blank");
});

/* ---- Pagos: pasarela y crypto ---- */
const payCfg=(window.TUPLUS_CONFIG&&window.TUPLUS_CONFIG.payments)||{};
const cryptoWallets=((payCfg.crypto&&payCfg.crypto.wallets)||[]).filter(w=>w&&w.id&&w.label);
let cryptoSelected=null;
function payAmountUsd(){return `$${grandTotal().toLocaleString('en-US')} USD`;}
function openGateway(){
  if(!validateContact(true))return;
  const url=String(payCfg.gatewayUrl||'').trim();
  if(!/^https:\/\//i.test(url)){toast("La pasarela aún no está disponible. Escríbenos por WhatsApp y te enviamos el enlace de pago.");return;}
  sendToBackend(); window.open(url,"_blank","noopener,noreferrer"); toast("Abriendo la pasarela de pago.");
}
function renderCryptoWallet(){
  const w=cryptoWallets.find(x=>x.id===cryptoSelected)||cryptoWallets[0];
  $("#cryptoAddress").value=w&&w.address?w.address:"";
  $("#cryptoAddress").placeholder=w&&w.address?"":t("Dirección pendiente: pídela por WhatsApp");
  const qr=w&&typeof w.qr==="string"?w.qr.trim():"", okQr=/^(https:\/\/|[\w.\-\/]+\.(png|jpe?g|webp|svg)$)/i.test(qr)&&!qr.startsWith("//");
  const img=$("#cryptoQrImg"); img.hidden=!okQr; $("#cryptoQrEmpty").hidden=okQr;
  if(okQr)img.src=qr; else img.removeAttribute("src");
  $$("#cryptoNetworks .crypto-net").forEach(b=>{const on=w&&b.dataset.id===w.id;b.classList.toggle("selected",!!on);b.setAttribute("aria-checked",on?"true":"false");});
}
function openCrypto(){
  if(!(payCfg.crypto&&payCfg.crypto.enabled)||!cryptoWallets.length){toast("El pago con crypto aún no está disponible. Escríbenos por WhatsApp.");return;}
  if(!validateContact(true))return;
  cryptoSelected=cryptoSelected||cryptoWallets[0].id;
  const box=$("#cryptoNetworks"); box.textContent="";
  for(const w of cryptoWallets){
    const b=document.createElement("button"); b.type="button"; b.className="crypto-net"; b.dataset.id=w.id; b.setAttribute("role","radio"); b.textContent=w.label;
    b.addEventListener("click",()=>{cryptoSelected=w.id;renderCryptoWallet();}); box.append(b);
  }
  $("#cryptoAmount").textContent=payAmountUsd(); renderCryptoWallet();
  const dlg=$("#cryptoDialog"); if(typeof dlg.showModal==="function")dlg.showModal(); else dlg.setAttribute("open","");
}
function closeCrypto(){const d=$("#cryptoDialog"); if(typeof d.close==="function")d.close(); else d.removeAttribute("open");}
async function copyCryptoAddress(){
  const v=$("#cryptoAddress").value; if(!v){toast("Aún no hay dirección configurada.");return;}
  try{await navigator.clipboard.writeText(v);}catch{$("#cryptoAddress").select();document.execCommand("copy");}
  toast("Dirección copiada.");
}
function cryptoPaidWhatsApp(){
  const w=cryptoWallets.find(x=>x.id===cryptoSelected)||cryptoWallets[0], tx=$("#cryptoTx").value.trim();
  const extra=['','PAGO CON CRYPTO',`Red: ${w.label}`,`Monto: ${payAmountUsd()}`,`TXID: ${tx||'—'}`].join('\n');
  sendToBackend(); closeCrypto();
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(quoteText()+'\n'+extra)}`,"_blank","noopener");
  toast("Abriendo WhatsApp para confirmar tu pago.");
}
$("#gatewayBtn").addEventListener("click",openGateway);
$("#cryptoBtn").addEventListener("click",openCrypto);
$("#cryptoClose").addEventListener("click",closeCrypto);
$("#cryptoCopy").addEventListener("click",copyCryptoAddress);
$("#cryptoPaid").addEventListener("click",cryptoPaidWhatsApp);
$("#cryptoDialog").addEventListener("click",e=>{if(e.target===e.currentTarget)closeCrypto();});

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

/* ---- Descuentos conectados al panel (solo si config.js define apiUrl) ---- */
function renderPromoBanner(){
  const box = document.getElementById('couponBox');
  if(!box) return;
  let el = document.getElementById('promoBanner');
  const c = promo.campaign;
  if(!c){ if(el) el.remove(); return; }
  if(!el){ el = document.createElement('p'); el.id = 'promoBanner'; el.className = 'promo-banner'; el.setAttribute('role','status'); box.parentNode.insertBefore(el, box); }
  const val = c.tipo === 'porcentaje' ? c.valor + '%' : '$' + c.valor + ' USD';
  el.textContent = (c.mensaje || c.nombre) + ' (−' + val + ' aplicado automáticamente)';
}
function refreshPromo(){ renderPromoBanner(); sync(); if(state.step===5) renderSummary(); }
document.addEventListener('tuplus:coupon', e => {
  const d = e.detail || {};
  promo.coupon = d.code && d.tipo ? { codigo: d.code, tipo: d.tipo, valor: d.valor } : null;
  refreshPromo();
});
if(apiBase()){
  fetch(apiBase()+'/api/descuentos/activo').then(r=>r.json()).then(r=>{
    if(r && r.campana){ promo.campaign = r.campana; refreshPromo(); }
  }).catch(()=>{});
}