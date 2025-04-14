
<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Function to log errors
function logDatabaseError($message) {
    error_log("DATABASE ERROR: " . $message);
    // Create logs directory if it doesn't exist
    if (!file_exists('logs')) {
        mkdir('logs', 0755);
    }
    // Log to file with timestamp
    file_put_contents('logs/db_errors.log', date('[Y-m-d H:i:s] ') . $message . PHP_EOL, FILE_APPEND);
}

// Database configuration
$host = "localhost";
$username = "u961166301_moldura";
$password = "@Moldura123";
$database = "u961166301_moldura";

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    logDatabaseError("Connection failed: " . $conn->connect_error);
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to utf8mb4
if (!$conn->set_charset("utf8mb4")) {
    logDatabaseError("Error setting charset: " . $conn->error);
}

// Debug database connection
logDatabaseError("Database connected successfully with user: $username to database: $database");

// Check if required tables exist
$tables = ['clients', 'text_points'];
foreach ($tables as $table) {
    $result = $conn->query("SHOW TABLES LIKE '$table'");
    if (!$result || $result->num_rows === 0) {
        logDatabaseError("Table '$table' does not exist in database");
    } else {
        logDatabaseError("Table '$table' exists in database");
    }
}
?>
