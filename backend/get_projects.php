<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

try {
    require_once 'auth_middleware.php';

    $status = $_GET['status'] ?? null;

    $sql    = "SELECT p.id, p.project_id, p.title, p.department, p.department_id,
                      p.academic_year, p.team, p.guide, p.stack,
                      p.github, p.demo, p.abstract,
                      p.status, p.submitted_by, p.created_at, p.updated_at
               FROM projects p";
    $where  = [];
    $params = [];

    getDepartmentFilterForFetch($pdo, $where, $params, 'p');
    if ($status) { $where[] = 'p.status = ?'; $params[] = $status; }
    if ($where) { $sql .= " WHERE " . implode(" AND ", $where); }
    $sql .= " ORDER BY p.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $projects = array_map(function($row) {
        return [
            'id'           => (int)$row['id'],
            '_id'          => (string)$row['id'],
            'projectId'    => $row['project_id'],
            'title'        => $row['title'],
            'department'   => $row['department'],
            'department_id'=> isset($row['department_id']) ? (int)$row['department_id'] : null,
            'academicYear' => $row['academic_year'],
            'team'         => $row['team'],
            'guide'        => $row['guide'],
            'stack'        => $row['stack'],
            'github'       => $row['github'],
            'demo'         => $row['demo'],
            'abstract'     => $row['abstract'],
            'status'       => $row['status'],
            'submittedBy'  => $row['submitted_by'],
            'type'         => 'Project',
            'createdAt'    => $row['created_at'],
            'updatedAt'    => $row['updated_at'],
        ];
    }, $rows);

    echo json_encode(['success' => true, 'projects' => $projects]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage(), 'projects' => []]);
}
?>
