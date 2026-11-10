const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const { randomUUID } = require('crypto');

const estadoRoutes = require('./routes/estado');
const cotizacionesRoutes = require('./routes/cotizaciones');

const app = express();
const PORT = process.env.PORT || 8080;

// Registra los datos recibidos y la respuesta para diagnosticar solicitudes.
app.use((req, res, next) => {
  const id = randomUUID();
  const start = process.hrtime.bigint();
  res.setHeader('X-Request-Id', id);
  let recorded = false;
  let responseBody;
  const send = res.send;
  res.send = function (body) { responseBody = body; return send.call(this, body); };
  const record = (outcome) => {
    if (recorded) return;
    recorded = true;
    const route = req.route && typeof req.route.path === 'string' ? req.route.path : 'no-identificada';
    console.log(JSON.stringify({ time: new Date().toISOString(), event: 'http_request', id,
      method: req.method, route, url: req.originalUrl, query: req.query, ip: req.ip,
      headers: req.headers, body: req.body, responseHeaders: res.getHeaders(), responseBody,
      status: res.statusCode, outcome, durationMs: Number(process.hrtime.bigint() - start) / 1e6 }));
  };
  res.once('finish', () => record('completed'));
  res.once('close', () => { if (!res.writableFinished) record('disconnected'); });
  next();
});
app.use(cors());
app.use(express.json());

app.use(estadoRoutes);
app.use(cotizacionesRoutes);

app.use((err, req, res, next) => {
  console.error(JSON.stringify({ time: new Date().toISOString(), event: 'request_error',
    id: res.getHeader('X-Request-Id'), kind: err.type === 'entity.parse.failed' ? 'invalid_json' : 'internal_error', message: err.message, stack: err.stack }));
  if (res.headersSent) return next(err);
  res.status(err.type === 'entity.parse.failed' ? 400 : 500).json({ estado: 'error', mensaje: 'No se pudo procesar la solicitud' });
});

app.listen(PORT, () => {
  console.log(JSON.stringify({ time: new Date().toISOString(), event: 'server_started', port: PORT }));
});
