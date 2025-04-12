
<?php
// Enable error reporting
ini_set('display_errors', 1);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Function to log errors
function logDatabaseError($message) {
    error_log("DATABASE ERROR: " . $message);
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

// Log successful connection
logDatabaseError("Database connected successfully");
?>
