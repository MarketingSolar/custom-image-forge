
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
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'request_uri' => $_SERVER['REQUEST_URI'] ?? 'Unknown',
    'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
    'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown'
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
            
            // Check if users table exists and has data
            if (in_array('users', $tables)) {
                $userResult = $conn->query("SELECT id, username FROM users LIMIT 5");
                $users = [];
                if ($userResult && $userResult->num_rows > 0) {
                    while ($userRow = $userResult->fetch_assoc()) {
                        $users[] = ['id' => $userRow['id'], 'username' => $userRow['username']];
                    }
                }
                $response['user_count'] = $userResult ? $userResult->num_rows : 0;
                $response['users_sample'] = $users;
            } else {
                $response['initialization_needed'] = true;
                
                // Initialize the database by calling init.php
                $initUrl = 'http://' . $_SERVER['HTTP_HOST'] . '/api/init.php';
                $response['init_url'] = $initUrl;
                
                $ch = curl_init($initUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                $init_result = curl_exec($ch);
                $init_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                
                $response['initialization'] = [
                    'status_code' => $init_status,
                    'response' => $init_result ? json_decode($init_result, true) : null,
                    'raw_response' => substr($init_result, 0, 1000) // Limit the size for troubleshooting
                ];
            }
            
            // Check clients table
            if (in_array('clients', $tables)) {
                $clientResult = $conn->query("SELECT COUNT(*) as count FROM clients");
                $response['client_count'] = $clientResult ? $clientResult->fetch_assoc()['count'] : 0;
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

// Output the response as JSON
echo json_encode($response, JSON_PRETTY_PRINT);
?>
