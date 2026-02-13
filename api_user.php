<?php
ob_start();
header("Content-Type: application/json");

$servername = "localhost";
$username = "root";
$password = "";
$dbname = "campus_reclaim";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    ob_clean();
    echo json_encode(["status" => "error", "message" => "DB Connect Error"]);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    if (!isset($_POST['user_id'])) {
        ob_clean();
        echo json_encode(["status" => "error", "message" => "Missing User ID"]);
        exit();
    }
    $user_id = (int) $_POST['user_id'];

    // Handle Profile Picture Upload
    if (isset($_FILES['profile_pic']) && $_FILES['profile_pic']['error'] === UPLOAD_ERR_OK) {
        $ext = strtolower(pathinfo($_FILES['profile_pic']['name'], PATHINFO_EXTENSION));
        $newName = md5(time() . $_FILES['profile_pic']['name']) . '.' . $ext;
        $targetDir = "uploads/";
        if (!is_dir($targetDir))
            mkdir($targetDir, 0777, true);
        $targetFile = $targetDir . $newName;

        if (move_uploaded_file($_FILES['profile_pic']['tmp_name'], $targetFile)) {
            $sql = "UPDATE users SET profile_pic = '$targetFile' WHERE id = $user_id";
            if ($conn->query($sql)) {
                ob_clean();
                echo json_encode(["status" => "success", "url" => $targetFile, "message" => "Profile picture updated"]);
            } else {
                ob_clean();
                echo json_encode(["status" => "error", "message" => "SQL Error"]);
            }
        } else {
            ob_clean();
            echo json_encode(["status" => "error", "message" => "Move Failed"]);
        }
    }
    // Handle Account Security Update (Email & Password)
    else if (isset($_POST['email']) || isset($_POST['password'])) {
        $email = isset($_POST['email']) ? $conn->real_escape_string($_POST['email']) : null;
        $password = isset($_POST['password']) && !empty($_POST['password']) ? password_hash($_POST['password'], PASSWORD_DEFAULT) : null;

        $updateParts = [];
        if ($email)
            $updateParts[] = "email = '$email'";
        if ($password)
            $updateParts[] = "password_hash = '$password'";

        if (empty($updateParts)) {
            ob_clean();
            echo json_encode(["status" => "error", "message" => "No data to update"]);
            exit();
        }

        $sql = "UPDATE users SET " . implode(", ", $updateParts) . " WHERE id = $user_id";
        if ($conn->query($sql)) {
            ob_clean();
            echo json_encode(["status" => "success", "message" => "Account updated successfully"]);
        } else {
            ob_clean();
            $error = $conn->errno == 1062 ? "Email already exists" : "Database error";
            echo json_encode(["status" => "error", "message" => $error]);
        }
    }
    // Handle Profile Info Update
    else if (isset($_POST['full_name']) || isset($_POST['bio'])) {
        $name = $conn->real_escape_string($_POST['full_name']);
        $bio = $conn->real_escape_string($_POST['bio']);

        $sql = "UPDATE users SET full_name = '$name', bio = '$bio' WHERE id = $user_id";
        if ($conn->query($sql)) {
            ob_clean();
            echo json_encode(["status" => "success", "message" => "Profile updated successfully"]);
        } else {
            ob_clean();
            echo json_encode(["status" => "error", "message" => "Database Update Failed"]);
        }
    } else {
        ob_clean();
        echo json_encode(["status" => "error", "message" => "No Update Data Provided"]);
    }
} else {
    ob_clean();
    echo json_encode(["status" => "error", "message" => "Invalid Request"]);
}

$conn->close();