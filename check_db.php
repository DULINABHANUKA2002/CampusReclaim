<?php
require 'db_connect.php';

$tables = ['users', 'items'];
$missing = [];

foreach ($tables as $table) {
    if ($conn->query("SHOW TABLES LIKE '$table'")->num_rows == 0) {
        $missing[] = $table;
    }
}

if (empty($missing)) {
    echo "DB_OK";
} else {
    echo "MISSING: " . implode(', ', $missing);
}
$conn->close();
?>