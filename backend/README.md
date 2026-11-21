# Backend de TUPLUS

```
backend/
├─ node/                    API en Node.js + Express (la nueva)
│  ├─ src/
│  │  ├─ server.js          Arranca el servidor y registra las rutas
│  │  ├─ config/db.js       Conexión a MySQL (lee el archivo .env)
│  │  ├─ routes/
│  │  │  ├─ estado.js       GET /, GET /api/rutas, GET /api/prueba-db
│  │  │  └─ cotizaciones.js POST /api/cotizaciones (guarda la cotización)
│  │  └─ services/
│  │     └─ campanas.js     Descuentos por campaña y por monto (aún sin ruta)
│  ├─ .env.example          Modelo del archivo .env
│  └─ package.json
├─ php/                     Versión anterior en PHP (hosting con PHP)
│  ├─ procesar_cotizacion.php
│  └─ server-config.php
└─ database/
   └─ database.sql          Crea la base cotizador_db y la tabla cotizaciones
```

Las dos versiones usan la **misma base de datos** (`database/database.sql`).

## Usar la API en Node (recomendado)

1. Crea la base de datos en MySQL, una sola vez:
   ```bash
   mysql -u root -p < backend/database/database.sql
   ```
2. Entra a la carpeta e instala:
   ```bash
   cd backend/node
   npm install
   ```
3. Copia `.env.example` como `.env` y pon tus datos de MySQL.
   En Windows: `copy .env.example .env`. **El `.env` nunca se sube a GitHub**; ya está en `.gitignore`.
4. Arranca el servidor:
   ```bash
   npm start        # normal
   npm run dev      # se reinicia solo al guardar cambios
   ```
5. Comprueba en el navegador:
   - http://localhost:8080/ → "Backend de TuPlus funcionando correctamente"
   - http://localhost:8080/api/prueba-db → "Conexión establecida"

### Rutas

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/` | Comprueba que el servidor está encendido |
| GET | `/api/rutas` | Lista de rutas disponibles |
| GET | `/api/prueba-db` | Comprueba la conexión con MySQL |
| POST | `/api/auth/login`, `/api/auth/verify-email-code`, `/api/auth/forgot-password`, `/api/auth/reset-password` | Acceso de socios y Dirección (límite de 20 intentos por IP cada 15 min, además del bloqueo por cuenta) |
| GET | `/api/auth/session` | Datos de la sesión actual (401 sin sesión) |
| POST | `/api/auth/logout` | Cierra la sesión |
| POST | `/api/cotizaciones` | Guarda una cotización. Obligatorios: `nombre`, `email`, `telefono`, `proyecto`, `paginas` (entero ≥ 1) y `total` |

Ejemplo de envío:
```json
{ "nombre": "Ana", "email": "ana@correo.com", "telefono": "51900000000",
  "proyecto": "Tienda virtual", "paginas": 5, "funciones": ["seo", "pagos"],
  "total": 1925, "igv": true }
```

## Acceso (auth)

`server.js` registra `routes/auth.js` y `cookie-parser` (necesario para leer la cookie de sesión). Pasos:
1. Crea las tablas con `database/auth.sql`.
2. Completa en `.env`: `AUTH_TOKEN_SECRET`, `CORS_ORIGINS` (la web que llama), `RESEND_API_KEY` y `AUTH_EMAIL_FROM` (correo de códigos).
3. Crea la primera cuenta: `node src/scripts/create-auth-user.js`.
4. En la web, `public/js/auth-config.js` debe apuntar a la URL de este servidor. La cookie es `SameSite=Strict`: la web y la API deben estar en el mismo sitio (por ejemplo `tuplus.com` y `api.tuplus.com`).

## Pendiente

- El cotizador de la web todavía envía a `procesar_cotizacion.php` (y solo si `quoteBackendEnabled` es `true` en `public/js/config.js`). Para usar la API de Node hay que cambiar esa dirección por la de este servidor + `/api/cotizaciones`.
- `services/campanas.js` tiene los porcentajes y fechas escritos en el código. Para cambiarlos desde el panel administrativo, deberían leerse de una tabla de la base de datos.
- GitHub Pages no ejecuta Node ni PHP: este backend necesita su propio hosting.

## Usar la versión en PHP (anterior)

1. Crea la base con `database/database.sql`.
2. Define `AZZIZ_DB_HOST`, `AZZIZ_DB_USER`, `AZZIZ_DB_PASS` y `AZZIZ_DB_NAME` en el hosting.
3. Sube `procesar_cotizacion.php`, `tarifario.php`, `limite.php`, `validacion.php` y `server-config.php` junto a `cotizador.html` (no subas `prueba-tarifario.php`). Opcional: variable `PEN_POR_USD` para el tipo de cambio. Las solicitudes se consultan en el panel del ERP (con login). El antiguo `admin.php` se eliminó porque mostraba los datos de los clientes sin autenticación.
