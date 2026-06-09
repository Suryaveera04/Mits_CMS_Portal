<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$key = strtolower(trim($_GET['dept'] ?? ''));
if (!$key) { echo json_encode(['success' => false, 'message' => 'dept param required']); exit; }

$cmsCode = cmsCodeFromKey($key);
if (!$cmsCode) { echo json_encode(['success' => true, 'mous' => []]); exit; }

$deptId = getDeptId($pdo, $cmsCode);
if (!$deptId) { echo json_encode(['success' => true, 'mous' => []]); exit; }

try {
    $stmt = $pdo->prepare("
        SELECT m.id, m.title, m.partner_org, m.org_type, m.country,
               m.mou_category, m.start_date, m.end_date, m.status,
               m.purpose, m.scope, m.collab_areas, m.department
        FROM mous m
        WHERE m.department_id = ?
          AND m.approval_status = 'Approved'
        ORDER BY m.start_date DESC
    ");
    $stmt->execute([$deptId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$m) {
        $m['collabAreas']  = json_decode($m['collab_areas'] ?? '[]', true);
        unset($m['collab_areas']);
        $m['organization'] = $m['partner_org'];
        $m['year']         = $m['start_date'] ? substr($m['start_date'], 0, 4) : '';
    }
    unset($m);

    echo json_encode(['success' => true, 'mous' => array_values($rows)]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'mous' => []]);
}
