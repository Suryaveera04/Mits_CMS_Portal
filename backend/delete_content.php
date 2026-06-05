<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['id']) || empty($input['type'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

$id = (int)$input['id'];
$type = strtolower($input['type']);

$table_map = [
    'event'       => ['table' => 'events',       'pk' => 'id'],
    'mou'         => ['table' => 'mous',         'pk' => 'id'],
    'news'        => ['table' => 'news',         'pk' => 'id'],
    'trending'    => ['table' => 'trending',     'pk' => 'id'],
    'achievement' => ['table' => 'achievements', 'pk' => 'id'],
    'patent'      => ['table' => 'patents',      'pk' => 'patent_id'],
    'publication' => ['table' => 'publications', 'pk' => 'id'],
    'placement'   => ['table' => 'placements',   'pk' => 'id'],
    'project'     => ['table' => 'projects',     'pk' => 'id'],
    'subject'     => ['table' => 'subjects',     'pk' => 'id'],
];

if (!array_key_exists($type, $table_map)) {
    echo json_encode(['success' => false, 'message' => 'Unknown content type']);
    exit;
}

$table = $table_map[$type]['table'];
$pk    = $table_map[$type]['pk'];

try {
    // For events/mous/news also delete child rows
    if ($type === 'event') {
        $pdo->prepare("DELETE FROM event_resource_persons WHERE event_id = :id")->execute([':id' => $id]);
        $pdo->prepare("DELETE FROM event_coordinators WHERE event_id = :id")->execute([':id' => $id]);
        $pdo->prepare("DELETE FROM event_images WHERE event_id = :id")->execute([':id' => $id]);
    } elseif ($type === 'mou') {
        $pdo->prepare("DELETE FROM mou_coordinators WHERE mou_id = :id")->execute([':id' => $id]);
        $pdo->prepare("DELETE FROM mou_images WHERE mou_id = :id")->execute([':id' => $id]);
    } elseif ($type === 'news') {
        $pdo->prepare("DELETE FROM news_images WHERE news_id = :id")->execute([':id' => $id]);
    }
    $stmt = $pdo->prepare("DELETE FROM $table WHERE $pk = :id");
    $stmt->execute([':id' => $id]);
    
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Record not found']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
