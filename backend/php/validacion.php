<?php
/* Validación de datos de contacto en el servidor (versión PHP).
   Mismas reglas que public/js/quote-core.js (la web), Validacion.cs (ERP) y validacion.js (Node): la validación del
   navegador se puede saltar, así que el servidor las repite antes de guardar. Si cambias una regla, cámbiala en todos. */

function tuplus_texto_limpio($v) {
  return !is_string($v) || !preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\x{80}-\x{9f}\x{200b}-\x{200f}\x{202a}-\x{202e}\x{2060}-\x{2064}\x{2066}-\x{2069}\x{feff}]/u', $v);
}

function tuplus_correo_valido($valor) {
  if (!is_string($valor) || !tuplus_texto_limpio($valor)) return false;
  $t = trim($valor);
  if ($t === '' || strlen($t) > 254) return false;
  $partes = explode('@', $t);
  if (count($partes) !== 2) return false;
  [$local, $dominio] = $partes;
  if ($local === '' || strlen($local) > 64) return false;
  if (!preg_match('/^[a-z\d!#$%&\'*+\/=?^_`{|}~-]+(?:\.[a-z\d!#$%&\'*+\/=?^_`{|}~-]+)*$/i', $local)) return false;
  if ($dominio === '' || !preg_match('/^[\p{L}\p{N}\p{M}.-]+$/u', $dominio)) return false;
  if (function_exists('idn_to_ascii')) {
    $ascii = idn_to_ascii($dominio, IDNA_DEFAULT, INTL_IDNA_VARIANT_UTS46);
    if ($ascii === false) return false;
    $dominio = $ascii;
  } elseif (preg_match('/[^\x20-\x7e]/', $dominio)) {
    return false; // sin la extensión intl no se pueden convertir dominios con tildes
  }
  if (strlen($local) + strlen($dominio) + 1 > 254 || strlen($dominio) > 253 || strpos($dominio, '.') === false) return false;
  $etiquetas = explode('.', $dominio);
  if (preg_match('/^\d+$/', end($etiquetas))) return false;
  foreach ($etiquetas as $e) if (!preg_match('/^[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?$/i', $e)) return false;
  return true;
}

function tuplus_nombre_valido($valor) {
  if (!is_string($valor)) return false;
  $t = trim($valor);
  $largo = mb_strlen($t, 'UTF-8');
  if ($largo < 2 || $largo > 80) return false;
  if (preg_match_all('/\p{L}/u', $t) < 2) return false;
  return (bool)preg_match('/^\p{L}[\p{L}\p{M}]*(?:[’\'\-]\p{L}[\p{L}\p{M}]*)*\.?(?: +\p{L}[\p{L}\p{M}]*(?:[’\'\-]\p{L}[\p{L}\p{M}]*)*\.?)*$/u', $t);
}

function tuplus_telefono_valido($valor) {
  if (!is_string($valor)) return false;
  $t = trim($valor);
  if (!preg_match('/^\+?[\d\s().-]{7,30}$/', $t)) return false;
  $d = preg_match_all('/\d/', $t);
  return $d >= 7 && $d <= 15;
}
