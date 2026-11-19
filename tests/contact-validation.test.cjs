const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = vm.createContext({window: {}, URL});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../public/js/quote-core.js'), 'utf8'), context);
const api = context.window.TuplusQuote;
let checks = 0;
function cases(method, expected, values) {
  for (const value of values) {assert.equal(api[method](value), expected, `${method}: ${JSON.stringify(value)}`); checks++;}
}
cases('validEmail', false, [
  '', ' ', 'name', '@example.com', 'name@', 'name@@example.com',
  '.name@example.com', 'name.@example.com', 'na..me@example.com',
  'name example@example.com', 'name@exam ple.com', 'name\t@example.com',
  'name@example.com\r\nBcc:another@example.com', 'name@example.com\n',
  'name@example', 'name@.example.com', 'name@example..com', 'name@example.com.',
  'name@-example.com', 'name@example-.com', 'name@exam_ple.com',
  'Name <name@example.com>', 'name@example.com,other@example.com',
  'name@example.com;other@example.com', 'name(comment)@example.com',
  'name@https://example.com', 'name@example.com/path', 'name@example.com:443',
  'name@192.168.1.1', 'name@[192.168.1.1]', 'name@example.123',
  'a'.repeat(65) + '@example.com', 'a@' + 'b'.repeat(64) + '.com',
  'a'.repeat(64) + '@' + 'b'.repeat(63) + '.' + 'c'.repeat(63) + '.' + 'd'.repeat(62)
]);
cases('validEmail', true, [
  'name@example.com', 'first.last+project@example.co.uk', "o'connor@example.com",
  'USER_2026@Sub.Example.COM', 'user@my-business.com', ' user@example.com ',
  'user@bücher.de', 'user@xn--bcher-kva.de',
  "!#$%&'*+-/=?^_`{|}~@example.com", 'a'.repeat(64) + '@example.com',
  'a'.repeat(64) + '@' + 'b'.repeat(63) + '.' + 'c'.repeat(63) + '.' + 'd'.repeat(61)
]);
cases('validPhone', false, ['', '123456789', '+012345678', '++51999123456', '+51 abc', '+123456', '+'+'1'.repeat(16), '+51\n999123456', '+51 (999123456', '+51 999)123456', '+51 ()999123456', '+51--999123456', '+51 999123456 ext 2', '+51 999123456.']);
cases('validPhone', true, ['+1234567', '+'+'1'.repeat(15), '+51 999 123 456', '+1 (212) 555-0123', '+49.30.123456', ' +51999123456 ']);
cases('validName', false, ['', ' ', 'A', 'A.', '1Ana', 'Ana2', 'Ana@', 'Ana\nPerez', '<Ana>', '--Ana', "Ana'", 'Ana--Maria', 'A'.repeat(81)]);
cases('validName', true, ['Li', 'José Pérez', 'Jose\u0301 Pérez', 'Jean-Luc Picard', 'Anne O’Connor', "D'Angelo", 'J. R. Tolkien', '李小明', '山田 太郎', 'أحمد علي', 'A'.repeat(80)]);
cases('validCompany', false, ['', ' ', '1', '12345', '&&&', 'Empresa\nContacto', '<script>', 'abc=123', 'Empresa'.repeat(15)]);
cases('validCompany', true, ['3M', 'Diseño & Tecnología S.A.C.', 'C# / .NET', 'Tienda: Ropa + Accesorios', 'Empresa (Perú)', 'A'.repeat(100)]);
cases('validMessage', false, ['', ' ', '#'.repeat(20), '123'.repeat(8), 'a'.repeat(19), 'a'.repeat(1001), 'Texto de proyecto\x00 con controles', 'Texto de proyecto\u202e con control bidireccional']);
cases('validMessage', true, ['a'.repeat(20), 'a'.repeat(1000), 'Necesito una tienda.\nCatálogo, pagos y envíos.', 'Quiero integrar https://example.com y C#; presupuesto: $500.', 'Necesito una web para mi negocio 🛍️.']);
console.log(`OK: ${checks} casos de formato y límites de correo, teléfono, nombre, empresa y mensaje.`);
