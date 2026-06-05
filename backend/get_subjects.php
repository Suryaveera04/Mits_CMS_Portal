<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

try {
    require_once 'auth_middleware.php';

    $status = $_GET['status'] ?? null;

    $sql    = "SELECT s.id, s.subject_id, s.code, s.name, s.department, s.department_id,
                      s.regulation, s.semester, s.credits, s.faculty, s.resources,
                      s.status, s.submitted_by, s.created_at, s.updated_at
               FROM subjects s";
    $where  = [];
    $params = [];

    getDepartmentFilterForFetch($pdo, $where, $params, 's');
    if ($status) { $where[] = 's.status = ?'; $params[] = $status; }
    if ($where) { $sql .= " WHERE " . implode(" AND ", $where); }
    $sql .= " ORDER BY s.semester ASC, s.name ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $subjects = array_map(function($row) {
        return [
            'id'           => (int)$row['id'],
            '_id'          => (string)$row['id'],
            'subjectId'    => $row['subject_id'],
            'code'         => $row['code'],
            'name'         => $row['name'],
            'title'        => $row['name'],
            'department'   => $row['department'],
            'department_id'=> isset($row['department_id']) ? (int)$row['department_id'] : null,
            'regulation'   => $row['regulation'],
            'semester'     => $row['semester'],
            'credits'      => $row['credits'],
            'faculty'      => $row['faculty'],
            'resources'    => $row['resources'],
            'status'       => $row['status'],
            'submittedBy'  => $row['submitted_by'],
            'type'         => 'Subject',
            'createdAt'    => $row['created_at'],
            'updatedAt'    => $row['updated_at'],
        ];
    }, $rows);

    echo json_encode(['success' => true, 'subjects' => $subjects]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage(), 'subjects' => []]);
}
?>
