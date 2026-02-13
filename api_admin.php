<?php
// api_admin.php
header("Content-Type: application/json");
require 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

// Helper to check if user is admin (simplified for this task)
function isAdmin($user_id, $conn)
{
    if (!$user_id)
        return false;
    $sql = "SELECT role FROM users WHERE id = $user_id";
    $res = $conn->query($sql);
    if ($res && $row = $res->fetch_assoc()) {
        return $row['role'] === 'admin';
    }
    return false;
}

// GET: Fetch all users or stats
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'users';
    $admin_id = (int) ($_GET['admin_id'] ?? 0);

    if (!isAdmin($admin_id, $conn)) {
        echo json_encode(["status" => "error", "message" => "Unauthorized"]);
        exit();
    }

    if ($action === 'users') {
        $sql = "SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC";
        $result = $conn->query($sql);
        if (!$result) {
            echo json_encode(["status" => "error", "message" => "SQL Error: " . $conn->error]);
            exit();
        }
        $users = [];
        while ($row = $result->fetch_assoc())
            $users[] = $row;
        echo json_encode($users);
    } elseif ($action === 'stats') {
        $total_users = $conn->query("SELECT COUNT(*) as count FROM users")->fetch_assoc()['count'];
        $total_items = $conn->query("SELECT COUNT(*) as count FROM items")->fetch_assoc()['count'];
        $active_items = $conn->query("SELECT COUNT(*) as count FROM items WHERE status = 'Active'")->fetch_assoc()['count'];
        $resolved_items = $conn->query("SELECT COUNT(*) as count FROM items WHERE status = 'Resolved'")->fetch_assoc()['count'];

        echo json_encode([
            "total_users" => $total_users,
            "total_items" => $total_items,
            "active_items" => $active_items,
            "resolved_items" => $resolved_items
        ]);
    }
}

// DELETE: Remove user
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $admin_id = (int) ($data['admin_id'] ?? 0);
    $target_id = (int) ($data['user_id'] ?? 0);

    if (!isAdmin($admin_id, $conn)) {
        echo json_encode(["status" => "error", "message" => "Unauthorized"]);
        exit();
    }

    if ($target_id === $admin_id) {
        echo json_encode(["status" => "error", "message" => "Cannot delete yourself"]);
        exit();
    }

    $sql = "DELETE FROM users WHERE id = $target_id";
    if ($conn->query($sql)) {
        echo json_encode(["status" => "success", "message" => "User deleted"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Delete failed"]);
    }
}

$conn->close();
