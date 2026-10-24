const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.post('/api/cotizaciones', async (req, res) => {
  console.log('RUTA POST /api/cotizaciones RECIBIDA');

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

    const paginasNumero = Number(paginas);
    const totalNumero = Number(total);

    if (
      !Number.isInteger(paginasNumero) ||
      paginasNumero < 1 ||
      !Number.isFinite(totalNumero) ||
      totalNumero < 0
    ) {
      return res.status(400).json({
        estado: 'error',
        mensaje: 'Las páginas o el total no son válidos'
      });
    }

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
      notas || ''
    ];

    const [resultado] = await pool.execute(sql, valores);

    res.status(201).json({
      estado: 'correcto',
      mensaje: 'Cotización guardada correctamente',
      id: resultado.insertId
    });
  } catch (error) {
    console.error('Error al guardar la cotización:', error.message);

    res.status(500).json({
      estado: 'error',
      mensaje: 'No se pudo guardar la cotización'
    });
  }
});

module.exports = router;
