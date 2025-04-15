
<?php
// Database connection parameters
$host = "srv1066.hstgr.io";
$username = "u961166301_moldura";
$password = "@Moldura123";
$database = "u961166301_moldura";

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'Connection failed: ' . $conn->connect_error]);
    exit();
}

// Set charset to utf8mb4
$conn->set_charset("utf8mb4");

// Helper function to handle errors
function db_error($message, $error = null) {
    global $conn;
    header('Content-Type: application/json');
    $error_details = $error ? $error : ($conn ? $conn->error : 'Unknown error');
    echo json_encode(['success' => false, 'message' => $message, 'error' => $error_details]);
    exit();
}

// Helper function to get POST data as JSON
function get_json_post_data() {
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        db_error('Invalid JSON data: ' . json_last_error_msg());
    }
    
    return $data;
}
?>
