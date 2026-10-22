# Imágenes según el idioma

Las imágenes de las cinco soluciones contienen texto dibujado dentro de ellas. El traductor del HTML no puede modificarlo. Por eso cada imagen tiene una versión independiente por idioma.

- Español: se conservan los cinco archivos originales en `imagenes/`.
- Inglés, chino simplificado, japonés, portugués, francés, alemán y ruso: cinco archivos por idioma en `imagenes/idiomas/`.
- Las tarjetas de inicio y las páginas interiores usan los mismos archivos traducidos.
- El selector conserva el idioma elegido al navegar entre páginas, mediante la preferencia local existente.
- Los logotipos y las otras imágenes del sitio no cambian.

## Integración

Subir la carpeta completa `imagenes/idiomas`, el archivo `i18n.js`, `index.html` y los cinco HTML de `soluciones`. Integrar también las correcciones de traducción previas si todavía no están en la rama del equipo.

No subir solamente los HTML: sin los nuevos archivos de imagen aparecerían referencias rotas. La publicación no requiere un servicio de traducción ni una API de imágenes.

## Mantenimiento

`data-i18n-image` conserva la ruta española de cada imagen. El motor selecciona el archivo del idioma actual; al volver a español restaura la ruta original. Los atributos alternativos siguen usando el diccionario de textos del sitio.

Las variantes se crearon con la herramienta integrada de edición de imágenes, usando cada original como referencia. Las instrucciones están en `imagenes/idiomas/PROMPTS.json`. Son recreaciones localizadas: pueden existir pequeñas variaciones gráficas respecto al original. Los nombres de marca, personas y empresas de ejemplo se conservan.

## Pruebas

```sh
npm install --no-save --package-lock=false linkedom@0.18.13
node tests/images.test.cjs
node tests/i18n.test.cjs
node tests/quote.test.cjs
```

Las pruebas de imágenes verifican la existencia de los archivos y su selección en los ocho idiomas, en las tarjetas y páginas interiores. No verifican por sí solas la ortografía dibujada en la imagen. No subir `node_modules`.
