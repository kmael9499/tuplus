(() => {
  'use strict';
  window.TUPLUS_LOG = (event) => {
    if (event !== 'cotizacion_guardada' || !['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;
    fetch('/__tuplus_logs', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event }),
      keepalive: true,
    }).catch(() => {});
  };
})();
