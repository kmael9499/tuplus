<?php
/* Tarifario TUPLUS en el servidor (versión PHP).
   Réplica de backend/node/src/services/tarifario.js y de public/js/cotizador.js (importes en SOLES, sin IGV).
   El servidor recalcula el total y NUNCA confía en el que manda el navegador.
   Si cambias un precio en cotizador.js, cámbialo también aquí y en tarifario.js. */

function tuplus_catalogo() {
  return [
    'landing'   => ['extra' => 90,  'unidad' => 'section', 'tiers' => ['pro' => [1090, 6], 'biz' => [1490, 9],  'corp' => [1990, 12]]],
    'website'   => ['extra' => 180, 'unidad' => 'page',    'tiers' => ['pro' => [1690, 5], 'biz' => [2790, 8],  'corp' => [3990, 12]], 'incluye' => ['biz' => ['blog'], 'corp' => ['blog']]],
    'catalog'   => ['extra' => 180, 'unidad' => 'page',    'productos' => true, 'tiers' => ['pro' => [2290, 5], 'biz' => [2990, 8], 'corp' => [3990, 12]]],
    'ecommerce' => ['extra' => 180, 'unidad' => 'page',    'productos' => true, 'tiers' => ['pro' => [3490, 5], 'biz' => [5490, 8], 'corp' => [7490, 12]]],
    'webapp'    => ['extra' => 180, 'unidad' => 'page',    'tiers' => ['pro' => [5090, 8], 'biz' => [7490, 12], 'corp' => [10990, 16]]],
  ];
}

// Adicionales con precio cerrado. Los que no tienen precio (rango) quedan "por confirmar" y no suman.
function tuplus_funciones() {
  return [
    'forms' => 180, 'seo' => 650, 'booking' => 450, 'multilingual' => 650, 'payments' => 180,
    'automation' => 750, 'geo' => 750, 'whatsapp' => 0,
    'blog' => 0, 'maps' => 0, 'speed' => 0, 'security' => 0, 'email' => 0, 'migration' => 0, 'analytics' => 0,
  ];
}

function tuplus_entero($valor, $min, $max) {
  if (is_bool($valor) || !is_numeric($valor)) return null;
  $n = $valor + 0;
  if (!is_int($n) && !(is_float($n) && floor($n) == $n)) return null;
  $n = (int)$n;
  return ($n >= $min && $n <= $max) ? $n : null;
}

/* Devuelve ['subtotalPen' => int, 'totalPen' => int, 'totalUsd' => float]. Lanza InvalidArgumentException si algo no es válido. */
function tuplus_calcular_cotizacion(array $d, $penPorUsd = 3.3923) {
  $catalogo = tuplus_catalogo();
  $clave = (string)($d['proyecto_clave'] ?? '');
  if (!isset($catalogo[$clave])) throw new InvalidArgumentException('Proyecto no válido');
  $proyecto = $catalogo[$clave];

  $nivel = (string)($d['nivel'] ?? '');
  if (!isset($proyecto['tiers'][$nivel])) throw new InvalidArgumentException('Nivel no válido');
  [$base, $incluidas] = $proyecto['tiers'][$nivel];

  $paginas = tuplus_entero($d['paginas'] ?? null, 1, 200);
  if ($paginas === null) throw new InvalidArgumentException('Páginas no válidas');

  $lista = $d['funciones'] ?? [];
  if (!is_array($lista) || count($lista) > 30) throw new InvalidArgumentException('Funciones no válidas');
  $funciones = tuplus_funciones();
  foreach ($lista as $f) {
    if (!is_string($f) || !array_key_exists($f, $funciones)) throw new InvalidArgumentException('Función no válida');
  }

$disenos = ['clean' => 0, 'custom' => 850];
$precioPremiumMotion = 1200;
  $soportes = ['30' => 0, 'web' => 150, 'store' => 300, 'plus' => 550];
  $diseno = (string)($d['diseno_clave'] ?? '');
  $soporte = (string)($d['soporte_clave'] ?? '');
  if (!array_key_exists($diseno, $disenos)) throw new InvalidArgumentException('Diseño no válido');
  if (!array_key_exists($soporte, $soportes)) throw new InvalidArgumentException('Soporte no válido');

  $b20 = $b50 = 0;
  if (!empty($proyecto['productos'])) {
    $b20 = tuplus_entero($d['blocks20'] ?? 0, 0, 100);
    $b50 = tuplus_entero($d['blocks50'] ?? 0, 0, 100);
    if ($b20 === null || $b50 === null) throw new InvalidArgumentException('Bloques de productos no válidos');
  }

  $suma = $base + max(0, $paginas - $incluidas) * $proyecto['extra'] + $b20 * 280 + $b50 * 650;

  if (!empty($d['contenido_pro'])) {
    $unidades = $proyecto['unidad'] === 'section' ? 1 : $paginas;
    $suma += intdiv($unidades, 5) * 650 + ($unidades % 5) * 150;
  }

  $incluidasNivel = $proyecto['incluye'][$nivel] ?? [];
  foreach (array_unique($lista) as $f) {
    if (in_array($f, $incluidasNivel, true)) continue;
    if ($f === 'payments') { $suma += ($clave === 'ecommerce') ? 450 : 180; continue; }
    $suma += $funciones[$f];
  }
  $suma += $disenos[$diseno];

$motion = $d['premium_motion'] ?? false;

if (!is_bool($motion)) {
  throw new InvalidArgumentException('Premium Motion no válido');
}

if ($motion) {
  $suma += $precioPremiumMotion;
}

  $implementacion = (int)round($suma);
  $prioritaria = !empty($d['prioritaria']) ? (int)round($implementacion * 0.20) : 0;
  $subtotal = $implementacion + $prioritaria + $soportes[$soporte];
  $total = !empty($d['igv']) ? (int)round($subtotal * 1.18) : (int)round($subtotal);

  return [
    'subtotalPen' => $subtotal,
    'totalPen' => $total,
    'totalUsd' => round($total / $penPorUsd, 2),
  ];
}
