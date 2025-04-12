
<?php
// Enable CORS for development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");

// Enable error logging
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Log function to help debug
function logError($message, $data = null) {
    error_log("USER API ERROR: " . $message . ($data ? " - " . json_encode($data) : ""));
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow GET method
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Validate input
if (!isset($_GET['id'])) {
    logError("User ID is required");
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "User ID is required"]);
    exit();
}

// Include database configuration
require_once 'db_config.php';

$id = $conn->real_escape_string($_GET['id']);
logError("Getting user by ID", ['id' => $id]);

// Query the database
$stmt = $conn->prepare("SELECT id, username, is_admin FROM users WHERE id = ?");
if (!$stmt) {
    logError("Prepare statement failed: " . $conn->error);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
    exit();
}

$stmt->bind_param("s", $id);

if (!$stmt->execute()) {
    logError("Execute failed: " . $stmt->error);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Query execution failed: " . $stmt->error]);
    exit();
}

$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    
    // Return user information
    echo json_encode([
        "success" => true,
        "user" => [
            "id" => $user['id'],
            "username" => $user['username'],
            "isAdmin" => (bool)$user['is_admin']
        ]
    ]);
} else {
    logError("User not found", ['id' => $id]);
    // User not found
    echo json_encode(["success" => false, "message" => "User not found"]);
}

$stmt->close();
$conn->close();
?>
