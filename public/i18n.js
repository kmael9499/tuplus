(() => {
  'use strict';
  const dictionaries = window.TUPLUS_TRANSLATIONS || {};
  const supported = ['es', 'en', 'zh', 'ru', 'pt', 'fr', 'ja', 'de'];
  const htmlLang = {es:'es', en:'en', zh:'zh-CN', ru:'ru', pt:'pt-BR', fr:'fr', ja:'ja', de:'de'};
  const ogLang = {es:'es_LA', en:'en_US', zh:'zh_CN', ru:'ru_RU', pt:'pt_BR', fr:'fr_FR', ja:'ja_JP', de:'de_DE'};
  const labels = {es:'Idioma del sitio', en:'Site language', zh:'网站语言', ru:'Язык сайта', pt:'Idioma do site', fr:'Langue du site', ja:'サイトの言語', de:'Seitensprache'};
  const normalize = value => String(value).trim().replace(/\s+/g, ' ');
  const texts = new WeakMap(), attributes = new WeakMap();
  const textAttributes = ['aria-label', 'title', 'placeholder', 'alt', 'content'];
  const managedSelector = '[data-i18n], [data-i18n-html]';
  const ignored = '[translate="no"], [data-i18n-static], script, style, noscript, svg';
  // Normalizar también las claves, no solo el texto que llega desde el DOM.
  for (const locale of Object.keys(dictionaries)) {
    dictionaries[locale] = Object.fromEntries(Object.entries(dictionaries[locale]).map(([key,value]) => [normalize(key),value]));
  }
  const sources = new Set(Object.values(dictionaries).flatMap(dict => Object.keys(dict)));
  const reverse = new Map();
  for (const dict of Object.values(dictionaries)) for (const [source, result] of Object.entries(dict)) {
    const value = normalize(result);
    if (!reverse.has(value)) reverse.set(value, new Set());
    reverse.get(value).add(source);
  }
  let currentLocale = 'es';
  const translate = source => dictionaries[currentLocale]?.[normalize(source)] ?? dictionaries.es?.[normalize(source)] ?? source;
  function canonical(value, previous) {
    const text = normalize(value);
    if (previous && (text === previous.source || text === normalize(previous.rendered))) return previous.source;
    if (sources.has(text)) return text;
    const candidates = reverse.get(text);
    if (previous && candidates?.has(previous.source)) return previous.source;
    return candidates?.size === 1 ? candidates.values().next().value : text;
  }
  function applyText(node) {
    if (!node.nodeValue?.trim() || !node.parentElement || node.parentElement.closest(`${ignored}, ${managedSelector}`)) return;
    const current = node.nodeValue, previous = texts.get(node);
    const source = canonical(current, previous);
    const next = (current.match(/^\s*/)?.[0] || '') + translate(source) + (current.match(/\s*$/)?.[0] || '');
    if (next !== current) node.nodeValue = next;
    texts.set(node, {source, rendered: next});
  }
  function applyAttributes(element) {
    if (element.closest(ignored)) return;
    let saved = attributes.get(element);
    if (!saved) {saved = {}; attributes.set(element, saved);}
    for (const attribute of textAttributes) {
      if (!element.hasAttribute(attribute)) continue;
      if (attribute === 'content' && !['description','og:title','og:description'].includes(element.name || element.getAttribute('property'))) continue;
      const current = element.getAttribute(attribute);
      const source = canonical(current, saved[attribute]), next = translate(source);
      if (current !== next) element.setAttribute(attribute, next);
      saved[attribute] = {source, rendered: next};
    }
  }
  function applyManaged(element) {
    if (element.closest(ignored)) return;
    const rich = element.hasAttribute('data-i18n-html');
    const key = element.getAttribute(rich ? 'data-i18n-html' : 'data-i18n');
    const value = translate(key);
    if (rich) {
      // Solo se admite el formato editorial local: saltos, énfasis y negritas.
      const template = document.createElement('template'); template.innerHTML = value;
      template.content.querySelectorAll('*').forEach(node => {
        if (!['BR','EM','STRONG'].includes(node.tagName)) node.replaceWith(document.createTextNode(node.textContent));
        else [...node.attributes].forEach(attribute => node.removeAttribute(attribute.name));
      });
      const clean = template.innerHTML;
      if (element.innerHTML !== clean) element.innerHTML = clean;
    } else if (element.textContent !== value) element.textContent = value;
  }
  function applyTree(root) {
    if (root.nodeType === Node.TEXT_NODE) {applyText(root);return;}
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    if (root.closest(ignored)) return;
    const owner = root.closest(managedSelector);
    if (owner) {applyManaged(owner); applyAttributes(root); return;}
    root.querySelectorAll(managedSelector).forEach(applyManaged);
    applyAttributes(root);
    root.querySelectorAll('[aria-label], [title], [placeholder], [alt], meta[content]').forEach(applyAttributes);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node; while ((node = walker.nextNode())) applyText(node);
  }
  const options = {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:[...textAttributes,'data-i18n','data-i18n-html']};
  function process(records) {
    const roots = new Set();
    for (const record of records) {
      roots.add(record.type === 'characterData' ? record.target.parentElement : record.target);
    }
    roots.forEach(root => root && applyTree(root));
  }
  const observer = new MutationObserver(records => {
    observer.disconnect();
    try {process(records);} finally {observer.observe(document.documentElement, options);}
  });
  const missingLocalizedImages = new Set();
  function applyLocale(locale) {
    // Consumir los cambios pendientes mientras aún conocemos el idioma anterior.
    const pending = observer.takeRecords(); observer.disconnect(); process(pending);
    currentLocale = supported.includes(locale) ? locale : 'es';
    document.documentElement.lang = htmlLang[currentLocale];
    const og = document.querySelector('meta[property="og:locale"]'); if (og) og.content = ogLang[currentLocale];
    applyTree(document.documentElement);
    // Los textos incrustados en fotografías requieren un archivo por idioma.
    document.querySelectorAll('img[data-i18n-image]').forEach(image => {
      const original = image.getAttribute('data-i18n-image');
      let next = currentLocale === 'es' ? original : original.replace(/([^/]+)\.webp$/, `idiomas/${currentLocale}/$1.png`);
      // Si la versión traducida no existe en el servidor, se conserva la imagen original.
      if (missingLocalizedImages.has(next)) next = original;
      if (!image.__i18nImageGuard) {
        image.__i18nImageGuard = true;
        image.addEventListener('error', () => {
          const failed = image.getAttribute('src');
          if (failed && failed !== original) { missingLocalizedImages.add(failed); image.setAttribute('src', original); }
        });
      }
      if (image.getAttribute('src') !== next) image.setAttribute('src', next);
    });
    const picker = document.getElementById('site-language');
    if (picker) {
      picker.value = currentLocale; picker.setAttribute('aria-label', labels[currentLocale]);
      picker.closest('.language-picker')?.querySelector('.sr-only')?.replaceChildren(labels[currentLocale]);
    }
    try {localStorage.setItem('tuplus-language', currentLocale);} catch {}
    observer.observe(document.documentElement, options);
    document.dispatchEvent(new CustomEvent('tuplus:language-change', {detail:{locale:currentLocale}}));
  }
  // Los componentes dinámicos guardan su clave española antes de mostrar el texto.
  function setText(element, source, rich = false) {
    if (!element) return;
    element.removeAttribute(rich ? 'data-i18n' : 'data-i18n-html');
    element.setAttribute(rich ? 'data-i18n-html' : 'data-i18n', source);
    applyManaged(element);
  }
  window.TUPLUS_I18N = {t:translate, setText, setLocale:applyLocale, get locale(){return currentLocale;}};
  const picker = document.getElementById('site-language');
  picker?.addEventListener('change', () => applyLocale(picker.value));
  let saved = 'es'; try {saved = localStorage.getItem('tuplus-language') || 'es';} catch {}
  applyLocale(saved);
})();
