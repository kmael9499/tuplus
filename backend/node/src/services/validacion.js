/* Validación de datos de contacto en el servidor.
   Copia de las reglas de public/js/quote-core.js (la web) y de Validacion.cs (ERP): la validación del navegador se
   puede saltar, así que el servidor las repite antes de guardar. Si cambias una regla, cámbiala en los tres sitios. */
  function validEmail(value) {
    if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/u.test(value)) return false;
    const text = value.trim();
    const parts = text.split('@');
    if (parts.length !== 2) return false;
    const [local, inputDomain] = parts;
    // Dirección pública, sin nombres de presentación ni comentarios. Admitimos IDN.
    // Límites SMTP: https://www.rfc-editor.org/rfc/rfc5321#section-4.5.3.1
    if (!/^[\p{L}\p{N}\p{M}.-]+$/u.test(inputDomain)) return false;
    let domain;
    try { domain = new URL('https://' + inputDomain).hostname; } catch { return false; }
    if (local.length + domain.length + 1 > 254) return false;
    return local.length <= 64 && /^[a-z\d!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z\d!#$%&'*+/=?^_`{|}~-]+)*$/i.test(local)
      && domain.length <= 253 && domain.includes('.')
      && !/^\d+$/.test(domain.split('.').at(-1))
      && domain.split('.').every(label => /^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i.test(label));
  }
  function validPhone(value) {
    if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/u.test(value)) return false;
    const text = value.trim();
    const digits = text.replace(/\D/g, '');
    return /^\+[1-9]\d*(?:[ .-]?\d+| ?\(\d+\))*$/.test(text) && digits.length >= 7 && digits.length <= 15;
  }
  function validName(value) {
    const text = value.trim();
    return text.length >= 2 && text.length <= 80 && (text.match(/\p{L}/gu) || []).length >= 2
      && /^\p{L}[\p{L}\p{M}]*(?:[’'\-]\p{L}[\p{L}\p{M}]*)*\.?(?: +\p{L}[\p{L}\p{M}]*(?:[’'\-]\p{L}[\p{L}\p{M}]*)*\.?)*$/u.test(text);
  }
  function validCompany(value) {
    const text = value.trim();
    return text.length >= 2 && text.length <= 100 && /\p{L}/u.test(text)
      && /^[\p{L}\p{M}\p{N}\p{Sc} .,’'&()\/+:#@\-]+$/u.test(text);
  }
  function validMessage(value) {
    const text = value.trim();
    // Caracteres, en lugar de palabras, para admitir también chino y japonés.
    return [...text].length >= 20 && text.length <= 1000 && /\p{L}/u.test(text)
      && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/u.test(text);
  }

module.exports = { validEmail, validPhone, validName, validCompany, validMessage };
