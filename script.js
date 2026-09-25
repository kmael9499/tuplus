'use strict';

(() => {
  const config = window.TUPLUS_CONFIG;
  const t = value => window.TUPLUS_I18N?.t(value) || value;
  const quote = window.TuplusQuote;
  const money = value => new Intl.NumberFormat(config.locale, {style: 'currency', currency: config.currency}).format(value);
  const serviceNames = {web: 'Diseño web', commerce: 'Tiendas virtuales', automation: 'Automatización', systems: 'Sistemas a medida', 'data-security': 'Datos y seguridad'};
  // Eventos locales sin datos del visitante. Conectar un proveedor solo tras su aprobación.
  const track = (name, detail = {}) => window.dispatchEvent(new CustomEvent('tuplus:event', {detail: {name, ...detail}}));
  track('page_view', {page: location.pathname.split('/').pop() || 'index.html'});

  const nav = document.getElementById('main-nav');
  const menuButton = document.querySelector('.menu-toggle');
  const overlay = document.querySelector('.menu-overlay');
  const mobile = matchMedia('(max-width: 850px)');
  function setMenu(open, restoreFocus = false) {
    const isOpen = open && mobile.matches;
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? t('Cerrar menú') : t('Abrir menú'));
    nav.classList.toggle('open', isOpen);
    overlay.hidden = !isOpen;
    document.body.classList.toggle('menu-open', isOpen);
    if (restoreFocus) menuButton.focus();
  }
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  overlay.addEventListener('click', () => setMenu(false, true));
  mobile.addEventListener('change', () => setMenu(false));
  document.addEventListener('keydown', event => {
    if (menuButton.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') setMenu(false, true);
    if (event.key === 'Tab') {
      const focusables = [menuButton, ...nav.querySelectorAll('a')];
      const first = focusables[0], last = focusables.at(-1);
      if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last.focus();}
      else if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first.focus();}
    }
  });
  nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    const wasOpen = menuButton.getAttribute('aria-expanded') === 'true';
    setMenu(false);
    if (wasOpen && link.getAttribute('href').startsWith('#')) {
      const target = document.getElementById(link.hash.slice(1));
      if (target) {target.setAttribute('tabindex', '-1'); target.focus({preventScroll: true});}
    }
  }));
  const localLinks = [...nav.querySelectorAll('a[href^="#"]')];
  const sections = [...document.querySelectorAll('main>section[id]')];
  let scheduled = false;
  function updateNavigation() {
    let current = sections[0]?.id;
    sections.forEach(section => {if (section.getBoundingClientRect().top <= 155) current = section.id;});
    localLinks.forEach(link => {
      if (link.hash === '#' + current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const floatingContact = document.querySelector('.whatsapp-float');
    if (floatingContact) floatingContact.hidden = current === 'cotizador' || current === 'contacto';
    scheduled = false;
  }
  addEventListener('scroll', () => {if (!scheduled) {scheduled = true; requestAnimationFrame(updateNavigation);}}, {passive: true});
  updateNavigation();
  document.addEventListener('tuplus:language-change', () => {
    setMenu(false);
    if (totalOutput) renderQuote();
  });
  document.querySelectorAll('[data-whatsapp]').forEach(link => {
    link.href = quote.whatsappUrl(config.whatsapp, 'Hola, vengo desde la web de TUPLUS. Quisiera orientación para mi proyecto.');
    link.addEventListener('click', () => track('contact_open', {channel: 'whatsapp'}));
  });
  document.querySelectorAll('a[href$="cotizador.html"]').forEach(link => link.addEventListener('click', () => track('quote_cta')));

  // Portafolio: ahora se muestra con el carrusel de carrusel.js (independiente).
  const interest = new URLSearchParams(location.search).get('interes');
  if (Object.hasOwn(serviceNames, interest || '') && document.getElementById('contact-service')) document.getElementById('contact-service').value = serviceNames[interest];

  // Cotizador: las mismas reglas alimentan el resumen, la descarga y el mensaje.
  const totalOutput = document.getElementById('quote-total');
  let selection = {type: 'corporativa', plan: 'empresarial', extras: 0};
  let currentStep = 1;
  const getTotals = () => quote.calculate(config, selection.type, selection.plan, selection.extras);
  const estimateText = () => {
    const totals = getTotals();
    return ['ESTIMACIÓN WEB · TUPLUS', `Tipo: ${config.types[selection.type].name}`, `Plan: ${config.plans[selection.plan].name}`, `Base del plan: ${money(totals.base)}`, `Ajuste por tipo de web: ${money(totals.adjustment)}`, `Páginas adicionales: ${selection.extras} × ${money(config.pricePerPage)} = ${money(totals.additional)}`, `TOTAL ESTIMADO: ${money(totals.total)} (PEN)`, '', 'Importe orientativo sujeto a validación comercial. Impuestos, dominio, alojamiento web, integraciones y plazos se confirman en la propuesta.'].join('\n');
  };
  function invalidateResults() {
    document.querySelectorAll('.form-result').forEach(result => {result.hidden = true; result.querySelector('a').removeAttribute('href');});
  }
  function renderQuote() {
    const totals = getTotals();
    totalOutput.textContent = money(totals.total);
    document.getElementById('summary-plan').textContent = t('Plan') + ' ' + t(config.plans[selection.plan].name);
    document.getElementById('summary-type').textContent = config.types[selection.type].name;
    document.getElementById('summary-pages').textContent = selection.extras ? `${selection.extras} ${t('páginas adicionales')}` : t('Sin páginas adicionales');
    document.getElementById('summary-base').textContent = money(totals.base);
    document.getElementById('summary-adjustment').textContent = money(totals.adjustment);
    document.getElementById('summary-extras').textContent = money(totals.additional);
    document.getElementById('scope-note').textContent = selection.type === 'landing' ? t('Una página de campaña se plantea como una página. Si añades páginas, revisaremos contigo el alcance adicional.') : t('El número de páginas y bloques se confirma en la propuesta.');
    document.getElementById('download-status').textContent = '';
    invalidateResults();
  }
  function goToStep(step) {
    if (step < 1 || step > 3) return;
    currentStep = step;
    document.querySelectorAll('.quote-panel').forEach((panel, index) => {panel.hidden = index + 1 !== step;});
    document.querySelectorAll('[data-step]').forEach(button => {
      if (Number(button.dataset.step) === step) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    const heading = document.querySelector(`#quote-step-${step} h3`);
    heading.focus({preventScroll: true});
    // Mantiene el título bajo el encabezado fijo al navegar desde el final del paso.
    if (heading.getBoundingClientRect().top < 95 || heading.getBoundingClientRect().top > innerHeight - 160) heading.scrollIntoView({block: 'center', behavior: 'instant'});
    track('quote_step', {step: currentStep});
  }
  if (totalOutput) {
    document.querySelectorAll('[name="quote-type"]').forEach(input => {
      const item = config.types[input.value];
      const card = input.closest('.option-card');
      card.querySelector('b').textContent = item.name;
      card.querySelector('.choice-price').textContent = item.price === 0 ? 'Base del plan' : (item.price > 0 ? '+ ' : '− ') + money(Math.abs(item.price));
    });
    document.querySelectorAll('[name="quote-plan"]').forEach(input => {
      const item = config.plans[input.value];
      const card = input.closest('.plan-option');
      card.querySelector('b').textContent = item.name;
      card.querySelector('strong').textContent = money(item.price);
    });
    document.querySelector('.extras-block p').textContent = `${money(config.pricePerPage)} por página · Hasta ${config.maxExtraPages} adicionales`;
    document.querySelectorAll('[data-next], [data-step]').forEach(button => button.addEventListener('click', () => goToStep(Number(button.dataset.next || button.dataset.step))));
    document.querySelectorAll('[name="quote-type"]').forEach(input => input.addEventListener('change', () => {selection.type = input.value; renderQuote();}));
    document.querySelectorAll('[name="quote-plan"]').forEach(input => input.addEventListener('change', () => {selection.plan = input.value; renderQuote();}));
    document.getElementById('extra-pages').addEventListener('change', event => {selection.extras = Number(event.target.value); renderQuote();});
    document.getElementById('download-quote').addEventListener('click', () => {
      const blob = new Blob(['\ufeff' + estimateText()], {type: 'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = 'TUPLUS-estimacion-web.txt';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      document.getElementById('download-status').textContent = t('Descarga preparada con tu selección actual.');
      track('quote_download', {type: selection.type, plan: selection.plan});
    });
    renderQuote();
  }

  // Las consultas permanecen en memoria. No hay llamadas a servidores ni envíos automáticos.
  ['quote-form', 'contact-form'].forEach(id => {
    const form = document.getElementById(id);
    if (!form) return;
    const contact = form.elements.contact;
    contact.addEventListener('input', () => contact.setCustomValidity(''));
    form.addEventListener('input', () => {
      form.querySelector('.form-error').hidden = true;
      const result = form.querySelector('.form-result');
      result.hidden = true; result.querySelector('a').removeAttribute('href');
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const error = form.querySelector('.form-error');
      const values = Object.fromEntries(new FormData(form).entries());
      for (const [key, value] of Object.entries(values)) if (typeof value === 'string') values[key] = value.trim();
      const requiredNames = id === 'contact-form' ? ['name', 'company', 'contact', 'country', 'message'] : ['name', 'company', 'contact', 'country'];
      const missing = requiredNames.find(key => !values[key]);
      if (missing) {
        error.textContent = t('Completa los campos con información válida; los espacios en blanco no son suficientes.');
        error.hidden = false; form.elements[missing].focus(); return;
      }
      if (!quote.validContact(values.contact)) {
        contact.setCustomValidity('Escribe un correo válido o un teléfono de 7 a 15 dígitos con código de país.');
        contact.reportValidity(); return;
      }
      if (!form.reportValidity()) return;
      const source = id === 'quote-form' ? 'Web TUPLUS / Cotizador' : 'Web TUPLUS / Contacto';
      const message = [`Hola, soy ${values.name}.`, `Empresa o actividad: ${values.company}`, `Contacto: ${values.contact}`, `País: ${values.country}`, `Preferencia de contacto: ${values.preference}`, '', id === 'quote-form' ? estimateText() : `Solución de interés: ${values.service}`, values.message ? `\nMi proyecto: ${values.message}` : '', `\nOrigen: ${source}`, 'Consentimiento: autorizo el uso de estos datos para atender esta consulta.'].filter(Boolean).join('\n');
      try {
        const result = form.querySelector('.form-result');
        result.querySelector('a').href = quote.whatsappUrl(config.whatsapp, message);
        error.hidden = true; result.hidden = false;
        result.querySelector('a').focus({preventScroll: true});
        result.scrollIntoView({block: 'nearest', behavior: 'instant'});
        track('lead_prepared', {source: id === 'quote-form' ? 'quote' : 'contact'});
      } catch {
        error.textContent = t('No pudimos preparar el enlace. Intenta de nuevo o usa el contacto directo.');
        error.hidden = false;
      }
    });
    form.querySelector('.result-link').addEventListener('click', () => track('lead_open_whatsapp', {source: id === 'quote-form' ? 'quote' : 'contact'}));
  });
})();
