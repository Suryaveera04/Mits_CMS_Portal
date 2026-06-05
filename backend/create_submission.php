<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$data = json_decode(file_get_contents('php://input'), true);

// Required fields
$user_id = $data['userId'] ?? '';
$title = $data['title'] ?? '';
$type = $data['type'] ?? '';
$status = $data['status'] ?? 'Pending';
$department = $data['department'] ?? '';
$submitted_by = $data['submittedBy'] ?? '';
$submitted_date = $data['submittedDate'] ?? date('Y-m-d');
$change_description = $data['changeDescription'] ?? '';

if (empty($user_id) || empty($title) || empty($type)) {
    echo json_encode(['success' => false, 'message' => 'Required fields missing']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        INSERT INTO submissions 
        (user_id, title, type, status, department, submitted_by, submitted_date, change_description, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([
        $user_id,
        $title,
        $type,
        $status,
        $department,
        $submitted_by,
        $submitted_date,
        $change_description
    ]);
    
    $submission_id = $pdo->lastInsertId();
    
    // Return the created submission
    $stmt = $pdo->prepare("SELECT * FROM submissions WHERE id = ?");
    $stmt->execute([$submission_id]);
    $submission = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Convert to frontend format
    $submission['_id'] = $submission['id'];
    $submission['date'] = $submission['submitted_date'];
    
    echo json_encode(['success' => true, 'submission' => $submission]);
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
