<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$key = strtolower(trim($_GET['dept'] ?? ''));
if (!$key) { echo json_encode(['success' => false, 'message' => 'dept param required']); exit; }

$cmsCode = cmsCodeFromKey($key);
if (!$cmsCode) { echo json_encode(['success' => true, 'patents' => []]); exit; }

$deptId = getDeptId($pdo, $cmsCode);
if (!$deptId) { echo json_encode(['success' => true, 'patents' => []]); exit; }

try {
    $stmt = $pdo->prepare("
        SELECT p.patent_id AS id, p.title, p.patent_type, p.inventors,
               p.patent_number, p.application_number, p.filing_date,
               p.published_date, p.office, p.abstract, p.external_link, p.department
        FROM patents p
        WHERE p.department_id = ?
          AND p.status = 'Published'
        ORDER BY p.filing_date DESC
    ");
    $stmt->execute([$deptId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$p) {
        $typeMap = ['granted' => 'Granted', 'published' => 'Published', 'filed' => 'Filed'];
        $t = strtolower($p['patent_type'] ?? '');
        $p['status'] = $typeMap[$t] ?? (ucfirst($t) ?: 'Filed');
        $p['year']   = $p['filing_date']
            ? substr($p['filing_date'], 0, 4)
            : ($p['published_date'] ? substr($p['published_date'], 0, 4) : '');
    }
    unset($p);

    echo json_encode(['success' => true, 'patents' => array_values($rows)]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'patents' => []]);
}
