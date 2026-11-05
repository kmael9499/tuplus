const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { router: authRoutes } = require('./routes/auth');

const estadoRoutes = require('./routes/estado');
const cotizacionesRoutes = require('./routes/cotizaciones');

const app = express();
const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV === 'production') {
  const requiredAuthConfig = ['AUTH_TOKEN_SECRET', 'AUTH_APP_URL', 'AUTH_ALLOWED_ORIGINS', 'AUTH_EMAIL_FROM', 'RESEND_API_KEY'];
  const missing = requiredAuthConfig.filter((key) => !process.env[key]);
  if (missing.length || String(process.env.AUTH_TOKEN_SECRET || '').length < 32 || !String(process.env.AUTH_APP_URL || '').startsWith('https://')) {
    throw new Error(`Configuración de autenticación de producción incompleta o insegura: ${missing.join(', ') || 'usa un secreto de 32+ caracteres y una URL HTTPS'}`);
  }
}

const allowedOrigins = (process.env.AUTH_ALLOWED_ORIGINS || 'http://localhost:4321,http://127.0.0.1:4321').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes(origin)) return callback(null, true); callback(new Error('Origen no permitido')); }, credentials: true }));
app.use(express.json());
app.use((req, _res, next) => {
  const cookieHeader = req.headers.cookie || '';
  req.cookies = Object.fromEntries(cookieHeader.split(';').map((part) => part.trim().split(/=(.*)/s).slice(0, 2)).filter((pair) => pair.length === 2).map(([key, value]) => [key, decodeURIComponent(value)]));
  next();
});

app.use(estadoRoutes);
app.use(cotizacionesRoutes);
app.use(authRoutes);

app.listen(PORT, () => {
  console.log('------------------------------------');
  console.log('Backend de TuPlus iniciado');
  console.log(`Servidor: http://localhost:${PORT}`);
  console.log(`MySQL: http://localhost:${PORT}/api/prueba-db`);
  console.log('------------------------------------');
});
