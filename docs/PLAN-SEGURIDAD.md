# Plan de remediación de seguridad — TUPLUS

> **Versión 3 — 2026-11-20 (20:00).** Reescrita tras el commit `a57e041 "Mejoras"`
> (18:58) y tras ejecutar la suite de tests.
>
> Las versiones 1 y 2 describían un estado anterior del repositorio. Varios puntos ya
> están resueltos; esta versión lista **solo lo que queda**.
>
> **[verificado]** = comprobado contra el código o contra el servicio en línea.

---

## 1. Estado: 12 de 15 puntos del resumen, resueltos

Verificado leyendo el código actual (`a57e041`) y, cuando aplica, producción:

| N.º | Punto | Estado | Evidencia |
|---|---|---|---|
| 1 | Precios manipulables | ✅ Resuelto y verificado | `Tarifario.cs` + `PublicoController`; probado en producción |
| 2 | Listado de clientes | ✅ Sin fallo | `[Authorize]` en todos los controladores admin |
| 3 | Datos en la URL de WhatsApp | ✅ Resuelto | `cotizador.js` → `forWhatsapp?[]:[correo, teléfono]` los excluye |
| 4 | Cabeceras (CSP, anti-incrustación) | ✅ Resuelto | `scripts/seguridad-navegador.mjs` inyecta CSP + `referrer` en las 15 páginas y genera `dist/.htaccess` (CSP, `X-Frame-Options`, `Referrer-Policy`, `nosniff`, `Permissions-Policy`) |
| 5 | jsPDF sin verificación | ✅ Resuelto **con matiz** | Autoalojado en `public/js/vendor/`; SHA-512 documentado en `LEEME.md`. Ver **§2.1** |
| 6 | XSS por `innerHTML` | ✅ Resuelto | `esc()` (`cotizador.js:95`), aplicada 9 veces |
| 7 | Inyección SQL | ✅ Sin fallo | Consultas parametrizadas |
| 8 | Límite de envíos | ⚠️ Parcial | Producción y ERP: **8/10 min**. El cambio a 10/hora no está en esta máquina |
| 9 | `admin.php` sin login | ✅ Eliminado | No está en git ni en disco |
| 10 | Login de Node sin conectar | ✅ Resuelto | `server.js`: `cookie-parser`, `authRoutes`, `middleware/limite.js`, CORS allowlist, body limit 50 kb |
| 11 | Errores con nombres internos | ✅ Verificado | `Program.cs:23-30`; probado en producción |
| 12 | Validación de contacto | ✅ Repo / ⚠️ ERP | 117 casos OK. Pero dice "55 pruebas ERP" y el ERP tiene **22** |
| 13 | Contraste en tema oscuro | ✅ | `public/css/light-contrast.css` + 4 capturas |
| 14 | Rectángulo en iPhone | ⚠️ | Capturas presentes; el resumen admite que no se confirmó en un iPhone real |
| 15 | Globo de socios | ✅ | `GlobalAudio.astro:14` → `audio.volume = 0.2` |

---

## 2. Lo que queda

### 2.1 SRI automatizado para jsPDF (Media)

`public/js/vendor/LEEME.md` documenta el SHA-512 verificado contra cdnjs, pero es una
**verificación manual**: nada falla si el archivo se reemplaza.

- Añadir `integrity="sha512-…"` + `crossorigin="anonymous"` en
  `src/pages/cotizador.astro:18`.
- O mejor, comprobar el hash en `scripts/seguridad-navegador.mjs` durante el build y
  **fallar el build** si no coincide. Así queda automatizado y no se puede olvidar al
  actualizar.

### 2.2 `quote.test.cjs` rompe la suite (Alta — bloquea la verificación)

```
AssertionError: 2340 !== 2790   (tests/quote.test.cjs:39)
```

- **No es una regresión de la seguridad.** Verificado: en `ab534ab` (commit anterior) el
  código `blog:{label:"Blog / CMS",range:[450,650]}` y la expectativa `1690+450+650`
  eran idénticos → el fallo precede a `a57e041`.
