const express = require('express');
const crypto = require('node:crypto');
const pool = require('../config/db');

const router = express.Router();
const SESSION_MS = 30 * 60 * 1000;
const HASH_COST = 32768;
const COOKIE = 'tuplus_session';
const PENDING_COOKIE = 'tuplus_mfa';
const production = process.env.NODE_ENV === 'production';
const codeDigest = (challenge, code) => crypto.createHmac('sha256', process.env.AUTH_TOKEN_SECRET || process.env.DB_PASSWORD || 'local-development-only').update(`${challenge}:${code}`).digest('hex');
const cookieOptions = (maxAge) => ({ httpOnly: true, secure: production, sameSite: 'strict', path: '/', maxAge });
const digest = (value) => crypto.createHash('sha256').update(value).digest('hex');
const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
const normalizedEmail = (value) => String(value || '').trim().toLowerCase().slice(0, 254);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16);
    crypto.scrypt(password, salt, 64, { N: HASH_COST, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (err, derived) => {
      if (err) return reject(err);
      resolve(`scrypt$${HASH_COST}$8$1$${salt.toString('hex')}$${derived.toString('hex')}`);
    });
  });
}

function verifyPassword(password, encoded) {
  return new Promise((resolve) => {
    const [algorithm, n, r, p, saltHex, hashHex] = String(encoded || '').split('$');
    if (algorithm !== 'scrypt' || !saltHex || !hashHex) return resolve(false);
    crypto.scrypt(password, Buffer.from(saltHex, 'hex'), 64, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 }, (err, derived) => {
      if (err) return resolve(false);
      const expected = Buffer.from(hashHex, 'hex');
      resolve(expected.length === derived.length && crypto.timingSafeEqual(expected, derived));
    });
  });
}

async function sendEmail(to, subject, html, text) {
  if (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM) throw new Error('Servicio de correo no configurado');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.AUTH_EMAIL_FROM, to: [to], subject, html, text })
  });
  if (!response.ok) throw new Error(`Proveedor de correo respondió ${response.status}`);
}

function setSessionCookie(res, token) { res.cookie(COOKIE, token, cookieOptions(SESSION_MS)); }

async function createSession(accountId, res) {
  const token = randomToken();
  await pool.execute('INSERT INTO auth_sessions (account_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE))', [accountId, digest(token)]);
  setSessionCookie(res, token);
}

async function loadSession(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE];
  if (!token || token.length > 128) return res.status(401).json({ message: 'Inicia sesión para continuar.' });
  try {
    const [rows] = await pool.execute(`SELECT s.id AS session_id, a.id, a.full_name, a.email, a.role, a.status
      FROM auth_sessions s JOIN auth_accounts a ON a.id = s.account_id
      WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP() LIMIT 1`, [digest(token)]);
    const account = rows[0];
    if (!account || account.status !== 'active') {
      await pool.execute('DELETE FROM auth_sessions WHERE token_hash = ?', [digest(token)]);
      res.clearCookie(COOKIE, cookieOptions(0));
      return res.status(401).json({ message: 'Tu sesión no está disponible. Vuelve a ingresar.' });
    }
    await pool.execute('UPDATE auth_sessions SET expires_at = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE), last_seen_at = UTC_TIMESTAMP() WHERE id = ?', [account.session_id]);
    setSessionCookie(res, token);
    req.account = account;
    next();
  } catch (error) { next(error); }
}

