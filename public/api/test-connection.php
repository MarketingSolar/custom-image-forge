
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$host = "srv1066.hstgr.io";
$username = "u961166301_moldura";
$password = "@Moldura123";
$database = "u961166301_moldura";

echo json_encode([
    'message' => 'Testing database connection...',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion()
]);

try {
    // Attempt to connect to database
    $conn = new mysqli($host, $username, $password, $database);

    // Check connection
    if ($conn->connect_error) {
        echo json_encode([
            'success' => false, 
            'message' => 'Connection failed: ' . $conn->connect_error,
            'error_code' => $conn->connect_errno
        ]);
    } else {
        // Connection successful
        echo json_encode([
            'success' => true,
            'message' => 'Database connection successful',
            'server_info' => $conn->server_info,
            'host_info' => $conn->host_info
        ]);
        
        // Test query
        $result = $conn->query("SHOW TABLES");
        if ($result) {
            $tables = [];
            while ($row = $result->fetch_array()) {
                $tables[] = $row[0];
            }
            echo json_encode(['tables' => $tables]);
        } else {
            echo json_encode(['query_error' => $conn->error]);
        }
        
        $conn->close();
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Exception: ' . $e->getMessage()
    ]);
}
?>
