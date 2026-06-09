<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$key = strtolower(trim($_GET['dept'] ?? ''));
if (!$key) { echo json_encode(['success' => false, 'message' => 'dept param required']); exit; }

$cmsCode = cmsCodeFromKey($key);
if (!$cmsCode) { echo json_encode(['success' => true, 'publications' => []]); exit; }

$deptId = getDeptId($pdo, $cmsCode);
if (!$deptId) { echo json_encode(['success' => true, 'publications' => []]); exit; }

try {
    $stmt = $pdo->prepare("
        SELECT p.id, p.title, p.authors, p.venue, p.publisher,
               p.doi, p.issn, p.year, p.indexing,
               p.citation_count, p.abstract, p.external_link, p.department
        FROM publications p
        WHERE p.department_id = ?
          AND p.status = 'Published'
        ORDER BY p.year DESC, p.created_at DESC
    ");
    $stmt->execute([$deptId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$p) {
        $venue = strtolower($p['venue'] ?? '');
        $idx   = strtolower($p['indexing'] ?? '');
        $p['type']         = (str_contains($venue, 'conf') || str_contains($venue, 'proc') || str_contains($idx, 'conf'))
                             ? 'conference' : 'journal';
        $p['citationCount'] = (int)$p['citation_count'];
        unset($p['citation_count']);
    }
    unset($p);

    echo json_encode(['success' => true, 'publications' => array_values($rows)]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'publications' => []]);
}
