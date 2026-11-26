/* Tarifario TUPLUS en el servidor.
   Réplica de los precios de public/js/cotizador.js (en SOLES, sin IGV).
   El servidor recalcula el total con estas tarifas y NUNCA confía en el total que manda el navegador.
   Si cambias un precio en cotizador.js, cámbialo también aquí. */

const IGV = 1.18;
const PEN_POR_USD = Number(process.env.PEN_POR_USD) || 3.3923;

const catalogo = {
  landing:   { unidad: 'section', extra: 90,  tiers: { pro: [1090, 6], biz: [1490, 9],  corp: [1990, 12] } },
  website:   { unidad: 'page',    extra: 180, tiers: { pro: [1690, 5], biz: [2790, 8],  corp: [3990, 12] }, incluye: { biz: ['blog'], corp: ['blog'] } },
  catalog:   { unidad: 'page',    extra: 180, productos: { pro: 20, biz: 50, corp: 100 }, tiers: { pro: [2290, 5], biz: [2990, 8], corp: [3990, 12] } },
  ecommerce: { unidad: 'page',    extra: 180, productos: { pro: 20, biz: 50, corp: 100 }, tiers: { pro: [3490, 5], biz: [5490, 8], corp: [7490, 12] } },
  webapp:    { unidad: 'page',    extra: 180, tiers: { pro: [5090, 8], biz: [7490, 12], corp: [10990, 16] } }
};

const bloques = { blocks20: 280, blocks50: 650 };

// Solo los adicionales con precio cerrado suman; los que tienen rango quedan "por confirmar".
const funciones = {
  forms: 180, seo: 650, booking: 450, multilingual: 650, payments: 180,
  automation: 750, geo: 750, whatsapp: 0,
  blog: null, maps: null, speed: null, security: null, email: null, migration: null, analytics: null
};

const disenos = { clean: 0, custom: 850 };
const PRECIO_PREMIUM_MOTION = 1200;
const soportes = { '30': 0, web: 150, store: 300, plus: 550 };

const PAGINA_CONTENIDO = 150;
const PACK_CONTENIDO = 650;
const RECARGO_PRIORITARIA = 0.20;

const entero = (valor, min, max) => {
  const n = Number(valor);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

/* Devuelve { totalPen, totalUsd, subtotalPen } o lanza Error si las opciones no son válidas. */
function calcularCotizacion(datos) {
  const proyecto = catalogo[datos.proyecto_clave];
  if (!proyecto) throw new Error('Proyecto no válido');

  const tier = proyecto.tiers[datos.nivel];
  if (!tier) throw new Error('Nivel no válido');
  const [precioBase, incluidas] = tier;

  const paginas = entero(datos.paginas, 1, 200);
  if (paginas === null) throw new Error('Páginas no válidas');

  const lista = Array.isArray(datos.funciones) ? datos.funciones : [];
  for (const clave of lista) {
    if (!Object.prototype.hasOwnProperty.call(funciones, clave)) throw new Error('Función no válida');
  }
  if (!Object.prototype.hasOwnProperty.call(disenos, datos.diseno_clave)) throw new Error('Diseño no válido');
  if (!Object.prototype.hasOwnProperty.call(soportes, datos.soporte_clave)) throw new Error('Soporte no válido');

  const b20 = proyecto.productos ? entero(datos.blocks20 ?? 0, 0, 100) : 0;
  const b50 = proyecto.productos ? entero(datos.blocks50 ?? 0, 0, 100) : 0;
  if (b20 === null || b50 === null) throw new Error('Bloques de productos no válidos');

  let suma = precioBase;
  suma += Math.max(0, paginas - incluidas) * proyecto.extra;
  suma += b20 * bloques.blocks20 + b50 * bloques.blocks50;

  if (datos.contenido_pro) {
    const unidades = proyecto.unidad === 'section' ? 1 : paginas;
    suma += Math.floor(unidades / 5) * PACK_CONTENIDO + (unidades % 5) * PAGINA_CONTENIDO;
  }

  const incluidas_nivel = (proyecto.incluye && proyecto.incluye[datos.nivel]) || [];
  const unicas = [...new Set(lista)];
  for (const clave of unicas) {
    if (incluidas_nivel.includes(clave)) continue;
    if (clave === 'payments') {
      suma += datos.proyecto_clave === 'ecommerce' ? 450 : 180;
      continue;
    }
    suma += funciones[clave] || 0;
  }
 suma += disenos[datos.diseno_clave];

const motion = datos.premium_motion ?? false;

if (typeof motion !== 'boolean') {
  throw new Error('Premium Motion no válido');
}

if (motion) {
  suma += PRECIO_PREMIUM_MOTION;
}

  const implementacion = Math.round(suma);
  const prioritaria = datos.prioritaria ? Math.round(implementacion * RECARGO_PRIORITARIA) : 0;
  const subtotalPen = implementacion + prioritaria + soportes[datos.soporte_clave];
  const totalPen = datos.igv ? Math.round(subtotalPen * IGV) : Math.round(subtotalPen);

  return {
    subtotalPen,
    totalPen,
    totalUsd: Math.round((totalPen / PEN_POR_USD) * 100) / 100
  };
}

module.exports = { calcularCotizacion };
