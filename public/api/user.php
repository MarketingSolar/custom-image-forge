
<?php
// Enable CORS for development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");

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
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "User ID is required"]);
    exit();
}

// Include database configuration
require_once 'db_config.php';

$id = $conn->real_escape_string($_GET['id']);

// Query the database
$stmt = $conn->prepare("SELECT id, username, is_admin FROM users WHERE id = ?");
$stmt->bind_param("s", $id);
$stmt->execute();
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
    // User not found
    echo json_encode(["success" => false, "message" => "User not found"]);
}

$stmt->close();
$conn->close();
?>
