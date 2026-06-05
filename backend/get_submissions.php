<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $stmt = $pdo->query("
        SELECT 
            id,
            user_id as userId,
            title,
            type,
            status,
            department,
            submitted_by as submittedBy,
            submitted_date as date,
            reviewed_by as reviewedBy,
            reviewed_date as reviewedDate,
            change_description as changeDescription,
            comments,
            created_at as createdAt,
            updated_at as updatedAt
        FROM submissions 
        ORDER BY created_at DESC
    ");
    
    $submissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Add _id field for frontend compatibility
    foreach ($submissions as &$sub) {
        $sub['_id'] = $sub['id'];
        // Parse comments if stored as JSON
        if ($sub['comments']) {
            $sub['comments'] = json_decode($sub['comments'], true) ?: [$sub['comments']];
        } else {
            $sub['comments'] = [];
        }
    }
    
    echo json_encode(['success' => true, 'submissions' => $submissions]);
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
