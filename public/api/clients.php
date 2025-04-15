
<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'db_connection.php';

// For debugging
error_log("clients.php accessed: " . $_SERVER['REQUEST_METHOD'] . " " . $_GET['action']);

// Get action from request
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'list':
            // List all clients
            $clients = [];
            $sql = "SELECT * FROM clients";
            $result = $conn->query($sql);
            
            if ($result === false) {
                throw new Exception("Database error: " . $conn->error);
            }
            
            if ($result->num_rows > 0) {
                while ($row = $result->fetch_assoc()) {
                    // Get text points for this client
                    $clientId = $row['id'];
                    $textPoints = [];
                    
                    $textPointsSql = "SELECT * FROM text_points WHERE client_id = ?";
                    $stmt = $conn->prepare($textPointsSql);
                    $stmt->bind_param("s", $clientId);
                    $stmt->execute();
                    $textPointsResult = $stmt->get_result();
                    
                    if ($textPointsResult->num_rows > 0) {
                        while ($textPointRow = $textPointsResult->fetch_assoc()) {
                            // Convert font_style from JSON to array
                            $fontStyle = json_decode($textPointRow['font_style'], true) ?: [];
                            
                            $textPoints[] = [
                                'id' => $textPointRow['id'],
                                'name' => $textPointRow['name'],
                                'x' => (float)$textPointRow['x_position'],
                                'y' => (float)$textPointRow['y_position'],
                                'fontFamily' => $textPointRow['font_family'],
                                'fontSize' => (int)$textPointRow['font_size'],
                                'fontStyle' => $fontStyle,
                                'color' => $textPointRow['color']
                            ];
                        }
                    }
                    
                    // Build client object
                    $clients[] = [
                        'id' => $row['id'],
                        'name' => $row['name'],
                        'companyName' => $row['company_name'],
                        'url' => $row['url'],
                        'frame' => $row['frame'],
                        'footer' => $row['footer'],
                        'logo' => $row['logo'],
                        'password' => $row['password'],
                        'textPoints' => $textPoints
                    ];
                }
            }
            
            echo json_encode($clients);
            break;
            
        case 'add':
            // Add a new client
            $data = get_json_post_data();
            
            if (!isset($data['name']) || !isset($data['url'])) {
                throw new Exception("Missing required fields (name, url)");
            }
            
            // Create unique ID if not provided
            $id = isset($data['id']) ? $data['id'] : uniqid();
            $name = $data['name'];
            $companyName = isset($data['companyName']) ? $data['companyName'] : null;
            $url = $data['url'];
            $frame = isset($data['frame']) ? $data['frame'] : null;
            $footer = isset($data['footer']) ? $data['footer'] : null;
            $logo = isset($data['logo']) ? $data['logo'] : null;
            $password = isset($data['password']) ? $data['password'] : null;
            
            $sql = "INSERT INTO clients (id, name, company_name, url, frame, footer, logo, password) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
                    
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ssssssss", $id, $name, $companyName, $url, $frame, $footer, $logo, $password);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'Client added successfully',
                    'client' => [
                        'id' => $id,
                        'name' => $name,
                        'companyName' => $companyName,
                        'url' => $url,
                        'frame' => $frame,
                        'footer' => $footer,
                        'logo' => $logo,
                        'password' => $password,
                        'textPoints' => []
                    ]
                ]);
            } else {
                throw new Exception("Error adding client: " . $stmt->error);
            }
            break;
            
        case 'update':
            // Update an existing client
            $data = get_json_post_data();
            
            if (!isset($data['id'])) {
                throw new Exception("Missing client ID");
            }
            
            $id = $data['id'];
            $name = isset($data['name']) ? $data['name'] : null;
            $companyName = isset($data['companyName']) ? $data['companyName'] : null;
            $url = isset($data['url']) ? $data['url'] : null;
            $frame = isset($data['frame']) ? $data['frame'] : null;
            $footer = isset($data['footer']) ? $data['footer'] : null;
            $logo = isset($data['logo']) ? $data['logo'] : null;
            $password = isset($data['password']) ? $data['password'] : null;
            
            // Build dynamic update query based on provided fields
            $updateFields = [];
            $params = [];
            $types = "";
            
            if ($name !== null) {
                $updateFields[] = "name = ?";
                $params[] = $name;
                $types .= "s";
            }
            
            if ($companyName !== null) {
                $updateFields[] = "company_name = ?";
                $params[] = $companyName;
                $types .= "s";
            }
            
            if ($url !== null) {
                $updateFields[] = "url = ?";
                $params[] = $url;
                $types .= "s";
            }
            
            if ($frame !== null) {
                $updateFields[] = "frame = ?";
                $params[] = $frame;
                $types .= "s";
            }
            
            if ($footer !== null) {
                $updateFields[] = "footer = ?";
                $params[] = $footer;
                $types .= "s";
            }
            
            if ($logo !== null) {
                $updateFields[] = "logo = ?";
                $params[] = $logo;
                $types .= "s";
            }
            
            if ($password !== null) {
                $updateFields[] = "password = ?";
                $params[] = $password;
                $types .= "s";
            }
            
            if (empty($updateFields)) {
                echo json_encode(['success' => true, 'message' => 'No fields to update']);
                break;
            }
            
            $sql = "UPDATE clients SET " . implode(", ", $updateFields) . " WHERE id = ?";
            $params[] = $id;
            $types .= "s";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Client updated successfully']);
            } else {
                throw new Exception("Error updating client: " . $stmt->error);
            }
            break;
            
        case 'delete':
            // Delete a client
            $data = get_json_post_data();
            
            if (!isset($data['id'])) {
                throw new Exception("Missing client ID");
            }
            
            $id = $data['id'];
            
            // Start transaction
            $conn->begin_transaction();
            
            try {
                // Delete text points
                $sql1 = "DELETE FROM text_points WHERE client_id = ?";
                $stmt1 = $conn->prepare($sql1);
                $stmt1->bind_param("s", $id);
                $stmt1->execute();
                
                // Delete client
                $sql2 = "DELETE FROM clients WHERE id = ?";
                $stmt2 = $conn->prepare($sql2);
                $stmt2->bind_param("s", $id);
                $stmt2->execute();
                
                $conn->commit();
                echo json_encode(['success' => true, 'message' => 'Client deleted successfully']);
            } catch (Exception $e) {
                $conn->rollback();
                throw new Exception("Error deleting client: " . $e->getMessage());
            }
            break;
            
        default:
            throw new Exception("Invalid action");
    }
} catch (Exception $e) {
    error_log("ERROR in clients.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?>
