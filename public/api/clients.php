<?php
// This file contains the necessary code to handle client-related operations

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connection.php';

// Get action from query string
$action = isset($_GET['action']) ? $_GET['action'] : "";

// Handle different actions based on the action parameter
try {
    switch ($action) {
        case 'list':
            listClients($conn);
            break;
        case 'add':
            addClient($conn);
            break;
        case 'update':
            updateClient($conn);
            break;
        case 'delete':
            deleteClient($conn);
            break;
        case 'prepare_directory':
            prepareDirectory();
            break;
        default:
            throw new Exception("Invalid action specified");
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();

// Function to list all clients
function listClients($conn) {
    $sql = "SELECT 
                id, name, url, company_name as companyName, logo, frame, footer, password
            FROM clients";
    $result = $conn->query($sql);
    
    if (!$result) {
        throw new Exception("Database query failed: " . $conn->error);
    }
    
    $clients = [];
    while ($row = $result->fetch_assoc()) {
        // Convert numeric ID to string for consistency with frontend
        $row['id'] = (string)$row['id'];
        
        // Get text points for this client
        $textPointsSql = "SELECT 
                            id, name, x, y, font_family as fontFamily, 
                            font_size as fontSize, font_style as fontStyle, color
                          FROM text_points 
                          WHERE client_id = ?";
        $stmt = $conn->prepare($textPointsSql);
        $clientId = $row['id'];
        $stmt->bind_param("s", $clientId);
        $stmt->execute();
        $textPointsResult = $stmt->get_result();
        
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
        
        $row['textPoints'] = $textPoints;
        
        // Check if molduras directory exists for this client, create if not
        createClientDirectory($row['url']);
        
        $clients[] = $row;
    }
    
    echo json_encode($clients);
}

// Function to add a new client
function addClient($conn) {
    // Get input JSON
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['name']) || !isset($data['url'])) {
        throw new Exception("Name and URL are required fields");
    }
    
    // Check if client with same URL already exists
    $checkSql = "SELECT id FROM clients WHERE url = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $data['url']);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows > 0) {
        throw new Exception("A client with this URL already exists");
    }
    
    // Insert new client
    $sql = "INSERT INTO clients (name, url, company_name, logo, frame, footer, password) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    
    $name = $data['name'];
    $url = $data['url'];
    $companyName = isset($data['companyName']) ? $data['companyName'] : null;
    $logo = isset($data['logo']) ? $data['logo'] : null;
    $frame = isset($data['frame']) ? $data['frame'] : null;
    $footer = isset($data['footer']) ? $data['footer'] : null;
    $password = isset($data['password']) ? $data['password'] : null;
    
    $stmt->bind_param("sssssss", $name, $url, $companyName, $logo, $frame, $footer, $password);
    $stmt->execute();
    
    if ($stmt->affected_rows <= 0) {
        throw new Exception("Failed to add client: " . $stmt->error);
    }
    
    $newClientId = $stmt->insert_id;
    
    // Create necessary directories
    createClientDirectory($url);
    
    // Return success with the client ID
    echo json_encode([
        'success' => true,
        'message' => 'Client added successfully',
        'clientId' => (string)$newClientId
    ]);
}

// Function to update an existing client
function updateClient($conn) {
    // Get input JSON
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['id'])) {
        throw new Exception("Client ID is required");
    }
    
    // Check if client exists
    $checkSql = "SELECT url FROM clients WHERE id = ?";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bind_param("s", $data['id']);
    $checkStmt->execute();
    $checkResult = $checkStmt->get_result();
    
    if ($checkResult->num_rows <= 0) {
        throw new Exception("Client not found");
    }
    
    $clientRow = $checkResult->fetch_assoc();
    $oldUrl = $clientRow['url'];
    
    // Prepare update SQL
    $sql = "UPDATE clients SET 
                name = ?, 
                url = ?, 
                company_name = ?, 
                logo = ?";
    
    // Add conditional fields to update
    if (isset($data['frame'])) {
        $sql .= ", frame = ?";
    }
    
    if (isset($data['footer'])) {
        $sql .= ", footer = ?";
    }
    
    if (isset($data['password'])) {
        $sql .= ", password = ?";
    }
    
    $sql .= " WHERE id = ?";
    
    // Prepare and bind parameters
    $stmt = $conn->prepare($sql);
    
    $name = $data['name'];
    $url = $data['url'];
    $companyName = isset($data['companyName']) ? $data['companyName'] : null;
    $logo = isset($data['logo']) ? $data['logo'] : null;
    
    // Create parameter array and types
    $paramTypes = "ssss";
    $params = [$name, $url, $companyName, $logo];
    
    // Add conditional parameters
    if (isset($data['frame'])) {
        $paramTypes .= "s";
        $params[] = $data['frame'];
    }
    
    if (isset($data['footer'])) {
        $paramTypes .= "s";
        $params[] = $data['footer'];
    }
    
    if (isset($data['password'])) {
        $paramTypes .= "s";
        $params[] = $data['password'];
    }
    
    // Add ID parameter
    $paramTypes .= "s";
    $params[] = $data['id'];
    
    // Bind all parameters
    $stmt->bind_param($paramTypes, ...$params);
    
    $stmt->execute();
    
    // Check if the URL has changed and rename the directory if needed
    if ($oldUrl !== $url) {
        renameClientDirectory($oldUrl, $url);
    } else {
        // Ensure the directory exists
        createClientDirectory($url);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Client updated successfully'
    ]);
}

