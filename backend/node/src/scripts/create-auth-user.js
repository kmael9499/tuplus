const readline = require('node:readline');
const { promisify } = require('node:util');
const pool = require('../config/db');
const { hashPassword } = require('../routes/auth');

const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = promisify(prompt.question).bind(prompt);

function askSecret(label) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') return reject(new Error('Ejecuta este comando en una terminal interactiva.'));
    process.stdout.write(label);
    let value = '';
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    const finish = (error) => {
      process.stdin.off('keypress', onKey);
      process.stdin.setRawMode(false);
      process.stdout.write('\n');
      error ? reject(error) : resolve(value);
    };
    const onKey = (key, info) => {
      if (info.ctrl && info.name === 'c') return finish(new Error('Operación cancelada.'));
      if (info.name === 'return') return finish();
      if (info.name === 'backspace') { value = value.slice(0, -1); process.stdout.write('\b \b'); return; }
      if (key && !info.ctrl && !info.meta && key.length === 1) { value += key; process.stdout.write('*'); }
    };
    process.stdin.on('keypress', onKey);
  });
}

(async () => {
  try {
    const name = (await ask('Nombre completo: ')).trim();
    const email = (await ask('Correo: ')).trim().toLowerCase();
    const role = (await ask('Rol (partner/direccion): ')).trim().toLowerCase();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['partner', 'direccion'].includes(role)) throw new Error('Revisa nombre, correo y rol.');
    const password = await askSecret('Contraseña nueva (mínimo 12 caracteres, no se muestra): ');
    const confirmation = await askSecret('Confirma la contraseña: ');
    if (password.length < 12 || password.length > 128 || password !== confirmation) throw new Error('La contraseña debe tener 12 a 128 caracteres y ambas entradas deben coincidir.');
    const passwordHash = await hashPassword(password);
    await pool.execute('INSERT INTO auth_accounts (full_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, \'active\')', [name, email, passwordHash, role]);
    console.log(`Cuenta creada para ${email} (${role}).`);
  } catch (error) {
    console.error(error.code === 'ER_DUP_ENTRY' ? 'Ese correo ya tiene una cuenta.' : error.message);
    process.exitCode = 1;
  } finally { prompt.close(); await pool.end(); }
})();