router.post('/api/auth/login', async (req, res) => {
  const email = normalizedEmail(req.body.email);
  const password = String(req.body.password || '');
  if (!validEmail(email) || password.length < 1 || password.length > 128) return res.status(400).json({ message: 'Revisa el correo y la contraseña e inténtalo de nuevo.' });
  try {
    const [rows] = await pool.execute('SELECT id, email, password_hash, role, status, failed_attempts, locked_until FROM auth_accounts WHERE email = ? LIMIT 1', [email]);
    const account = rows[0];
    if (!account) return res.status(401).json({ message: 'Correo o contraseña incorrectos. Te quedan 4 intentos.' });
    if (account.locked_until) {
      const [lockState] = await pool.execute('SELECT GREATEST(0, TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), locked_until)) AS seconds_left FROM auth_accounts WHERE id = ?', [account.id]);
      const secondsLeft = Number(lockState[0].seconds_left);
      if (secondsLeft > 0) return res.status(423).json({ message: `Acceso bloqueado temporalmente. Inténtalo en ${Math.max(1, Math.ceil(secondsLeft / 60))} min.` });
      await pool.execute('UPDATE auth_accounts SET failed_attempts = 0, locked_until = NULL WHERE id = ? AND locked_until <= UTC_TIMESTAMP()', [account.id]);
    }
    if (account.status !== 'active') return res.status(403).json({ message: 'No se puede acceder a esta cuenta. Contacta al equipo TUPLUS.' });
    const valid = await verifyPassword(password, account.password_hash);
    if (!valid) {
      await pool.execute(`UPDATE auth_accounts SET failed_attempts = LEAST(failed_attempts + 1, 5), locked_until = IF(failed_attempts >= 5, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE), NULL) WHERE id = ?`, [account.id]);
      const [updated] = await pool.execute('SELECT failed_attempts, locked_until FROM auth_accounts WHERE id = ?', [account.id]);
      const nextAttempts = Number(updated[0].failed_attempts);
      if (updated[0].locked_until) {
        return res.status(423).json({ message: 'Se alcanzaron 5 intentos. El acceso se bloqueó durante 15 minutos.' });
      }
      return res.status(401).json({ message: `Correo o contraseña incorrectos. Te quedan ${5 - nextAttempts} intentos.` });
    }
    await pool.execute('UPDATE auth_accounts SET failed_attempts = 0, locked_until = NULL WHERE id = ?', [account.id]);
    if (account.role === 'direccion') {
      const challenge = randomToken();
      const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      await pool.execute('DELETE FROM auth_challenges WHERE account_id = ?', [account.id]);
      await pool.execute(`INSERT INTO auth_challenges (account_id, challenge_hash, code_hash, expires_at)
        VALUES (?, ?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE))`, [account.id, digest(challenge), codeDigest(challenge, code)]);
      try {
        await sendEmail(account.email, 'Tu código de acceso TUPLUS', `<p>Tu código de verificación es <strong>${code}</strong>.</p><p>Caduca en 10 minutos. Si no lo solicitaste, ignora este correo.</p>`, `Tu código de verificación TUPLUS es ${code}. Caduca en 10 minutos.`);
      } catch (error) {
        await pool.execute('DELETE FROM auth_challenges WHERE challenge_hash = ?', [digest(challenge)]);
        console.error('No se pudo enviar el código de Dirección:', error.message);
        return res.status(503).json({ message: 'No pudimos enviar el código ahora. Inténtalo más tarde.' });
      }
      res.cookie(PENDING_COOKIE, challenge, cookieOptions(10 * 60 * 1000));
      return res.json({ requiresCode: true });
    }
    await createSession(account.id, res);
    res.json({ authenticated: true, redirect: process.env.PARTNER_HOME_URL || '/portal-socios.html' });
  } catch (error) { console.error('Error al iniciar sesión:', error.message); res.status(500).json({ message: 'No pudimos procesar el acceso. Inténtalo más tarde.' }); }
});

router.post('/api/auth/verify-email-code', async (req, res) => {
  const challenge = req.cookies && req.cookies[PENDING_COOKIE];
  const code = String(req.body.code || '');
  if (!challenge || !/^\d{6}$/.test(code)) return res.status(400).json({ message: 'El código no es válido o ya venció.' });
  try {
    const [rows] = await pool.execute(`SELECT c.id, c.account_id, c.code_hash, c.attempts FROM auth_challenges c JOIN auth_accounts a ON a.id = c.account_id
      WHERE c.challenge_hash = ? AND c.expires_at > UTC_TIMESTAMP() AND a.role = 'direccion' AND a.status = 'active' LIMIT 1`, [digest(challenge)]);
    const item = rows[0];
    if (!item) return res.status(401).json({ message: 'El código no es válido o ya venció.' });
    if (Number(item.attempts) >= 5) { await pool.execute('DELETE FROM auth_challenges WHERE id = ?', [item.id]); return res.status(429).json({ message: 'Se agotaron los intentos. Vuelve a iniciar sesión.' }); }
    const submittedHash = Buffer.from(codeDigest(challenge, code), 'hex');
    const savedHash = Buffer.from(item.code_hash, 'hex');
    if (submittedHash.length !== savedHash.length || !crypto.timingSafeEqual(submittedHash, savedHash)) { await pool.execute('UPDATE auth_challenges SET attempts = attempts + 1 WHERE id = ?', [item.id]); return res.status(401).json({ message: 'El código no es válido o ya venció.' }); }
    await pool.execute('DELETE FROM auth_challenges WHERE id = ?', [item.id]);
    res.clearCookie(PENDING_COOKIE, cookieOptions(0));
    await createSession(item.account_id, res);
    res.json({ authenticated: true, redirect: process.env.DIRECTION_HOME_URL || '/portal-socios.html' });
  } catch (error) { console.error('Error al validar el código:', error.message); res.status(500).json({ message: 'No pudimos validar el código. Inténtalo más tarde.' }); }
});

