<?php
// Prueba rápida del tarifario y de la validación: php prueba-tarifario.php  (no subir al hosting)
require __DIR__ . '/tarifario.php';
require __DIR__ . '/validacion.php';
function igual($esperado, $real, $nombre) {
  echo ($esperado === $real ? "OK   " : "FALLA") . " $nombre: esperado " . var_export($esperado, true) . ", real " . var_export($real, true) . "\n";
  if ($esperado !== $real) $GLOBALS['fallos'] = true;
}
$base = ['proyecto_clave' => 'landing', 'nivel' => 'pro', 'paginas' => 6, 'funciones' => [], 'diseno_clave' => 'clean', 'soporte_clave' => '30'];
igual(1090, tuplus_calcular_cotizacion($base + ['total' => 1])['totalPen'], 'landing basica (total=1 ignorado)');
igual(1090, tuplus_calcular_cotizacion($base + ['total' => 0])['totalPen'], 'landing basica (total=0 ignorado)');
igual(13636, tuplus_calcular_cotizacion(['proyecto_clave' => 'ecommerce', 'nivel' => 'biz', 'paginas' => 10, 'blocks20' => 1, 'contenido_pro' => true,
  'funciones' => ['payments', 'seo', 'blog'], 'diseno_clave' => 'custom', 'soporte_clave' => 'store', 'prioritaria' => true, 'igv' => true])['totalPen'], 'tienda completa');
foreach ([['proyecto_clave' => 'zzz'], ['funciones' => ['hack']], ['paginas' => -5], ['nivel' => 'x'], ['diseno_clave' => 'x']] as $i => $malo) {
  try { tuplus_calcular_cotizacion($malo + $base); echo "FALLA entrada invalida $i aceptada\n"; $GLOBALS['fallos'] = true; }
  catch (InvalidArgumentException $e) { echo "OK   entrada invalida $i rechazada\n"; }
}

// Validación de contacto (mismas reglas que la web y el ERP)
foreach (['.a@b.com', 'a.@b.com', 'a..b@c.com', 'a@b', 'a@-b.com', 'a b@c.com', '<x>@b.com', 'a@b.123'] as $c) igual(false, tuplus_correo_valido($c), "correo invalido $c");
foreach (['a@b.com', 'a+tag@b.co', 'ana.perez@sub.correo.com.pe'] as $c) igual(true, tuplus_correo_valido($c), "correo valido $c");
foreach (['Ana123', '<b>Ana</b>', 'A', "Ana\u{200b}Pérez"] as $n) igual(false, tuplus_nombre_valido($n), "nombre invalido $n");
foreach (['José María', "O'Neil", 'Müller-Smith', 'Dr. Ana Pérez'] as $n) igual(true, tuplus_nombre_valido($n), "nombre valido $n");
foreach (['abc', '123', '++51999888777', '1234567890123456'] as $t) igual(false, tuplus_telefono_valido($t), "telefono invalido $t");
igual(true, tuplus_telefono_valido('+51 987 654 321'), 'telefono valido');

exit(empty($GLOBALS['fallos']) ? 0 : 1);
