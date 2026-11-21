const express = require('express');
const pool = require('../config/db');
const { calcularCotizacion } = require('../services/tarifario');
const { limitePorIp } = require('../middleware/limite');
const { validEmail, validName } = require('../services/validacion');

const router = express.Router();

router.post('/api/cotizaciones', limitePorIp({ max: 10, ventanaMs: 60 * 60 * 1000 }), async (req, res) => {
  try {
    const {
      nombre,
      email,
      telefono,
      proyecto,
      paginas,
      contenido_pro,
      funciones,
      diseno,
      soporte,
      prioritaria,
      cloud,
      igv,
      total,
      notas
    } = req.body;

    if (
      !nombre ||
      !email ||
      !telefono ||
      !proyecto ||
      paginas === undefined ||
      total === undefined
    ) {
      return res.status(400).json({
        estado: 'error',
        mensaje: 'Faltan datos obligatorios de la cotización'
      });
    }

    // Datos de contacto: mismas reglas que la web; la validación del navegador se puede saltar.
    if (typeof nombre !== 'string' || !validName(nombre)) {
      return res.status(400).json({ estado: 'error', mensaje: 'Escribe tu nombre con letras, de 2 a 80 caracteres, sin números ni símbolos.' });
    }
    if (typeof email !== 'string' || !validEmail(email)) {
      return res.status(400).json({ estado: 'error', mensaje: 'Revisa tu correo.' });
    }
    if (typeof telefono !== 'string' || !/^\+?[\d\s().-]{7,30}$/.test(telefono.trim()) || telefono.replace(/\D/g, '').length < 7 || telefono.replace(/\D/g, '').length > 15) {
      return res.status(400).json({ estado: 'error', mensaje: 'Revisa tu teléfono e incluye el código de país.' });
    }

    const paginasNumero = Number(paginas);

    if (!Number.isInteger(paginasNumero) || paginasNumero < 1) {
      return res.status(400).json({
        estado: 'error',
        mensaje: 'Las páginas no son válidas'
      });
    }

    // El total NO se toma del navegador: se recalcula aquí con el tarifario del servidor.
    let calculo;
    try {
      calculo = calcularCotizacion({
        proyecto_clave: req.body.proyecto_clave,
        nivel: req.body.nivel,
        paginas: paginasNumero,
        blocks20: req.body.blocks20,
        blocks50: req.body.blocks50,
        contenido_pro: contenido_pro,
        funciones: Array.isArray(funciones) ? funciones : [],
        diseno_clave: req.body.diseno_clave,
        soporte_clave: req.body.soporte_clave,
        prioritaria: prioritaria,
        igv: igv
      });
    } catch (errorCalculo) {
      return res.status(400).json({
        estado: 'error',
        mensaje: 'Las opciones de la cotización no son válidas'
      });
    }
    const totalNumero = calculo.totalUsd;

    // Lo que declaró el navegador (descuento, cupón, total) se guarda solo como dato a verificar a mano.
    const declarado = [
      `Total declarado por el navegador: ${Number(total) || 0} USD`,
      req.body.cupon ? `Cupón declarado: ${String(req.body.cupon).slice(0, 40)}` : '',
      Number(req.body.descuento) > 0 ? `Descuento declarado: ${Number(req.body.descuento)} PEN (sin verificar)` : '',
      `Total verificado por el servidor: ${calculo.totalPen} PEN`
    ].filter(Boolean).join(' | ');

    const funcionesTexto = Array.isArray(funciones)
      ? funciones.join(', ')
      : (funciones || '');

    const sql = `
      INSERT INTO cotizaciones (
        nombre,
        email,
        telefono,
        proyecto,
        paginas,
        contenido_pro,
        funciones,
        diseno,
        soporte,
        prioritaria,
        cloud,
        igv,
        total,
        notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valores = [
      nombre.trim(),
      email.trim(),
      telefono.trim(),
      proyecto.trim(),
      paginasNumero,
      contenido_pro ? 1 : 0,
      funcionesTexto,
      diseno || '',
      soporte || '',
      prioritaria ? 1 : 0,
      cloud ? 1 : 0,
      igv ? 1 : 0,
      totalNumero,
      `${notas || ''} || ${declarado}`
    ];

    const [resultado] = await pool.execute(sql, valores);

    res.status(201).json({
      estado: 'correcto',
      mensaje: 'Cotización guardada correctamente',
      id: resultado.insertId
    });
  } catch (error) {
    console.error(JSON.stringify({ time: new Date().toISOString(), event: 'quote_save_failed', id: res.getHeader('X-Request-Id') }));

    res.status(500).json({
      estado: 'error',
      mensaje: 'No se pudo guardar la cotización'
    });
  }
});

module.exports = router;
