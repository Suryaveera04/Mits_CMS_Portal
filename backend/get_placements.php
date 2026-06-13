<?php
require_once 'config.php';
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

try {
    require_once 'auth_middleware.php';

    $status  = $_GET['status']  ?? null;
    $subtype = $_GET['subtype'] ?? null;

    $sql    = "SELECT p.id, p.placement_id, p.subtype, p.department, p.department_id,
                      p.student_name, p.roll_number, p.company_name, p.package, p.role,
                      p.placement_type, p.year, p.program_title, p.training_type,
                      p.conducted_by, p.start_date, p.end_date, p.number_of_students,
                      p.description, p.status, p.submitted_by, p.created_at, p.updated_at
               FROM placements p";
    $where  = [];
    $params = [];

    getDepartmentFilterForFetch($pdo, $where, $params, 'p');
    if ($status)  { $where[] = 'p.status = ?';  $params[] = $status; }
    if ($subtype) { $where[] = 'p.subtype = ?'; $params[] = $subtype; }
    if ($where) {
        $sql .= " WHERE " . implode(" AND ", $where);
    }
    $sql .= " ORDER BY p.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Map snake_case DB columns → camelCase for frontend
    $placements = array_map(function($row) {
        return [
            'id'               => (int)$row['id'],
            '_id'              => (string)$row['id'],
            'placementId'      => $row['placement_id'],
            'subtype'          => $row['subtype'],
            'department'       => $row['department'],
            'studentName'      => $row['student_name'],
            'rollNumber'       => $row['roll_number'],
            'companyName'      => $row['company_name'],
            'package'          => $row['package'],
            'role'             => $row['role'],
            'placementType'    => $row['placement_type'],
            'year'             => $row['year'],
            'programTitle'     => $row['program_title'],
            'trainingType'     => $row['training_type'],
            'conductedBy'      => $row['conducted_by'],
            'startDate'        => $row['start_date'],
            'endDate'          => $row['end_date'],
            'numberOfStudents' => (int)$row['number_of_students'],
            'description'      => $row['description'],
            'status'           => $row['status'],
            'submittedBy'      => $row['submitted_by'],
            'department_id'    => isset($row['department_id']) ? (int)$row['department_id'] : null,
            'type'             => 'Placement',
            'title'            => $row['subtype'] === 'Training'
                                    ? ($row['program_title'] ?: 'Training Program')
                                    : ($row['student_name']  ?: 'Placement Record'),
            'createdAt'        => $row['created_at'],
            'updatedAt'        => $row['updated_at'],
        ];
    }, $rows);

    echo json_encode(['success' => true, 'placements' => $placements]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage(), 'placements' => []]);
}
?>
