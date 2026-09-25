const WHATSAPP_NUMBER = "51916828870";
// Tipo de cambio de referencia editable. Los precios base se mantienen en USD y se convierten en pantalla.
const PEN_PER_USD = 3.55;
const state = {
  step: 1,
  project: "landing",
  pages: 5,
  contentPro: false,
  features: new Set(),
  design: "clean",
  support: "30",
  rush: false,
  hosting: false,
  tax: false,
  currency: "USD"
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
const currencyMeta = {
  USD: {code:"USD", symbol:"$", name:"Dólares", flag:"🇺🇸"},
  PEN: {code:"PEN", symbol:"S/", name:"Soles", flag:"🇵🇪"}
};
const money = (usd) => {
  const value = Math.round(state.currency === "PEN" ? usd * PEN_PER_USD : usd);
  return `${currencyMeta[state.currency].symbol}${value.toLocaleString("en-US")}`;
};
const moneyCode = () => currencyMeta[state.currency].code;
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
  return `${days}–${days+3} días hábiles`;
}
function save(){
  localStorage.setItem("azzizQuote", JSON.stringify({
    project:state.project,pages:state.pages,contentPro:state.contentPro,features:[...state.features],
    design:state.design,support:state.support,rush:state.rush,hosting:state.hosting,tax:state.tax
  }));
}
function load(){
  try{
    const q = JSON.parse(localStorage.getItem("azzizQuote") || "null");
    if(!q) return;
    state.project = q.project || state.project;
    state.pages = Number(q.pages) || state.pages;
    state.contentPro = !!q.contentPro;
    state.features = new Set(Array.isArray(q.features) ? q.features : []);
    state.design = q.design || state.design;
    state.support = q.support || state.support;
    state.rush = !!q.rush;
    state.hosting = !!q.hosting;
    state.tax = !!q.tax;
    state.currency = q.currency === "PEN" ? "PEN" : "USD";
  }catch{}
}
function updateCurrencyUI(){
  const meta = currencyMeta[state.currency];
  $$(".currency-option").forEach(el => { el.classList.toggle("active", el.dataset.currency===state.currency); el.setAttribute("aria-pressed", el.dataset.currency===state.currency ? "true" : "false"); });
  document.body.dataset.currency = state.currency.toLowerCase();
  const scene = $(".hummingbird-scene");
  if(scene){ scene.classList.toggle("currency-pen", state.currency==="PEN"); scene.classList.toggle("currency-usd", state.currency==="USD"); }
  const headline = $("#currencyHeadline"); if(headline) headline.textContent = `${meta.name} ${meta.code}`;
  const birdLabel = $("#birdCurrencyLabel"); if(birdLabel) birdLabel.textContent = `${meta.code} · LIVE 3D`;
  const heroCode = $("#heroCurrencyCode"); if(heroCode) heroCode.textContent = meta.code;
  const heroEyebrow = $("#heroEyebrowCurrency"); if(heroEyebrow) heroEyebrow.textContent = meta.code;
  const estimatePill = $("#estimatePill"); if(estimatePill) estimatePill.textContent = `${meta.code} · estimado`;
  const tag = $("#summaryCurrencyTag"); if(tag) tag.textContent = meta.code;
  const perk = $("#perkCurrency"); if(perk) perk.textContent = meta.code;
  const marquee = $("#marqueeCurrency"); if(marquee) marquee.textContent = meta.code;
  $$(".option-price[data-usd]").forEach(el=>{
    const n=Number(el.dataset.usd);
    const prefix=el.textContent.trim().startsWith("desde") ? "desde " : "+";
    el.textContent = `${prefix}${money(n)}`;
  });
  const rate = $("#currencyRate"); if(rate) rate.textContent = state.currency === "USD" ? `1 USD = S/ ${PEN_PER_USD.toFixed(2)}` : `1 USD = S/ ${PEN_PER_USD.toFixed(2)}`;
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
  $("#sideProjectName").textContent = catalog[state.project].label;
  $("#liveTotal").textContent = `${money(grandTotal())} ${moneyCode()}`;
  $("#liveTotal").setAttribute("aria-label", `Estimado ${money(grandTotal())} ${moneyCode()}`);
}
function renderProgress(){
  const pct = state.step*20;
  $("#progressFill").style.width = `${pct}%`;
  $("#progressLabel").textContent = `Paso ${state.step} de 5`;
  $("#progressPercent").textContent = `${pct}%`;
  $$(".step").forEach(el => {
    const step=Number(el.dataset.step);
    el.classList.toggle("active", step===state.step);
    el.setAttribute("aria-current", step===state.step ? "step" : "false");
  });
  $$(".step-view").forEach(el => el.classList.toggle("active", Number(el.dataset.view)===state.step));
  $("#backBtn").disabled = state.step===1;
  $("#nextLabel").textContent = state.step===5 ? "Editar" : "Continuar";
  if(state.step===5) renderSummary();
  $("#liveTotal").textContent = money(grandTotal());
}
function renderSummary(){
  const t=grandTotal(), sub=subtotal(), r=range();
  $("#totalPrice").textContent=money(t);
  $("#rangePrice").textContent=`rango orientativo ${money(r.min)} — ${money(r.max)}`;
  $("#summaryPriceLabel").textContent=`INVERSIÓN ESTIMADA · ${moneyCode()} · ${state.tax ? "CON IGV" : "SIN IGV"}`;
  const rows=[
    [catalog[state.project].label, money(catalog[state.project].base)],
    [`${state.pages} ${state.pages===1?"página":"páginas"}`, pagesExtraCost()?money(pagesExtraCost()):"Incluido"],
    ["Contenido profesional", state.contentPro?money(120):"Incluido"],
    ...[...state.features].map(k=>[features[k].label,money(features[k].price)]),
    ["Dirección visual", designs[state.design].price?money(designs[state.design].price):"Incluido"],
    ["Soporte", supports[state.support].price?supports[state.support].price?money(supports[state.support].price):"Incluido":"Incluido"],
    ["Entrega prioritaria", state.rush?money(180):"—"],
    ["Pack Cloud anual", state.hosting?money(120):"—"],
  ];
  if(state.tax) rows.push(["IGV 18%", money(Math.round(sub*.18))]);
  $("#summaryLines").innerHTML=rows.map(([a,b])=>`<div class="summary-line"><span>${a}</span><strong>${b}</strong></div>`).join("");
}
function toast(msg){
  const el=$("#toast"); el.textContent=msg; el.classList.add("show");
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.classList.remove("show"),2600);
}
function go(n){
  state.step=Math.max(1,Math.min(5,n)); renderProgress(); sync();
  document.querySelector(".quote-layout").scrollIntoView({behavior:"smooth",block:"start"});
}
function validateContact(){
  const name=$("#nombre").value.trim(), email=$("#email").value.trim(), phone=$("#telefono").value.trim();
  if(!name || !email || !phone){ toast("Completa nombre, correo y WhatsApp para continuar."); return false; }
  if(!/^\S+@\S+\.\S+$/.test(email)){ toast("Revisa el correo electrónico."); return false; }
  return true;
}
function quoteText(){
  const t=grandTotal(), r=range();
  const selected = [...state.features].map(k=>features[k].label).join(", ") || "Ninguna adicional";
  return [
    "AZZIZ — COTIZACIÓN WEB",
    "@azziz · Software Engineering × AI",
    "",
    `Proyecto: ${catalog[state.project].label}`,
    `Páginas: ${state.pages}`,
    `Contenido profesional: ${state.contentPro?"Sí":"No"}`,
    `Funciones: ${selected}`,
    `Diseño: ${designs[state.design].label}`,
    `Soporte: ${supports[state.support].label}`,
    `Entrega prioritaria: ${state.rush?"Sí":"No"}`,
    `Pack Cloud anual: ${state.hosting?"Sí":"No"}`,
    `IGV mostrado: ${state.tax?"Sí":"No"}`,
    `Entrega estimada: ${deliveryDays()}`,
    "",
    `TOTAL ESTIMADO: ${money(t)} ${moneyCode()}`,
    `RANGO ORIENTATIVO: ${money(r.min)} — ${money(r.max)} ${moneyCode()}`,
    "",
    `Cliente: ${$("#nombre").value.trim()}`,
    `Email: ${$("#email").value.trim()}`,
    `WhatsApp: ${$("#telefono").value.trim()}`,
    `Notas: ${$("#mensajeCliente").value.trim() || "—"}`,
    "",
    "La cifra es orientativa y se confirma al validar el alcance final."
  ].join("\n");
}
function whatsappUrl(){
  const name=$("#nombre").value.trim() || "cliente";
  const phone=$("#telefono").value.trim() || "no indicado";
  const selected=[...state.features].map(k=>features[k].label).join(", ") || "Ninguna adicional";
  const lines=[
    `Hola @azziz, soy *${name}*.`,
    "",
    "*QUIERO COTIZAR MI PROYECTO WEB*",
    `• Tipo: ${catalog[state.project].label}`,
    `• Páginas: ${state.pages}`,
    `• Funciones: ${selected}`,
    `• Diseño: ${designs[state.design].label}`,
    `• Soporte: ${supports[state.support].label}`,
    `• Entrega prioritaria: ${state.rush?"Sí":"No"}`,
    `• Pack Cloud anual: ${state.hosting?"Sí":"No"}`,
    `• Estimación: *${money(grandTotal())} ${moneyCode()}*`,
    `• Rango: ${money(range().min)} — ${money(range().max)} ${moneyCode()}`,
    `• Mi WhatsApp: ${phone}`,
    "",
    `Mensaje: ${$("#mensajeCliente").value.trim() || "Quiero recibir una propuesta detallada."}`
  ];
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
}
function downloadTxt(){
  if(!validateContact()) return;
  const blob=new Blob([quoteText()],{type:"text/plain;charset=utf-8"});
  const url=URL.createObjectURL(blob), a=document.createElement("a");
  a.href=url; a.download=`azziz-cotizacion-${state.project}.txt`; a.click(); URL.revokeObjectURL(url);
  toast("Resumen descargado.");
}
function sendToBackend(){
  // Optional PHP endpoint. The UI remains functional even on static hosting.
  try{
    const payload={
      nombre:$("#nombre").value.trim(), email:$("#email").value.trim(), telefono:$("#telefono").value.trim(),
      proyecto:catalog[state.project].label,paginas:state.pages,contenido_pro:state.contentPro,moneda:state.currency,total_usd:grandTotal(),total_mostrado:money(grandTotal()),
      funciones:[...state.features],diseno:designs[state.design].label,soporte:supports[state.support].label,
      prioritaria:state.rush,cloud:state.hosting,igv:state.tax,total:grandTotal(),notas:$("#mensajeCliente").value.trim()
    };
    fetch("procesar_cotizacion.php",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}).catch(()=>{});
  }catch{}
}
load(); sync(); renderProgress();

$$(".currency-option").forEach(el=>el.addEventListener("click",()=>{
  state.currency=el.dataset.currency === "PEN" ? "PEN" : "USD";
  save(); sync(); renderProgress();
  toast(`Mostrando precios en ${currencyMeta[state.currency].name}.`);
}));

$$("#projectOptions .choice-card").forEach(el=>el.addEventListener("click",()=>{state.project=el.dataset.key;save();sync();renderProgress()}));
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
$("#restartTop").addEventListener("click",()=>{localStorage.removeItem("azzizQuote"); location.reload();});
$("#whatsappBtn").addEventListener("click",()=>{if(!validateContact())return; sendToBackend(); window.open(whatsappUrl(),"_blank","noopener"); toast("Abriendo WhatsApp con tu cotización.");});
$("#downloadBtn").addEventListener("click",downloadTxt);
$("#printBtn").addEventListener("click",()=>window.print());

function syncFloatingWhatsApp(){
  const href=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola @azziz, quiero información sobre una cotización web.")}`;
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
