(() => {
  'use strict';
  const form = document.querySelector('#sc-form');
  if (!form) return;
  const base = 'https://tuplus-partners-api-production.up.railway.app/api';
  const field = name => form.querySelector(`[name="${name}"]`);
  const select = field('territorio_id');
  const submit = form.querySelector('[type="submit"]');
  const retry = document.querySelector('#sc-retry');
  const status = document.querySelector('#sc-territorios-status');
  const error = document.querySelector('#sc-error');
  const result = document.querySelector('#sc-msg');
  const unavailable = 'No se pudo conectar con la API. Intenta de nuevo en unos minutos.';
  let sending = false;
  let openIds = new Set();
  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(base + path, { ...options, signal: controller.signal });
      const data = await response.json().catch(() => ({}));
      return { response, data };
    } finally {
      clearTimeout(timeout);
    }
  }
  function option(value, label) {
    const node = document.createElement('option');
    node.value = String(value);
    node.textContent = label;
    return node;
  }
  async function loadTerritories() {
    select.disabled = submit.disabled = true;
    retry.hidden = true;
    status.textContent = 'Cargando territorios…';
    openIds = new Set();
    try {
      const { response, data } = await request('/territorios');
      if (!response.ok) throw new Error('territorios');
      const list = Array.isArray(data) ? data : data.territorios ?? data.data;
      if (!Array.isArray(list)) throw new Error('formato');
      const open = list.filter(item => item.estado === 'abierta' && item.id != null);
      openIds = new Set(open.map(item => String(item.id)));
      select.replaceChildren(option('', open.length ? 'Selecciona un territorio' : 'Sin convocatorias abiertas'));
      open.forEach(item => select.append(option(item.id, item.nombre)));
      select.disabled = submit.disabled = !open.length;
      status.textContent = open.length ? '' : 'No hay territorios con convocatoria abierta en este momento.';
      retry.hidden = !!open.length;
    } catch {
      select.replaceChildren(option('', 'Territorios no disponibles'));
      status.textContent = unavailable;
      retry.hidden = false;
    }
  }
  function messages(value) {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(messages).filter(Boolean).join('\n');
    if (value && typeof value === 'object') return Object.entries(value).map(([key, detail]) => `${key}: ${messages(detail)}`).join('\n');
    return '';
  }
  retry.addEventListener('click', loadTerritories);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !form.reportValidity() || !openIds.has(select.value)) return;
    sending = true;
    submit.disabled = true;
    submit.textContent = 'Enviando…';
    error.hidden = result.hidden = true;
    form.setAttribute('aria-busy', 'true');
    const payload = Object.fromEntries(['nombre', 'correo', 'telefono', 'territorio_id', 'mensaje'].map(name => [name, field(name).value.trim()]));
    try {
      const { response, data } = await request('/postulaciones', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      if (response.status === 200 || response.status === 201) {
        result.textContent = 'Tu postulación fue recibida. Esto no garantiza el ingreso a la Red de Socios Comerciales ni te autoriza todavía a representar a TUPLUS. Nos pondremos en contacto contigo.';
        result.hidden = false;
        form.reset();
      } else {
        error.textContent = [400, 422].includes(response.status)
          ? [messages(data.error), messages(data.errores)].filter(Boolean).join('\n') || 'Revisa los datos de tu postulación e intenta nuevamente.'
          : unavailable;
        error.hidden = false;
      }
    } catch {
      error.textContent = unavailable;
      error.hidden = false;
    } finally {
      sending = false;
      submit.disabled = !openIds.size;
      submit.textContent = 'Enviar postulación';
      form.removeAttribute('aria-busy');
    }
  });
  loadTerritories();
})();
