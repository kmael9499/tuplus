(() => {
  'use strict';
  // Los registros se quedan en la consola del navegador; no recopilan datos de formularios.
  function log(event, details = {}) {
    console.info('[TUPLUS]', { time: new Date().toISOString(), event, ...details });
  }
  window.TUPLUS_LOG = log;
  log('page_loaded');
  window.addEventListener('error', event => {
    log(event.target !== window ? 'resource_error' : 'javascript_error');
  }, true);
  window.addEventListener('unhandledrejection', () => log('unhandled_promise_rejection'));
  const originalFetch = window.fetch;
  if (typeof originalFetch === 'function') {
    window.fetch = function (...args) {
      const started = Date.now();
      return originalFetch.apply(this, args).then(response => {
        log('request_completed', { status: response.status, durationMs: Date.now() - started });
        return response;
      }, error => {
        log('request_failed', { durationMs: Date.now() - started });
        throw error;
      });
    };
  }
})();
