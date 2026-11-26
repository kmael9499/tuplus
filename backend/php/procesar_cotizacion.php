<?php
header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/tarifario.php';
require_once __DIR__ . '/limite.php';
require_once __DIR__ . '/validacion.php';

if (!tuplus_limite_ip(10, 3600)) {
  http_response_code(429);
  echo json_encode(["status" => "error", "message" => "Alcanzaste el límite de cotizaciones por hora. Inténtalo más tarde."]);
  exit;
}

$data = json_decode(substr((string)file_get_contents('php://input', false, null, 0, 51200), 0, 51200), true); // máx. 50 KB
if (!is_array($data)) {
  echo json_encode(["status" => "error", "message" => "Sin datos recibidos"]);
  exit;
}

function clean_text($v) {
  return trim(strip_tags((string)($v ?? '')));
}

// Se valida el dato tal como llegó (clean_text quita etiquetas y podría "arreglar" en silencio un nombre como <b>Ana</b>).
$invalido = null;
if (!tuplus_nombre_valido($data['nombre'] ?? null)) $invalido = 'Escribe tu nombre con letras, de 2 a 80 caracteres, sin números ni símbolos.';
elseif (!tuplus_correo_valido($data['email'] ?? null)) $invalido = 'Revisa tu correo.';
elseif (!tuplus_telefono_valido($data['telefono'] ?? null)) $invalido = 'Revisa tu teléfono e incluye el código de país.';
elseif (!tuplus_texto_limpio($data['proyecto'] ?? '') || !tuplus_texto_limpio($data['notas'] ?? '')) $invalido = 'Hay caracteres no permitidos en el mensaje.';
if ($invalido !== null) {
  http_response_code(400);
  echo json_encode(["status" => "error", "message" => $invalido]);
  exit;
}

$nombre = clean_text($data['nombre'] ?? '');
$email = filter_var((string)($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$telefono = clean_text($data['telefono'] ?? '');
$proyecto = clean_text($data['proyecto'] ?? '');
$paginas = max(1, (int)($data['paginas'] ?? 1));
$diseno = clean_text($data['diseno'] ?? '');
$soporte = clean_text($data['soporte'] ?? '');
$total_declarado = (float)($data['total'] ?? 0); // lo que dice el navegador: NO se usa para guardar
$notas = clean_text($data['notas'] ?? '');

$funciones = $data['funciones'] ?? [];
if (!is_array($funciones)) $funciones = [];
$funciones_json = json_encode(array_values($funciones), JSON_UNESCAPED_UNICODE);

if ($nombre === '' || !$email || $telefono === '' || $proyecto === '') {
  echo json_encode(["status" => "error", "message" => "Faltan datos obligatorios"]);
  exit;
}

// El total se recalcula aquí con el tarifario del servidor; el del navegador se ignora.
$pen_por_usd = (float)(getenv('PEN_POR_USD') ?: 3.3923);
try {
  $calculo = tuplus_calcular_cotizacion($data, $pen_por_usd);
} catch (InvalidArgumentException $e) {
  http_response_code(400);
  echo json_encode(["status" => "error", "message" => "Las opciones de la cotización no son válidas"]);
  exit;
}
$total = $calculo['totalUsd'];
$notas = substr($notas, 0, 2000) . ' || Total declarado por el navegador: ' . $total_declarado . ' USD (sin verificar) | Total verificado por el servidor: ' . $calculo['totalPen'] . ' PEN';

$igv = !empty($data['igv']) ? 1 : 0;
$contenido_pro = !empty($data['contenido_pro']) ? 1 : 0;
$prioritaria = !empty($data['prioritaria']) ? 1 : 0;
$cloud = !empty($data['cloud']) ? 1 : 0;

// Configuración MySQL: edita estos valores para tu servidor.
$db_host = getenv('AZZIZ_DB_HOST') ?: 'localhost';
$db_user = getenv('AZZIZ_DB_USER') ?: 'root';
$db_pass = getenv('AZZIZ_DB_PASS') ?: '';
$db_name = getenv('AZZIZ_DB_NAME') ?: 'cotizador_db';

// Solo se responde "éxito" si la cotización realmente quedó guardada. Si falla, el navegador lo sabe
// y ofrece WhatsApp o la descarga; así no se pierden solicitudes sin que nadie se entere.
$guardado = false;
mysqli_report(MYSQLI_REPORT_OFF);
$conn = @new mysqli($db_host, $db_user, $db_pass, $db_name);
if (!$conn->connect_error) {
  $conn->set_charset('utf8mb4');
  $conn->query("CREATE TABLE IF NOT EXISTS cotizaciones (
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
  ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

  $stmt = $conn->prepare("INSERT INTO cotizaciones
    (nombre,email,telefono,proyecto,paginas,contenido_pro,funciones,diseno,soporte,prioritaria,cloud,igv,total,notas)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  if ($stmt) {
    $stmt->bind_param("ssssiisssiiids", $nombre, $email, $telefono, $proyecto, $paginas, $contenido_pro,
      $funciones_json, $diseno, $soporte, $prioritaria, $cloud, $igv, $total, $notas);
    $guardado = $stmt->execute() && $stmt->affected_rows === 1;
    if (!$guardado) error_log('TUPLUS cotizacion no guardada: ' . $stmt->error);
    $stmt->close();
  } else {
    error_log('TUPLUS no se pudo preparar el INSERT: ' . $conn->error);
  }
  $conn->close();
} else {
  error_log('TUPLUS sin conexion a MySQL: ' . $conn->connect_error);
}

if (!$guardado) {
  http_response_code(500);
  echo json_encode(["status" => "error", "message" => "No se pudo guardar la cotización"]);
  exit;
}
echo json_encode(["status" => "success", "message" => "Cotización recibida"]);
?>
