/* Funciones puras compartidas por la interfaz y las pruebas del cotizador. */
(function (root) {
  'use strict';
  function calculate(config, type, plan, extras) {
    if (!Object.hasOwn(config.types, type) || !Object.hasOwn(config.plans, plan)) {
      throw new RangeError('Selecciona un tipo de web y un plan válidos.');
    }
    if (!Number.isInteger(extras) || extras < 0 || extras > config.maxExtraPages || extras % 5 !== 0) {
      throw new RangeError('Selecciona entre 0 y 20 páginas, en grupos de 5.');
    }
    const base = config.plans[plan].price;
    const adjustment = config.types[type].price;
    const additional = extras * config.pricePerPage;
    return { base, adjustment, additional, total: base + adjustment + additional };
  }
  function validContact(value) {
    const text = value.trim();
    if (text.includes('@')) {
      const parts = text.split('@');
      if (parts.length !== 2 || text.length > 254) return false;
      const [local, domain] = parts;
      return local.length <= 64 && /^[a-z\d!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z\d!#$%&'*+/=?^_`{|}~-]+)*$/i.test(local)
        && domain.length <= 253 && domain.includes('.')
        && domain.split('.').every(label => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label));
    }
    return /^\+?[\d\s().-]+$/.test(text) && text.replace(/\D/g, '').length >= 7 && text.replace(/\D/g, '').length <= 15;
  }
  function whatsappUrl(phone, text) {
    if (!/^\d{8,15}$/.test(phone)) throw new TypeError('Número de atención no configurado.');
    return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text);
  }
  function validName(value) {
    const text = value.trim();
    return text.length >= 2 && text.length <= 80 && /\p{L}/u.test(text)
      && /^[\p{L}\p{M} .’'\-]+$/u.test(text);
  }
  function validCompany(value) {
    const text = value.trim();
    return text.length >= 2 && text.length <= 100 && /\p{L}/u.test(text)
      && /^[\p{L}\p{M}\p{N} .,’'&()\/+\-]+$/u.test(text);
  }
  function validMessage(value) {
    const text = value.trim();
    // Caracteres, en lugar de palabras, para admitir también chino y japonés.
    return [...text].length >= 20 && text.length <= 1000 && /\p{L}/u.test(text)
      && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(text);
  }
  const api = { calculate, validContact, validName, validCompany, validMessage, whatsappUrl };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TuplusQuote = api;
})(typeof window !== 'undefined' ? window : globalThis);
