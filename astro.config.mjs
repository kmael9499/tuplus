import { defineConfig } from 'astro/config';

// Mantiene las mismas URLs que el sitio actual (index.html, cotizador.html, soluciones/web.html…)
// y el HTML tal cual, sin comprimir.
export default defineConfig({
  build: { format: 'file' },
  compressHTML: false,
  server: { host: true, port: 4321 },
});
