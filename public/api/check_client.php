
<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connection.php';

try {
    // Get the data - support both GET and POST
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Get the JSON data from the request
        $data = json_decode(file_get_contents('php://input'), true);
        $clientUrl = isset($data['clientUrl']) ? $data['clientUrl'] : '';
    } else {
        // For direct URL access
        $clientUrl = isset($_GET['clientUrl']) ? $_GET['clientUrl'] : '';
    }
    
    // Check if client URL is provided
    if (empty($clientUrl)) {
        throw new Exception("Client URL is required");
    }
    
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
    
    // Check if the folder exists, if not, create it
    $clientDir = "../molduras/{$clientUrl}";
    if (!file_exists($clientDir)) {
        mkdir($clientDir, 0755, true);
    }
    
    // Get text points for this client
    $textPointsSql = "SELECT 
                      id, name, x, y, font_family as fontFamily, 
                      font_size as fontSize, font_style as fontStyle, color
                    FROM text_points 
                    WHERE client_id = ?";
    $stmtPoints = $conn->prepare($textPointsSql);
    $clientId = $client['id'];
    $stmtPoints->bind_param("s", $clientId);
    $stmtPoints->execute();
    $textPointsResult = $stmtPoints->get_result();
    
    $textPoints = [];
    while ($textPointRow = $textPointsResult->fetch_assoc()) {
        // Convert font_style from string to array
        $textPointRow['fontStyle'] = $textPointRow['fontStyle'] ? explode(',', $textPointRow['fontStyle']) : [];
        
        // Convert numeric values to proper types
        $textPointRow['x'] = (float)$textPointRow['x'];
        $textPointRow['y'] = (float)$textPointRow['y'];
        $textPointRow['fontSize'] = (int)$textPointRow['fontSize'];
        
        $textPoints[] = $textPointRow;
    }
    
    // Return client info
    echo json_encode([
        'success' => true,
        'client' => [
            'id' => (string)$client['id'],
            'name' => $client['name'],
            'url' => $client['url'],
            'companyName' => $client['company_name'],
            'frame' => $client['frame'],
            'footer' => $client['footer'],
            'logo' => $client['logo'],
            'password' => $client['password'],
            'hasPassword' => !empty($client['password']),
            'textPoints' => $textPoints
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
