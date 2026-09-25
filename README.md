# @azziz — Cotizador Web Premium

Fusiona el flujo del cotizador clásico con una interfaz premium en dark mode, 3D CSS y microinteracciones. Todo el cálculo visible está en **USD**.

## Qué incluye

- Cotizador de 5 pasos.
- Landing, corporativa, catálogo, e-commerce y aplicación web/SaaS.
- Páginas configurables de 1 a 20.
- Contenido profesional opcional.
- 12 funcionalidades adicionales.
- Diseño Clean / Custom UI / Premium Motion.
- Soporte de 30 / 90 / 180 días.
- Entrega prioritaria opcional.
- Pack Cloud anual opcional.
- Selector para mostrar IGV 18%.
- Estimación, rango orientativo y tiempo de entrega.
- Guardado automático en `localStorage`.
- Descarga de resumen `.txt`.
- Impresión / PDF desde el navegador.
- Botón flotante de **WhatsApp** y botón para enviar la cotización completa a WhatsApp.
- Endpoint PHP opcional + panel `admin.php`.
- Esquema `database.sql` listo para MySQL.
- Responsive móvil / tablet / escritorio.
- Colibrí de la marca integrado como elemento 3D animado con profundidad, glow, órbita, partículas y tilt con cursor.
- Selector global **Soles (PEN) / Dólares (USD)** con conversión visible y guardado de preferencia.
- El tipo de cambio de referencia está centralizado en `PEN_PER_USD` dentro de `script.js` para editarlo fácilmente.
- 3D y motion hechos con CSS/JS; no necesitas un framework.

## Ejecutar en local

### Solo frontend

Abre `index.html` o levanta un servidor estático:

```bash
python3 -m http.server 5500
```

Luego entra a `http://localhost:5500`.

### Con PHP

```bash
php -S localhost:8000
```

Abre `http://localhost:8000`.

El frontend seguirá funcionando aunque el PHP o MySQL no estén configurados.

## MySQL + panel

1. Crea la base con `database.sql`.
2. Configura variables de entorno:
   - `AZZIZ_DB_HOST`
   - `AZZIZ_DB_USER`
   - `AZZIZ_DB_PASS`
   - `AZZIZ_DB_NAME`
3. Abre `admin.php` para ver las solicitudes.

## Moneda

El proyecto trabaja internamente con precios base en USD y muestra el equivalente en PEN cuando se selecciona Soles. El valor de referencia incluido es **1 USD = S/ 3.55**; está pensado para que puedas editarlo según el tipo de cambio que quieras usar en tus cotizaciones.

## WhatsApp

El número configurado en el proyecto es **+51 916 828 870**, tomado del cotizador original que se fusionó. Para cambiarlo, edita `WHATSAPP_NUMBER` en `script.js`.

## Nota de precios

Los importes son una **estimación editable** del proyecto, no una tarifa universal de mercado. La estructura se inspiró en la idea de cotización por etapas y en componentes visibles en la referencia pública de KOM, pero el diseño, copy, valores y marca del cotizador son propios de @azziz.
