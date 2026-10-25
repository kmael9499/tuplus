# TUPLUS — Sitio web y cotizador

Sitio de TUPLUS hecho con **Astro** (salida estática) y publicado en **GitHub Pages**. Incluye la portada, cinco páginas de soluciones, privacidad, 404 y un cotizador web de 5 pasos con varias monedas, cupón, resumen descargable y envío por WhatsApp. Está traducido a 8 idiomas.

## Comandos

```bash
npm install       # instalar dependencias
npm run dev       # servidor local con recarga (http://localhost:4321)
npm run build     # genera el sitio en dist/
npm run preview   # sirve dist/ para revisarlo
npm test          # compila y ejecuta los tests de tests/
```

Al hacer push a `main`, el sitio se publica solo (`.github/workflows/deploy.yml`).

## Estructura

```
src/pages/              Páginas (.astro). Las URLs finales son .html (build.format: 'file')
  index.astro           Portada
  cotizador.astro       Cotizador
  privacidad.astro, 404.astro
  soluciones/           web, commerce, systems, automation, data-security
public/                 Se copia tal cual a dist/
  css/                  Hojas de estilo (css/soluciones/ = páginas de soluciones)
  js/                   Scripts (js/soluciones/ = páginas de soluciones)
  imagenes/             Imágenes de soluciones y logotipos (marca/)
  colibri.png           Colibrí de la marca (se usa en casi todas las páginas)
backend/                API (Node + Express y PHP) y base MySQL. Ver backend/README.md
  node/                 API en Node.js + Express
  php/                  Versión anterior en PHP
  database/             database.sql
scripts/                Utilidades de mantenimiento
tests/                  Tests en Node (leen dist/ y public/)
docs/                   Notas de cambios y verificaciones anteriores
```

Las páginas cargan CSS y JS con rutas relativas y `?v=FECHA` para renovar la caché. Si editas un archivo, sube su `?v=` en la página que lo enlaza.

## Dónde cambiar cosas

| Qué | Archivo |
|---|---|
| Número de WhatsApp y configuración general | `public/js/config.js` |
| Tarifas y lógica del cotizador | `public/js/cotizador.js`, `public/js/quote-core.js` |
| Países y monedas | `public/js/countries.js`, `public/js/currencies.js` |
| Cupón del cotizador | `public/js/cotizador-cupon.js` |
| Traducciones | `public/js/i18n-translations.json` y luego `node scripts/build-i18n-data.js` (regenera `js/i18n-data.js`) |
| Textos propios del cotizador traducidos | `public/js/quote-translations.js` |
| Tema claro/oscuro | `public/js/theme.js`, `public/css/theme.css` |

## Backend (Node + Express / PHP + MySQL)

Todo está en `backend/` y se explica en `backend/README.md`. Resumen:

- **Node + Express** (`backend/node`): `cd backend/node`, `npm install`, copia `.env.example` como `.env` con tus datos de MySQL y `npm start`. Ruta principal: `POST /api/cotizaciones`.
- **PHP** (`backend/php`): versión anterior para hosting con PHP.
- **Base de datos** (`backend/database/database.sql`): la usan las dos versiones.

`public/js/cotizador.js` todavía envía la cotización a `procesar_cotizacion.php`, y solo si `quoteBackendEnabled` es `true` en `public/js/config.js`. Si falla, el cotizador sigue funcionando (WhatsApp y descarga). Ningún backend corre en GitHub Pages.

## Pendientes conocidos

- `public/js/i18n.js` busca imágenes traducidas en `imagenes/idiomas/<idioma>/`, pero esa carpeta no existe. En los idiomas distintos al español, cada imagen pide primero el archivo traducido (404) y luego vuelve a la versión en español, así que sus textos siguen en español (ver `docs/IMAGENES-IDIOMAS.md`).
