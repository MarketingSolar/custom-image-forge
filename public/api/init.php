
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'db_connection.php';

try {
    // Start transaction
    $conn->begin_transaction();
    
    // Create clients table if it doesn't exist
    $sql_clients = "CREATE TABLE IF NOT EXISTS clients (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company_name VARCHAR(255),
        url VARCHAR(255) NOT NULL,
        frame TEXT,
        footer TEXT,
        logo TEXT,
        password VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    if (!$conn->query($sql_clients)) {
        throw new Exception("Error creating clients table: " . $conn->error);
    }
    
    // Create text_points table if it doesn't exist
    $sql_text_points = "CREATE TABLE IF NOT EXISTS text_points (
        id VARCHAR(255) PRIMARY KEY,
        client_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        x_position DOUBLE NOT NULL,
        y_position DOUBLE NOT NULL,
        font_family VARCHAR(255) DEFAULT 'Arial',
        font_size INT DEFAULT 16,
        font_style TEXT,
        color VARCHAR(50) DEFAULT '#000000',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )";
    
    if (!$conn->query($sql_text_points)) {
        throw new Exception("Error creating text_points table: " . $conn->error);
    }
    
    // Commit transaction
    $conn->commit();
    
    echo json_encode(['success' => true, 'message' => 'Database initialized successfully']);
} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    echo json_encode(['success' => false, 'message' => 'Database initialization failed: ' . $e->getMessage()]);
}

$conn->close();
?>
