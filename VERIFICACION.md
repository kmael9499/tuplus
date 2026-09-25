# Verificación · 25/09/2026

- Nueve páginas HTML: archivos y anclas locales comprobados, sin identificadores duplicados.
- Catorce archivos JavaScript: sintaxis comprobada. Sintaxis de los archivos PHP comprobada con PHP 8.2.12.
- 145 comprobaciones automatizadas del cotizador: tarifas originales, páginas, extras, IGV, veinte monedas, veintisiete opciones de país, selección automática/manual, persistencia, migración de la versión antigua, datos inválidos, resumen, URL de WhatsApp y siete traducciones adicionales.
- Navegador: Perú inicia en PEN y precios S/; México cambia a MXN y Japón a JPY. Los selectores de país de la portada y del contacto se sincronizan. Una moneda manual se conserva al cambiar idioma.
- Recorridos los cinco pasos en móvil; comprobada la validación y la descarga del resumen TXT con datos de prueba.
- Cotizador revisado en anchos de 320, 390, 768, 1024 y 1440 px, sin controles fuera del ancho visible. Portada y otras siete páginas comprobadas a 320 px sin desbordamiento horizontal ni imágenes fallidas.
- Revisión visual de portada, solución web, carrusel y cotizador en móvil; portada y cotizador en escritorio; carrusel en tableta. Temas claro y oscuro comprobados.
- Cinco tarjetas de soluciones recuperadas, cinco conceptos en el carrusel y controles para cambiar de concepto comprobados. Restauradas las tres vistas de la presentación principal.
- Entradas al desplazarse y animaciones con reglas que respetan la preferencia de movimiento reducido.
- Sin errores de JavaScript registrados durante el recorrido del navegador.
- PHP: comprobadas las respuestas de método incorrecto y servicio/panel sin configurar. No se accedió a MySQL.

## Límites

- No se enviaron mensajes reales por WhatsApp ni se publicó el sitio.
- El servidor opcional está desactivado. No se probó una inserción en una base de datos real.
- La referencia cambiaria fechada se conserva de la entrega anterior; la actualización manual de tasas requiere conexión. No se promete cambio en tiempo real.
- Los tamaños de móvil se comprobaron mediante el navegador, no en todos los modelos de teléfono ni en Safari de iPhone.
- Imprimir/PDF conserva sus estilos; no se verificó una impresión física.
- Las traducciones heredadas y añadidas requieren revisión editorial antes de publicar. No se trata de una certificación de accesibilidad.

Para repetir las pruebas desde esta carpeta: `node tests/quote.test.cjs`.
