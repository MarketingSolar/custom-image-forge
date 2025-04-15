
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$host = "srv1066.hstgr.io";
$username = "u961166301_moldura";
$password = "@Moldura123";
$database = "u961166301_moldura";

// Initialize response array
$response = [
    'message' => 'Testing database connection...',
    'timestamp' => date('Y-m-d H:i:s'),
    'php_version' => phpversion()
];

try {
    // Attempt to connect to database
    $conn = new mysqli($host, $username, $password, $database);

    // Check connection
    if ($conn->connect_error) {
        $response['success'] = false;
        $response['message'] = 'Connection failed: ' . $conn->connect_error;
        $response['error_code'] = $conn->connect_errno;
    } else {
        // Connection successful
        $response['success'] = true;
        $response['message'] = 'Database connection successful';
        $response['server_info'] = $conn->server_info;
        $response['host_info'] = $conn->host_info;
        
        // Test query to list tables
        $result = $conn->query("SHOW TABLES");
        if ($result) {
            $tables = [];
            while ($row = $result->fetch_array()) {
                $tables[] = $row[0];
            }
            $response['tables'] = $tables;
            
            // Check if users table exists
            if (!in_array('users', $tables)) {
                // Initialize the database by calling init.php
                $ch = curl_init('http://' . $_SERVER['HTTP_HOST'] . '/api/init.php');
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                $init_result = curl_exec($ch);
                curl_close($ch);
                
                $init_data = json_decode($init_result, true);
                $response['initialization'] = $init_data;
            } else {
                $response['initialization'] = 'Database already initialized';
            }
        } else {
            $response['query_error'] = $conn->error;
        }
        
        $conn->close();
    }
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = 'Exception: ' . $e->getMessage();
}

echo json_encode($response);
?>
