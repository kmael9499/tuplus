# Verificación de idiomas y contacto — 18/11/2026

## Alcance

Las once páginas públicas con selector de idioma cargan `site-translations.js` antes de `i18n.js`. Se conservan español, inglés, chino, ruso, portugués, francés, japonés y alemán. Se corrigieron bloqueos `translate="no"` en navegación, encabezados y el formulario de socios. Las marcas, datos del visitante, códigos de moneda y los países gestionados con `Intl.DisplayNames` mantienen su tratamiento propio.

`tests/translation-coverage.test.cjs` comprueba las entradas por página, los siete idiomas adicionales, los textos administrados por `data-xd` en el cotizador, el orden de carga y los elementos que habían quedado bloqueados. Comprueba también ciclos de cambio de idioma y el retorno al español. No sustituye una revisión visual de todos los tamaños de pantalla ni una revisión lingüística editorial.

## Reglas del formulario de contacto de inicio

- Correo: una dirección pública, con parte local de hasta 64 caracteres ASCII y longitud total de hasta 254 después de normalizar el dominio internacional. Se rechazan espacios interiores, controles, múltiples `@`, partes vacías, puntos iniciales/finales/consecutivos, etiquetas de dominio de más de 63 caracteres, guiones en sus extremos y símbolos no admitidos en el dominio. Se permiten subdominios, `+`, apóstrofes y los demás símbolos admitidos en la parte local sin comillas. Los dominios internacionales se validan en su forma ASCII (IDN).
- Se usa el formato habitual de un formulario web, sin nombres de presentación, comentarios, dominios IP ni partes locales entre comillas. No se admite SMTPUTF8 en la parte local. No se verifica DNS ni se afirma que exista el buzón: eso requiere confirmación por correo.
- Teléfono: `+`, código internacional comenzando por 1–9 y entre 7 y 15 dígitos en total. Se permiten espacios, puntos, guiones y grupos numéricos entre paréntesis equilibrados. No se aceptan letras, extensiones ni saltos de línea. No se comprueba la asignación real de cada número.
- Nombre: entre 2 y 80 caracteres, al menos dos letras; admite otros alfabetos, acentos, apóstrofes, guiones e iniciales. Rechaza números, controles y separadores mal ubicados.
- Empresa: entre 2 y 100 caracteres y al menos una letra. Admite números y puntuación comercial habitual, incluyendo `&`, `C#`, paréntesis y símbolos monetarios. No se intenta verificar su existencia jurídica.
- País: selección de la lista de 249 países y territorios, con código estable y etiqueta localizada.
- Mensaje: de 20 a 1000 caracteres, con letras; permite párrafos, enlaces, signos y emojis. Rechaza mensajes formados solo por números/símbolos y controles no imprimibles o de dirección del texto. No se pretende inferir si el contenido tiene sentido.
- Los límites se vuelven a comprobar al preparar el mensaje. La autorización para compartir datos sigue siendo obligatoria. Los datos se codifican en el enlace de WhatsApp; este formulario no envía una solicitud al backend.

Referencias: [formato de correo en HTML](https://html.spec.whatwg.org/multipage/input.html#email-state-(type=email)) y [límites SMTP, RFC 5321 §4.5.3.1](https://www.rfc-editor.org/rfc/rfc5321#section-4.5.3.1).

## Comprobaciones

```text
npm.cmd run build
node tests/translation-coverage.test.cjs
node tests/site.test.cjs
node tests/i18n.test.cjs
node tests/partner.test.cjs
node tests/partner-application.test.cjs
node tests/socios.test.cjs
node tests/socios-application.test.cjs
node tests/navigation.test.cjs
```

`site.test.cjs` incluye las pruebas de integración de contacto y los 117 casos de `contact-validation.test.cjs`. Las pruebas de contacto comprueban rechazo y conservación de datos al cambiar de idioma, consentimiento y codificación de WhatsApp.

La suite general conserva un fallo anterior en `tests/quote.test.cjs` (2340 obtenido frente a 2790 esperado). Se reprodujo con los archivos anteriores a las correcciones. No se han cambiado los cálculos de `calculate` ni el tarifario de `cotizador.js` como parte de este trabajo.

El login alojado en `tuplus-partners-portal.vercel.app` es otra aplicación: estos cambios traducen el enlace de acceso, pero no modifican ese portal externo.
