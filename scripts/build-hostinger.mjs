/* Compila el sitio para Hostinger, en la raíz del dominio (public_html).
   Si se publica en una subcarpeta, indícala: node scripts/build-hostinger.mjs /tuplus
   Funciona igual en Windows, macOS y Linux. */
import { build } from 'astro';

process.env.TUPLUS_BASE = process.argv[2] || '/';
await build({});
console.log(`\nListo. Sube el CONTENIDO de la carpeta dist/ (incluido el archivo oculto .htaccess) a public_html${process.env.TUPLUS_BASE === '/' ? '' : process.env.TUPLUS_BASE}.`);
