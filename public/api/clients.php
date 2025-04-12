
<?php
// Enable CORS for development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database configuration
require_once 'db_config.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get input data for POST, PUT methods
$input = null;
if ($method === 'POST' || $method === 'PUT') {
    $input = json_decode(file_get_contents('php://input'), true);
}

// GET: Fetch all clients or a specific client
if ($method === 'GET') {
    if (isset($_GET['id'])) {
        // Get specific client
        $id = $conn->real_escape_string($_GET['id']);
        $stmt = $conn->prepare("SELECT * FROM clients WHERE id = ?");
        $stmt->bind_param("s", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 1) {
            $client = $result->fetch_assoc();
            
            // Get client text points
            $textPointsStmt = $conn->prepare("SELECT * FROM text_points WHERE client_id = ?");
            $textPointsStmt->bind_param("s", $id);
            $textPointsStmt->execute();
            $textPointsResult = $textPointsStmt->get_result();
            
            $textPoints = [];
            while ($point = $textPointsResult->fetch_assoc()) {
                $textPoints[] = [
                    'id' => $point['id'],
                    'name' => $point['name'],
                    'x' => (float)$point['x'],
                    'y' => (float)$point['y'],
                    'fontFamily' => $point['font_family'],
                    'fontSize' => (int)$point['font_size'],
                    'fontStyle' => json_decode($point['font_style']),
                    'color' => $point['color']
                ];
            }
            
            $client['textPoints'] = $textPoints;
            
            echo json_encode([
                "success" => true,
                "client" => [
                    "id" => $client['id'],
                    "name" => $client['name'],
                    "companyName" => $client['company_name'],
                    "url" => $client['url'],
                    "frame" => $client['frame'],
                    "footer" => $client['footer'],
                    "logo" => $client['logo'],
                    "password" => $client['password'],
                    "textPoints" => $textPoints
                ]
            ]);
            
            $textPointsStmt->close();
        } else {
            echo json_encode(["success" => false, "message" => "Client not found"]);
        }
        
        $stmt->close();
    } else if (isset($_GET['url'])) {
        // Get client by URL
        $url = $conn->real_escape_string($_GET['url']);
        $stmt = $conn->prepare("SELECT * FROM clients WHERE url = ?");
        $stmt->bind_param("s", $url);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 1) {
            $client = $result->fetch_assoc();
            
            // Get client text points
            $textPointsStmt = $conn->prepare("SELECT * FROM text_points WHERE client_id = ?");
            $textPointsStmt->bind_param("s", $client['id']);
            $textPointsStmt->execute();
            $textPointsResult = $textPointsStmt->get_result();
            
            $textPoints = [];
            while ($point = $textPointsResult->fetch_assoc()) {
                $textPoints[] = [
                    'id' => $point['id'],
                    'name' => $point['name'],
                    'x' => (float)$point['x'],
                    'y' => (float)$point['y'],
                    'fontFamily' => $point['font_family'],
                    'fontSize' => (int)$point['font_size'],
                    'fontStyle' => json_decode($point['font_style']),
                    'color' => $point['color']
                ];
            }
            
            echo json_encode([
                "success" => true,
                "client" => [
                    "id" => $client['id'],
                    "name" => $client['name'],
                    "companyName" => $client['company_name'],
                    "url" => $client['url'],
                    "frame" => $client['frame'],
                    "footer" => $client['footer'],
                    "logo" => $client['logo'],
                    "password" => $client['password'],
                    "textPoints" => $textPoints
                ]
            ]);
            
            $textPointsStmt->close();
        } else {
            echo json_encode(["success" => false, "message" => "Client not found"]);
        }
        
        $stmt->close();
    } else {
        // Get all clients
        $stmt = $conn->prepare("SELECT * FROM clients");
        $stmt->execute();
        $result = $stmt->get_result();
        
        $clients = [];
        while ($client = $result->fetch_assoc()) {
            // Get client text points
            $textPointsStmt = $conn->prepare("SELECT * FROM text_points WHERE client_id = ?");
            $textPointsStmt->bind_param("s", $client['id']);
            $textPointsStmt->execute();
            $textPointsResult = $textPointsStmt->get_result();
            
            $textPoints = [];
            while ($point = $textPointsResult->fetch_assoc()) {
                $textPoints[] = [
                    'id' => $point['id'],
                    'name' => $point['name'],
                    'x' => (float)$point['x'],
                    'y' => (float)$point['y'],
                    'fontFamily' => $point['font_family'],
                    'fontSize' => (int)$point['font_size'],
                    'fontStyle' => json_decode($point['font_style']),
                    'color' => $point['color']
                ];
            }
            
            $clients[] = [
                "id" => $client['id'],
                "name" => $client['name'],
                "companyName" => $client['company_name'],
                "url" => $client['url'],
                "frame" => $client['frame'],
                "footer" => $client['footer'],
                "logo" => $client['logo'],
                "password" => $client['password'],
                "textPoints" => $textPoints
            ];
            
            $textPointsStmt->close();
        }
        
        echo json_encode([
            "success" => true,
            "clients" => $clients
        ]);
        
        $stmt->close();
    }
} 
// POST: Create a new client
else if ($method === 'POST') {
    if ($input === null) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid input data"]);
        exit();
    }
    
    // Validate required fields
    if (!isset($input['name']) || !isset($input['url'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Name and URL are required"]);
        exit();
    }
    
    // Generate a unique ID
    $id = uniqid();
    
    // Insert client
    $stmt = $conn->prepare("INSERT INTO clients (id, name, company_name, url, frame, footer, logo, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param(
        "ssssssss",
        $id,
        $input['name'],
        $input['companyName'] ?? null,
        $input['url'],
        $input['frame'] ?? null,
        $input['footer'] ?? null,
        $input['logo'] ?? null,
        $input['password'] ?? null
    );
    
    if ($stmt->execute()) {
        // Insert text points if provided
        if (isset($input['textPoints']) && is_array($input['textPoints'])) {
            foreach ($input['textPoints'] as $point) {
                $pointId = uniqid();
                $fontStyle = json_encode($point['fontStyle'] ?? []);
                
                $pointStmt = $conn->prepare(
                    "INSERT INTO text_points (id, client_id, name, x, y, font_family, font_size, font_style, color) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
                );
                
                $pointStmt->bind_param(
                    "sssddssss",
                    $pointId,
                    $id,
                    $point['name'],
                    $point['x'],
                    $point['y'],
                    $point['fontFamily'],
                    $point['fontSize'],
                    $fontStyle,
                    $point['color'] ?? null
                );
                
                $pointStmt->execute();
                $pointStmt->close();
            }
        }
        
        echo json_encode([
            "success" => true,
            "message" => "Client created successfully",
            "client" => [
                "id" => $id,
                "name" => $input['name'],
                "companyName" => $input['companyName'] ?? null,
                "url" => $input['url'],
                "frame" => $input['frame'] ?? null,
                "footer" => $input['footer'] ?? null,
                "logo" => $input['logo'] ?? null,
                "password" => $input['password'] ?? null,
                "textPoints" => $input['textPoints'] ?? []
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to create client: " . $stmt->error]);
    }
    
    $stmt->close();
} 
// PUT: Update an existing client
else if ($method === 'PUT') {
    if ($input === null || !isset($input['id'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid input data or missing client ID"]);
        exit();
    }
    
    $id = $conn->real_escape_string($input['id']);
    
    // Check if client exists
    $checkStmt = $conn->prepare("SELECT id FROM clients WHERE id = ?");
    $checkStmt->bind_param("s", $id);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        $checkStmt->close();
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Client not found"]);
        exit();
    }
    
    $checkStmt->close();
    
    // Update client
    $updateFields = [];
    $updateParams = [];
    $updateTypes = "";
    
    if (isset($input['name'])) {
        $updateFields[] = "name = ?";
        $updateParams[] = $input['name'];
        $updateTypes .= "s";
    }
    
    if (array_key_exists('companyName', $input)) {
        $updateFields[] = "company_name = ?";
        $updateParams[] = $input['companyName'];
        $updateTypes .= "s";
    }
    
    if (isset($input['url'])) {
        $updateFields[] = "url = ?";
        $updateParams[] = $input['url'];
        $updateTypes .= "s";
    }
    
    if (array_key_exists('frame', $input)) {
        $updateFields[] = "frame = ?";
        $updateParams[] = $input['frame'];
        $updateTypes .= "s";
    }
    
    if (array_key_exists('footer', $input)) {
        $updateFields[] = "footer = ?";
        $updateParams[] = $input['footer'];
        $updateTypes .= "s";
    }
    
    if (array_key_exists('logo', $input)) {
        $updateFields[] = "logo = ?";
        $updateParams[] = $input['logo'];
        $updateTypes .= "s";
    }
    
    if (array_key_exists('password', $input)) {
        $updateFields[] = "password = ?";
        $updateParams[] = $input['password'];
        $updateTypes .= "s";
    }
    
    if (empty($updateFields)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "No fields to update"]);
        exit();
    }
    
    $updateQuery = "UPDATE clients SET " . implode(", ", $updateFields) . " WHERE id = ?";
    $updateParams[] = $id;
    $updateTypes .= "s";
    
    $updateStmt = $conn->prepare($updateQuery);
    $updateStmt->bind_param($updateTypes, ...$updateParams);
    
    $updateSuccess = $updateStmt->execute();
    $updateStmt->close();
    
    // Handle text points update if provided
    if (isset($input['textPoints']) && is_array($input['textPoints'])) {
        // Delete existing text points
        $deletePointsStmt = $conn->prepare("DELETE FROM text_points WHERE client_id = ?");
        $deletePointsStmt->bind_param("s", $id);
        $deletePointsStmt->execute();
        $deletePointsStmt->close();
        
        // Insert new text points
        foreach ($input['textPoints'] as $point) {
            $pointId = isset($point['id']) ? $point['id'] : uniqid();
            $fontStyle = json_encode($point['fontStyle'] ?? []);
            
            $pointStmt = $conn->prepare(
                "INSERT INTO text_points (id, client_id, name, x, y, font_family, font_size, font_style, color) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            
            $pointStmt->bind_param(
                "sssddssss",
                $pointId,
                $id,
                $point['name'],
                $point['x'],
                $point['y'],
                $point['fontFamily'],
                $point['fontSize'],
                $fontStyle,
                $point['color'] ?? null
            );
            
            $pointStmt->execute();
            $pointStmt->close();
        }
    }
    
    if ($updateSuccess) {
        echo json_encode([
            "success" => true,
            "message" => "Client updated successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to update client"]);
    }
} 
// DELETE: Delete a client
else if ($method === 'DELETE') {
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Client ID is required"]);
        exit();
    }
    
    $id = $conn->real_escape_string($_GET['id']);
    
    // Delete associated text points first
    $deletePointsStmt = $conn->prepare("DELETE FROM text_points WHERE client_id = ?");
    $deletePointsStmt->bind_param("s", $id);
    $deletePointsStmt->execute();
    $deletePointsStmt->close();
    
    // Delete the client
    $deleteClientStmt = $conn->prepare("DELETE FROM clients WHERE id = ?");
    $deleteClientStmt->bind_param("s", $id);
    
    if ($deleteClientStmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Client deleted successfully"
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to delete client"]);
    }
    
    $deleteClientStmt->close();
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}

$conn->close();
?>
