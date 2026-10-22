<?php
// Configuración opcional. Las credenciales se establecen en el servidor.
function tuplus_db() {
    if (!extension_loaded('mysqli')) throw new RuntimeException('MySQL no disponible');
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $host = getenv('TUPLUS_DB_HOST') ?: (getenv('AZZIZ_DB_HOST') ?: 'localhost');
    $user = getenv('TUPLUS_DB_USER') ?: getenv('AZZIZ_DB_USER');
    $password = getenv('TUPLUS_DB_PASS') ?: (getenv('AZZIZ_DB_PASS') ?: '');
    $name = getenv('TUPLUS_DB_NAME') ?: (getenv('AZZIZ_DB_NAME') ?: 'cotizador_db');
    if (!$user) throw new RuntimeException('Base de datos sin configurar');
    $connection = new mysqli($host, $user, $password, $name);
    $connection->set_charset('utf8mb4');
    return $connection;
}
