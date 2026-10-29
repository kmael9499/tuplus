
const obtenerFechaLima = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

const campanas = [
  {
    nombre: 'Black Friday',
    porcentaje: 20,
    inicio: '2026-11-27',
    fin: '2026-11-30'
  },
  {
    nombre: 'Navidad',
    porcentaje: 15,
    inicio: '2026-12-01',
    fin: '2026-12-25'
  },
  {
    nombre: 'Año Nuevo',
    porcentaje: 10,
    inicio: '2026-12-26',
    fin: '2027-01-01'
  }
];

const obtenerCampanaActiva = (fecha = obtenerFechaLima()) => {
  return campanas.find(campana =>
    fecha >= campana.inicio &&
    fecha <= campana.fin
  ) || null;
};

const calcularDescuento = (subtotal) => {
  const monto = Number(subtotal);

  if (!Number.isFinite(monto) || monto < 0) {
    throw new Error('El subtotal no es válido');
  }

  let porcentajeMonto = 0;

  if (monto >= 2000) {
    porcentajeMonto = 15;
  } else if (monto >= 1000) {
    porcentajeMonto = 10;
  } else if (monto >= 500) {
    porcentajeMonto = 5;
  }

  const descuentoMonto = monto * porcentajeMonto / 100;
  const subtotalConDescuento = monto - descuentoMonto;

  const campana = obtenerCampanaActiva();
  const porcentajeCampana = campana?.porcentaje || 0;
  const descuentoCampana =
    subtotalConDescuento * porcentajeCampana / 100;

  const total = Math.round(
    (subtotalConDescuento - descuentoCampana) * 100
  ) / 100;

  return {
    fechaLima: obtenerFechaLima(),
    subtotal: monto,
    porcentajeMonto,
    descuentoMonto: Math.round(descuentoMonto * 100) / 100,
    campana: campana?.nombre || '',
    porcentajeCampana,
    descuentoCampana: Math.round(descuentoCampana * 100) / 100,
    total
  };
};

module.exports = {
  obtenerFechaLima,
  obtenerCampanaActiva,
  calcularDescuento
};
