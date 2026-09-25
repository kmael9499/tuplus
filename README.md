# TUPLUS · Versión corregida con Rama-Dennys

## Cómo probarlo
1. Extrae TODO el ZIP, no solo index.html.
2. Abre la carpeta TUPLUS-CORREGIDO-V2 en Visual Studio Code.
3. Abre index.html con Live Server. No necesitas instalar dependencias ni un framework.
4. Pulsa «Cotizar mi web» para abrir cotizador.html.

También puedes abrir index.html directamente. Live Server es preferible para probar los recursos, la persistencia y la actualización del cambio.

## Qué se integró
- La portada completa de Rama-Dennys sobre la integración anterior: presentación con tres vistas, cinco tarjetas con imágenes, carrusel de cinco conceptos, servicios, proceso, nosotros, preguntas y contacto.
- Las páginas de soluciones y los recursos de main, con su tema claro/oscuro e idiomas.
- El cotizador completo de main, separado del inicio: cinco tipos de proyecto, páginas, contenido, doce funciones, tres diseños, soporte, prioridad, Cloud, IGV, rango y plazo estimados.
- Un solo cotizador visible. El menú, botones y páginas de soluciones llevan a cotizador.html.
- Descarga de resumen TXT, impresión/PDF del resumen y apertura de WhatsApp con la selección completa.
- Colores azul marino, dorado y fondos claros; logotipo original; transiciones, entradas de secciones, tarjetas y progreso animados. Se respeta la preferencia del dispositivo de reducir movimiento.
- Quitados el identificador @azziz, la A, «Software Engineering × AI» y «Reiniciar» de la interfaz solicitada.

## Correcciones de esta entrega
- Recuperadas las cinco tarjetas con imágenes que antes aparecían como enlaces sueltos.
- Recuperado el carrusel de Rama-Dennys y corregido el contraste de sus ilustraciones en ambos temas.
- Añadidas entradas al desplazarse en servicios, proceso, nosotros, contacto y pie, más movimiento suave en las ilustraciones. Se respeta «reducir movimiento».
- Menús, formularios, tarjetas, pasos y resumen reorganizados para celulares y tabletas.
- Eliminada únicamente la franja solicitada de «DISEÑO RESPONSIVE … PRECIO EN USD». Se conservan las demás secciones y funciones.
- Recursos con versión en la URL para evitar estilos antiguos en caché.

## Idiomas y monedas
El sitio conserva español, inglés, portugués, francés, alemán, ruso, chino y japonés. Se añadieron traducciones del cotizador. El país comienza en Perú y la moneda en soles (PEN, símbolo S/). Cambiar el país ajusta la moneda: México → MXN, Colombia → COP, España → EUR, etc. Hay 26 países y la opción «Otro país». También se puede elegir la moneda manualmente; cambiar nuevamente de país restablece su moneda. Cambiar de idioma conserva país y moneda. No se utiliza ubicación por IP ni GPS. Los datos antiguos guardados en dólares sin país se migran a Perú/soles, manteniendo el alcance del proyecto.

Monedas: USD, PEN, EUR, BRL, MXN, COP, CLP, ARS, UYU, BOB, PYG, CRC, GTQ, DOP, HNL, CNY, JPY, RUB, GBP y CAD.

Los precios base de main se conservan en USD. currencies.js contiene una copia de las referencias consultadas en https://api.frankfurter.dev/v2/rates?base=USD el 25/09/2026; cada moneda conserva la fecha de su dato. «Actualizar cambio» consulta Frankfurter y conserva la referencia anterior si falla. No se promete cambio en tiempo real. Las cifras mostradas se redondean a unidades; puede haber pequeñas diferencias entre la suma de líneas convertidas y el total convertido. Las tarifas y el alcance final requieren confirmación comercial.

La selección del proyecto, el país, la moneda y el tipo de cambio se guardan localmente; los datos personales del formulario no. Las preferencias de idioma y tema también se conservan. El resumen descargado sí incluye los datos que escribe el visitante.

## Archivos para editar
- index.html: página principal.
- style.css / theme.css / redesign.css / motion.css / polish.css / responsive-v2.css: presentación de las páginas corporativas.
- script.js: menú y contacto corporativo. redesign.js: tres vistas de la portada. carrusel.js / carrusel.css: cinco conceptos de proyectos. motion.js: entradas de contenido al desplazarse.
- cotizador.html: contenido del cotizador nuevo.
- styles.css / cotizador-tuplus.css / quote-responsive-v2.css: diseño del cotizador.
- cotizador.js: catálogo, tarifas USD, cálculo, pasos, resumen y validaciones.
- countries.js: correspondencia entre país y moneda. No requiere crear tablas ni alterar una base de datos.
- quote-nav.js: menú del cotizador en celulares.
- currencies.js: monedas, referencias cambiarias y actualización.
- config.js: WhatsApp comercial y activación opcional del servidor. Las claves de planes antiguos se conservan por compatibilidad; las tarifas del cotizador visible están en cotizador.js.
- js/quote-translations.js: traducciones añadidas. js/i18n-data.js e i18n.js: idiomas heredados.
- procesar_cotizacion.php, admin.php, server-config.php, database.sql: backend opcional de main.

## Backend opcional (PHP + MySQL)
La web, el cálculo, la descarga y WhatsApp funcionan sin base de datos. El registro en servidor está desactivado de forma explícita en esta entrega.

Para activarlo en un entorno propio:
1. Importa database.sql en MySQL.
2. Configura en el servidor TUPLUS_DB_HOST, TUPLUS_DB_USER, TUPLUS_DB_PASS y TUPLUS_DB_NAME. Por compatibilidad se admiten también los nombres AZZIZ_DB_* originales.
3. Define TUPLUS_QUOTES_ENABLED=1 y cambia quoteBackendEnabled a true en config.js.
4. Define TUPLUS_ADMIN_USER y TUPLUS_ADMIN_PASSWORD para abrir admin.php. El panel requiere autenticación; en un hosting utiliza HTTPS.
5. Sirve la carpeta con PHP (por ejemplo, XAMPP). Live Server no ejecuta PHP.

No se incluyen contraseñas ni se modifica una base de datos existente. El total del panel se conserva en USD, y las notas guardan empresa, país con su código, moneda mostrada y cambio utilizado. procesar_cotizacion.php recibe el país de forma explícita; se conserva el esquema SQL existente. El registro es una solicitud estimada, no una orden de cobro. El mensaje de WhatsApp lo revisa y envía el visitante.

## Revisión
Consulta VERIFICACION.md para las pruebas realizadas y sus límites. La versión mantiene noindex, nofollow como los originales. El ZIP no publica ni reemplaza automáticamente ningún sitio.
