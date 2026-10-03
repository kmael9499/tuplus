<?php
$db_host = getenv('AZZIZ_DB_HOST') ?: 'localhost';
$db_user = getenv('AZZIZ_DB_USER') ?: 'root';
$db_pass = getenv('AZZIZ_DB_PASS') ?: '';
$db_name = getenv('AZZIZ_DB_NAME') ?: 'cotizador_db';

$conn = @new mysqli($db_host, $db_user, $db_pass, $db_name);
if ($conn->connect_error) {
  die("No se pudo conectar a la base de datos. Configura AZZIZ_DB_HOST, AZZIZ_DB_USER, AZZIZ_DB_PASS y AZZIZ_DB_NAME.");
}
$conn->set_charset('utf8mb4');

$result = $conn->query("SELECT * FROM cotizaciones ORDER BY fecha DESC");
function h($v){ return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }
function arr($json){ $a=json_decode($json,true); return is_array($a)?implode(', ',$a):'—'; }
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Azziz — Panel de Cotizaciones</title>
<style>
body{margin:0;background:#08090d;color:#f5f5ef;font-family:Inter,system-ui,sans-serif;padding:28px}
.wrap{max-width:1400px;margin:auto}.top{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:20px}h1{margin:0;font-size:38px;letter-spacing:-.05em}p{color:#8b8c95}.badge{font:11px monospace;color:#d7ff54;border:1px solid rgba(215,255,84,.2);padding:8px 10px;border-radius:99px}
.card{border:1px solid rgba(255,255,255,.09);border-radius:22px;overflow:auto;background:#0e0f14;box-shadow:0 30px 80px rgba(0,0,0,.35)}
table{width:100%;border-collapse:collapse;min-width:1200px}th,td{padding:13px 12px;border-bottom:1px solid rgba(255,255,255,.06);text-align:left;font-size:12px;vertical-align:top}th{font:10px monospace;letter-spacing:.08em;text-transform:uppercase;color:#777881;background:#12131a;position:sticky;top:0}td{color:#b7b8bf}.money{color:#d7ff54;font-family:monospace}.client{color:#f3f3ee;font-weight:700}.muted{color:#70717a}
</style></head>
<body><div class="wrap">
<div class="top"><div><div class="badge">@azziz / COTIZACIONES</div><h1>Panel de solicitudes</h1><p>Resumen de contactos enviados desde el cotizador premium.</p></div><div class="muted"><?=date('d/m/Y H:i')?></div></div>
<div class="card"><table><thead><tr>
<th>ID</th><th>Fecha</th><th>Cliente</th><th>Email</th><th>WhatsApp</th><th>Proyecto</th><th>Páginas</th><th>Funciones</th><th>Diseño</th><th>Soporte</th><th>Total USD</th><th>Notas</th>
</tr></thead><tbody>
<?php if($result): while($row=$result->fetch_assoc()): ?>
<tr>
<td>#<?=h($row['id'])?></td><td><?=h($row['fecha'])?></td><td class="client"><?=h($row['nombre'])?></td><td><?=h($row['email'])?></td><td><?=h($row['telefono'])?></td>
<td><?=h($row['proyecto'])?></td><td><?=h($row['paginas'])?></td><td><?=h(arr($row['funciones']))?></td><td><?=h($row['diseno'])?></td><td><?=h($row['soporte'])?></td>
<td class="money">$<?=number_format((float)$row['total'],2)?></td><td><?=h($row['notas'])?></td>
</tr>
<?php endwhile; endif; ?>
</tbody></table></div></div></body></html>
<?php $conn->close(); ?>