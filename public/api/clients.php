
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
                    
                    // Check if text_points table exists
                    $check_table = "SHOW TABLES LIKE 'text_points'";
                    $table_exists = $conn->query($check_table)->num_rows > 0;
                    
                    if ($table_exists) {
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
                    }
                    
                    // Build client object
                    $client = [
                        'id' => $row['id'],
                        'name' => $row['name'],
                        'url' => $row['url'],
                        'textPoints' => $textPoints
                    ];
                    
                    // Add optional fields if they exist in the database
                    if (isset($row['company_name'])) {
                        $client['companyName'] = $row['company_name'];
                    }
                    
                    if (isset($row['frame'])) {
                        $client['frame'] = $row['frame'];
                    }
                    
                    if (isset($row['footer'])) {
                        $client['footer'] = $row['footer'];
                    }
                    
                    if (isset($row['logo'])) {
                        $client['logo'] = $row['logo'];
                    }
                    
                    if (isset($row['password'])) {
                        $client['password'] = $row['password'];
                    }
                    
                    $clients[] = $client;
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
            
            // Initialize client data with required fields
            $id = isset($data['id']) ? $data['id'] : uniqid();
            $name = $data['name'];
            $url = $data['url'];
            
            // First, check which columns exist in the clients table
            $columns = [];
            $values = [];
            $types = "";
            $placeholders = [];
            
            // Add required fields
            $columns[] = "id";
            $values[] = $id;
            $types .= "s";
            $placeholders[] = "?";
            
            $columns[] = "name";
            $values[] = $name;
            $types .= "s";
            $placeholders[] = "?";
            
            $columns[] = "url";
            $values[] = $url;
            $types .= "s";
            $placeholders[] = "?";
            
            // Check for optional fields
            if (isset($data['companyName'])) {
                $check = "SHOW COLUMNS FROM clients LIKE 'company_name'";
                if ($conn->query($check)->num_rows > 0) {
                    $columns[] = "company_name";
                    $values[] = $data['companyName'];
                    $types .= "s";
                    $placeholders[] = "?";
                }
            }
            
            if (isset($data['frame'])) {
                $check = "SHOW COLUMNS FROM clients LIKE 'frame'";
                if ($conn->query($check)->num_rows > 0) {
                    $columns[] = "frame";
                    $values[] = $data['frame'];
                    $types .= "s";
                    $placeholders[] = "?";
                }
            }
            
            if (isset($data['footer'])) {
                $check = "SHOW COLUMNS FROM clients LIKE 'footer'";
                if ($conn->query($check)->num_rows > 0) {
                    $columns[] = "footer";
                    $values[] = $data['footer'];
                    $types .= "s";
                    $placeholders[] = "?";
                }
            }
            
            if (isset($data['logo'])) {
                $check = "SHOW COLUMNS FROM clients LIKE 'logo'";
                if ($conn->query($check)->num_rows > 0) {
                    $columns[] = "logo";
                    $values[] = $data['logo'];
                    $types .= "s";
                    $placeholders[] = "?";
                }
            }
            
            if (isset($data['password'])) {
                $check = "SHOW COLUMNS FROM clients LIKE 'password'";
                if ($conn->query($check)->num_rows > 0) {
                    $columns[] = "password";
                    $values[] = $data['password'];
                    $types .= "s";
                    $placeholders[] = "?";
                }
            }
            
            // Build the SQL query
            $columnsStr = implode(", ", $columns);
            $placeholdersStr = implode(", ", $placeholders);
            $sql = "INSERT INTO clients ($columnsStr) VALUES ($placeholdersStr)";
            
            $stmt = $conn->prepare($sql);
            
            if ($stmt === false) {
                throw new Exception("Failed to prepare statement: " . $conn->error);
            }
            
            // Bind parameters dynamically
            $stmt->bind_param($types, ...$values);
            
            if ($stmt->execute()) {
                // Build response with all data that was actually inserted
                $client = [
                    'id' => $id,
                    'name' => $name,
                    'url' => $url,
                ];
                
                if (isset($data['companyName'])) {
                    $client['companyName'] = $data['companyName'];
                }
                
                if (isset($data['frame'])) {
                    $client['frame'] = $data['frame'];
                }
                
                if (isset($data['footer'])) {
                    $client['footer'] = $data['footer'];
                }
                
                if (isset($data['logo'])) {
                    $client['logo'] = $data['logo'];
                }
                
                if (isset($data['password'])) {
                    $client['password'] = $data['password'];
                }
                
                $client['textPoints'] = [];
                
                echo json_encode([
                    'success' => true, 
                    'message' => 'Client added successfully',
                    'client' => $client
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
            
            // Build dynamic update query based on provided fields
            $updateFields = [];
            $params = [];
            $types = "";
            
            if (isset($data['name'])) {
                $updateFields[] = "name = ?";
                $params[] = $data['name'];
                $types .= "s";
            }
            
            // Check if company_name column exists
            if (isset($data['companyName'])) {
                $check = "SHOW COLUMNS FROM clients LIKE 'company_name'";
                if ($conn->query($check)->num_rows > 0) {
                    $updateFields[] = "company_name = ?";
                    $params[] = $data['companyName'];
                    $types .= "s";
                }
            }
            
            if (isset($data['url'])) {
                $updateFields[] = "url = ?";
                $params[] = $data['url'];
                $types .= "s";
            }
            
            // Check if frame column exists
            if (isset($data['frame'])) {
                $check = "SHOW COLUMNS FROM clients LIKE 'frame'";
                if ($conn->query($check)->num_rows > 0) {
                    $updateFields[] = "frame = ?";
                    $params[] = $data['frame'];
                    $types .= "s";
                }
            }
            
            // Check if footer column exists
            if (isset($data['footer'])) {
                $check = "SHOW COLUMNS FROM clients LIKE 'footer'";
                if ($conn->query($check)->num_rows > 0) {
                    $updateFields[] = "footer = ?";
                    $params[] = $data['footer'];
                    $types .= "s";
                }
            }
            
            // Check if logo column exists
            if (isset($data['logo'])) {
                $check = "SHOW COLUMNS FROM clients LIKE 'logo'";
                if ($conn->query($check)->num_rows > 0) {
                    $updateFields[] = "logo = ?";
                    $params[] = $data['logo'];
                    $types .= "s";
                }
            }
            
            // Check if password column exists
            if (isset($data['password'])) {
                $check = "SHOW COLUMNS FROM clients LIKE 'password'";
                if ($conn->query($check)->num_rows > 0) {
                    $updateFields[] = "password = ?";
                    $params[] = $data['password'];
                    $types .= "s";
                }
            }
            
            if (empty($updateFields)) {
                echo json_encode(['success' => true, 'message' => 'No fields to update']);
                break;
            }
            
            $sql = "UPDATE clients SET " . implode(", ", $updateFields) . " WHERE id = ?";
            $params[] = $id;
            $types .= "s";
            
            $stmt = $conn->prepare($sql);
            
            if ($stmt === false) {
                throw new Exception("Failed to prepare statement: " . $conn->error);
            }
            
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
                // Check if text_points table exists before trying to delete from it
                $check_table = "SHOW TABLES LIKE 'text_points'";
                $table_exists = $conn->query($check_table)->num_rows > 0;
                
                if ($table_exists) {
                    // Delete text points
                    $sql1 = "DELETE FROM text_points WHERE client_id = ?";
                    $stmt1 = $conn->prepare($sql1);
                    $stmt1->bind_param("s", $id);
                    $stmt1->execute();
                }
                
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
