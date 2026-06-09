<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$faculty_id = $_POST['faculty_id'] ?? '';
$user_role  = strtoupper($_POST['user_role'] ?? 'FACULTY');

if (empty($faculty_id)) {
    echo json_encode(['success' => false, 'message' => 'Faculty ID required']);
    exit;
}

if (empty($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'No file uploaded or upload error']);
    exit;
}

$file     = $_FILES['avatar'];
$allowed  = ['image/jpeg', 'image/png', 'image/webp'];
$maxBytes = 5 * 1024 * 1024; // 5 MB

if (!in_array($file['type'], $allowed)) {
    echo json_encode(['success' => false, 'message' => 'Invalid type. Only JPG, PNG, WEBP allowed.']);
    exit;
}

if ($file['size'] > $maxBytes) {
    echo json_encode(['success' => false, 'message' => 'File too large. Max 5MB.']);
    exit;
}

// Read raw binary data from the uploaded file
$binaryData = file_get_contents($file['tmp_name']);
if ($binaryData === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to read uploaded file']);
    exit;
}

$mimeType = $file['type']; // e.g. image/jpeg

try {
    // Store binary data in MEDIUMBLOB column
    $table = ($user_role === 'HOD') ? 'hod_login' : 'faculty_login';

    $stmt = $pdo->prepare("UPDATE $table SET avatar = ?, avatar_mime = ? WHERE id = ?");
    $stmt->bindParam(1, $binaryData, PDO::PARAM_LOB); // PARAM_LOB for binary data
    $stmt->bindParam(2, $mimeType,   PDO::PARAM_STR);
    $stmt->bindParam(3, $faculty_id, PDO::PARAM_INT);
    $stmt->execute();

    // Return the URL that serves this image back to the browser
    $avatarUrl = BASE_URL . "/get_avatar.php?id={$faculty_id}&role=" . strtolower($user_role);

    echo json_encode(['success' => true, 'avatarUrl' => $avatarUrl]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
