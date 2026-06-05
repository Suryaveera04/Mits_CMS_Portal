<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$data = json_decode(file_get_contents('php://input'), true);

$user_id = $data['id'] ?? '';
$name = $data['name'] ?? '';
$designation = $data['designation'] ?? '';
$email = $data['email'] ?? '';
$qualification = $data['qualification'] ?? '';
$avatar = $data['avatar'] ?? '';

if (empty($user_id)) {
    echo json_encode(['success' => false, 'message' => 'User ID required']);
    exit;
}

try {
    // Check if user is HOD or Faculty
    $stmt = $pdo->prepare("SELECT 'hod' as type FROM hod_login WHERE id = ? UNION SELECT 'faculty' as type FROM faculty_login WHERE id = ?");
    $stmt->execute([$user_id, $user_id]);
    $userType = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$userType) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit;
    }
    
    if ($userType['type'] === 'hod') {
        // Update HOD table
        $stmt = $pdo->prepare("
            UPDATE hod_login 
            SET name = ?, designation = ?, email = ?, qualification = ?, avatar = ?
            WHERE id = ?
        ");
        $stmt->execute([$name, $designation, $email, $qualification, $avatar, $user_id]);
    } else {
        // Update Faculty table
        $stmt = $pdo->prepare("
            UPDATE faculty_login 
            SET faculty_name = ?, designation = ?, email = ?, qualification = ?, avatar = ?
            WHERE id = ?
        ");
        $stmt->execute([$name, $designation, $email, $qualification, $avatar, $user_id]);
    }
    
    echo json_encode(['success' => true, 'message' => 'User info updated successfully']);
    
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
