
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import seguridadNavegador from './scripts/seguridad-navegador.mjs';
import optimizar from './scripts/optimizar-dist.mjs';

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
  // GitHub Pages publica en /tuplus. Para Hostinger (raíz del dominio) usar `npm run build:hostinger`.
  base: process.env.TUPLUS_BASE || '/tuplus',
  integrations: [optimizar(), seguridadNavegador()],

  build: { format: 'file', inlineStylesheets: 'always' },
  compressHTML: false,
  server: { host: true, port: 4321 },
  vite: {
    plugins: [redirigirABase],
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
