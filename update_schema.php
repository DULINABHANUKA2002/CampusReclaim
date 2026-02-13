<?php
require 'db_connect.php';

$alterations = [
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_pic VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin') DEFAULT 'user'",
    "ALTER TABLE items MODIFY COLUMN status ENUM('Active', 'Resolved', 'Found') DEFAULT 'Active'",
    "ALTER TABLE items ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20) DEFAULT NULL",
    "ALTER TABLE items ADD COLUMN IF NOT EXISTS resolved_by_phone VARCHAR(20) DEFAULT NULL",
    "ALTER TABLE items ADD COLUMN IF NOT EXISTS resolved_date DATE DEFAULT NULL",
    "ALTER TABLE items ADD COLUMN IF NOT EXISTS resolved_location VARCHAR(150) DEFAULT NULL",
    "CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id INT NOT NULL,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        message TEXT NOT NULL,
        found_date DATE,
        found_location VARCHAR(255),
        finder_phone VARCHAR(20),
        status ENUM('unread', 'read') DEFAULT 'unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    )"
];

foreach ($alterations as $sql) {
    if ($conn->query($sql) === TRUE) {
        echo "Success: $sql\n";
    } else {
        echo "Note: " . $conn->error . "\n";
    }
}

// Ensure admin exists
$admin_pass = password_hash('admin123', PASSWORD_DEFAULT);
$checkAdmin = "SELECT id FROM users WHERE email = 'admin'";
$result = $conn->query($checkAdmin);

if (!$result) {
    echo "Error checking for admin: " . $conn->error . "\n";
    exit();
}

if ($result->num_rows == 0) {
    $insertAdminSql = "INSERT INTO users (full_name, email, password_hash, role) VALUES ('System Admin', 'admin', '$admin_pass', 'admin')";
    if ($conn->query($insertAdminSql) === TRUE) {
        echo "Admin user created successfully.\n";
    } else {
        echo "Error creating admin user: " . $conn->error . "\n";
    }
}

echo "Schema Update Complete.";
$conn->close();
?>