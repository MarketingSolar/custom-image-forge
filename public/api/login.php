
<?php
// Enable CORS for development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

// Get and decode JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($input['username']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Username and password are required"]);
    exit();
}

// Include database configuration
require_once 'db_config.php';

$username = $conn->real_escape_string($input['username']);
$password = $input['password']; // We'll hash-compare in PHP

// Query the database
$stmt = $conn->prepare("SELECT id, username, password, is_admin FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    
    // For now, simple password check (insecure, but matches our current system)
    // In production, you should use password_hash and password_verify
    if ($password === $user['password']) {
        // Return user information (excluding password)
        echo json_encode([
            "success" => true,
            "user" => [
                "id" => $user['id'],
                "username" => $user['username'],
                "isAdmin" => (bool)$user['is_admin']
            ]
        ]);
    } else {
        // Invalid password
        echo json_encode(["success" => false, "message" => "Invalid credentials"]);
    }
} else {
    // User not found
    echo json_encode(["success" => false, "message" => "Invalid credentials"]);
}

$stmt->close();
$conn->close();
?>
