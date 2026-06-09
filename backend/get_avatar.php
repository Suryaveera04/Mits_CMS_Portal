<?php
require_once 'config.php';

// get_avatar.php — serves the avatar BLOB from the database as an image.
// Usage: <img src="BASE_URL . '/get_avatar.php?id=1&role=faculty'" />

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$id   = intval($_GET['id']   ?? 0);
$role = strtolower($_GET['role'] ?? 'faculty');

if ($id <= 0) {
    http_response_code(400);
    exit('Missing id');
}

$table = ($role === 'hod') ? 'hod_login' : 'faculty_login';

$stmt = $pdo->prepare("SELECT avatar, avatar_mime FROM $table WHERE id = ?");
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row || empty($row['avatar'])) {
    // Return a 1x1 transparent PNG as placeholder
    http_response_code(404);
    exit('No avatar found');
}

$mime = $row['avatar_mime'] ?: 'image/jpeg';

// Serve the binary image
header("Content-Type: $mime");
header('Cache-Control: public, max-age=86400'); // cache for 1 day
echo $row['avatar'];
?>
