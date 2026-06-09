<?php
require_once 'config.php';
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

try {
    require_once 'auth_middleware.php';

    $status = $_GET['status'] ?? null;

    $where  = [];
    $params = [];
    getDepartmentFilterForFetch($pdo, $where, $params, 'n');
    if ($status) { $where[] = 'n.status = ?'; $params[] = $status; }
    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $stmt = $pdo->prepare("SELECT n.id, n.news_id, n.title, n.department, n.department_id, n.category, n.date, n.summary, n.full_content, n.tags, n.featured, n.visibility, n.status, n.submitted_by, n.created_at, n.updated_at, h.name AS submitted_by_name FROM news n LEFT JOIN hod_login h ON h.id = n.submitted_by $whereSQL ORDER BY n.created_at DESC");
    $stmt->execute($params);
    $newsList = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($newsList as &$item) {
        $id = $item['id'];

        $item['tags'] = json_decode($item['tags'] ?? '[]', true);

        // Cover image URL (don't send binary in list)
        $item['coverImage'] = BASE_URL . "/get_content_image.php?table=news&id={$id}&field=cover_image";

        // Gallery image URLs
        $s = $pdo->prepare("SELECT id FROM news_images WHERE news_id = ? ORDER BY sort_order");
        $s->execute([$id]);
        $item['gallery'] = array_map(fn($r) => [
            'id'  => 'ni' . $r['id'],
            'url' => BASE_URL . "/get_content_image.php?table=news_images&id={$r['id']}"
        ], $s->fetchAll(PDO::FETCH_ASSOC));

        $item['_id']          = $item['id'];
        $item['type']         = 'News';
        $item['newsId']       = $item['news_id'];
        $item['fullContent']  = $item['full_content'];
        $item['submittedByName'] = $item['submitted_by_name'];
        $item['department_id']= isset($item['department_id']) ? (int)$item['department_id'] : null;
    }

    echo json_encode(['success' => true, 'news' => $newsList]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
