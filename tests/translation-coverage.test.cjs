const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {parseHTML} = require('linkedom');
const base = path.resolve(__dirname, '../dist');
const locales = ['en', 'zh', 'ru', 'pt', 'fr', 'ja', 'de'];
const normalize = value => value.trim().replace(/\s+/g, ' ');
// Marcas, siglas, ejemplos de datos y símbolos que no son texto editorial.
const invariant = /^(?:TUPLUS(?: \/ WEB)?|TuPlus|\+ TUPLUS|TP|CL|TN|SSL|✓ SSL|✓ WhatsApp|WhatsApp|VISA|forma®|Hash \/ TXID|tumarca\.com|cliente@correo\.com|[A-Zh]|[+]?S\/[\d,]+(?: — S\/[\d,]+)?|María López · 987 654 321)$/;
let checks = 0;
const failures = [];
for (const file of fs.readdirSync(base, {recursive: true}).filter(file => file.endsWith('.html'))) {
  const {window, document} = parseHTML(fs.readFileSync(path.join(base, file), 'utf8'));
  if (!document.getElementById('site-language')) continue;
  Object.defineProperty(document.getElementById('site-language'), 'value', {value: 'es', writable: true});
  const scripts = [...document.querySelectorAll('script[src]')];
  const shared = scripts.find(node => node.getAttribute('src').includes('/site-translations.js'));
  const engine = scripts.find(node => /\/i18n\.js\?/.test(node.getAttribute('src')));
  assert.ok(shared && engine && scripts.indexOf(shared) < scripts.indexOf(engine), `${file}: orden de traducciones`);
  assert.equal(shared.hasAttribute('defer'), engine.hasAttribute('defer'), `${file}: orden de ejecución`);
  const context = vm.createContext({window, document, Node: window.Node, NodeFilter: {SHOW_TEXT: 4}, MutationObserver: window.MutationObserver, CustomEvent: window.CustomEvent, localStorage: {getItem() {}, setItem() {}}, matchMedia: () => ({matches: true}), Intl});
  for (const element of document.querySelectorAll('script[src]')) {
    const src = element.getAttribute('src').split('?')[0];
    if (/(?:translations|i18n-data|partner-territory)\.js$/.test(src)) {
      vm.runInContext(fs.readFileSync(path.resolve(base, path.dirname(file), src), 'utf8'), context);
    }
  }
  let extras = {};
  if (file === 'cotizador.html') {
    const source = fs.readFileSync(path.join(base, 'js/cotizador-extras.js'), 'utf8');
    const split = source.indexOf('  let reChips');
    const laterRows = source.slice(split).match(/^  K\([\s\S]*?^  \);/gm) || [];
    vm.runInContext(source.slice(0, split) + laterRows.join('\n') + '\nwindow.__extraTranslations = D; window.__applyExtras = applyI18n;})();', context);
    extras = window.__extraTranslations;
    for (const element of document.querySelectorAll('[data-xd]')) for (const locale of locales) {
      assert.ok(extras[element.dataset.xd]?.[locale], `${file}: ${element.dataset.xd} / ${locale}`); checks++;
    }
  }
  const sources = new Set();
  const excluded = 'script, style, svg, noscript, [data-i18n], [data-i18n-html], [data-xd], [translate="no"], [data-i18n-static]';
  function add(text) {
    text = normalize(text);
    if (!/\p{L}/u.test(text) || invariant.test(text)) return;
    sources.add(text);
  }
  function walk(node) {
    if (node.nodeType === 3) { if (!node.parentElement.closest(excluded)) add(node.textContent); }
    else for (const child of node.childNodes) walk(child);
  }
  walk(document.documentElement);
  for (const node of document.querySelectorAll('[data-i18n], [data-i18n-html]')) add(node.getAttribute('data-i18n') || node.getAttribute('data-i18n-html'));
  for (const node of document.querySelectorAll('[aria-label], [placeholder], [alt], [title]')) {
    if (node.closest('[translate="no"], [data-i18n-static]')) continue;
    for (const attr of ['aria-label', 'placeholder', 'alt', 'title']) if (node.hasAttribute(attr)) add(node.getAttribute(attr));
  }
  // No permitir que translate=no vuelva a bloquear navegación o formularios enteros.
  for (const node of document.querySelectorAll('[translate="no"]')) {
    if (node.matches('section, form') || /Acceso Partners|RED PARTNER|Redes TUPLUS/.test(node.textContent)) failures.push(`${file}: texto bloqueado: ${normalize(node.textContent).slice(0, 80)}`);
  }
  vm.runInContext(fs.readFileSync(path.join(base, 'js/i18n.js'), 'utf8'), context);
  const dictionaries = window.TUPLUS_TRANSLATIONS;
  for (const locale of [...locales, 'es', 'zh', 'es']) {
    window.TUPLUS_I18N.setLocale(locale);
    window.__applyExtras?.();
    if (locale === 'es') {
      const access = document.querySelector('a[href="https://tuplus-partners-portal.vercel.app/acceso"]');
      if (access) { assert.equal(access.textContent.trim(), 'Acceso Partners'); checks++; }
      continue;
    }
    for (const source of sources) {
      const key = normalize(source);
      const value = window.TUPLUS_I18N.t(source);
      const hasEntry = Object.hasOwn(dictionaries[locale] || {}, key);
      const hasExtra = Object.values(extras).some(row => normalize(row.es) === key && row[locale]);
      if (!hasEntry && !hasExtra && value === source) failures.push(`${file} / ${locale}: ${source}`);
      checks++;
    }
    const access = document.querySelector('a[href="https://tuplus-partners-portal.vercel.app/acceso"]');
    if (access) { assert.equal(access.textContent.trim(), dictionaries[locale]['Acceso Partners']); checks++; }
    if (file === 'partner.html') {
      assert.equal(document.querySelector('.pp-hero .pp-eyebrow').textContent.trim(), dictionaries[locale]['TUPLUS / RED PARTNER']); checks++;
    }
    if (file === 'socios-comerciales.html') {
      assert.equal(document.querySelector('#sc-form h3').textContent.trim(), dictionaries[locale]['Conozcamos tu perfil']); checks++;
    }
  }
}
assert.equal(failures.length, 0, [...new Set(failures)].join('\n'));
console.log(`OK: ${checks} comprobaciones de cobertura en todas las páginas con selector y los siete idiomas adicionales.`);
