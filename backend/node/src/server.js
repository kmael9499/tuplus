const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');

const estadoRoutes = require('./routes/estado');
const cotizacionesRoutes = require('./routes/cotizaciones');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use(estadoRoutes);
app.use(cotizacionesRoutes);

app.listen(PORT, () => {
  console.log('------------------------------------');
  console.log('Backend de TuPlus iniciado');
  console.log(`Servidor: http://localhost:${PORT}`);
  console.log(`MySQL: http://localhost:${PORT}/api/prueba-db`);
  console.log('------------------------------------');
});
