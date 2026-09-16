# Verificación de TUPLUS V4

Fecha de preparación: 15/09/2026. Entorno local: servidor estático y navegador Chromium integrado. Esta revisión no sustituye la aceptación formal EQU-02.

## Comprobaciones realizadas

- 45 combinaciones: 3 tipos de sitio × 3 planes × 5 cantidades de extras. Resultado correcto contra los importes de origen.
- Rechazo de tipos y planes desconocidos, valores negativos, fracciones, cantidades fuera de rango y extras fuera de los grupos permitidos.
- Validación de correos y teléfonos; conservación de acentos, saltos de línea y caracteres como `&`, `+` y `#` en el enlace de WhatsApp.
- 254 referencias internas en 8 páginas, sin destinos inexistentes ni identificadores duplicados. Un H1 por página.
- JavaScript sin errores de sintaxis. Sin errores ni advertencias de consola en los recorridos de interfaz realizados.
- Pantallas de 320, 390, 768, 1280 y 1440 píxeles de ancho. Sin desbordamiento horizontal detectado. Inspección visual de portada, cotizador y página Web en las vistas utilizadas.
- Apertura y cierre del menú móvil, incluido Escape. Estados de navegación y enfoque visibles.
- Cambio a tienda + Profesional + 10 extras: S/ 1,800.00. Cambio a landing + Corporativo + 20 extras: S/ 3,300.00.
- Cambio entre los pasos del cotizador conservando la selección. Resumen, descarga y mensaje utilizan el mismo cálculo.
- Descarga de la estimación activada desde la interfaz. El archivo se genera sin los datos personales del formulario.
- Campos vacíos e información de contacto inválida bloqueados; consentimiento obligatorio sin marcar inicialmente.
- Preparación de consultas con datos ficticios de prueba. El enlace conserva el detalle del cálculo y la información de contacto. No se abrió el enlace externo ni se envió el mensaje.
- Si se editan los datos después de preparar una consulta, el enlace anterior se retira hasta volver a generarlo.
- Filtro Commerce: un concepto visible. Apertura y cierre de su detalle.
- Navegación a la página Web y regreso a contacto con Diseño web seleccionado.
- Logo original conservado; sin dependencias de fuentes, imágenes o bibliotecas remotas.

## Pendiente para lanzamiento

Pruebas de entrega con el contacto autorizado, segundo navegador, dispositivos reales, auditoría completa de accesibilidad y rendimiento, textos y condiciones comerciales, política legal, configuración de SEO de producción, analítica aprobada, hosting y reversión. El proyecto conserva `noindex` mientras siga en revisión.

Esta entrega no incluye base de datos, correo automático, panel administrativo ni CMS. El estado del brief por requisito se detalla en `LEEME.md`.
