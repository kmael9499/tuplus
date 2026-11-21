
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import seguridadNavegador from './scripts/seguridad-navegador.mjs';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), 'TUPLUS_');
const apiProxy = {
  target: env.TUPLUS_API_PROXY_TARGET?.trim() || 'https://tuplusadminpanel.onrender.com',
  changeOrigin: true,
};

// En local, /tuplus y / se redirigen a /tuplus/ (las rutas del sitio son relativas y
// sin la barra final se resolverían fuera de la base, como /css/style.css).
const redirigirABase = {
  name: 'tuplus-redirigir-base',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const [ruta, consulta = ''] = (req.originalUrl || req.url || '').split('?');
      if (ruta === '/' || ruta === '/tuplus') {
        res.statusCode = 302;
        res.setHeader('Location', '/tuplus/' + (consulta ? '?' + consulta : ''));
        res.end();
        return;
      }
      next();
    });
  },
};

export default defineConfig({
  base: '/tuplus',
  integrations: [seguridadNavegador()],

  build: { format: 'file', inlineStylesheets: 'always' },
  compressHTML: false,
  server: { host: true, port: 4321 },
  vite: {
    plugins: [redirigirABase, {
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
              console.info('[TUPLUS]', new Date().toISOString(), data.event);
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
