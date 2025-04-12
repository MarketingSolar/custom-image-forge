
<?php
// Database configuration
$host = "localhost";
$username = "u961166301_moldura";
$password = "@Moldura123";
$database = "u961166301_moldura";

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Set charset to utf8mb4
$conn->set_charset("utf8mb4");
?>
