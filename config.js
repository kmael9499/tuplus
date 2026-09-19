/* Configuración comercial centralizada. Validar tarifas y canal antes de publicar. */
window.TUPLUS_CONFIG = Object.freeze({
  whatsapp: '51916828870',
  currency: 'PEN',
  locale: 'es-PE',
  pricePerPage: 50,
  maxExtraPages: 20,
  types: {
    corporativa: { name: 'Página corporativa', price: 0 },
    tienda: { name: 'Tienda virtual', price: 350 },
    landing: { name: 'Página de campaña', price: -150 }
  },
  plans: {
    profesional: { name: 'Profesional', price: 950 },
    empresarial: { name: 'Empresarial', price: 1575 },
    corporativo: { name: 'Corporativo', price: 2450 }
  }
});
