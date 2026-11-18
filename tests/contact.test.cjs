const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {parseHTML} = require('linkedom');
const base = path.resolve(__dirname, '..', 'dist');
const {window, document} = parseHTML(fs.readFileSync(path.join(base, 'index.html'), 'utf8'));
const form = document.getElementById('contact-form');
const fields = Object.fromEntries([...form.querySelectorAll('[name]')].map(field => [field.name, field]));
Object.defineProperty(form, 'elements', {value: fields});
for (const field of Object.values(fields)) {
  field.setCustomValidity = message => { field.validationMessage = message; };
  field.reportValidity = () => !field.validationMessage;
  if (field.tagName === 'SELECT') {
    let selected = field.options[0].value;
    Object.defineProperty(field, 'value', {get: () => selected, set: value => {selected = value;}});
    Object.defineProperty(field, 'selectedOptions', {get: () => [...field.options].filter(option => option.value === selected)});
  }
}
form.reportValidity = () => Object.values(fields).every(field => !field.validationMessage && (field.type !== 'checkbox' || field.checked));
document.querySelectorAll('main>section[id]').forEach(section => {section.getBoundingClientRect = () => ({top: 1000});});
form.querySelector('.form-result').scrollIntoView = () => {};
const context = vm.createContext({
  window, document, Intl, URLSearchParams, location: {pathname: '/index.html', search: ''},
  CustomEvent: window.CustomEvent, matchMedia: () => ({matches: false, addEventListener() {}}),
  addEventListener() {}, requestAnimationFrame() {},
  FormData: class {entries() {return Object.entries(fields).map(([name, field]) => [name, field.value]);}}
});
for (const file of ['config', 'quote-core', 'i18n-data', 'contact-translations', 'script']) {
  vm.runInContext(fs.readFileSync(path.join(base, 'js', file + '.js'), 'utf8'), context);
}
const api = window.TuplusQuote;
for (const value of ['.nombre@example.com', 'nombre.@example.com', 'a..b@example.com', 'a@-example.com', 'a@example..com', 'a@exam_ple.com']) assert.equal(api.validContact(value), false, value);
for (const value of ['nombre.apellido+web@example.com', "o'connor@example.co.uk", '+51 999 123 456']) assert.equal(api.validContact(value), true, value);
for (const value of ['José Pérez', "Anne O’Connor", '李小明', '山田 太郎']) assert.equal(api.validName(value), true, value);
for (const value of ['a1$MHF5452672', '123', '  ', 'A\nB']) assert.equal(api.validName(value), false, value);
for (const value of ['3M Perú S.A.C.', 'Diseño & Tecnología', 'Estudio (Web)']) assert.equal(api.validCompany(value), true, value);
assert.equal(api.validCompany('a$2=1C:VBSA64'), false);
for (const value of ['#', 'a'.repeat(19), 'a'.repeat(1001)]) assert.equal(api.validMessage(value), false);
for (const value of ['a'.repeat(20), 'a'.repeat(1000), 'Necesito una tienda.\nCon catálogo, pagos y envíos.']) assert.equal(api.validMessage(value), true);
assert.equal(fields.country.options.length, 250);
assert.equal(new Set([...fields.country.options].map(option => option.value)).size, 250);
const submit = () => form.dispatchEvent(new window.Event('submit', {cancelable: true}));
const result = form.querySelector('.form-result');
Object.entries({name: 'José Pérez', company: 'Diseño & Tecnología', contact: 'jose@example.com', country: 'PE', message: 'Necesito una tienda con catálogo y pagos.'}).forEach(([name, value]) => {fields[name].value = value;});
fields.consent.checked = true;
for (const [name, value] of [['country', 'Angangeo'], ['name', 'a1$MHF5452672'], ['contact', '.jose@example.com'], ['message', '#']]) {
  const valid = fields[name].value;
  fields[name].value = value;
  submit();
  assert.ok(fields[name].validationMessage, name);
  assert.equal(result.hidden, true);
  fields[name].value = valid;
}
fields.consent.checked = false;
submit(); assert.equal(result.hidden, true);
fields.consent.checked = true;
submit(); assert.equal(result.hidden, false);
const text = new URL(result.querySelector('a').getAttribute('href')).searchParams.get('text');
assert.ok(text.includes('País: Perú') && text.includes('Diseño & Tecnología'), text);
fields.message.value = '#';
form.dispatchEvent(new window.Event('input'));
assert.equal(result.hidden, true);
assert.equal(result.querySelector('a').hasAttribute('href'), false);
for (const locale of ['en', 'zh', 'ru', 'pt', 'fr', 'ja', 'de']) {
  window.TUPLUS_I18N = {locale, t: source => window.TUPLUS_TRANSLATIONS[locale][source] || source};
  document.dispatchEvent(new window.CustomEvent('tuplus:language-change'));
  assert.equal(fields.country.value, 'PE');
  assert.equal(fields.country.selectedOptions[0].textContent, new Intl.DisplayNames([locale], {type: 'region'}).of('PE'));
  assert.notEqual(fields.message.validationMessage, 'Describe tu proyecto en 20 a 1000 caracteres.');
}
console.log('OK: contacto — validación, países, consentimiento, WhatsApp y avisos en 7 idiomas.');