// Function to delete a client
function deleteClient($conn) {
    // Get input JSON
    $data = json_decode(file_get_contents('php://input'), true);
    
    // Validate required fields
    if (!isset($data['id'])) {
        throw new Exception("Client ID is required");
    }
    
    // Get client URL before deleting (for directory removal)
    $urlSql = "SELECT url FROM clients WHERE id = ?";
    $urlStmt = $conn->prepare($urlSql);
    $urlStmt->bind_param("s", $data['id']);
    $urlStmt->execute();
    $urlResult = $urlStmt->get_result();
    
    if ($urlResult->num_rows > 0) {
        $clientRow = $urlResult->fetch_assoc();
        $clientUrl = $clientRow['url'];
        
        // Delete associated text points first
        $deleteTextPointsSql = "DELETE FROM text_points WHERE client_id = ?";
        $deleteTextPointsStmt = $conn->prepare($deleteTextPointsSql);
        $deleteTextPointsStmt->bind_param("s", $data['id']);
        $deleteTextPointsStmt->execute();
        
        // Now delete the client
        $sql = "DELETE FROM clients WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $data['id']);
        $stmt->execute();
        
        if ($stmt->affected_rows <= 0) {
            throw new Exception("Failed to delete client: " . $stmt->error);
        }
        
        // Try to remove client directory
        removeClientDirectory($clientUrl);
        
        echo json_encode([
            'success' => true,
            'message' => 'Client deleted successfully'
        ]);
    } else {
        throw new Exception("Client not found");
    }
}

// Helper function to create directory for a client
function createClientDirectory($clientUrl) {
    $baseDir = "../molduras";
    
    // Create base directory if it doesn't exist
    if (!file_exists($baseDir)) {
        if (!mkdir($baseDir, 0755, true)) {
            error_log("Failed to create base directory: $baseDir");
            return false;
        }
    }
    
    // Create client directory
    $clientDir = "$baseDir/$clientUrl";
    if (!file_exists($clientDir)) {
        if (!mkdir($clientDir, 0755, true)) {
            error_log("Failed to create client directory: $clientDir");
            return false;
        }
        
        // Create an .htaccess file in the client directory to ensure proper access
        $htaccess = "$clientDir/.htaccess";
        $htaccessContent = "
# Allow access to image files
<FilesMatch \"\.(jpg|jpeg|png|gif)$\">
    Require all granted
</FilesMatch>

# Set proper content types
<IfModule mod_mime.c>
    AddType image/jpeg jpg jpeg
    AddType image/png png
    AddType image/gif gif
</IfModule>

# Allow cross-origin requests for images
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin \"*\"
</IfModule>
";
        file_put_contents($htaccess, $htaccessContent);
    }
    
    return true;
}

// Helper function to prepare directory for a client
function prepareDirectory() {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['clientUrl'])) {
        throw new Exception("Client URL is required");
    }
    
    $clientUrl = $data['clientUrl'];
    
    try {
        if (createClientDirectory($clientUrl)) {
            echo json_encode([
                'success' => true,
                'message' => 'Client directory prepared successfully'
            ]);
        } else {
            throw new Exception("Failed to create client directory");
        }
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

// Helper function to rename client directory
function renameClientDirectory($oldUrl, $newUrl) {
    $baseDir = "../molduras";
    $oldClientDir = "$baseDir/$oldUrl";
    $newClientDir = "$baseDir/$newUrl";
    
    if (file_exists($oldClientDir)) {
        if (!rename($oldClientDir, $newClientDir)) {
            // If rename fails, create new directory but don't throw error
            createClientDirectory($newUrl);
        }
    } else {
        // If old directory doesn't exist, create new one
        createClientDirectory($newUrl);
    }
    
    return true;
}

// Helper function to remove client directory
function removeClientDirectory($clientUrl) {
    $baseDir = "../molduras";
    $clientDir = "$baseDir/$clientUrl";
    
    if (file_exists($clientDir)) {
        // Simple directory deletion - in a production environment,
        // you might want a more robust directory removal function
        array_map('unlink', glob("$clientDir/*.*"));
        rmdir($clientDir);
    }
    
    return true;
}
