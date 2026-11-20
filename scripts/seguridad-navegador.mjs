/* Protecciones del navegador para un sitio en GitHub Pages (que no permite configurar cabeceras HTTP).
   Tras cada `astro build` inserta en el <head> de cada página:
     - Content-Security-Policy (meta): los scripts en línea se autorizan por hash, no con 'unsafe-inline'.
     - Referrer-Policy (meta).
     - Un script anti-incrustación (frame-busting), porque `frame-ancestors` y `X-Frame-Options` solo
       funcionan como cabecera HTTP y se ignoran en <meta>.
   Si el sitio pasa a un host con cabeceras (Cloudflare, Netlify, Vercel), conviene enviar también las
   cabeceras reales; ver docs/seguridad-cabeceras.md. */
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ANTI_IFRAME =
  "if(window.top!==window.self){document.documentElement.style.display='none';try{window.top.location=window.self.location.href}catch(e){}}";

const hash = (texto) => "'sha256-" + createHash('sha256').update(texto, 'utf8').digest('base64') + "'";

export function construirCsp(scriptsEnLinea) {
  const hashes = [...new Set([...scriptsEnLinea, ANTI_IFRAME].map(hash))].join(' ');
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://flagcdn.com",
    "media-src 'self' blob:",
    "connect-src 'self' http://localhost:8080 https://tuplusadminpanel.onrender.com https://tuplus-partners-api-production.up.railway.app https://api.frankfurter.dev https://countriesnow.space",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
}

export function scriptsEnLinea(html) {
  const scripts = [];
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const atributos = m[1];
    if (/\bsrc\s*=/i.test(atributos)) continue;
    const tipo = /\btype\s*=\s*["']?([^"'\s>]+)/i.exec(atributos)?.[1]?.toLowerCase();
    if (tipo && tipo !== 'module' && tipo !== 'text/javascript') continue; // JSON-LD y similares no se ejecutan
    if (m[2].trim() === '') continue;
    scripts.push(m[2]);
  }
  return scripts;
}

/* Cabeceras HTTP reales para hosting con Apache/LiteSpeed (Hostinger). GitHub Pages ignora este archivo. */
export function construirHtaccess(todosLosScripts) {
  const csp = construirCsp(todosLosScripts) + "; frame-ancestors 'none'";
  return `# Generado por scripts/seguridad-navegador.mjs en cada build. No editar a mano.
<IfModule mod_headers.c>
  Header always set Content-Security-Policy "${csp}"
  Header always set X-Frame-Options "DENY"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
</IfModule>
`;
}

export function protegerHtml(html) {
  const scripts = scriptsEnLinea(html);
  const bloque =
    `<meta http-equiv="Content-Security-Policy" content="${construirCsp(scripts)}">` +
    `<meta name="referrer" content="strict-origin-when-cross-origin">` +
    `<script>${ANTI_IFRAME}</script>`;
  if (!/<head[^>]*>/i.test(html)) return html;
  return html.replace(/<head[^>]*>/i, (cabecera) => cabecera + bloque);
}

async function archivosHtml(carpeta) {
  const salida = [];
  for (const e of await readdir(carpeta, { withFileTypes: true })) {
    const ruta = join(carpeta, e.name);
    if (e.isDirectory()) salida.push(...(await archivosHtml(ruta)));
    else if (e.name.endsWith('.html')) salida.push(ruta);
  }
  return salida;
}

export default function seguridadNavegador() {
  return {
    name: 'tuplus-seguridad-navegador',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const carpeta = fileURLToPath(dir);
        const lista = await archivosHtml(carpeta);
        const todos = [];
        for (const ruta of lista) {
          const html = await readFile(ruta, 'utf8');
          if (html.includes('http-equiv="Content-Security-Policy"')) continue;
          todos.push(...scriptsEnLinea(html));
          await writeFile(ruta, protegerHtml(html), 'utf8');
        }
        await writeFile(join(carpeta, '.htaccess'), construirHtaccess(todos), 'utf8');
        logger.info(`CSP, Referrer-Policy y anti-incrustación aplicados a ${lista.length} páginas; .htaccess generado`);
      }
    }
  };
}
