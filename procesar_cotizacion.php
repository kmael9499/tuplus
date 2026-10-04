<?php
header('Content-Type: application/json; charset=UTF-8');

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
  echo json_encode(["status" => "error", "message" => "Sin datos recibidos"]);
  exit;
}

function clean_text($v) {
  return trim(strip_tags((string)($v ?? '')));
}

$nombre = clean_text($data['nombre'] ?? '');
$email = filter_var((string)($data['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$telefono = clean_text($data['telefono'] ?? '');
$proyecto = clean_text($data['proyecto'] ?? '');
$paginas = max(1, (int)($data['paginas'] ?? 1));
$diseno = clean_text($data['diseno'] ?? '');
$soporte = clean_text($data['soporte'] ?? '');
$total = (float)($data['total'] ?? 0);
$notas = clean_text($data['notas'] ?? '');

$funciones = $data['funciones'] ?? [];
if (!is_array($funciones)) $funciones = [];
$funciones_json = json_encode(array_values($funciones), JSON_UNESCAPED_UNICODE);

if ($nombre === '' || !$email || $telefono === '' || $proyecto === '') {
  echo json_encode(["status" => "error", "message" => "Faltan datos obligatorios"]);
  exit;
}

$igv = !empty($data['igv']) ? 1 : 0;
$contenido_pro = !empty($data['contenido_pro']) ? 1 : 0;
$prioritaria = !empty($data['prioritaria']) ? 1 : 0;
$cloud = !empty($data['cloud']) ? 1 : 0;

// Configuración MySQL: edita estos valores para tu servidor.
$db_host = getenv('AZZIZ_DB_HOST') ?: 'localhost';
$db_user = getenv('AZZIZ_DB_USER') ?: 'root';
$db_pass = getenv('AZZIZ_DB_PASS') ?: '';
$db_name = getenv('AZZIZ_DB_NAME') ?: 'cotizador_db';

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
    $types = "ssss i i s s s i i i d s";
    $types = str_replace(' ', '', $types); // ssssiiissiiids
    $stmt->bind_param($types, $nombre, $email, $telefono, $proyecto, $paginas, $contenido_pro,
      $funciones_json, $diseno, $soporte, $prioritaria, $cloud, $igv, $total, $notas);
    @$stmt->execute();
    $stmt->close();
  }
  $conn->close();
}

echo json_encode(["status" => "success", "message" => "Cotización recibida"]);
?>