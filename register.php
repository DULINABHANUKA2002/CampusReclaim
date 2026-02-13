<?php
// register.php
header("Content-Type: application/json");
require 'db_connect.php';

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['full_name'], $data['email'], $data['password'])) {
    echo json_encode(["status" => "error", "message" => "Invalid input"]);
    exit();
}

$full_name = $conn->real_escape_string($data['full_name']);
$email = $conn->real_escape_string($data['email']);
$password = password_hash($data['password'], PASSWORD_BCRYPT);
$role = isset($data['role']) && $data['role'] === 'admin' ? 'admin' : 'user';

// Check if email exists
$checkSql = "SELECT id FROM users WHERE email = '$email'";
$result = $conn->query($checkSql);

if ($result->num_rows > 0) {
    echo json_encode(["status" => "error", "message" => "Email already registered"]);
} else {
    $sql = "INSERT INTO users (full_name, email, password_hash, role) VALUES ('$full_name', '$email', '$password', '$role')";

    if ($conn->query($sql) === TRUE) {
        // Return success with user data (excluding password)
        $userId = $conn->insert_id;
        echo json_encode([
            "status" => "success",
            "message" => "Registration successful",
            "user" => [
                "id" => $userId,
                "name" => $full_name,
                "email" => $email,
                "profile_pic" => null,
                "role" => $role
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Error: " . $conn->error]);
    }
}

$conn->close();