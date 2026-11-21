<?php
/* Límite de envíos por IP (ventana fija) guardado en archivos temporales del servidor.
   Evita que alguien llene la base con cotizaciones falsas. Si el sitio va detrás de Cloudflare se usa
   CF-Connecting-IP; si no, REMOTE_ADDR. */
function tuplus_limite_ip($max = 8, $ventana = 600) {
  $ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? ($_SERVER['REMOTE_ADDR'] ?? 'desconocida');
  if (!filter_var($ip, FILTER_VALIDATE_IP)) $ip = $_SERVER['REMOTE_ADDR'] ?? 'desconocida';
  $archivo = rtrim(sys_get_temp_dir(), '/\\') . DIRECTORY_SEPARATOR . 'tuplus_rl_' . sha1($ip) . '.json';
  $fh = @fopen($archivo, 'c+');
  if (!$fh) return true; // si no se puede escribir, no se bloquea a nadie
  flock($fh, LOCK_EX);
  $ahora = time();
  $d = json_decode((string)stream_get_contents($fh), true);
  if (!is_array($d) || ($d['hasta'] ?? 0) <= $ahora) $d = ['n' => 0, 'hasta' => $ahora + $ventana];
  $d['n']++;
  ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($d));
  flock($fh, LOCK_UN); fclose($fh);
  if ($d['n'] > $max) { header('Retry-After: ' . max(1, $d['hasta'] - $ahora)); return false; }
  return true;
}
