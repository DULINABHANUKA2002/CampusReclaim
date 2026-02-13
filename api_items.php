<?php
// api_items.php
header("Content-Type: application/json");
require 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET: Fetch all items
if ($method === 'GET') {
    $sql = "SELECT items.*, users.full_name as reporter_name 
            FROM items 
            JOIN users ON items.user_id = users.id 
            ORDER BY created_at DESC";

    $result = $conn->query($sql);

    $items = [];
    if ($result && $result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $items[] = $row;
        }
    } elseif (!$result) {
        echo json_encode(["status" => "error", "message" => "SQL Error: " . $conn->error]);
        exit();
    }
    echo json_encode($items);
}

// POST: Create or Update item
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    // Check if it's a status update (JSON POST)
    if ($data && isset($data['action']) && $data['action'] === 'status_update') {
        $id = (int) $data['id'];
        $status = $conn->real_escape_string($data['status']);

        $resolved_by_phone = isset($data['resolved_by_phone']) ? $conn->real_escape_string($data['resolved_by_phone']) : null;
        $resolved_date = isset($data['resolved_date']) ? $conn->real_escape_string($data['resolved_date']) : null;
        $resolved_location = isset($data['resolved_location']) ? $conn->real_escape_string($data['resolved_location']) : null;

        $sql = "UPDATE items SET 
                status = '$status',
                resolved_by_phone = " . ($resolved_by_phone ? "'$resolved_by_phone'" : "NULL") . ",
                resolved_date = " . ($resolved_date ? "'$resolved_date'" : "NULL") . ",
                resolved_location = " . ($resolved_location ? "'$resolved_location'" : "NULL") . "
                WHERE id = $id";

        if ($conn->query($sql) === TRUE) {
            echo json_encode(["status" => "success", "message" => "Item status updated"]);
        } else {
            echo json_encode(["status" => "error", "message" => "SQL Error: " . $conn->error]);
        }
        exit();
    }

    // Normal Multipart POST: Create new item
    // Basic validation
    if (!isset($_POST['user_id'], $_POST['title'])) {
        echo json_encode(["status" => "error", "message" => "Missing required fields"]);
        exit();
    }

    $user_id = (int) $_POST['user_id'];
    $title = $conn->real_escape_string($_POST['title']);
    $description = $conn->real_escape_string($_POST['description']);
    $category = $conn->real_escape_string($_POST['category']);
    $type = $conn->real_escape_string($_POST['type']);
    $location = $conn->real_escape_string($_POST['location']);
    $event_date = $conn->real_escape_string($_POST['date']);
    $contact_phone = isset($_POST['contact_phone']) ? $conn->real_escape_string($_POST['contact_phone']) : '';

    $image_url = '';

    // Handle File Upload
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['image']['tmp_name'];
        $fileName = $_FILES['image']['name'];
        $fileSize = $_FILES['image']['size'];
        $fileType = $_FILES['image']['type'];

        $fileNameCmps = explode(".", $fileName);
        $fileExtension = strtolower(end($fileNameCmps));

        // Sanitize file name
        $newFileName = md5(time() . $fileName) . '.' . $fileExtension;
        $uploadFileDir = './uploads/';
        $dest_path = $uploadFileDir . $newFileName;

        if (move_uploaded_file($fileTmpPath, $dest_path)) {
            $image_url = 'uploads/' . $newFileName;
        }
    }

    $sql = "INSERT INTO items (user_id, title, description, category, type, location, event_date, image_url, contact_phone) 
            VALUES ($user_id, '$title', '$description', '$category', '$type', '$location', '$event_date', '$image_url', '$contact_phone')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Item reported successfully"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Error: " . $conn->error]);
    }
}

// DELETE: Remove item
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = (int) $data['id'];

    $sql = "DELETE FROM items WHERE id = $id";
    if ($conn->query($sql) === TRUE) {
        echo json_encode(["status" => "success", "message" => "Item deleted"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Error: " . $conn->error]);
    }
}

$conn->close();