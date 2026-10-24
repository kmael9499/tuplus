CREATE DATABASE IF NOT EXISTS cotizador_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cotizador_db;
CREATE TABLE IF NOT EXISTS cotizaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  nombre VARCHAR(180) NOT NULL,
  email VARCHAR(180) NOT NULL,
  telefono VARCHAR(60) NOT NULL,
  proyecto VARCHAR(120) NOT NULL,
  paginas INT NOT NULL,
  contenido_pro TINYINT(1) DEFAULT 0,
  funciones TEXT,
  diseno VARCHAR(120),
  soporte VARCHAR(60),
  prioritaria TINYINT(1) DEFAULT 0,
  cloud TINYINT(1) DEFAULT 0,
  igv TINYINT(1) DEFAULT 0,
  total DECIMAL(12,2) DEFAULT 0,
  notas TEXT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;