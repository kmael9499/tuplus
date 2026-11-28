/* Protecciones del navegador. Tras cada `astro build`:
     - Inserta en el <head> de cada página la Content-Security-Policy (meta) con los scripts en línea
       autorizados por hash (sin 'unsafe-inline'), Referrer-Policy y un script anti-incrustación.
       GitHub Pages no permite cabeceras HTTP, por eso van como <meta>.
     - Genera dist/.htaccess para Hostinger (Apache/LiteSpeed) con las cabeceras HTTP reales, HTTPS
       obligatorio, compresión, caché, bloqueo de archivos internos y página 404.
   La lista de servicios externos permitidos está en ORIGENES. Si se agrega una API nueva, va ahí. */
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGENES = {
  // APIs que la web consulta con fetch()
  conexion: [
    'https://tuplusadminpanel.onrender.com',                   // ERP: cotizaciones, cupones y descuentos
    'https://tuplus-partners-api-production.up.railway.app',   // Portal Partners: postulaciones
    'https://api.frankfurter.dev',                             // tipo de cambio de referencia
  ],
  // Banderas de países del cotizador y de la red de socios
  imagenes: ['https://flagcdn.com'],
};

const ANTI_IFRAME =
  "if(window.top!==window.self){document.documentElement.style.display='none';try{window.top.location=window.self.location.href}catch(e){}}";

const hash = (texto) => "'sha256-" + createHash('sha256').update(texto, 'utf8').digest('base64') + "'";

export function construirCsp(scriptsEnLinea) {
  const hashes = [...new Set([...scriptsEnLinea, ANTI_IFRAME].map(hash))].join(' ');
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    `img-src 'self' data: blob: ${ORIGENES.imagenes.join(' ')}`,
    "media-src 'self'",
    `connect-src 'self' ${ORIGENES.conexion.join(' ')}`,
    "frame-src 'none'",
    "worker-src 'none'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    'upgrade-insecure-requests'
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

/* Configuración para Hostinger (Apache o LiteSpeed). GitHub Pages ignora este archivo.
   `base` es la carpeta donde vive el sitio: '' si está en la raíz del dominio, '/tuplus' si está en una subcarpeta. */
export function construirHtaccess(todosLosScripts, base = '') {
  const csp = construirCsp(todosLosScripts) + "; frame-ancestors 'none'";
  return `# Generado por scripts/seguridad-navegador.mjs en cada build. No editar a mano.
# Pensado para Hostinger (LiteSpeed/Apache). Requiere el certificado SSL activo en el panel.

Options -Indexes
ServerSignature Off
AddDefaultCharset utf-8
DirectoryIndex index.html
ErrorDocument 404 ${base}/404.html
ErrorDocument 403 ${base}/404.html

<IfModule mod_mime.c>
  AddType image/svg+xml .svg
  AddType image/webp .webp
  AddType font/woff2 .woff2
  AddType audio/mpeg .mp3
  AddCharset utf-8 .html .css .js .svg .txt
</IfModule>

<IfModule mod_rewrite.c>
  RewriteEngine On

  # Siempre por HTTPS
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !https
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]

  # Archivos internos: ocultos (devuelven 404, no 403, para no confirmar que existen)
  RewriteRule (^|/)\\.(?!well-known/) - [R=404,L]
  RewriteRule \\.(md|map|json|lock|log|sql|env|ini|bak|old|orig|sh|cjs|mjs|ts|astro)$ - [R=404,L]

  # Páginas de acceso antiguas: el acceso de socios vive en el Portal TUPLUS Partners
  RewriteRule ^(acceso|portal-socios|restablecer)\\.html$ https://tuplus-partners-portal.vercel.app/acceso [R=301,L]
</IfModule>

<IfModule mod_headers.c>
  Header always set Content-Security-Policy "${csp}"
  Header always set Strict-Transport-Security "max-age=31536000"
  Header always set X-Frame-Options "DENY"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()"
  Header always set Cross-Origin-Opener-Policy "same-origin"
  Header always set Cross-Origin-Resource-Policy "same-origin"
  Header always set X-Permitted-Cross-Domain-Policies "none"
  Header always unset X-Powered-By
  Header unset X-Powered-By

  # Caché: las páginas se revisan siempre; CSS y JS llevan huella (?v=) y pueden guardarse un año.
  <FilesMatch "\\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <FilesMatch "\\.(css|js|woff2)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  <FilesMatch "\\.(svg|webp|png|jpg|jpeg|ico|mp3)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>
</IfModule>

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/plain application/javascript text/javascript image/svg+xml application/json
</IfModule>
<IfModule mod_brotli.c>
  AddOutputFilterByType BROTLI_COMPRESS text/html text/css text/plain application/javascript text/javascript image/svg+xml application/json
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

/* La 404 se muestra en cualquier ruta que no exista (por ejemplo /soluciones/x/y). Con <base> sus enlaces
   relativos (CSS, JS, imágenes y menú) apuntan siempre a la carpeta del sitio. */
export function fijarBase404(html, base) {
  if (/<base\s/i.test(html)) return html;
  return html
    .replace(/<head[^>]*>/i, (cabecera) => `${cabecera}<base href="${base}/">`)
    .replace(/href="#([\w-]+)"/g, 'href="404.html#$1"');
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
  let base = '';
  return {
    name: 'tuplus-seguridad-navegador',
    hooks: {
      'astro:config:done': ({ config }) => { base = (config.base || '/').replace(/\/+$/, ''); },
      'astro:build:done': async ({ dir, logger }) => {
        const carpeta = fileURLToPath(dir);
        const lista = await archivosHtml(carpeta);
        const todos = [];
        for (const ruta of lista) {
          let html = await readFile(ruta, 'utf8');
          if (html.includes('http-equiv="Content-Security-Policy"')) continue;
          if (ruta === join(carpeta, '404.html')) html = fijarBase404(html, base);
          todos.push(...scriptsEnLinea(html));
          await writeFile(ruta, protegerHtml(html), 'utf8');
        }
        await writeFile(join(carpeta, '.htaccess'), construirHtaccess(todos, base), 'utf8');
        await writeFile(join(carpeta, 'robots.txt'), 'User-agent: *\nAllow: /\n', 'utf8');
        logger.info(`CSP, Referrer-Policy y anti-incrustación aplicados a ${lista.length} páginas; .htaccess generado (base "${base || '/'}")`);
      }
    }
  };
}
