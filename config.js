/* Configuración comercial centralizada. Validar tarifas y canal antes de publicar. */
window.TUPLUS_CONFIG = Object.freeze({
  quoteBackendEnabled: false, // Activar solo con PHP/MySQL configurados.
  whatsapp: '51916828870',
  // Pagos: completa estos datos antes de publicar.
  payments: {
    // Enlace de tu pasarela (Culqi, Niubiz, Mercado Pago, Stripe Payment Link, etc.).
    gatewayUrl: '',
    crypto: {
      enabled: true,
      // Pega aquí TUS direcciones reales. Verifica cada red antes de publicar.
      wallets: [
        { id: 'usdt-trc20', label: 'USDT · red TRON (TRC-20)', address: '' },
        { id: 'usdt-erc20', label: 'USDT · red Ethereum (ERC-20)', address: '' },
        { id: 'btc', label: 'Bitcoin (BTC)', address: '' }
      ]
    }
  },
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
