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
