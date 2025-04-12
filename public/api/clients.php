<?php
// Enable CORS for development
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");

// Enable error logging
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include database configuration
require_once 'db_config.php';

// Log function to help debug
function logError($message, $data = null) {
    error_log("CLIENTS API ERROR: " . $message . ($data ? " - " . json_encode($data) : ""));
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get input data for POST, PUT methods
$input = null;
if ($method === 'POST' || $method === 'PUT') {
    $inputRaw = file_get_contents('php://input');
    $input = json_decode($inputRaw, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        logError("Invalid JSON input", $inputRaw);
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid JSON input: " . json_last_error_msg()]);
        exit();
    }
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
        if (!$stmt) {
            logError("Prepare statement failed: " . $conn->error);
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
            exit();
        }
        
        $stmt->bind_param("s", $url);
        if (!$stmt->execute()) {
            logError("Execute failed: " . $stmt->error);
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Query execution failed: " . $stmt->error]);
            exit();
        }
        
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
        if (!$stmt) {
            logError("Prepare statement failed: " . $conn->error);
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
            exit();
        }
        
        if (!$stmt->execute()) {
            logError("Execute failed: " . $stmt->error);
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Query execution failed: " . $stmt->error]);
            exit();
        }
        
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
        logError("Invalid input data for POST");
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid input data"]);
        exit();
    }
    
    // Validate required fields
    if (!isset($input['name']) || !isset($input['url'])) {
        logError("Missing required fields", $input);
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Name and URL are required"]);
        exit();
    }
    
    // Generate a unique ID
    $id = uniqid();
    
    // Log the data we're trying to insert
    logError("Attempting to insert client", [
        'id' => $id,
        'name' => $input['name'],
        'companyName' => $input['companyName'] ?? null,
        'url' => $input['url']
    ]);
    
    // Insert client
    $stmt = $conn->prepare("INSERT INTO clients (id, name, company_name, url, frame, footer, logo, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    
    if (!$stmt) {
        logError("Prepare statement failed: " . $conn->error);
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
        exit();
    }
    
    $companyName = $input['companyName'] ?? null;
    $frame = $input['frame'] ?? null;
    $footer = $input['footer'] ?? null;
    $logo = $input['logo'] ?? null;
    $password = $input['password'] ?? null;
    
    $stmt->bind_param(
        "ssssssss",
        $id,
        $input['name'],
        $companyName,
        $input['url'],
        $frame,
        $footer,
        $logo,
        $password
    );
    
    if (!$stmt->execute()) {
        logError("Execute failed: " . $stmt->error);
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to create client: " . $stmt->error]);
        exit();
    }
    
    // Insert text points if provided
    if (isset($input['textPoints']) && is_array($input['textPoints'])) {
        foreach ($input['textPoints'] as $point) {
            $pointId = uniqid();
            $fontStyle = json_encode($point['fontStyle'] ?? []);
            
            $pointStmt = $conn->prepare(
                "INSERT INTO text_points (id, client_id, name, x, y, font_family, font_size, font_style, color) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            
            if (!$pointStmt) {
                logError("Prepare statement failed for text point: " . $conn->error);
                continue;
            }
            
            $color = $point['color'] ?? null;
            
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
                $color
            );
            
            if (!$pointStmt->execute()) {
                logError("Failed to insert text point: " . $pointStmt->error);
            }
            
            $pointStmt->close();
        }
    }
    
    // Success response
    echo json_encode([
        "success" => true,
        "message" => "Client created successfully",
        "client" => [
            "id" => $id,
            "name" => $input['name'],
            "companyName" => $companyName,
            "url" => $input['url'],
            "frame" => $frame,
            "footer" => $footer,
            "logo" => $logo,
            "password" => $password,
            "textPoints" => $input['textPoints'] ?? []
        ]
    ]);
    
    $stmt->close();
} 
// PUT: Update an existing client
else if ($method === 'PUT') {
    if ($input === null || !isset($input['id'])) {
        logError("Invalid input data or missing client ID for PUT");
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid input data or missing client ID"]);
        exit();
    }
    
    $id = $conn->real_escape_string($input['id']);
    logError("Attempting to update client", ['id' => $id]);
    
    // Check if client exists
    $checkStmt = $conn->prepare("SELECT id FROM clients WHERE id = ?");
    if (!$checkStmt) {
        logError("Prepare statement failed: " . $conn->error);
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
        exit();
    }
    
    $checkStmt->bind_param("s", $id);
    
    if (!$checkStmt->execute()) {
        logError("Execute failed: " . $checkStmt->error);
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Query execution failed: " . $checkStmt->error]);
        exit();
    }
    
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows === 0) {
        $checkStmt->close();
        logError("Client not found for update", ['id' => $id]);
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
    
    if (empty($updateFields) && !isset($input['textPoints'])) {
        logError("No fields to update");
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "No fields to update"]);
        exit();
    }
    
    // Only update client fields if there are fields to update
    if (!empty($updateFields)) {
        $updateQuery = "UPDATE clients SET " . implode(", ", $updateFields) . " WHERE id = ?";
        $updateParams[] = $id;
        $updateTypes .= "s";
        
        $updateStmt = $conn->prepare($updateQuery);
        if (!$updateStmt) {
            logError("Prepare statement failed for update: " . $conn->error);
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
            exit();
        }
        
        $updateStmt->bind_param($updateTypes, ...$updateParams);
        
        $updateSuccess = $updateStmt->execute();
        if (!$updateSuccess) {
            logError("Execute failed for update: " . $updateStmt->error);
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Failed to update client: " . $updateStmt->error]);
            exit();
        }
        
        $updateStmt->close();
    }
    
    // Handle text points update if provided
    if (isset($input['textPoints']) && is_array($input['textPoints'])) {
        // Delete existing text points
        $deletePointsStmt = $conn->prepare("DELETE FROM text_points WHERE client_id = ?");
        $deletePointsStmt->bind_param("s", $id);
        
        if (!$deletePointsStmt->execute()) {
            logError("Failed to delete existing text points: " . $deletePointsStmt->error);
        }
        
        $deletePointsStmt->close();
        
        // Insert new text points
        foreach ($input['textPoints'] as $point) {
            $pointId = isset($point['id']) ? $point['id'] : uniqid();
            $fontStyle = json_encode($point['fontStyle'] ?? []);
            
            $pointStmt = $conn->prepare(
                "INSERT INTO text_points (id, client_id, name, x, y, font_family, font_size, font_style, color) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            
            if (!$pointStmt) {
                logError("Prepare statement failed for text point insert: " . $conn->error);
                continue;
            }
            
            $color = $point['color'] ?? null;
            
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
                $color
            );
            
            if (!$pointStmt->execute()) {
                logError("Failed to insert text point: " . $pointStmt->error);
            }
            
            $pointStmt->close();
        }
    }
    
    echo json_encode([
        "success" => true,
        "message" => "Client updated successfully"
    ]);
} 
// DELETE: Delete a client
else if ($method === 'DELETE') {
    if (!isset($_GET['id'])) {
        logError("Client ID is required for DELETE");
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Client ID is required"]);
        exit();
    }
    
    $id = $conn->real_escape_string($_GET['id']);
    logError("Attempting to delete client", ['id' => $id]);
    
    // Delete associated text points first
    $deletePointsStmt = $conn->prepare("DELETE FROM text_points WHERE client_id = ?");
    if (!$deletePointsStmt) {
        logError("Prepare statement failed for delete text points: " . $conn->error);
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
        exit();
    }
    
    $deletePointsStmt->bind_param("s", $id);
    
    if (!$deletePointsStmt->execute()) {
        logError("Failed to delete text points: " . $deletePointsStmt->error);
    }
    
    $deletePointsStmt->close();
    
    // Delete the client
    $deleteClientStmt = $conn->prepare("DELETE FROM clients WHERE id = ?");
    if (!$deleteClientStmt) {
        logError("Prepare statement failed for delete client: " . $conn->error);
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $conn->error]);
        exit();
    }
    
    $deleteClientStmt->bind_param("s", $id);
    
    if ($deleteClientStmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Client deleted successfully"
        ]);
    } else {
        logError("Failed to delete client: " . $deleteClientStmt->error);
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Failed to delete client: " . $deleteClientStmt->error]);
    }
    
    $deleteClientStmt->close();
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
}

$conn->close();
?>
