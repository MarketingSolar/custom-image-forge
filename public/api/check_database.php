
<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'db_connection.php';

try {
    $response = [
        'success' => true,
        'message' => 'Database check completed',
        'database_info' => [],
        'tables' => []
    ];
    
    // Get database name
    $result = $conn->query("SELECT DATABASE()");
    $row = $result->fetch_row();
    $response['database_info']['name'] = $row[0];
    
    // Check tables
    $tables = [
        'clients' => [
            'expected_columns' => [
                'id', 'name', 'company_name', 'url', 'frame', 'footer', 'logo', 'password', 'created_at'
            ]
        ],
        'text_points' => [
            'expected_columns' => [
                'id', 'client_id', 'name', 'x_position', 'y_position', 'font_family', 
                'font_size', 'font_style', 'color', 'created_at'
            ]
        ],
        'users' => [
            'expected_columns' => [
                'id', 'username', 'password', 'created_at'
            ]
        ]
    ];
    
    foreach ($tables as $table_name => $table_info) {
        $table_data = [
            'name' => $table_name,
            'exists' => false,
            'columns' => [],
            'missing_columns' => [],
            'extra_columns' => []
        ];
        
        // Check if table exists
        $result = $conn->query("SHOW TABLES LIKE '$table_name'");
        $table_data['exists'] = $result->num_rows > 0;
        
        if ($table_data['exists']) {
            // Get columns
            $result = $conn->query("SHOW COLUMNS FROM $table_name");
            $actual_columns = [];
            
            while ($row = $result->fetch_assoc()) {
                $column_info = [
                    'name' => $row['Field'],
                    'type' => $row['Type'],
                    'null' => $row['Null'],
                    'key' => $row['Key'],
                    'default' => $row['Default'],
                    'extra' => $row['Extra']
                ];
                
                $actual_columns[] = $row['Field'];
                $table_data['columns'][] = $column_info;
            }
            
            // Check for missing columns
            foreach ($table_info['expected_columns'] as $expected_column) {
                if (!in_array($expected_column, $actual_columns)) {
                    $table_data['missing_columns'][] = $expected_column;
                }
            }
            
            // Check for extra columns
            foreach ($actual_columns as $actual_column) {
                if (!in_array($actual_column, $table_info['expected_columns'])) {
                    $table_data['extra_columns'][] = $actual_column;
                }
            }
        }
        
        $response['tables'][] = $table_data;
    }
    
    echo json_encode($response, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database check failed: ' . $e->getMessage()
    ]);
}

$conn->close();
?>
