/* TUPLUS cotizador: campo de cupón (solo interfaz).
   Valida el formato, muestra el estado y permite quitar el código.
   Todavía NO calcula descuentos: cuando exista esa lógica, escucha el evento
   "tuplus:coupon" (abajo) o conecta aquí la validación real. */
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

  function apply() {
    var code = input.value.replace(/\s+/g, '').toUpperCase();

    if (!code) return fail('Escribe tu código de descuento.');
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
      return fail('Usa solo letras, números y guiones (mínimo 3 caracteres).');
    }

    input.value = code;
    input.readOnly = true;
    box.classList.add('is-applied');
    btn.textContent = 'Quitar';
    btn.setAttribute('aria-label', 'Quitar el cupón ' + code);
    setState('is-ok', 'Código ' + code + ' recibido.');

    // TODO: validar el cupón y recalcular el total.
    document.dispatchEvent(new CustomEvent('tuplus:coupon', { detail: { code: code } }));
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
