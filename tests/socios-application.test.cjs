const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { parseHTML } = require('linkedom');
const tick = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  const { document, window } = parseHTML(fs.readFileSync('dist/socios-comerciales.html', 'utf8'));
  const form = document.querySelector('#sc-form');
  const field = name => form.querySelector(`[name="${name}"]`);
  for (const el of form.querySelectorAll('[name]')) Object.defineProperty(el, 'value', { value: '', writable: true });
  form.reportValidity = () => true;
  form.reset = () => {};
  const requests = [];
  let reply = { status: 200, data: [{ id: 1, nombre: 'Lima', estado: 'abierta' }, { id: 2, nombre: 'Cusco', estado: 'cerrada' }] };
  let fail = false;
  const context = vm.createContext({ document, AbortController, setTimeout, clearTimeout,
    fetch: async (url, options) => {
      requests.push({ url, options });
      if (fail) throw new TypeError('offline');
      return { status: reply.status, ok: reply.status < 300, json: async () => reply.data };
    }
  });
  vm.runInContext(fs.readFileSync('public/js/socios-application.js', 'utf8'), context);
  await tick();
  assert.match(requests[0].url, /\/api\/territorios$/);
  assert.match(field('territorio_id').textContent, /Lima/);
  assert.doesNotMatch(field('territorio_id').textContent, /Cusco/);
  for (const [name, value] of Object.entries({ nombre: 'Prueba', correo: 'test@example.com', telefono: '999999999', territorio_id: '1', mensaje: '' })) field(name).value = value;
  const send = () => form.dispatchEvent(new window.Event('submit', { cancelable: true }));
  reply = { status: 201, data: {} };
  send(); send();
  assert.equal(form.querySelector('[type="submit"]').disabled, true);
  await tick();
  assert.equal(requests.length, 2);
  assert.match(requests[1].url, /\/api\/postulaciones$/);
  assert.deepEqual(Object.keys(JSON.parse(requests[1].options.body)), ['nombre', 'correo', 'telefono', 'territorio_id', 'mensaje']);
  assert.equal(document.querySelector('#sc-msg').hidden, false);
  assert.match(document.querySelector('#sc-msg').textContent, /no garantiza.*ni te autoriza/);
  for (const status of [400, 422]) {
    reply = { status, data: { errores: { correo: ['Correo inválido'] }, error: 'Revisa tus datos' } };
    send(); await tick();
    assert.match(document.querySelector('#sc-error').textContent, /Correo inválido/);
    assert.match(document.querySelector('#sc-error').textContent, /Revisa tus datos/);
    assert.equal(document.querySelector('#sc-msg').hidden, true);
  }
  fail = true; send(); await tick();
  assert.match(document.querySelector('#sc-error').textContent, /Intenta de nuevo en unos minutos/);
  assert.equal(form.querySelector('[type="submit"]').disabled, false);
  document.querySelector('#sc-retry').click(); await tick();
  assert.equal(field('territorio_id').disabled, true);
  assert.equal(document.querySelector('#sc-retry').hidden, false);
  fail = false; reply = { status: 200, data: [] };
  document.querySelector('#sc-retry').click(); await tick();
  assert.match(document.querySelector('#sc-territorios-status').textContent, /No hay territorios/);
  assert.equal(form.querySelector('[type="submit"]').disabled, true);
  console.log('OK: territorios abiertos, JSON, envío único, confirmación, 400/422, red y convocatoria vacía.');
})().catch(error => { console.error(error); process.exitCode = 1; });