router.post('/api/auth/forgot-password', async (req, res) => {
  const email = normalizedEmail(req.body.email);
  const generic = 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.';
  if (!validEmail(email)) return res.json({ message: generic });
  try {
    const [rows] = await pool.execute("SELECT id, email FROM auth_accounts WHERE email = ? AND status = 'active' LIMIT 1", [email]);
    if (rows[0]) {
      const token = randomToken();
      await pool.execute('DELETE FROM auth_password_resets WHERE account_id = ?', [rows[0].id]);
      await pool.execute(`INSERT INTO auth_password_resets (account_id, token_hash, expires_at)
        VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 MINUTE))`, [rows[0].id, digest(token)]);
      const resetUrl = `${(process.env.AUTH_APP_URL || 'http://localhost:4321').replace(/\/$/, '')}/restablecer.html?token=${encodeURIComponent(token)}`;
      try { await sendEmail(rows[0].email, 'Restablece tu contraseña de TUPLUS', `<p>Solicitaste restablecer tu contraseña.</p><p><a href="${resetUrl}">Crear una nueva contraseña</a></p><p>Este enlace vence en 30 minutos.</p>`, `Restablece tu contraseña: ${resetUrl}\nEl enlace vence en 30 minutos.`); }
      catch (error) { await pool.execute('DELETE FROM auth_password_resets WHERE token_hash = ?', [digest(token)]); console.error('No se pudo enviar recuperación:', error.message); }
    }
    res.json({ message: generic });
  } catch (error) { console.error('Error en recuperación de contraseña:', error.message); res.json({ message: generic }); }
});

router.post('/api/auth/reset-password', async (req, res) => {
  const token = String(req.body.token || '');
  const password = String(req.body.password || '');
  if (token.length < 32 || password.length < 12 || password.length > 128) return res.status(400).json({ message: 'Usa una contraseña de al menos 12 caracteres y un enlace vigente.' });
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const [rows] = await connection.execute('SELECT id, account_id FROM auth_password_resets WHERE token_hash = ? AND expires_at > UTC_TIMESTAMP() AND used_at IS NULL LIMIT 1 FOR UPDATE', [digest(token)]);
    if (!rows[0]) { await connection.rollback(); return res.status(400).json({ message: 'El enlace no es válido o ya venció. Solicita uno nuevo.' }); }
    const encoded = await hashPassword(password);
    await connection.execute('UPDATE auth_accounts SET password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE id = ?', [encoded, rows[0].account_id]);
    await connection.execute('UPDATE auth_password_resets SET used_at = UTC_TIMESTAMP() WHERE id = ?', [rows[0].id]);
    await connection.execute('DELETE FROM auth_sessions WHERE account_id = ?', [rows[0].account_id]);
    await connection.commit();
    res.json({ message: 'Contraseña actualizada. Ya puedes ingresar.' });
  } catch (error) { if (connection) await connection.rollback(); console.error('Error al restablecer contraseña:', error.message); res.status(500).json({ message: 'No pudimos actualizar la contraseña. Inténtalo más tarde.' }); }
  finally { if (connection) connection.release(); }
});

router.get('/api/auth/session', loadSession, (req, res) => res.json({ account: { name: req.account.full_name, email: req.account.email, role: req.account.role } }));
router.post('/api/auth/logout', loadSession, async (req, res) => {
  try { await pool.execute('DELETE FROM auth_sessions WHERE id = ?', [req.account.session_id]); res.clearCookie(COOKIE, cookieOptions(0)); res.json({ loggedOut: true }); }
  catch (error) { console.error('Error al cerrar sesión:', error.message); res.status(500).json({ message: 'No se pudo cerrar la sesión.' }); }
});

module.exports = { router, hashPassword, loadSession };
