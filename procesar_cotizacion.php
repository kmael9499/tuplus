<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');
require_once __DIR__ . '/server-config.php';
function respond($code, $status, $message) {
  http_response_code($code);
  echo json_encode(['status'=>$status, 'message'=>$message], JSON_UNESCAPED_UNICODE);
  exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405,'error','Usa POST.');
if (getenv('TUPLUS_QUOTES_ENABLED') !== '1') respond(503,'error','El registro de solicitudes no está habilitado.');
if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 20000) respond(413,'error','Solicitud demasiado extensa.');

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
  respond(400,'error','Datos inválidos.');
}

function clean_text($v) {
  return is_scalar($v) ? trim(strip_tags((string)$v)) : ''; 
}

$nombre = clean_text($data['nombre'] ?? '');
$email = filter_var(clean_text($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$telefono = clean_text($data['telefono'] ?? '');
$proyecto = clean_text($data['proyecto'] ?? '');
$paginas = max(1, (int)($data['paginas'] ?? 1));
$diseno = clean_text($data['diseno'] ?? '');
$soporte = clean_text($data['soporte'] ?? '');
$total = is_numeric($data['total'] ?? null) ? (float)$data['total'] : -1;
$notas = clean_text($data['notas'] ?? '');
$notas .= "\nPaís seleccionado: " . clean_text($data['pais'] ?? '') . "\nMoneda: " . clean_text($data['moneda'] ?? 'PEN') . ' | Estimado: ' . clean_text($data['total_mostrado'] ?? '') . ' | Cambio: ' . clean_text($data['cambio'] ?? '');

$funciones = $data['funciones'] ?? [];
if (!is_array($funciones)) $funciones = [];
$funciones_json = json_encode(array_values($funciones), JSON_UNESCAPED_UNICODE);

if ($nombre === '' || !$email || $telefono === '' || $proyecto === '' || $paginas > 20 || $total < 0 || !is_finite($total) || $total > 9999999 || strlen($nombre)>180 || strlen($email)>180 || strlen($telefono)>60 || strlen($proyecto)>120 || strlen($notas)>8000 || count($funciones)>12 || empty($data['consentimiento'])) {
  respond(422,'error','Revisa los datos y el consentimiento.');
}

$igv = !empty($data['igv']) ? 1 : 0;
$contenido_pro = !empty($data['contenido_pro']) ? 1 : 0;
$prioritaria = !empty($data['prioritaria']) ? 1 : 0;
$cloud = !empty($data['cloud']) ? 1 : 0;

try {
  $conn = tuplus_db();
  $stmt = $conn->prepare("INSERT INTO cotizaciones
    (nombre,email,telefono,proyecto,paginas,contenido_pro,funciones,diseno,soporte,prioritaria,cloud,igv,total,notas)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  if ($stmt) {
    $types = "ssss i i s s s i i i d s";
    $types = str_replace(' ', '', $types); // ssssiiissiiids
    $stmt->bind_param($types, $nombre, $email, $telefono, $proyecto, $paginas, $contenido_pro,
      $funciones_json, $diseno, $soporte, $prioritaria, $cloud, $igv, $total, $notas);
    $stmt->execute();
    $stmt->close();
  }
  $conn->close();
} catch (Throwable $error) {
  respond(503,'error','No se pudo registrar la solicitud. Puedes continuar por WhatsApp.');
}

echo json_encode(["status" => "success", "message" => "Cotización recibida"]);
?>
