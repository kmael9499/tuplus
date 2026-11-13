/* TUPLUS cotizador: campo de cupón.
   Valida el código con el backend (POST /api/cupones/validar) y avisa a
   cotizador.js con el evento "tuplus:coupon" para recalcular el total.
   Hay un campo al inicio (paso 1) y otro al final (paso 5): comparten el mismo estado. */
(function () {
  'use strict';

  // Cada campo: caja + input + botón + mensaje (los ids terminan en "" o "2").
  var fields = [['', 'couponBox'], ['2', 'couponBox2']].map(function (p) {
    var s = p[0];
    return {
      box: document.getElementById('couponBox' + s),
      input: document.getElementById('couponInput' + s),
      btn: document.getElementById('couponBtn' + s),
      msg: document.getElementById('couponMsg' + s)
    };
  }).filter(function (f) { return f.box && f.input && f.btn && f.msg; });
  if (!fields.length) return;

  var applied = false;

  function each(fn) { fields.forEach(fn); }

  function setState(state, text) {
    each(function (f) {
      f.box.classList.remove('is-ok', 'is-error');
      if (state) f.box.classList.add(state);
      f.msg.textContent = text || '';
    });
  }

  function shake(f) {
    f.box.classList.remove('is-shake');
    void f.box.offsetWidth; // reinicia la animación
    f.box.classList.add('is-shake');
  }

  function fail(f, text) {
    setState('is-error', text);
    shake(f);
    f.input.focus();
  }

  function apiBase() {
    return String((window.TUPLUS_CONFIG && window.TUPLUS_CONFIG.apiUrl) || '').replace(/\/+$/, '');
  }

  function apply(f) {
    var code = f.input.value.replace(/\s+/g, '').toUpperCase();

    if (!code) return fail(f, 'Escribe tu código de descuento.');
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      return fail(f, 'Usa solo letras, números y guiones (mínimo 3 caracteres).');
    }
    if (!apiBase()) return fail(f, 'Los cupones no están disponibles por ahora.');

    each(function (x) { x.input.value = code; x.btn.disabled = true; });
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
        each(function (x) { x.btn.disabled = false; });
        if (!res.d || !res.d.valido) return fail(f, (res.d && res.d.mensaje) || 'No se pudo comprobar el código.');
        applied = true;
        each(function (x) {
          x.input.value = code;
          x.input.readOnly = true;
          x.box.classList.add('is-applied');
          x.btn.textContent = 'Quitar';
          x.btn.setAttribute('aria-label', 'Quitar el cupón ' + code);
        });
        setState('is-ok', res.d.mensaje || 'Cupón aplicado.');
        document.dispatchEvent(new CustomEvent('tuplus:coupon', {
          detail: { code: res.d.cupon.codigo, tipo: res.d.cupon.tipo, valor: res.d.cupon.valor }
        }));
      })
      .catch(function () {
        each(function (x) { x.btn.disabled = false; });
        fail(f, 'No pudimos comprobar el código. Inténtalo de nuevo.');
      });
  }

  function clear(f) {
    applied = false;
    each(function (x) {
      x.input.readOnly = false;
      x.input.value = '';
      x.box.classList.remove('is-applied');
      x.btn.textContent = 'Aplicar';
      x.btn.removeAttribute('aria-label');
    });
    setState('', '');
    f.input.focus();

    document.dispatchEvent(new CustomEvent('tuplus:coupon', { detail: { code: '' } }));
  }

  fields.forEach(function (f) {
    f.btn.addEventListener('click', function () {
      if (applied) clear(f);
      else apply(f);
    });

    f.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault(); // evita que el Enter dispare otras acciones del formulario
        if (!applied) apply(f);
      }
    });

    // Al escribir de nuevo se limpia el mensaje de error y se copia el texto al otro campo
    f.input.addEventListener('input', function () {
      if (f.box.classList.contains('is-error')) setState('', '');
      each(function (x) { if (x !== f && !applied) x.input.value = f.input.value; });
    });
  });
})();
