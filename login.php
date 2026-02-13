<?php
// login.php
header("Content-Type: application/json");
require 'db_connect.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['email'], $data['password'])) {
    echo json_encode(["status" => "error", "message" => "Invalid input"]);
    exit();
}

$email = $conn->real_escape_string($data['email']);
$password = $data['password'];

$sql = "SELECT id, full_name, email, password_hash, profile_pic, bio, role FROM users WHERE email = '$email'";
$result = $conn->query($sql);

if (!$result) {
    echo json_encode(["status" => "error", "message" => "Database Query Failed: " . $conn->error]);
    exit();
}

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    if (password_verify($password, $user['password_hash'])) {
        echo json_encode([
            "status" => "success",
            "message" => "Login successful",
            "user" => [
                "id" => $user['id'],
                "name" => $user['full_name'],
                "email" => $user['email'],
                "profile_pic" => $user['profile_pic'],
                "bio" => $user['bio'],
                "role" => $user['role']
            ]
        ]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid password"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "User not found"]);
}

$conn->close();