- **Causa:** `blog` dejó de ser precio fijo el 10/11 (`1df634f`) y pasó a rango, pero el
  test sigue esperando 450.
- **Efecto colateral no mencionado en el resumen:** `npm test` encadena todo con `&&`,
  así que al fallar este test **los 7 siguientes nunca se ejecutan**:
  `i18n, partner, partner-footer, partner-application, socios, socios-application,
  navigation`. Corridos a mano, **pasan todos**.
- **Acción:** corregir la expectativa (o excluir `blog` del total) y luego dejar que
  `npm test` ejecute la suite completa.

### 2.3 Cambios del ERP que no están en esta máquina (Alta)

El resumen afirma *"Cambiado a 10 por hora (sin subir)"* y *"ERP: 55 pruebas en verde
(sin subir)"*. Busqué en todo el sistema:

| Dato | Declarado | Encontrado |
|---|---|---|
| Límite de cotizaciones | 10/hora | **8 / 10 min** (`Program.cs:63`) |
| Pruebas del ERP | 55 | **22** (`CotizacionesPublicasTests.cs`) |

**Acción:** confirmar con quien los hizo si esos cambios existen en otra máquina. Si no
existen, hay que hacerlos.

### 2.4 Panel del ERP: cabeceras y contraseña por defecto (Alta)

El sitio ya tiene sus cabeceras; **el panel no**.

- **Sin cabeceras de seguridad**: `frontend/nginx.conf` no tiene `add_header`. Ni CSP, ni
  `X-Frame-Options`, ni `Referrer-Policy`, ni `nosniff`, ni HSTS. **El login del panel es
  clickjackeable.**
- **`ADMIN_PASSWORD=12345678`** en `.env.example:3`. Pasa el mínimo de 8 caracteres de
  `DbSeeder.cs:19`, así que se acepta tal cual. Verificar que el admin en producción no
  use esa contraseña.
- Sin bloqueo de cuenta (solo rate-limit por IP) y cambiar la contraseña no cierra las
  sesiones abiertas.

### 2.5 Datos en producción (Higiene)

- Borrar las cotizaciones de prueba **26 en adelante** ("PRUEBA DE SEGURIDAD 20261115…").
- Auditar importes: `SELECT id, fecha, nombre, total FROM "Quotes" ORDER BY id DESC LIMIT 50`.

### 2.6 GitHub Pages no publicado (Operativo)

`kmael9499.github.io/tuplus/` y la raíz devuelven **404** pese a existir
`.github/workflows/deploy.yml`. Sin esto, las cabeceras del `.htaccess` no se aplican
porque el sitio no está serviendo.

---

## 3. Prioridad

| P | Acción | Cierra |
|---|---|---|
| **P0** | Borrar registros de prueba 26+ y auditar importes | §2.5 |
| **P0** | Verificar que el admin no usa `12345678` | §2.4 |
| **P0** | Arreglar `quote.test.cjs` para desbloquear los 7 tests | §2.2 |
| **P1** | Cabeceras de seguridad en `frontend/nginx.conf` del ERP | §2.4 |
| **P1** | Confirmar los cambios del ERP "sin subir" (10/hora, 55 pruebas) | §2.3 |
| **P1** | Publicar GitHub Pages | §2.6 |
| **P2** | SRI automatizado de jsPDF | §2.1 |
| **P2** | Bloqueo de cuenta + invalidar sesiones al cambiar contraseña | §2.4 |

---

## 4. Nota sobre las versiones anteriores

La versión 1 y 2 de este documento afirmaban que faltaban las cabeceras del navegador,
que `admin.php` seguía en el repositorio y que el login de Node no estaba conectado.
**Ya no es cierto**: el commit `a57e041 "Mejoras"` (2026-11-20 18:58) los resolvió.

Conviene revisar este archivo después de cada despliegue, porque el repositorio está
avanzando rápidamente.
