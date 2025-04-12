
<?php
// Enable CORS for development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");

// Enable error logging
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Log function to help debug
function logError($message, $data = null) {
    error_log("LOGIN API ERROR: " . $message . ($data ? " - " . json_encode($data) : ""));
}

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
$inputRaw = file_get_contents('php://input');
$input = json_decode($inputRaw, true);

// Validate input
if (!isset($input['username']) || !isset($input['password'])) {
    logError("Username and password are required", $input);
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Username and password are required"]);
    exit();
}

// Include database configuration
require_once 'db_config.php';

$username = $conn->real_escape_string($input['username']);
$password = $input['password']; // We'll hash-compare in PHP

logError("Attempting login", ['username' => $username]);

// Query the database
$stmt = $conn->prepare("SELECT id, username, password, is_admin FROM users WHERE username = ?");
if (!$stmt) {
    logError("Prepare statement failed: " . $conn->error);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
    exit();
}

$stmt->bind_param("s", $username);

if (!$stmt->execute()) {
    logError("Execute failed: " . $stmt->error);
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Query execution failed: " . $stmt->error]);
    exit();
}

$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    
    // For now, simple password check (insecure, but matches our current system)
    // In production, you should use password_hash and password_verify
    if ($password === $user['password']) {
        // Return user information (excluding password)
        logError("Login successful", ['userId' => $user['id']]);
        echo json_encode([
            "success" => true,
            "user" => [
                "id" => $user['id'],
                "username" => $user['username'],
                "isAdmin" => (bool)$user['is_admin']
            ]
        ]);
    } else {
        logError("Invalid password", ['username' => $username]);
        // Invalid password
        echo json_encode(["success" => false, "message" => "Invalid credentials"]);
    }
} else {
    logError("User not found", ['username' => $username]);
    // User not found
    echo json_encode(["success" => false, "message" => "Invalid credentials"]);
}

$stmt->close();
$conn->close();
?>
