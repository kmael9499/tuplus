/* TUPLUS cotizador: campo de cupón.
   Valida el código con el backend (POST /api/cupones/validar) y avisa a
   cotizador.js con el evento "tuplus:coupon" para recalcular el total. */
(function () {
  'use strict';

  var box = document.getElementById('couponBox');
  var input = document.getElementById('couponInput');
  var btn = document.getElementById('couponBtn');
  var msg = document.getElementById('couponMsg');
  if (!box || !input || !btn || !msg) return;

  function setState(state, text) {
    box.classList.remove('is-ok', 'is-error');
    if (state) box.classList.add(state);
    msg.textContent = text || '';
  }

  function shake() {
    box.classList.remove('is-shake');
    void box.offsetWidth; // reinicia la animación
    box.classList.add('is-shake');
  }

  function fail(text) {
    setState('is-error', text);
    shake();
    input.focus();
  }

  function apiBase() {
    return String((window.TUPLUS_CONFIG && window.TUPLUS_CONFIG.apiUrl) || '').replace(/\/+$/, '');
  }

  function apply() {
    var code = input.value.replace(/\s+/g, '').toUpperCase();

    if (!code) return fail('Escribe tu código de descuento.');
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      return fail('Usa solo letras, números y guiones (mínimo 3 caracteres).');
    }
    if (!apiBase()) return fail('Los cupones no están disponibles por ahora.');

    input.value = code;
    btn.disabled = true;
    setState('', 'Comprobando…');

    // El total en USD sin descuento; el servidor decide si el código vale
    var subtotal = typeof subtotalUsd === 'function' ? subtotalUsd() : 0;
    fetch(apiBase() + '/api/cupones/validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: code, subtotal: subtotal })
    })
      .then(function (r) { return r.json().then(function (d) { return { status: r.status, d: d }; }); })
      .then(function (res) {
        btn.disabled = false;
        if (!res.d || !res.d.valido) return fail((res.d && res.d.mensaje) || 'No se pudo comprobar el código.');
        input.readOnly = true;
        box.classList.add('is-applied');
        btn.textContent = 'Quitar';
        btn.setAttribute('aria-label', 'Quitar el cupón ' + code);
        setState('is-ok', res.d.mensaje || 'Cupón aplicado.');
        document.dispatchEvent(new CustomEvent('tuplus:coupon', {
          detail: { code: res.d.cupon.codigo, tipo: res.d.cupon.tipo, valor: res.d.cupon.valor }
        }));
      })
      .catch(function () {
        btn.disabled = false;
        fail('No pudimos comprobar el código. Inténtalo de nuevo.');
      });
  }

  function clear() {
    input.readOnly = false;
    input.value = '';
    box.classList.remove('is-applied');
    btn.textContent = 'Aplicar';
    btn.removeAttribute('aria-label');
    setState('', '');
    input.focus();

    document.dispatchEvent(new CustomEvent('tuplus:coupon', { detail: { code: '' } }));
  }

  btn.addEventListener('click', function () {
    if (box.classList.contains('is-applied')) clear();
    else apply();
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault(); // evita que el Enter dispare otras acciones del formulario
      if (!box.classList.contains('is-applied')) apply();
    }
  });

  // Al escribir de nuevo se limpia el mensaje de error
  input.addEventListener('input', function () {
    if (box.classList.contains('is-error')) setState('', '');
  });
})();
