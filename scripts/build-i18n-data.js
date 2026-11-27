'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const sourcePath = path.join(frontend, 'js', 'i18n-translations.json');
const outputPath = path.join(frontend, 'js', 'i18n-data.js');
const translations = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

fs.writeFileSync(
  outputPath,
  `window.TUPLUS_TRANSLATIONS = ${JSON.stringify(translations)};\n`,
  'utf8'
);
