'use strict';

const fs = require('node:fs');
const path = require('node:path');

const frontend = path.resolve(__dirname, '..');
const sourcePath = path.join(frontend, 'js', 'i18n-translations.json');
const outputPath = path.join(frontend, 'js', 'i18n-data.js');
const translations = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

fs.writeFileSync(
  outputPath,
  `window.TUPLUS_TRANSLATIONS = ${JSON.stringify(translations)};\n`,
  'utf8'
);
