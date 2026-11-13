(() => {
  'use strict';
  window.TUPLUS_LOG = (event, details = {}) => {
    if (event !== 'cotizacion_guardada' || !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;
    fetch('/__tuplus_logs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, proyecto: details.proyecto, moneda: details.moneda, total_pen: details.total_pen }),
      keepalive: true,
    }).catch(() => {});
  };
})();
