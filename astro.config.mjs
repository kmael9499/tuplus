import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

// Usa el mismo ERP que la web publicada, salvo que se configure uno local.
const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), 'TUPLUS_');
const apiProxy = {
  target: env.TUPLUS_API_PROXY_TARGET?.trim() || 'https://tuplusadminpanel.onrender.com',
  changeOrigin: true,
};

// Mantiene las mismas URLs que el sitio actual (index.html, cotizador.html, soluciones/web.html…)
// y el HTML tal cual, sin comprimir.
export default defineConfig({
  build: { format: 'file' },
  compressHTML: false,
  server: { host: true, port: 4321 },
  vite: {
    plugins: [{
      name: 'tuplus-logs-locales',
      apply: 'serve',
      configureServer(server) {
        server.middlewares.use('/__tuplus_logs', (req, res) => {
          if (req.method !== 'POST') { res.writeHead(405).end(); return; }
          let body = '';
          req.on('data', chunk => { body += chunk; if (body.length > 2048) req.destroy(); });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (data.event !== 'cotizacion_guardada') throw new Error('Evento inválido');
              const details = {
                ip: req.socket.remoteAddress,
                navegador: (req.headers['user-agent'] || '').slice(0, 256),
                proyecto: typeof data.proyecto === 'string' ? data.proyecto.slice(0, 80) : '',
                moneda: typeof data.moneda === 'string' ? data.moneda.slice(0, 10) : '',
                total_pen: Number.isFinite(data.total_pen) ? data.total_pen : null,
              };
              console.info('[TUPLUS]', new Date().toISOString(), data.event, details);
              res.writeHead(204).end();
            } catch { res.writeHead(400).end(); }
          });
        });
      },
    }],
    server: {
      proxy: {
        '/api': { ...apiProxy },
      },
    },
    preview: {
      proxy: {
        '/api': { ...apiProxy },
      },
    },
  },
});
