const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname, '..');

function element() {
  const attributes = new Map();
  const classes = new Set();
  const listeners = new Map();
  return {
    hidden: false,
    setAttribute: (key, value) => attributes.set(key, value),
    getAttribute: key => attributes.get(key),
    removeAttribute: key => attributes.delete(key),
    classList: {toggle(key, enabled) {if (enabled) classes.add(key); else classes.delete(key);}},
    addEventListener: (name, callback) => listeners.set(name, callback),
    dispatch: (name, event = {}) => listeners.get(name)?.(event),
    querySelectorAll: () => [],
    focus() {this.focused = true;}
  };
}

const menu = element(), nav = element(), overlay = element(), whatsapp = element();
menu.setAttribute('aria-expanded', 'false');
const document = {
  body: element(),
  // These pages have the shared navigation, but no embedded quote controls.
  getElementById: id => id === 'main-nav' ? nav : null,
  querySelector: selector => ({'.menu-toggle': menu, '.menu-overlay': overlay, '.whatsapp-float': whatsapp}[selector] || null),
  querySelectorAll: selector => selector === '[data-whatsapp]' ? [whatsapp] : [],
  addEventListener: (name, callback) => document[name] = callback
};
const context = vm.createContext({
  window: {dispatchEvent() {}}, document, Intl, URLSearchParams,
  location: {pathname: '/index.html', search: ''},
  CustomEvent: class {constructor(name, options) {this.type = name; this.detail = options.detail;}},
  matchMedia: () => ({matches: true, addEventListener() {}}),
  addEventListener() {}, requestAnimationFrame: callback => callback()
});
for (const file of ['config.js', 'quote-core.js', 'script.js']) {
  assert.doesNotThrow(() => vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8'), context, {filename: file}));
}
menu.dispatch('click');
assert.equal(menu.getAttribute('aria-expanded'), 'true');
assert.equal(overlay.hidden, false);
document.keydown({key: 'Escape'});
assert.equal(menu.getAttribute('aria-expanded'), 'false');
assert.equal(overlay.hidden, true);
assert.equal(menu.focused, true);
assert.equal(new URL(whatsapp.href).pathname, '/51916828870');
assert.match(new URL(whatsapp.href).searchParams.get('text'), /TUPLUS/);

const pages = ['index.html', 'privacidad.html', '404.html', ...fs.readdirSync(path.join(base, 'soluciones')).filter(file => file.endsWith('.html')).map(file => 'soluciones/' + file)];
for (const file of pages) {
  const html = fs.readFileSync(path.join(base, file), 'utf8');
  assert.match(html, /id="main-nav"/, file);
  assert.match(html, /class="menu-toggle"/, file);
  assert.match(html, /class="menu-overlay"/, file);
  assert.match(html, /script\.js\?v=20261002-1/, file);
  assert.doesNotMatch(html, /id="pagesRange"/, file);
}
const quotePage = fs.readFileSync(path.join(base, 'cotizador.html'), 'utf8');
assert.match(quotePage, /cotizador\.js\?v=/);
assert.doesNotMatch(quotePage, /src="(?:\.\/)?script\.js/);
console.log('OK: inicio sin campos del cotizador, menú móvil, Escape, WhatsApp y scripts de las 9 páginas.');
