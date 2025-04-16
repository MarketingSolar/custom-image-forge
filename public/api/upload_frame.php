
<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Check if this is a POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["success" => false, "message" => "Method not allowed"]);
    exit();
}

require_once 'db_connection.php';

try {
    // Get client URL from the POST data
    $clientUrl = isset($_POST['clientUrl']) ? $_POST['clientUrl'] : null;
    
    if (!$clientUrl) {
        throw new Exception("Client URL is required");
    }
    
    // Create the base directory if it doesn't exist
    $baseDir = "../molduras";
    if (!file_exists($baseDir)) {
        if (!mkdir($baseDir, 0755, true)) {
            throw new Exception("Failed to create base directory");
        }
    }
    
    // Create client directory if it doesn't exist
    $clientDir = "$baseDir/$clientUrl";
    if (!file_exists($clientDir)) {
        if (!mkdir($clientDir, 0755, true)) {
            throw new Exception("Failed to create client directory");
        }
    }
    
    // Handle file upload
    if (isset($_FILES['frame']) && $_FILES['frame']['error'] === UPLOAD_ERR_OK) {
        $tempFile = $_FILES['frame']['tmp_name'];
        $fileName = 'frame.png'; // Fixed filename for easy reference
        $targetFile = "$clientDir/$fileName";
        
        // Move the uploaded file to the target location
        if (move_uploaded_file($tempFile, $targetFile)) {
            $frameUrl = "/molduras/$clientUrl/$fileName";
            
            // Update the database with the frame URL
            $sql = "UPDATE clients SET frame = ? WHERE url = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ss", $frameUrl, $clientUrl);
            $stmt->execute();
            
            if ($stmt->affected_rows > 0) {
                echo json_encode(["success" => true, "frameUrl" => $frameUrl]);
            } else {
                echo json_encode(["success" => true, "frameUrl" => $frameUrl, "warning" => "Database not updated"]);
            }
        } else {
            throw new Exception("Failed to move uploaded file");
        }
    } else {
        throw new Exception("No file uploaded or upload error");
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}

$conn->close();
?>
