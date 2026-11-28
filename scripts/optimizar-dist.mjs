/* Optimización de dist/ tras cada `astro build` (no cambia el aspecto ni el comportamiento):
     1. Minifica los .js y .css copiados desde public/ (esbuild, que ya instala Astro).
        Los scripts siguen siendo scripts clásicos: esbuild no renombra variables globales sin "format".
     2. Cambia el ?v= de cada CSS/JS enlazado por una huella de su contenido (las imágenes no: los scripts
        también las piden sin ?v= y se descargarían dos veces). Así el navegador solo
        vuelve a descargar un archivo cuando cambia y el servidor puede guardarlo en caché un año.
     3. Quita de dist/ archivos que no deben publicarse (notas, mapas de código). */
import { transform } from 'esbuild';
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

async function listar(carpeta) {
  const salida = [];
  for (const e of await readdir(carpeta, { withFileTypes: true })) {
    const ruta = join(carpeta, e.name);
    if (e.isDirectory()) salida.push(...(await listar(ruta)));
    else salida.push(ruta);
  }
  return salida;
}

const huella = (buffer) => createHash('sha256').update(buffer).digest('hex').slice(0, 10);

export async function optimizarDist(carpeta, logger = console) {
  const archivos = await listar(carpeta);
  let antes = 0, despues = 0;

  // 1. Minificar (los .min.js de terceros ya vienen minificados)
  for (const ruta of archivos) {
    const esJs = ruta.endsWith('.js') && !ruta.endsWith('.min.js');
    const esCss = ruta.endsWith('.css');
    if (!esJs && !esCss) continue;
    const codigo = (await readFile(ruta, 'utf8')).replace(/^﻿/, '');
    const resultado = await transform(codigo, {
      loader: esJs ? 'js' : 'css',
      minify: true,
      legalComments: 'none',
      charset: 'utf8',
      target: esJs ? 'es2020' : ['chrome100', 'firefox100', 'safari15'],
    });
    antes += Buffer.byteLength(codigo);
    despues += Buffer.byteLength(resultado.code);
    await writeFile(ruta, resultado.code, 'utf8');
  }

  // 2. Huellas de contenido en los enlaces de cada página
  const cache = new Map();
  const huellaDe = async (ruta) => {
    if (!cache.has(ruta)) {
      try { cache.set(ruta, huella(await readFile(ruta))); } catch { cache.set(ruta, null); }
    }
    return cache.get(ruta);
  };
  let enlaces = 0;
  for (const pagina of archivos.filter((r) => r.endsWith('.html'))) {
    let html = await readFile(pagina, 'utf8');
    const cambios = [];
    for (const m of html.matchAll(/\b(src|href)="([^"#:]+?\.(?:js|css))(\?v=[^"]*)?"/g)) {
      const destino = resolve(dirname(pagina), m[2]);
      if (!destino.startsWith(carpeta)) continue;
      const h = await huellaDe(destino);
      if (h) cambios.push([m[0], `${m[1]}="${m[2]}?v=${h}"`]);
    }
    for (const [viejo, nuevo] of cambios) { html = html.split(viejo).join(nuevo); enlaces++; }
    await writeFile(pagina, html, 'utf8');
  }

  // 3. Lo que no debe publicarse
  for (const ruta of archivos) {
    if (/\.(md|map)$/i.test(ruta) || /(^|[\\/])\.DS_Store$/.test(ruta)) await rm(ruta, { force: true });
  }

  logger.info(`JS/CSS minificados: ${Math.round(antes / 1024)} KB → ${Math.round(despues / 1024)} KB; ${enlaces} enlaces con huella de contenido`);
}

export default function optimizar() {
  return {
    name: 'tuplus-optimizar-dist',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        await optimizarDist(resolve(fileURLToPath(dir)), logger);
      },
    },
  };
}

// También se puede ejecutar a mano: node scripts/optimizar-dist.mjs dist
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await optimizarDist(resolve(process.argv[2] || 'dist'));
}
