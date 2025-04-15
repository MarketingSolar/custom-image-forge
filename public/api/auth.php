
<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connection.php';

try {
    // Get the JSON data from the request
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Check if username and password are provided
    if (!isset($data['username']) || !isset($data['password'])) {
        throw new Exception("Username and password are required");
    }
    
    $username = $data['username'];
    $password = $data['password'];
    
    // Query to check if the user exists
    $sql = "SELECT * FROM users WHERE username = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        // User not found
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password'
        ]);
        exit();
    }
    
    $user = $result->fetch_assoc();
    
    // Verify password
    // In a real-world scenario, passwords should be hashed
    if ($password === $user['password']) {
        // Password match
        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'isAdmin' => true // Assuming all users in the users table are admins
            ]
        ]);
    } else {
        // Invalid password
        echo json_encode([
            'success' => false,
            'message' => 'Invalid username or password'
        ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>
