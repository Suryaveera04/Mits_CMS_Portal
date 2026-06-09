<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$key = strtolower(trim($_GET['dept'] ?? ''));
if (!$key) { echo json_encode(['success' => false, 'message' => 'dept param required']); exit; }

$cmsCode = cmsCodeFromKey($key);
if (!$cmsCode) { echo json_encode(['success' => true, 'achievements' => []]); exit; }

$deptId = getDeptId($pdo, $cmsCode);
if (!$deptId) { echo json_encode(['success' => true, 'achievements' => []]); exit; }

try {
    $stmt = $pdo->prepare("
        SELECT a.id, a.title, a.achievement_type, a.name,
               a.date, a.short_description, a.external_link, a.department
        FROM achievements a
        WHERE a.department_id = ?
          AND a.status = 'Published'
        ORDER BY a.date DESC
    ");
    $stmt->execute([$deptId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$a) {
        $typeRaw      = strtolower($a['achievement_type'] ?? '');
        $a['type']        = str_contains($typeRaw, 'student') ? 'student' : 'faculty';
        $a['description'] = $a['short_description'];
        unset($a['short_description']);
    }
    unset($a);

    echo json_encode(['success' => true, 'achievements' => array_values($rows)]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'achievements' => []]);
}
