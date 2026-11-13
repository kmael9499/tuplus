const WHATSAPP_NUMBER = window.TUPLUS_CONFIG.whatsapp;
// Tipo de cambio de referencia editable. Los precios base se mantienen en USD y se convierten en pantalla.
const fx = window.TUPLUS_FX;
const countries = window.TUPLUS_COUNTRIES;
const t = value=>window.TUPLUS_I18N?.t(value)||value;
/* Tarifario TUPLUS por niveles (propuesta del 29/10/2026).
   Todos los importes están en SOLES y SIN IGV; la pantalla los convierte a la moneda elegida.
   Los adicionales con rango no se suman al total: se muestran "por confirmar". */
const state = {
  step: 1,
  project: "landing",
  tier: "pro",
  pages: 6,
  blocks20: 0,
  blocks50: 0,
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

const TIERS = ["pro","biz","corp"];
const tierNames = {pro:"Profesional", biz:"Empresarial", corp:"Corporativo"};
// unit: qué mide el deslizador. extraRate: precio por unidad sobre lo incluido.
const catalog = {
  landing: {label:"Landing page", delivery:[14,16], unit:"section", extraRate:90, tiers:{
    pro:{price:1090, included:6, scope:"Una página de campaña, hasta 6 secciones."},
    biz:{price:1490, included:9, scope:"Hasta 9 secciones y mayor personalización visual."},
    corp:{price:1990, included:12, scope:"Hasta 12 secciones y diseño visual a medida."}}},
  website: {label:"Sitio corporativo", delivery:[20,30], unit:"page", extraRate:180, tiers:{
    pro:{price:1690, included:5, scope:"Hasta 5 páginas de contenido."},
    biz:{price:2790, included:8, scope:"Hasta 8 páginas, con gestor de contenidos y blog.", includes:["blog"]},
    corp:{price:3990, included:12, scope:"Hasta 12 páginas, con gestor de contenidos y mayor personalización.", includes:["blog"]}}},
  catalog: {label:"Catálogo online", delivery:[30,45], unit:"page", extraRate:180, products:true, tiers:{
    pro:{price:2290, included:5, products:20, scope:"Hasta 5 páginas informativas y carga de 20 productos."},
    biz:{price:2990, included:8, products:50, scope:"Hasta 8 páginas informativas y carga de 50 productos."},
    corp:{price:3990, included:12, products:100, scope:"Hasta 12 páginas informativas y carga de 100 productos."}}},
  // La tienda ya incluye carrito, checkout y una pasarela estándar; el adicional "payments" es la segunda.
  ecommerce: {label:"Tienda e-commerce", delivery:[30,45], unit:"page", extraRate:180, products:true, tiers:{
    pro:{price:3490, included:5, products:20, scope:"Hasta 5 páginas informativas y carga de 20 productos."},
    biz:{price:5490, included:8, products:50, scope:"Hasta 8 páginas informativas y carga de 50 productos."},
    corp:{price:7490, included:12, products:100, scope:"Hasta 12 páginas informativas y carga de 100 productos."}}},
  // Las aplicaciones se cotizan a medida: un solo nivel con importe referencial.
  webapp: {label:"Aplicación web / SaaS", delivery:[15,15], unit:"page", extraRate:180, custom:true, tiers:{
    pro:{price:5090, included:8, scope:"Cotización personalizada según módulos, usuarios e integraciones."}}}
};
const productBlocks = {blocks20:{qty:20, price:280}, blocks50:{qty:50, price:650}};
// price: importe cerrado. range: [mínimo, máximo|null] por confirmar, no se suma al total.
const features = {
  forms:{label:"Formulario adicional",price:180}, seo:{label:"SEO de intención",price:650},
  booking:{label:"Reservas",price:450},
  multilingual:{label:"Multidioma",price:650}, payments:{label:"Pagos online",price:180},
  blog:{label:"Blog / CMS",range:[450,650]}, whatsapp:{label:"WhatsApp",price:0,included:true}, maps:{label:"Mapa con buscador o rutas",range:[600,null]},
  automation:{label:"Automatización",price:750}, speed:{label:"Performance+",range:[450,900]},
  security:{label:"Hardening",range:[600,1200]}, email:{label:"Correo corporativo",range:[120,180]},
  migration:{label:"Migración de web",range:[600,1200]}, geo:{label:"Visibilidad en buscadores con IA (GEO)",price:750}
};

const featureDescriptions = {
  whatsapp:"Añade un acceso directo para que las personas puedan escribirte por WhatsApp desde tu página. Facilita las consultas, cotizaciones y coordinación con tus clientes sin que tengan que buscar tu número.",
  forms:"Permite crear formularios para recibir consultas, solicitudes de cotización, datos de contacto o pedidos. La información se organiza mediante campos personalizados y puede enviarse al correo que indiques para que puedas responder a tus potenciales clientes.",
  seo:"Optimiza la estructura y el contenido de tu sitio para que Google pueda entender mejor tus páginas. Se trabajan elementos como títulos, descripciones y palabras clave relacionadas con tus servicios, ayudando a que tu negocio tenga más oportunidades de aparecer en búsquedas relevantes.",
  analytics:"Integra herramientas de medición para conocer cuántas personas visitan tu web, desde dónde llegan y qué páginas consultan. También permite revisar interacciones importantes para identificar qué contenido funciona mejor y tomar decisiones basadas en datos.",
  booking:"Incorpora un sistema para que tus clientes puedan consultar horarios disponibles y solicitar o reservar citas directamente desde tu página. Es útil para negocios que trabajan con atención por turnos, como consultorios, salones, servicios técnicos o asesorías.",
  multilingual:"Adapta el contenido de tu sitio para que pueda mostrarse en dos o más idiomas mediante un selector de idioma. Así, visitantes de distintos países pueden comprender mejor tus productos y servicios; la traducción y cantidad de idiomas se definen según el alcance del proyecto.",
  payments:"Agrega una opción para que tus clientes puedan realizar pagos o continuar el proceso de compra por internet. La integración se realiza mediante una pasarela o proveedor externo compatible; sus comisiones, requisitos y posibles cargos se pagan directamente al proveedor.",
  blog:"Añade una sección de artículos o noticias que podrás actualizar desde un administrador de contenido, sin tener que modificar el código de la página. Puedes publicar novedades, consejos, casos de trabajo y contenido útil para mantener tu web activa y compartir información con tus clientes.",
  maps:"Integra un mapa para mostrar la ubicación de tu negocio, sucursales o puntos de atención. Según lo contratado, también puede incluir buscador de lugares o indicaciones de rutas para que los visitantes encuentren con mayor facilidad cómo llegar.",
  automation:"Conecta procesos de tu web con herramientas externas para reducir tareas manuales, como enviar avisos, registrar solicitudes o distribuir información. Las automatizaciones específicas se definen según tu flujo de trabajo y pueden requerir servicios externos con costos propios.",
  speed:"Mejora el rendimiento de tu sitio para que sus páginas y recursos carguen de manera más eficiente. Se revisan aspectos como imágenes, archivos y recursos que afectan la velocidad, con el objetivo de ofrecer una navegación más fluida, especialmente desde celulares y conexiones lentas.",
  security:"Refuerza la seguridad de tu página mediante ajustes de configuración y buenas prácticas para reducir riesgos comunes. Puede incluir protección de accesos, revisión de permisos, configuración segura y medidas preventivas; no sustituye el monitoreo continuo ni garantiza que un sitio sea imposible de vulnerar.",
  email:"Configura cuentas de correo con el nombre de tu propio dominio, por ejemplo ventas@tuempresa.com, para dar una imagen más profesional al comunicarte con tus clientes. La cantidad de buzones, capacidad y renovación dependen del proveedor de correo contratado.",
  migration:"Traslada una página web existente a un nuevo entorno, procurando conservar su contenido, estructura y enlaces importantes. Antes del traslado se revisan los elementos del sitio para definir qué se puede migrar y evitar, en lo posible, interrupciones o pérdida de información.",
  geo:"Prepara y estructura el contenido de tu negocio para que los motores de búsqueda y asistentes de inteligencia artificial puedan comprender mejor qué ofreces. Se trabaja la claridad de la información, preguntas frecuentes, datos del negocio y contenido útil para aumentar las posibilidades de que tu marca sea considerada en respuestas generadas por IA; no garantiza menciones ni recomendaciones."
};
const designs = {clean:{label:"Clean / inteligente",price:0},custom:{label:"Custom UI",price:850},premium:{label:"Premium motion",price:1200,range:[1200,2000]}};
// Soporte mensual: pago recurrente, no entra al total de implementación.
const supports = {"30":{label:"Sin soporte mensual adicional",monthly:0},web:{label:"Soporte web",monthly:150},store:{label:"Soporte tienda",monthly:300},plus:{label:"Soporte ampliado",monthly:550}};
const CONTENT_PAGE = 150, CONTENT_PACK = 650; // contenido profesional: S/150 por página o S/650 cada 5
const RUSH_RATE = .20;                         // entrega prioritaria: +20 % del valor de la implementación
const RUSH_CUT = .75;                          // y el plazo se recorta a ese porcentaje

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const currencyMeta = Object.fromEntries(Object.keys(fx.rates).map(code=>[code,{code}]));
const penRate = () => fx.rates.PEN.rate;
const toUsd = pen => pen / penRate();
const money = pen => fx.format(toUsd(pen), state.currency);
const moneyCode = ()=>state.currency;
// Importe en la moneda elegida, como número (para PDF y pagos).
const amountIn = pen => state.currency==="PEN" ? Math.round(pen) : Math.round(toUsd(pen) * fx.rates[state.currency].rate);

const project = () => catalog[state.project];
const tierCfg = () => project().tiers[state.tier] || project().tiers.pro;
const unitName = n => project().unit==="section" ? t(n===1?"sección":"secciones") : t(n===1?"página":"páginas");
function includedFeature(k){
  return (project().includes||[]).includes(k) || (tierCfg().includes||[]).includes(k);
}
function featureInfo(k){
  const f = features[k];
  if(k==="whatsapp") return {...f, price:0, range:null, included:true};
  if(includedFeature(k)) return {...f, price:0, range:null, included:true};
  // En tienda, la primera pasarela está incluida; lo que se cobra es una segunda.
  if(k==="payments") return state.project==="ecommerce"
    ? {...f, label:"Segunda pasarela de pago", price:450}
    : {...f, label:"Enlace de pago", price:180};
  return f;
}
function extraUnits(){ return Math.max(0, Math.max(1, Number(state.pages)) - tierCfg().included); }
function pagesExtraCost(){ return extraUnits() * project().extraRate; }
function productCount(){
  if(!project().products) return 0;
  return tierCfg().products + state.blocks20*productBlocks.blocks20.qty + state.blocks50*productBlocks.blocks50.qty;
}
function productsCost(){
  if(!project().products) return 0;
  return state.blocks20*productBlocks.blocks20.price + state.blocks50*productBlocks.blocks50.price;
}
function contentUnits(){ return project().unit==="section" ? 1 : Math.max(1, Number(state.pages)); }
function contentPrice(){ const n = contentUnits(); return Math.floor(n/5)*CONTENT_PACK + (n%5)*CONTENT_PAGE; }
function contentCost(){ return state.contentPro ? contentPrice() : 0; }
function implementationCost(){
  let sum = tierCfg().price + pagesExtraCost() + productsCost() + contentCost();
  state.features.forEach(k => sum += featureInfo(k).price || 0);
  sum += designs[state.design].price || 0;
  return Math.round(sum);
}
function rushAmount(){ return Math.round(implementationCost()*RUSH_RATE); }
function rushCost(){ return state.rush ? rushAmount() : 0; }
function subtotal(){ return implementationCost() + rushCost() + (supports[state.support]?.monthly || 0); }
/* Descuentos: cupón y descuento por fecha NO se suman, se aplica el mayor.
   Las reglas finales las valida el backend; aquí solo se muestra el efecto. */
function subtotalUsd(){ return Math.round(toUsd(subtotal())*100)/100; }
const promo = { coupon: null, campaign: null };
function promoAmount(p, sub){
  if(!p) return 0;
  const v = Number(p.valor);
  if(!(v > 0) || !(sub > 0)) return 0;
  // Los montos fijos del panel están en USD; se pasan a soles.
  const raw = p.tipo === 'porcentaje' ? sub * Math.min(v, 100) / 100 : Math.min(v * penRate(), sub);
  return Math.round(raw * 100) / 100;
}
function discountInfo(){
  const sub = subtotal();
  const dCoupon = promoAmount(promo.coupon, sub), dCampaign = promoAmount(promo.campaign, sub);
  if(promo.coupon && dCoupon >= dCampaign && dCoupon > 0) return { origin: 'cupon', label: promo.coupon.codigo, amount: dCoupon };
  if(promo.campaign && dCampaign > 0) return { origin: 'campana', label: promo.campaign.nombre, amount: dCampaign };
  return { origin: null, label: '', amount: 0 };
}
const withTax = n => state.tax ? Math.round(n * 1.18) : Math.round(n);
function grandTotal(){ return withTax(Math.max(0, subtotal() - discountInfo().amount)); }
// Adicionales con rango: se listan aparte y no entran al total.
function pending(){
  const items = [];
  state.features.forEach(k => { const f = featureInfo(k); if(f.range) items.push({label:f.label, range:f.range}); });
  const min = items.reduce((s,i)=>s+i.range[0],0), max = items.reduce((s,i)=>s+(i.range[1]??i.range[0]),0);
  return {items, min:withTax(min), max:withTax(max), open:items.some(i=>i.range[1]==null)};
}
const rangeText = (min,max,open) => open||max===min ? `${t("desde")} ${money(min)}` : `${money(min)} — ${money(max)}`;
function hostingInfo(){ return state.project==="ecommerce" ? {label:"Hosting tienda + dominio básico (configuración)", yearly:900} : {label:"Hosting básico + dominio básico (configuración)", yearly:420}; }
// El primer mes de soporte se suma al estimado; el hosting anual se lista aparte.
function recurring(){
  const rows = [];
  const s = supports[state.support];
  if(s.monthly) rows.push({label:s.label, text:`${money(withTax(s.monthly))} / ${t("mes")}`});
  if(state.hosting){ const h = hostingInfo(); rows.push({label:h.label, text:`${t("desde")} ${money(withTax(h.yearly))} / ${t("año")}`}); }
  return rows;
}
function deliveryDays(){
  // Plazo fijo por tipo de proyecto: los extras no lo alargan. Solo la entrega urgente lo acorta.
  let [min,max] = project().delivery;
  if(state.rush){ min = Math.max(3, Math.ceil(min*RUSH_CUT)); max = Math.max(min, Math.ceil(max*RUSH_CUT)); }
  const unit = t("días hábiles");
  return min===max ? `${min} ${unit}` : `${min}–${max} ${unit}`;
}
function setCountry(code){
  if(!countries.has(code))return;
  state.country=code;state.currency=countries.currency(code);state.currencyManual=false;
}
function setProject(key){
  state.project=key;
  if(!project().tiers[state.tier]) state.tier="pro";
  state.pages=tierCfg().included;
}
function setTier(key){
  if(!project().tiers[key]) return;
  // Si el visitante no había pasado de lo incluido, el deslizador acompaña al nuevo nivel.
  const followed = state.pages <= tierCfg().included;
  state.tier=key;
  if(followed) state.pages=tierCfg().included;
}
const clampBlocks = n => Math.max(0, Math.min(10, Math.round(Number(n)) || 0));
function save(){
  try { localStorage.setItem("tuplusQuote", JSON.stringify({
    project:state.project,tier:state.tier,pages:state.pages,blocks20:state.blocks20,blocks50:state.blocks50,contentPro:state.contentPro,features:[...state.features],
    design:state.design,support:state.support,rush:state.rush,hosting:state.hosting,tax:state.tax,currency:state.currency,country:state.country,currencyManual:state.currencyManual,version:3
  })); } catch { /* El cálculo funciona aunque el navegador bloquee el guardado. */ }
}
function load(){
  try{
    const q = JSON.parse(localStorage.getItem("tuplusQuote") || "null");
    if(!q) return;
    state.project = Object.hasOwn(catalog,q.project) ? q.project : state.project;
    state.tier = Object.hasOwn(project().tiers,q.tier) ? q.tier : "pro";
    state.pages = Math.max(1,Math.min(20,Math.round(Number(q.pages)) || state.pages));
    state.blocks20 = clampBlocks(q.blocks20);
    state.blocks50 = clampBlocks(q.blocks50);
    state.contentPro = !!q.contentPro;
    state.features = new Set(Array.isArray(q.features) ? q.features.filter(k=>Object.hasOwn(features,k)) : []);
    state.design = Object.hasOwn(designs,q.design) ? q.design : state.design;
    state.support = Object.hasOwn(supports,q.support) ? q.support : "30";
    state.rush = !!q.rush;
    state.hosting = !!q.hosting;
    state.tax = !!q.tax;
    state.country = countries.has(q.country) ? q.country : 'PE';
    state.currencyManual = q.version>=2 && q.currencyManual===true && Object.hasOwn(currencyMeta,q.currency);
    state.currency = state.currencyManual ? q.currency : countries.currency(state.country);
  }catch{}
}
function priceText(el){
  const pen = Number(el.dataset.pen), max = el.dataset.penMax ? Number(el.dataset.penMax) : null;
  if(el.dataset.included==="true") return t("Incluido");
  let text = max ? `${money(pen)} — ${money(max)}` : money(pen);
  if(el.dataset.period) return `${text} / ${t(el.dataset.period)}`;
  if(el.dataset.prefix==="from" || el.closest('.choice-card')) return `${t('desde')} ${text}`;
  if(el.dataset.prefix==="none") return text;
  return max ? text : '+'+text;
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
}
function renderTiers(){
  const box=$("#tierOptions"); if(!box) return;
  const custom=!!project().custom;
  $("#tierBlock").hidden=custom; $("#tierCustom").hidden=!custom;
  if(custom){ box.textContent=""; return; }
  box.innerHTML=TIERS.map(k=>{
    const c=project().tiers[k], on=k===state.tier;
    return `<button class="radio-card tier-card${on?" selected":""}" data-tier="${k}" type="button" role="radio" aria-checked="${on}" tabindex="${on?0:-1}"><span class="radio"></span><div><b>${t(tierNames[k])}</b><small>${t(c.scope)}</small></div><strong><span class="option-price" data-pen="${c.price}" data-prefix="none" translate="no"></span></strong></button>`;
  }).join("");
}
function renderScope(){
  const c=tierCfg(), p=project(), extra=extraUnits();
  $("#pagesUnit").textContent=t(p.unit==="section"?"Secciones de la landing":"Páginas principales");
  $("#pagesRange").setAttribute("aria-label",t(p.unit==="section"?"Número de secciones":"Número de páginas"));
  const tierLabel=p.custom?t("La base"):t(tierNames[state.tier]);
  const base=`${tierLabel} ${t("incluye")} ${c.included} ${unitName(c.included)}.`;
  $("#pagesHint").textContent = extra
    ? `${base} ${extra} ${t(p.unit==="section"?"secciones adicionales":"páginas adicionales")} × ${money(p.extraRate)} = +${money(pagesExtraCost())}.`
    : `${base} ${t(p.unit==="section"?"Cada sección adicional cuesta":"Cada página adicional cuesta")} ${money(p.extraRate)}.`;
  const prod=$("#productsBlock"); prod.hidden=!p.products;
  if(p.products){
    $("#productsTotal").textContent=productCount();
    $("#productsHint").textContent=`${c.products} ${t("incluidos en")} ${t(tierNames[state.tier])}${productsCost()?` · +${money(productsCost())}`:""}`;
    for(const key of Object.keys(productBlocks)){
      const row=$(`.stepper[data-block="${key}"]`);
      row.querySelector("output").textContent=state[key];
      row.querySelector('[data-delta="-1"]').disabled=state[key]===0;
      row.querySelector('[data-delta="1"]').disabled=state[key]===10;
    }
  }
  $("#contentProPrice").dataset.pen=contentPrice();
}
function renderFeatures(){
  $$(".feature-card").forEach(el=>{
    const k=el.dataset.feature, f=featureInfo(k), price=el.querySelector(".option-price");
    el.querySelector("b").textContent=t(f.label);
    const description=el.querySelector("small");
    if(description) description.textContent=t(featureDescriptions[k] || "Agrega esta función para ampliar las posibilidades de tu sitio web.");
    if(price){
      price.dataset.pen=f.range?f.range[0]:(f.price||0);
      if(f.range&&f.range[1]) price.dataset.penMax=f.range[1]; else delete price.dataset.penMax;
      price.dataset.prefix=f.range&&!f.range[1]?"from":"";
      price.dataset.included=String(!!f.included);
    }
    el.classList.toggle("is-included",!!f.included);
    const select=el.querySelector(".feature-select");
    if(select){ if(f.included){select.setAttribute("aria-disabled","true");select.disabled=true;} else {select.removeAttribute("aria-disabled");select.disabled=false;} }
    el.classList.toggle("is-pending",!!f.range);
  });
  const h=hostingInfo(), hp=$("#hostingPrice");
  $("#hostingLabel").textContent=t(h.label); hp.dataset.pen=h.yearly;
}

function sync(){
  updateCurrencyUI();
  renderTiers(); renderScope(); renderFeatures();
  $$(".option-price[data-pen]").forEach(el=>{el.setAttribute('translate','no');el.textContent=priceText(el);});
  $$("#projectOptions .choice-card").forEach(el => el.classList.toggle("selected", el.dataset.key===state.project));
  $("#pagesRange").value=state.pages; $("#pagesValue").textContent=state.pages;
  $$(".toggle-card").forEach(el => el.classList.toggle("selected", el.dataset.toggle==="contentPro" ? state.contentPro : !state.contentPro));
  $$(".feature-card").forEach(el => {
    const selected=state.features.has(el.dataset.feature) || el.classList.contains("is-included");
    el.classList.toggle("selected",selected);
    el.querySelector(".feature-select")?.setAttribute("aria-pressed",String(selected));
  });
  $$(".radio-card[data-design]").forEach(el => el.classList.toggle("selected", el.dataset.design===state.design));
  $$(".radio-card[data-support]").forEach(el => el.classList.toggle("selected", el.dataset.support===state.support));
  $("#rushToggle").classList.toggle("active", state.rush); $("#rushToggle").setAttribute("aria-pressed", state.rush);
  // Mostrar el importe exacto del recargo, incluso antes de activar la entrega prioritaria.
  const rushPrice = $("#rushToggle").querySelector("strong");
  const rushDescription = $("#rushToggle").querySelector("small");
  const rushValue = money(rushAmount());
  if (rushPrice) rushPrice.textContent = `+${rushValue} · 20%`;
  if (rushDescription) rushDescription.textContent = state.rush
    ? `Entrega acelerada activada. Se añadieron ${rushValue} (20 % del valor de implementación).`
    : `¿La necesitas antes de los plazos indicados? Al activarla se añadirán ${rushValue} (20 % del valor de implementación).`;
  $("#hostingToggle").classList.toggle("active", state.hosting); $("#hostingToggle").setAttribute("aria-pressed", state.hosting);
  $("#taxToggle").classList.toggle("active", state.tax); $("#taxToggle").setAttribute("aria-pressed", state.tax);
  $("#taxToggle").querySelector("span").textContent = "";
  $$(".choice-card,.toggle-card,.radio-card:not(.tier-card)").forEach(el=>el.setAttribute("aria-pressed",String(el.classList.contains("selected"))));
  $("#sideProjectName").textContent = project().custom ? t(project().label) : `${t(project().label)} · ${t(tierNames[state.tier])}`;
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
function projectLabel(){ return project().custom ? project().label : `${project().label} · ${tierNames[state.tier]}`; }
function summaryRows(){
  const p=project(), c=tierCfg(), extra=extraUnits(), inc=t("Incluido");
  const rows=[
    [`${t(p.label)}${p.custom?"":" · "+t(tierNames[state.tier])}`, money(c.price)],
    [`${state.pages} ${unitName(state.pages)}`, extra?`+${money(pagesExtraCost())}`:inc],
  ];
  if(p.products) rows.push([`${productCount()} ${t("productos")}`, productsCost()?`+${money(productsCost())}`:inc]);
  rows.push([state.contentPro?"Contenido profesional":"Contenido entregado por el cliente", state.contentPro?money(contentCost()):"Sin recargo"]);
  rows.push(["Garantía de 30 días", "Incluida · corrección de defectos del alcance aprobado"]);
  rows.push(["Plan de soporte", t(supports[state.support].label)]);
  state.features.forEach(k=>{ const f=featureInfo(k); if(!f.range) rows.push([f.label, f.included?inc:money(f.price)]); });
  rows.push([`${t("Diseño")} · ${t(designs[state.design].label)}`, designs[state.design].price?`${money(designs[state.design].price)}${state.design === "premium" ? ` (${t("desde")})` : ""}`:inc]);
  if(state.rush) rows.push(["Entrega prioritaria", `+${money(rushCost())}`]);
  rows.push(["Entrega estimada", deliveryDays()]);
  const disc = discountInfo();
  if(disc.amount) rows.push([`Descuento · ${disc.label}`, `−${money(disc.amount)}`]);
  if(state.tax) rows.push(["IGV 18%", money(Math.round((subtotal()-disc.amount)*.18))]);
  return rows;
}
function renderSummary(){
  const total=grandTotal(), pend=pending(), rec=recurring();
  $("#totalPrice").textContent=money(total);
  $("#rangePrice").textContent=pend.items.length
    ? `${t("Por confirmar, no incluido")}: ${rangeText(pend.min,pend.max,pend.open)}`
    : t("Precio según el alcance elegido");
  $("#summaryPriceLabel").textContent=`${t("INVERSIÓN ESTIMADA")} · ${moneyCode()} · ${t(state.tax ? "CON IGV" : "SIN IGV")}`;
  const line=([a,b],cls="")=>`<div class="summary-line${cls}"><span>${t(a)}</span><strong>${t(b)}</strong></div>`;
  let html=summaryRows().map(r=>line(r)).join("");
  if(state.design === "premium"){
    html+=`<div class="summary-sub">${t("Premium Motion: el estimado incluye S/1,200. El precio final puede llegar a S/2,000 según las interacciones y el alcance aprobado.")}</div>`;
  }
  if(pend.items.length){
    html+=`<div class="summary-sub">${t("Por confirmar tras diagnóstico")}</div>`;
    html+=pend.items.map(i=>line([i.label, rangeText(withTax(i.range[0]),withTax(i.range[1]??i.range[0]),i.range[1]==null)]," is-pending")).join("");
  }
  if(rec.length){
    html+=`<div class="summary-sub">${t("Pagos recurrentes, aparte del total")}</div>`;
    html+=rec.map(r=>line([r.label,r.text]," is-recurring")).join("");
  }
  $("#summaryLines").innerHTML=html;
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
  const pend=pending(), rec=recurring();
  const selected=[...state.features].map(k=>t(featureInfo(k).label)).join(', ')||t('Ninguna adicional');
  const line=(label,value)=>`${t(label)}: ${value}`;
  return [
    'TUPLUS — '+t('COTIZACIÓN WEB'),'',
    line('Proyecto',t(project().label)),...(project().custom?[]:[line('Nivel',t(tierNames[state.tier]))]),
    line(project().unit==='section'?'Secciones':'Páginas',`${state.pages} (${tierCfg().included} ${t('incluidas')})`),
    ...(project().products?[line('Productos',`${productCount()} (${tierCfg().products} ${t('incluidos')})`)]:[]),
    line('Contenido profesional',t(state.contentPro?'Sí':'No')),line('Funciones',selected),
    line('Diseño',state.design === "premium" ? `${t(designs[state.design].label)} — ${money(1200)} incluidos; hasta ${money(2000)} según alcance` : t(designs[state.design].label)),line('Soporte',t(supports[state.support].label)),
    line('Entrega prioritaria',state.rush?`+${money(rushCost())}`:t('No')),
    line('Garantía', '30 días incluida · defectos del alcance aprobado'),
    line('Hosting y dominio básico', state.hosting ? 'Seleccionado; registro del dominio al costo del proveedor' : 'No seleccionado'),
    line('IGV',t(state.tax?'CON IGV':'SIN IGV')),line('Entrega estimada',deliveryDays()),
    ...(discountInfo().amount?[line('Descuento · '+discountInfo().label,'−'+money(discountInfo().amount))]:[]),'',
    line('Cambio de referencia',`1 USD = ${fx.rates[state.currency].rate} ${state.currency} (${fx.rates[state.currency].date})`),
    line('INVERSIÓN ESTIMADA',money(grandTotal())),
    ...(pend.items.length?[line('Por confirmar, no incluido',pend.items.map(i=>`${t(i.label)} ${rangeText(withTax(i.range[0]),withTax(i.range[1]??i.range[0]),i.range[1]==null)}`).join('; '))]:[]),
    ...rec.map(r=>line(r.label,r.text)),'',
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
      // total y total_usd siguen en USD por compatibilidad con el panel; total_pen es el importe de referencia.
      proyecto:projectLabel(),nivel:project().custom?'':state.tier,paginas:state.pages,productos:productCount(),contenido_pro:state.contentPro,moneda:state.currency,
      total_usd:Math.round(toUsd(grandTotal())*100)/100,total_pen:grandTotal(),total_mostrado:money(grandTotal()),
      pais:state.country,consentimiento:$("#consentimiento").checked,cambio:`${fx.rates[state.currency].rate} (${fx.rates[state.currency].date})`,funciones:[...state.features],diseno:designs[state.design].label,soporte:supports[state.support].label,
      prioritaria:state.rush,cloud:state.hosting,igv:state.tax,total:Math.round(toUsd(grandTotal())*100)/100,notas:`Empresa: ${$("#empresa").value.trim()} | País: ${countries.name(state.country)} (${state.country}) | ${$("#mensajeCliente").value.trim()}`,
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
const projectCards=$$("#projectOptions .choice-card");
projectCards.forEach(el=>el.addEventListener("click",()=>{
  const features=el.querySelector(".choice-features");
  const expanded=el.getAttribute("aria-expanded")==="true";
  if(!expanded){
    projectCards.forEach(other=>{
      if(other===el)return;
      other.setAttribute("aria-expanded","false");
      const otherFeatures=other.querySelector(".choice-features");
      if(otherFeatures)otherFeatures.hidden=true;
    });
  }
  el.setAttribute("aria-expanded",String(!expanded));
  features.hidden=expanded;
  setProject(el.dataset.key);save();sync();renderProgress();
}));
$("#tierOptions").addEventListener("click",e=>{const b=e.target.closest("[data-tier]");if(!b)return;setTier(b.dataset.tier);save();sync();$(`#tierOptions [data-tier="${state.tier}"]`)?.focus();});
$("#tierOptions").addEventListener("keydown",e=>{
  // Flechas para moverse entre niveles, como un grupo de radios.
  const i=TIERS.indexOf(state.tier), step={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];
  if(!step||project().custom)return; e.preventDefault();
  setTier(TIERS[(i+step+TIERS.length)%TIERS.length]);save();sync();$(`#tierOptions [data-tier="${state.tier}"]`)?.focus();
});
$("#pagesRange").addEventListener("input",e=>{state.pages=Number(e.target.value);save();sync();});
$$(".stepper[data-block]").forEach(row=>row.addEventListener("click",e=>{
  const b=e.target.closest("[data-delta]"); if(!b)return;
  const key=row.dataset.block; state[key]=clampBlocks(state[key]+Number(b.dataset.delta)); save(); sync();
}));
$$(".toggle-card").forEach(el=>el.addEventListener("click",()=>{state.contentPro=el.dataset.toggle==="contentPro";save();sync();}));
$$(".feature-select").forEach(el=>el.addEventListener("click",()=>{const k=el.dataset.feature; if(includedFeature(k))return; state.features.has(k)?state.features.delete(k):state.features.add(k); save(); sync();}));
const featureDetails=$$(".feature-grid .feature-details");
// El panel "Qué incluye" ocupa todo el ancho de su grupo, debajo de la tarjeta, para no salirse de la pantalla.
function placeFeatureMore(detail){
  const more=detail.querySelector(".feature-more"),card=detail.closest(".feature-card"),group=detail.closest(".feature-group");
  if(!more||!card||!group)return;
  if(getComputedStyle(more).position!=="absolute"){more.style.left=more.style.right=more.style.width="";return;}
  const c=card.getBoundingClientRect(),g=group.getBoundingClientRect();
  more.style.left=(g.left-c.left-1)+"px";more.style.right="auto";more.style.width=(g.width+2)+"px";
}
featureDetails.forEach(detail=>detail.addEventListener("toggle",()=>{
  if(!detail.open)return;
  featureDetails.forEach(other=>{if(other!==detail&&other.open)other.open=false;});
  placeFeatureMore(detail);
  requestAnimationFrame(()=>{placeFeatureMore(detail);setTimeout(()=>{if(detail.open)placeFeatureMore(detail);},480);});
}));
window.addEventListener("resize",()=>featureDetails.forEach(d=>{if(d.open)placeFeatureMore(d);}));
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

    const total = amountIn(grandTotal()); // en la moneda elegida
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

  const total = amountIn(grandTotal()); // en la moneda elegida
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
function payAmountUsd(){return `${Math.round(toUsd(grandTotal())).toLocaleString('en-US')} USD`;}
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
