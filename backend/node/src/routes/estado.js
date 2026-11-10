const express = require('express');
const pool = require('../config/db');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    mensaje: 'Backend de TuPlus funcionando correctamente'
  });
});

router.get('/api/rutas', (req, res) => {
  res.json({
    prueba: 'GET funciona',
    cotizaciones: 'POST /api/cotizaciones'
  });
});

router.get('/api/prueba-db', async (req, res) => {
  try {
    const [filas] = await pool.query('SELECT 1 AS conexion');

    res.json({
      estado: 'correcto',
      mysql: 'Conexión establecida',
      resultado: filas[0].conexion
    });
  } catch (error) {
    console.error(JSON.stringify({ time: new Date().toISOString(), event: 'database_check_failed', id: res.getHeader('X-Request-Id'), message: error.message, stack: error.stack }));

    res.status(500).json({
      estado: 'error',
      mensaje: 'No se pudo conectar con MySQL'
    });
  }
});

module.exports = router;
