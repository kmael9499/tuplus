'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
// La fuente vive fuera de public/ para no publicarla (solo se publica el resultado, js/i18n-data.js).
const sourcePath = path.resolve(frontend, '..', 'src', 'i18n', 'i18n-translations.json');
const outputPath = path.join(frontend, 'js', 'i18n-data.js');
const translations = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

fs.writeFileSync(
  outputPath,
  `window.TUPLUS_TRANSLATIONS = ${JSON.stringify(translations)};\n`,
  'utf8'
);
