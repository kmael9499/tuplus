# Protecciones del navegador

El sitio se publica en GitHub Pages, que **no permite configurar cabeceras HTTP**. Por eso
`scripts/seguridad-navegador.mjs` (integración de Astro, corre en cada `astro build`) añade a cada página:

- **Content-Security-Policy** como `<meta>`. Los scripts en línea se autorizan por hash (no `unsafe-inline`).
  Si añades un servicio externo (API, fuente, script, imagen), agrégalo a la lista en ese archivo o el navegador lo bloqueará.
- **Referrer-Policy** `strict-origin-when-cross-origin` como `<meta>`.
- **Anti-incrustación**: un script que saca la página de un iframe ajeno.

## Hostinger (Apache/LiteSpeed)
Cada build genera `dist/.htaccess` con las cabeceras reales: CSP con `frame-ancestors 'none'`, `X-Frame-Options: DENY`,
`Referrer-Policy`, `X-Content-Type-Options` y `Permissions-Policy`. Al subir `dist/` a `public_html`:
1. Sube también `.htaccess` (es un archivo oculto; activa "mostrar archivos ocultos" en el Administrador de archivos o FTP).
2. Comprueba con `curl -I https://tudominio.com/` que aparecen las cabeceras.
3. Si el sitio queda en la raíz del dominio y no en `/tuplus`, cambia `base` en `astro.config.mjs`.

GitHub Pages ignora el `.htaccess` (allí solo actúan los `<meta>`).

## Límites
`frame-ancestors` y `X-Frame-Options` solo funcionan como cabecera HTTP; el script anti-incrustación es una mitigación
más débil. Para protección completa, poner el sitio detrás de Cloudflare (u otro host con cabeceras) y enviar:

```
Content-Security-Policy: (la misma política) ; frame-ancestors 'none'
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=()
```
