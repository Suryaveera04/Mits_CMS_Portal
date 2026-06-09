<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$key = strtolower(trim($_GET['dept'] ?? ''));
if (!$key) { echo json_encode(['success' => false, 'message' => 'dept param required']); exit; }

$cmsCode = cmsCodeFromKey($key);
if (!$cmsCode) { echo json_encode(['success' => true, 'events' => []]); exit; }

$deptId = getDeptId($pdo, $cmsCode);
if (!$deptId) { echo json_encode(['success' => true, 'events' => []]); exit; }

try {
    $stmt = $pdo->prepare("
        SELECT e.id, e.title, e.event_type, e.venue,
               e.from_date, e.to_date, e.description, e.department
        FROM events e
        WHERE e.department_id = ?
          AND e.status = 'Approved'
        ORDER BY e.from_date DESC
    ");
    $stmt->execute([$deptId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$ev) {
        // Poster image
        $s = $pdo->prepare("SELECT id FROM event_images WHERE event_id = ? AND image_type = 'poster' LIMIT 1");
        $s->execute([$ev['id']]);
        $img = $s->fetchColumn();
        $ev['poster'] = $img
            ? BASE_URL . "/get_content_image.php?table=event_images&id={$img}"
            : null;

        // Provide 'date' field for frontend compatibility
        $ev['date'] = $ev['from_date'];
        $ev['type'] = $ev['event_type'];
    }
    unset($ev);

    echo json_encode(['success' => true, 'events' => array_values($rows)]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'events' => []]);
}
