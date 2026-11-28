// Comprueba que los textos que los scripts del cotizador muestran con t(), tr() o toast() tengan traducción
// en los 7 idiomas. Si alguien agrega un texto nuevo sin traducir, este test falla y lo nombra.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const js = path.join(__dirname, '..', 'public', 'js');
const window = {};
const context = vm.createContext({ window, document: { documentElement: {}, addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; } } });
for (const file of ['i18n-data.js', 'quote-translations.js', 'quote-tiers-translations.js', 'quote-privacy-translations.js', 'site-translations.js']) {
  vm.runInContext(fs.readFileSync(path.join(js, file), 'utf8'), context);
}
const normalize = value => String(value).trim().replace(/\s+/g, ' ');
const dictionaries = Object.fromEntries(Object.entries(window.TUPLUS_TRANSLATIONS).map(([locale, dict]) => [locale, new Map(Object.entries(dict).map(([k, v]) => [normalize(k), v]))]));
const locales = ['en', 'zh', 'ru', 'pt', 'fr', 'ja', 'de'];

const keys = new Set();
const collect = (file, patterns) => {
  const source = fs.readFileSync(path.join(js, file), 'utf8');
  for (const pattern of patterns) for (const match of source.matchAll(pattern)) keys.add(normalize(match[1]));
  return source;
};
const quoted = name => [new RegExp(`\\b${name}\\(\\s*"([^"]{3,})"\\s*[),]`, 'g'), new RegExp(`\\b${name}\\(\\s*'([^']{3,})'\\s*[),]`, 'g')];
const cotizador = collect('cotizador.js', [...quoted('t'), ...quoted('toast')]);
collect('cotizador-cupon.js', [...quoted('tr'), ...quoted('fail\\(f,')]);
// Etiquetas y descripciones que cotizador.js pasa a t() desde sus tablas
const table = name => cotizador.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\};`))[1];
for (const m of table('featureDescriptions').matchAll(/^\s*\w+:"((?:[^"\\]|\\.)*)"/gm)) keys.add(normalize(m[1]));
for (const m of cotizador.matchAll(/label:"([^"]+)"/g)) keys.add(normalize(m[1]));

// Textos que no se traducen a propósito: nombres propios, códigos o formatos.
const skip = /^(TUPLUS|WhatsApp|Premium motion|Performance\+|Hardening|Custom UI|Blog \/ CMS|IGV 18%|PEN|USD)$|^\{|\$\{/;
let checks = 0;
const missing = [];
for (const key of keys) {
  if (skip.test(key) || !/\p{L}{3}/u.test(key)) continue;
  for (const locale of locales) {
    checks++;
    if (!dictionaries[locale]?.has(key)) missing.push(`${locale}: ${key.slice(0, 90)}`);
  }
}
assert.deepEqual(missing, [], 'Textos sin traducir en los scripts del cotizador');
// Ninguna "traducción" puede ser el mismo texto en español cuando lleva signos propios del español.
for (const locale of locales) for (const [key, value] of dictionaries[locale]) {
  if (/[¿¡ñ]/.test(key) && key === normalize(value) && locale !== 'pt') assert.fail(`${locale}: "${key}" está sin traducir`);
}
console.log(`OK: ${checks} textos de los scripts del cotizador traducidos en 7 idiomas.`);
