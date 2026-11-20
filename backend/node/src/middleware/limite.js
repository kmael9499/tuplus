/* Límite de envíos por IP (ventana fija, en memoria). Evita que alguien llene la base con cotizaciones falsas.
   Si el servidor va detrás de Cloudflare se usa CF-Connecting-IP; si no, la IP de la conexión.
   Con varias instancias del servidor cada una cuenta por separado: para algo más estricto usa un límite en el hosting. */
function limitePorIp({ max = 10, ventanaMs = 60 * 60 * 1000 } = {}) {
  const contadores = new Map();
  const limpieza = setInterval(() => {
    const ahora = Date.now();
    for (const [ip, c] of contadores) if (c.hasta <= ahora) contadores.delete(ip);
  }, ventanaMs);
  limpieza.unref();

  return (req, res, next) => {
    const ip = req.get('CF-Connecting-IP') || req.ip || 'desconocida';
    const ahora = Date.now();
    let c = contadores.get(ip);
    if (!c || c.hasta <= ahora) { c = { n: 0, hasta: ahora + ventanaMs }; contadores.set(ip, c); }
    c.n += 1;
    if (c.n > max) {
      res.set('Retry-After', String(Math.ceil((c.hasta - ahora) / 1000)));
      return res.status(429).json({ estado: 'error', mensaje: 'Alcanzaste el límite de cotizaciones por hora. Inténtalo más tarde.' });
    }
    next();
  };
}
module.exports = { limitePorIp };
