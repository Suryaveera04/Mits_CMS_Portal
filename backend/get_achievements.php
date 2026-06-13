<?php
require_once 'config.php';
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

try {
    require_once 'auth_middleware.php';

    $status = isset($_GET['status'])     ? $_GET['status']     : null;

    $sql    = "SELECT id, achievement_id, title, achievement_type, name, department, department_id,
                      date, short_description, external_link, status, submitted_by,
                      created_at, updated_at
               FROM achievements";
    $where  = [];
    $params = [];

    getDepartmentFilterForFetch($pdo, $where, $params);
    if ($status) {
        $where[]  = "status = ?";
        $params[] = $status;
    }
    if ($where) {
        $sql .= " WHERE " . implode(" AND ", $where);
    }
    $sql .= " ORDER BY created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Map snake_case DB columns → camelCase for frontend
    $achievements = array_map(function($row) {
        return [
            'id'               => (int)$row['id'],
            '_id'              => (string)$row['id'],
            'achievementId'    => $row['achievement_id'],
            'title'            => $row['title'],
            'achievementType'  => $row['achievement_type'],
            'name'             => $row['name'],
            'department'       => $row['department'],
            'department_id'    => isset($row['department_id']) ? (int)$row['department_id'] : null,
            'date'             => $row['date'],
            'shortDescription' => $row['short_description'],
            'externalLink'     => $row['external_link'],
            'status'           => $row['status'],
            'submittedBy'      => $row['submitted_by'],
            'type'             => 'Achievement',
            'createdAt'        => $row['created_at'],
            'updatedAt'        => $row['updated_at'],
        ];
    }, $rows);

    echo json_encode(['success' => true, 'achievements' => $achievements]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage(), 'achievements' => []]);
}
?>
