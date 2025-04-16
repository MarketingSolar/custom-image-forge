
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
    
    // Check if client URL is provided
    if (!isset($data['clientUrl'])) {
        throw new Exception("Client URL is required");
    }
    
    $clientUrl = $data['clientUrl'];
    
    // Query to check if the client exists
    $sql = "SELECT * FROM clients WHERE url = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $clientUrl);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        // Client not found
        echo json_encode([
            'success' => false,
            'message' => 'Cliente não encontrado'
        ]);
        exit();
    }
    
    $client = $result->fetch_assoc();
    
    // Return client info (without sensitive data)
    echo json_encode([
        'success' => true,
        'client' => [
            'id' => $client['id'],
            'name' => $client['name'],
            'url' => $client['url'],
            'hasPassword' => !empty($client['password'])
        ]
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>
