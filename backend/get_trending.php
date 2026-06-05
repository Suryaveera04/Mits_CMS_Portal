<?php
require_once 'config.php';
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

try {
    require_once 'auth_middleware.php';

    $status = $_GET['status'] ?? null;
    $where  = [];
    $params = [];

    getDepartmentFilterForFetch($pdo, $where, $params, 't');
    if ($status) {
        $where[] = 't.status = ?';
        $params[] = $status;
    }

    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $stmt = $pdo->prepare("SELECT t.id, t.title, t.reel_url, t.date, t.status, t.department_id, t.submitted_by, t.created_at, h.name AS submitted_by_name FROM trending t LEFT JOIN hod_login h ON h.id = t.submitted_by $whereSQL ORDER BY t.created_at DESC");
    $stmt->execute($params);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($items as &$item) {
        $item['_id']             = $item['id'];
        $item['reelUrl']         = $item['reel_url'];
        $item['submittedByName'] = $item['submitted_by_name'];
        $item['department_id']   = isset($item['department_id']) ? (int)$item['department_id'] : null;
        // Cover image URL — served by get_content_image.php
        $item['coverImage'] = "http://localhost/backend/get_content_image.php?table=trending&id={$item['id']}&field=cover_image";
    }

    echo json_encode(['success' => true, 'trending' => $items]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
