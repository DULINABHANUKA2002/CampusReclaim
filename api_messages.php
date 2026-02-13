<?php
// api_messages.php
header("Content-Type: application/json");
require 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET: Fetch messages for a user
if ($method === 'GET') {
    $user_id = (int) ($_GET['user_id'] ?? 0);
    if (!$user_id) {
        echo json_encode(["status" => "error", "message" => "User ID required"]);
        exit();
    }

    $sql = "SELECT m.*, i.title as item_title, u.full_name as sender_name 
            FROM messages m
            JOIN items i ON m.item_id = i.id
            JOIN users u ON m.sender_id = u.id
            WHERE m.receiver_id = $user_id
            ORDER BY m.created_at DESC";

    $result = $conn->query($sql);
    
    if (!$result) {
        echo json_encode(["status" => "error", "message" => "SQL Error: " . $conn->error]);
        exit();
    }

    $messages = [];
    while ($row = $result->fetch_assoc()) {
        $messages[] = $row;
    }
    echo json_encode($messages);
}

// POST: Send a message
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    $item_id = (int) $data['item_id'];
    $sender_id = (int) $data['sender_id'];
    $receiver_id = (int) $data['receiver_id'];
    $message = $conn->real_escape_string($data['message']);
    $found_date = $conn->real_escape_string($data['found_date'] ?? '');
    $found_location = $conn->real_escape_string($data['found_location'] ?? '');
    $finder_phone = $conn->real_escape_string($data['finder_phone'] ?? '');

    $sql = "INSERT INTO messages (item_id, sender_id, receiver_id, message, found_date, found_location, finder_phone) 
            VALUES ($item_id, $sender_id, $receiver_id, '$message', '$found_date', '$found_location', '$finder_phone')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Message sent successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Error: " . $conn->error]);
    }
}

// PUT: Mark message as read
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $msg_id = (int) $data['message_id'];

    $sql = "UPDATE messages SET status = 'read' WHERE id = $msg_id";
    if ($conn->query($sql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Message marked as read"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Error: " . $conn->error]);
    }
}

$conn->close();
?>