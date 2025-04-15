
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'db_connection.php';

try {
    // Start transaction
    $conn->begin_transaction();
    
    // Get current table structure to check if we need to make changes
    $check_table = "SHOW TABLES LIKE 'clients'";
    $table_exists = $conn->query($check_table)->num_rows > 0;
    
    if ($table_exists) {
        // Check if frame column exists
        $check_frame = "SHOW COLUMNS FROM clients LIKE 'frame'";
        $frame_exists = $conn->query($check_frame)->num_rows > 0;
        
        if (!$frame_exists) {
            // Add frame column if it doesn't exist
            $add_frame = "ALTER TABLE clients ADD COLUMN frame TEXT AFTER url";
            if (!$conn->query($add_frame)) {
                throw new Exception("Error adding frame column: " . $conn->error);
            }
            error_log("Added missing 'frame' column to clients table");
        }
        
        // Check if footer column exists
        $check_footer = "SHOW COLUMNS FROM clients LIKE 'footer'";
        $footer_exists = $conn->query($check_footer)->num_rows > 0;
        
        if (!$footer_exists) {
            // Add footer column if it doesn't exist
            $add_footer = "ALTER TABLE clients ADD COLUMN footer TEXT AFTER frame";
            if (!$conn->query($add_footer)) {
                throw new Exception("Error adding footer column: " . $conn->error);
            }
            error_log("Added missing 'footer' column to clients table");
        }
        
        // Check if logo column exists
        $check_logo = "SHOW COLUMNS FROM clients LIKE 'logo'";
        $logo_exists = $conn->query($check_logo)->num_rows > 0;
        
        if (!$logo_exists) {
            // Add logo column if it doesn't exist
            $add_logo = "ALTER TABLE clients ADD COLUMN logo TEXT AFTER footer";
            if (!$conn->query($add_logo)) {
                throw new Exception("Error adding logo column: " . $conn->error);
            }
            error_log("Added missing 'logo' column to clients table");
        }
        
        // Check if company_name column exists
        $check_company = "SHOW COLUMNS FROM clients LIKE 'company_name'";
        $company_exists = $conn->query($check_company)->num_rows > 0;
        
        if (!$company_exists) {
            // Add company_name column if it doesn't exist
            $add_company = "ALTER TABLE clients ADD COLUMN company_name VARCHAR(255) AFTER name";
            if (!$conn->query($add_company)) {
                throw new Exception("Error adding company_name column: " . $conn->error);
            }
            error_log("Added missing 'company_name' column to clients table");
        }
    } else {
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
    }
    
    // Check if text_points table exists
    $check_text_points = "SHOW TABLES LIKE 'text_points'";
    $text_points_exists = $conn->query($check_text_points)->num_rows > 0;
    
    if (!$text_points_exists) {
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
    }
    
    // Check if users table exists
    $check_users = "SHOW TABLES LIKE 'users'";
    $users_exists = $conn->query($check_users)->num_rows > 0;
    
    if (!$users_exists) {
        // Create users table if it doesn't exist
        $sql_users = "CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(255) PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        if (!$conn->query($sql_users)) {
            throw new Exception("Error creating users table: " . $conn->error);
        }
    }
    
    // Check if default admin user exists, if not create one
    $check_admin = "SELECT * FROM users WHERE username = 'admin'";
    $admin_result = $conn->query($check_admin);
    
    if ($admin_result->num_rows === 0) {
        // Create default admin user
        $admin_id = uniqid();
        $admin_username = 'admin';
        $admin_password = 'admin123'; // In production, this should be hashed
        
        $insert_admin = "INSERT INTO users (id, username, password) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($insert_admin);
        $stmt->bind_param("sss", $admin_id, $admin_username, $admin_password);
        $stmt->execute();
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
