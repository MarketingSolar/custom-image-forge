
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
error_log("textpoints.php accessed: " . $_SERVER['REQUEST_METHOD'] . " " . $_GET['action']);

// Get action from request
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'add':
            // Add a new text point to a client
            $data = get_json_post_data();
            
            if (!isset($data['clientId']) || !isset($data['textPoint'])) {
                throw new Exception("Missing required fields (clientId, textPoint)");
            }
            
            $clientId = $data['clientId'];
            $textPoint = $data['textPoint'];
            
            if (!isset($textPoint['name']) || !isset($textPoint['x']) || !isset($textPoint['y'])) {
                throw new Exception("Missing required text point fields (name, x, y)");
            }
            
            // Create unique ID if not provided
            $id = isset($textPoint['id']) ? $textPoint['id'] : uniqid();
            $name = $textPoint['name'];
            $x = $textPoint['x'];
            $y = $textPoint['y'];
            $fontFamily = isset($textPoint['fontFamily']) ? $textPoint['fontFamily'] : 'Arial';
            $fontSize = isset($textPoint['fontSize']) ? $textPoint['fontSize'] : 12;
            $fontStyle = isset($textPoint['fontStyle']) ? json_encode($textPoint['fontStyle']) : json_encode([]);
            $color = isset($textPoint['color']) ? $textPoint['color'] : '#000000';
            
            $sql = "INSERT INTO text_points (id, client_id, name, x_position, y_position, font_family, font_size, font_style, color) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
                    
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sssddssss", $id, $clientId, $name, $x, $y, $fontFamily, $fontSize, $fontStyle, $color);
            
            if ($stmt->execute()) {
                echo json_encode([
                    'success' => true, 
                    'message' => 'Text point added successfully',
                    'textPoint' => [
                        'id' => $id,
                        'name' => $name,
                        'x' => $x,
                        'y' => $y,
                        'fontFamily' => $fontFamily,
                        'fontSize' => $fontSize,
                        'fontStyle' => json_decode($fontStyle, true),
                        'color' => $color
                    ]
                ]);
            } else {
                throw new Exception("Error adding text point: " . $stmt->error);
            }
            break;
            
        case 'update':
            // Update an existing text point
            $data = get_json_post_data();
            
            if (!isset($data['clientId']) || !isset($data['textPoint']) || !isset($data['textPoint']['id'])) {
                throw new Exception("Missing required fields (clientId, textPoint with id)");
            }
            
            $clientId = $data['clientId'];
            $textPoint = $data['textPoint'];
            $id = $textPoint['id'];
            
            // Build dynamic update query based on provided fields
            $updateFields = [];
            $params = [];
            $types = "";
            
            if (isset($textPoint['name'])) {
                $updateFields[] = "name = ?";
                $params[] = $textPoint['name'];
                $types .= "s";
            }
            
            if (isset($textPoint['x'])) {
                $updateFields[] = "x_position = ?";
                $params[] = $textPoint['x'];
                $types .= "d";
            }
            
            if (isset($textPoint['y'])) {
                $updateFields[] = "y_position = ?";
                $params[] = $textPoint['y'];
                $types .= "d";
            }
            
            if (isset($textPoint['fontFamily'])) {
                $updateFields[] = "font_family = ?";
                $params[] = $textPoint['fontFamily'];
                $types .= "s";
            }
            
            if (isset($textPoint['fontSize'])) {
                $updateFields[] = "font_size = ?";
                $params[] = $textPoint['fontSize'];
                $types .= "i";
            }
            
            if (isset($textPoint['fontStyle'])) {
                $updateFields[] = "font_style = ?";
                $params[] = json_encode($textPoint['fontStyle']);
                $types .= "s";
            }
            
            if (isset($textPoint['color'])) {
                $updateFields[] = "color = ?";
                $params[] = $textPoint['color'];
                $types .= "s";
            }
            
            if (empty($updateFields)) {
                echo json_encode(['success' => true, 'message' => 'No fields to update']);
                break;
            }
            
            $sql = "UPDATE text_points SET " . implode(", ", $updateFields) . " WHERE id = ? AND client_id = ?";
            $params[] = $id;
            $params[] = $clientId;
            $types .= "ss";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Text point updated successfully']);
            } else {
                throw new Exception("Error updating text point: " . $stmt->error);
            }
            break;
            
        case 'delete':
            // Delete a text point
            $data = get_json_post_data();
            
            if (!isset($data['clientId']) || !isset($data['textPointId'])) {
                throw new Exception("Missing required fields (clientId, textPointId)");
            }
            
            $clientId = $data['clientId'];
            $textPointId = $data['textPointId'];
            
            $sql = "DELETE FROM text_points WHERE id = ? AND client_id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ss", $textPointId, $clientId);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => 'Text point deleted successfully']);
            } else {
                throw new Exception("Error deleting text point: " . $stmt->error);
            }
            break;
            
        default:
            throw new Exception("Invalid action");
    }
} catch (Exception $e) {
    error_log("ERROR in textpoints.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

$conn->close();
?>
