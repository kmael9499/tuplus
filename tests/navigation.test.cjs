const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { parseHTML } = require('linkedom');
const root = path.resolve(__dirname, '../dist');
let count = 0;
function inspect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) { inspect(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const { document } = parseHTML(fs.readFileSync(file, 'utf8'));
    if (!document.querySelector('#main-nav')) continue;
    const css = [...document.querySelectorAll('style')].map(style => style.textContent).join('\n');
    assert.ok(css.includes('.site-header .nav-networks summary'), `${file}: dropdown CSS must be embedded`);
    assert.ok(css.includes('list-style: none'), `${file}: native disclosure marker must be hidden`);
    assert.ok(css.includes('.site-header .nav-networks-menu'), `${file}: dropdown panel must be styled`);
    const pageUrl = new URL(path.relative(root, file).replaceAll('\\', '/'), 'https://example.com/tuplus/');
    for (const script of document.querySelectorAll('script[src]')) {
      const src = script.getAttribute('src');
      if (!/\b(navigation|socios-application)\.js/.test(src)) continue;
      const url = new URL(src, pageUrl);
      assert.ok(url.pathname.startsWith('/tuplus/'), `${file}: ${src} escapes deployment folder`);
      assert.ok(fs.existsSync(path.join(root, url.pathname.slice('/tuplus/'.length))), `${file}: missing ${src}`);
    }
    count++;
  }
}
inspect(root);
assert.ok(count >= 11);
console.log(`OK: menú con CSS incrustado y scripts dentro de /tuplus/ en ${count} páginas.`);
