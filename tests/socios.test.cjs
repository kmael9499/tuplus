const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const { parseHTML } = require('linkedom');
const { document } = parseHTML(fs.readFileSync('dist/socios-comerciales.html', 'utf8'));
const context = vm.createContext({ window: {} });
context.window.window = context.window;
vm.runInContext('var window = this.window;' + fs.readFileSync('public/js/i18n-data.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('public/js/socios-translations.js', 'utf8'), context);
const dictionaries = context.window.TUPLUS_TRANSLATIONS;
const locales = ['en', 'zh', 'ru', 'pt', 'fr', 'ja', 'de'];
const normalize = (text) => text.trim().replace(/\s+/g, ' ');
const sources = new Set();
const walker = document.createTreeWalker(document.body, 4);
let node;
while ((node = walker.nextNode())) {
  if (node.parentElement?.closest('script,style,svg,noscript,[translate="no"],[data-country-code]')) continue;
  const text = normalize(node.nodeValue || '');
  if (/\p{L}{3}/u.test(text) && !/^(TUPLUS|PARTNERS|\+ TUPLUS)$/.test(text)) sources.add(text);
}
for (const element of document.querySelectorAll('[placeholder],[aria-label]')) {
  for (const name of ['placeholder', 'aria-label']) {
    const text = element.getAttribute(name);
    if (text && !element.closest('[translate="no"]') && text !== 'WhatsApp') sources.add(normalize(text));
  }
}
let checks = 0;
const missing = [];
for (const locale of locales) for (const text of sources) {
  checks++;
  if (!dictionaries[locale]?.[text]) missing.push(locale + ': ' + text);
}
assert.deepEqual(missing, [], 'Textos sin traducir');
// El formulario debe seguir enviando al equipo los valores en español.
for (const select of ['tipo', 'soluciones']) {
  for (const option of document.querySelectorAll(`[name="${select}"] option`)) assert.ok(option.hasAttribute('value'), select);
}
assert.ok(document.getElementById('site-language'));
console.log(`OK: Socios — ${sources.size} textos en ${locales.length} idiomas (${checks} comprobaciones).`);
