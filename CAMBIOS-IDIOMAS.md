# Corrección de idiomas

## Causa

Algunas entradas japonesas y chinas contenían texto inglés. El motor también intentaba deducir el texto español a partir de traducciones ya visibles; esa deducción era ambigua y podía perderse al actualizar el carrusel. Finalmente, ciertos títulos se traducían por fragmentos: la palabra «un» tenía la traducción inglesa «a» en ambos idiomas.

## Cambios

- Traducciones japonesas y chinas corregidas y entradas faltantes añadidas.
- Títulos de contacto y proyectos traducidos como frases completas, conservando el énfasis visual.
- Claves estables para el carrusel, la presentación y el enlace del pie de página.
- Conservación del texto de origen al alternar idiomas y al recibir cambios dinámicos.
- Progreso del cotizador traducido mediante una frase con variables.
- Versiones de los scripts actualizadas en los HTML para renovar la caché.

Los nombres TuPlus, WhatsApp y otros identificadores de marca se conservan. No se cambiaron las tarifas ni el diseño.

## Archivos para integrar

Revisar los cambios en `i18n.js`, `js/i18n-data.js`, `js/i18n-translations.json`, `carrusel.js`, `redesign.js`, `cotizador.js` y los nueve HTML (incluidos los de `soluciones`). Conservar también `js/quote-translations.js`: sigue siendo necesario.

Este paquete parte del ZIP recibido. Integrarlo en la rama de trabajo del repositorio compartido y revisar el diff antes del commit. Si el equipo ha realizado cambios posteriores, combinarlos; no sustituirlos sin revisión. No subir el ZIP como archivo de la página.

## Validación

- 345 comprobaciones de DOM: nueve páginas, cambios repetidos de idioma, navegación del carrusel, presentación y actualización de textos.
- 145 comprobaciones existentes del cotizador.
- Comprobación de sintaxis de los scripts modificados.

Para repetir las pruebas desde la carpeta del proyecto:

```sh
npm install --no-save --package-lock=false linkedom@0.18.13
node tests/i18n.test.cjs
node tests/quote.test.cjs
```

La dependencia se usa solo para pruebas; no es necesaria para publicar la web. No subir `node_modules` al repositorio. Las pruebas de DOM no sustituyen una revisión visual en teléfono ni una revisión editorial por hablantes nativos.

Tras publicar, esperar a que finalice GitHub Pages y recargar la página. La corrección local no actualiza automáticamente el sitio publicado.
