# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dueños de pequeñas y medianas empresas de Perú y Latinoamérica que quieren una web, tienda online, sistema o automatización. Llegan buscando un precio orientativo antes de hablar con alguien y suelen cerrar la conversación por WhatsApp.

## Product Purpose

Sitio de la agencia TUPLUS: presenta sus cinco soluciones (web, commerce, systems, automation, data-security) y ofrece un cotizador de 5 pasos que calcula un precio estimado en la moneda del visitante. El éxito es que el visitante entienda qué puede pedir, vea un precio creíble y envíe su cotización por WhatsApp.

## Positioning

Precio transparente: el cotizador muestra el costo paso a paso y en la moneda local antes de cualquier contacto. El cierre es humano, por WhatsApp.

## Capabilities and Constraints

- Astro estático publicado en GitHub Pages; sin backend en producción (el PHP de `backend/` es opcional y no corre allí).
- Cotizador: tipo de proyecto, alcance, funciones, diseño/soporte, contacto; 20 monedas, 27 países, cupón, IGV, resumen TXT y envío a WhatsApp.
- Los precios son estimaciones editables, no tarifas cerradas.

## Brand Commitments

- Nombre TUPLUS. Azul marino y dorado; colibrí de la marca (`public/colibri.png`) y logotipos en `public/imagenes/marca/`.
- Conservar los nombres de marca (TuPlus, WhatsApp) sin traducir.

## Evidence on Hand

- Imágenes de las cinco soluciones en `public/imagenes/`.
- No hay testimonios, clientes ni casos reales en el repositorio: no inventarlos.

## Product Principles

- El precio se ve antes de pedir datos.
- Cada paso del cotizador se entiende solo y en cualquier idioma.
- WhatsApp es el canal de cierre; nada debe estorbar ese camino.

## Accessibility & Inclusion

- 8 idiomas (es, en, zh, ru, pt, fr, ja, de) y tema claro/oscuro, ambos se mantienen.
- Móvil primero, respeto de `prefers-reduced-motion`, objetivo WCAG AA.
