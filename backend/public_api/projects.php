<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$key = strtolower(trim($_GET['dept'] ?? ''));
if (!$key) { echo json_encode(['success' => false, 'message' => 'dept param required']); exit; }

$cmsCode = cmsCodeFromKey($key);
if (!$cmsCode) { echo json_encode(['success' => true, 'projects' => []]); exit; }

$deptId = getDeptId($pdo, $cmsCode);
if (!$deptId) { echo json_encode(['success' => true, 'projects' => []]); exit; }

try {
    $stmt = $pdo->prepare("
        SELECT p.id, p.title, p.academic_year, p.team, p.guide,
               p.stack, p.github, p.demo, p.abstract, p.department
        FROM projects p
        WHERE p.department_id = ?
          AND p.status = 'Published'
        ORDER BY p.academic_year DESC, p.created_at DESC
    ");
    $stmt->execute([$deptId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$p) {
        $p['students']     = $p['team'];
        $p['description']  = $p['abstract'];
        $p['academicYear'] = $p['academic_year'];
        unset($p['team'], $p['abstract'], $p['academic_year']);
    }
    unset($p);

    echo json_encode(['success' => true, 'projects' => array_values($rows)]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'projects' => []]);
}
