(() => {
  'use strict';
  const dictionaries = window.TUPLUS_TRANSLATIONS || {};
  const supported = ['es', 'en', 'zh', 'ru', 'pt', 'fr', 'ja', 'de'];
  const htmlLang = {es:'es', en:'en', zh:'zh-CN', ru:'ru', pt:'pt-BR', fr:'fr', ja:'ja', de:'de'};
  const ogLang = {es:'es_LA', en:'en_US', zh:'zh_CN', ru:'ru_RU', pt:'pt_BR', fr:'fr_FR', ja:'ja_JP', de:'de_DE'};
  const labels = {es:'Idioma del sitio', en:'Site language', zh:'网站语言', ru:'Язык сайта', pt:'Idioma do site', fr:'Langue du site', ja:'サイトの言語', de:'Seitensprache'};
  const names = {es:'Español', en:'English', zh:'简体中文', ru:'Русский', pt:'Português', fr:'Français', ja:'日本語', de:'Deutsch'};
  const textOriginals = new WeakMap();
  const textRendered = new WeakMap();
  const attrOriginals = new WeakMap();
  const attrRendered = new WeakMap();
  const textAttributes = ['aria-label', 'title', 'placeholder', 'alt', 'content'];
  const normalize = value => value.trim().replace(/\s+/g, ' ');
  let currentLocale = 'es';
  try { const saved = localStorage.getItem('tuplus-language'); if (supported.includes(saved)) currentLocale = saved; } catch {}

  function skipped(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return !element || Boolean(element.closest('[translate="no"], [data-i18n-static], script, style, noscript, svg'));
  }
  function translated(source) {
    return dictionaries[currentLocale]?.[normalize(source)] || source;
  }
  function applyText(node) {
    if (!node.nodeValue || skipped(node)) return;
    const current = node.nodeValue;
    const last = textRendered.get(node);
    if (!textOriginals.has(node) || (last !== undefined && current !== last)) textOriginals.set(node, normalize(current));
    else if (last === undefined) textOriginals.set(node, normalize(current));
    const original = textOriginals.get(node);
    const leading = current.match(/^\s*/)?.[0] || '';
    const trailing = current.match(/\s*$/)?.[0] || '';
    const next = leading + translated(original) + trailing;
    if (current !== next) node.nodeValue = next;
    textRendered.set(node, next);
  }
  function applyAttributes(element) {
    if (element.closest('[translate="no"], [data-i18n-static]')) return;
    for (const attribute of textAttributes) {
      if (!element.hasAttribute(attribute)) continue;
      if (attribute === 'content' && element.tagName === 'META' && !['description', 'og:title', 'og:description'].includes(element.name || element.getAttribute('property'))) continue;
      let originals = attrOriginals.get(element);
      let rendered = attrRendered.get(element);
      if (!originals) { originals = {}; attrOriginals.set(element, originals); rendered = {}; attrRendered.set(element, rendered); }
      const current = element.getAttribute(attribute);
      if (!(attribute in originals) || (attribute in rendered && rendered[attribute] !== current)) originals[attribute] = normalize(current);
      const next = translated(originals[attribute]);
      if (current !== next) element.setAttribute(attribute, next);
      rendered[attribute] = next;
    }
  }
  function applyLocale(locale) {
    observer.disconnect();
    currentLocale = supported.includes(locale) ? locale : 'es';
    document.documentElement.lang = htmlLang[currentLocale];
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.content = ogLang[currentLocale];
    const picker = document.getElementById('site-language');
    if (picker) {
      picker.value = currentLocale;
      picker.setAttribute('aria-label', labels[currentLocale]);
      picker.closest('.language-picker')?.querySelector('.sr-only')?.replaceChildren(labels[currentLocale]);
    }
    document.querySelectorAll('title, meta[content], [aria-label], [title], [placeholder], [alt]').forEach(applyAttributes);
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) applyText(node);
    try { localStorage.setItem('tuplus-language', currentLocale); } catch {}
    observer.observe(document.documentElement, observerOptions);
    document.dispatchEvent(new CustomEvent('tuplus:language-change', {detail: {locale: currentLocale}}));
  }

  const picker = document.getElementById('site-language');
  if (picker) picker.addEventListener('change', () => applyLocale(picker.value));
  window.TUPLUS_I18N = {t: value => translated(value), get locale() { return currentLocale; }};
  const observerOptions = {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:textAttributes};
  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') applyText(record.target);
      else {
        record.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) applyText(node);
          else if (node.nodeType === Node.ELEMENT_NODE) {
            applyAttributes(node);
            node.querySelectorAll?.('[aria-label], [title], [placeholder], [alt], meta[content]').forEach(applyAttributes);
            const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
            let child; while ((child = walker.nextNode())) applyText(child);
          }
        });
        if (record.type === 'attributes' && record.target instanceof Element) applyAttributes(record.target);
      }
    }
    observer.takeRecords();
  });
  observer.observe(document.documentElement, observerOptions);
  applyLocale(currentLocale);
})();
