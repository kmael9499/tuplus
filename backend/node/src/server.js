const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');
const cookieParser = require('cookie-parser');

const estadoRoutes = require('./routes/estado');
const cotizacionesRoutes = require('./routes/cotizaciones');
const { router: authRoutes } = require('./routes/auth');
const { limitePorIp } = require('./middleware/limite');

const app = express();
const PORT = process.env.PORT || 8080;

// Registra solo datos t?cnicos; nunca cuerpos, cookies, cabeceras ni par?metros sensibles.
app.use((req, res, next) => {
  const id = randomUUID();
  const start = process.hrtime.bigint();
  res.setHeader('X-Request-Id', id);
  let recorded = false;
  const record = (outcome) => {
    if (recorded) return;
    recorded = true;
    const route = req.route && typeof req.route.path === 'string' ? req.route.path : 'no-identificada';
    console.log(JSON.stringify({ time: new Date().toISOString(), event: 'http_request', id,
      method: req.method, route,
      status: res.statusCode, outcome, durationMs: Number(process.hrtime.bigint() - start) / 1e6 }));
  };
  res.once('finish', () => record('completed'));
  res.once('close', () => { if (!res.writableFinished) record('disconnected'); });
  next();
});
// Orígenes que pueden llamar a la API con cookies de sesión (lista cerrada, separada por comas en .env).
const origenesPermitidos = (process.env.CORS_ORIGINS || 'http://localhost:4321,http://localhost:4399,http://localhost:8080')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origen, cb) => cb(null, !origen || origenesPermitidos.includes(origen)),
  credentials: true
}));
app.use(express.json({ limit: '50kb' })); // tamaño máximo del cuerpo
app.use(cookieParser()); // lo necesita auth.js para leer la cookie de sesión

// Límite de intentos por IP en las rutas de acceso (además del bloqueo por cuenta que ya hace auth.js).
const limiteAcceso = limitePorIp({ max: 20, ventanaMs: 15 * 60 * 1000 });
// Recuperación de contraseña: tope más estricto por IP (cada solicitud envía un correo).
const limiteRecuperacion = limitePorIp({ max: 5, ventanaMs: 60 * 60 * 1000 });
app.use('/api/auth/forgot-password', limiteRecuperacion);
app.use('/api/auth', (req, res, next) => (req.path === '/session' || req.path === '/logout') ? next() : limiteAcceso(req, res, next));

app.use(estadoRoutes);
app.use(cotizacionesRoutes);
app.use(authRoutes);

app.use((err, req, res, next) => {
  console.error(JSON.stringify({ time: new Date().toISOString(), event: 'request_error',
    id: res.getHeader('X-Request-Id'), kind: err.type === 'entity.parse.failed' ? 'invalid_json' : 'internal_error' }));
  if (res.headersSent) return next(err);
  res.status(err.type === 'entity.parse.failed' ? 400 : 500).json({ estado: 'error', mensaje: 'No se pudo procesar la solicitud' });
});

app.listen(PORT, () => {
  console.log(JSON.stringify({ time: new Date().toISOString(), event: 'server_started', port: PORT }));
});
