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
    if (text.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
    return /^\+?[\d\s().-]+$/.test(text) && text.replace(/\D/g, '').length >= 7 && text.replace(/\D/g, '').length <= 15;
  }
  function whatsappUrl(phone, text) {
    if (!/^\d{8,15}$/.test(phone)) throw new TypeError('Número de atención no configurado.');
    return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text);
  }
  const api = { calculate, validContact, whatsappUrl };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TuplusQuote = api;
})(typeof window !== 'undefined' ? window : globalThis);
