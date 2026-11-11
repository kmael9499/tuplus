
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'development', process.cwd(), 'TUPLUS_');
const apiProxy = {
  target: env.TUPLUS_API_PROXY_TARGET?.trim() || 'https://tuplusadminpanel.onrender.com',
  changeOrigin: true,
};

export default defineConfig({
  base: '/tuplus',

  build: { format: 'file', inlineStylesheets: 'always' },
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
