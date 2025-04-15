
<?php
// This file is a simple check to verify PHP is executing correctly
header("Content-Type: application/json");

echo json_encode([
    "success" => true,
    "message" => "PHP is executing correctly",
    "php_version" => phpversion(),
    "time" => date("Y-m-d H:i:s"),
    "server" => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
]);
?>
