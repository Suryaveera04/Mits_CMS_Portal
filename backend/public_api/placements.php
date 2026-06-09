<?php
require_once __DIR__ . '/cors.php';
require_once __DIR__ . '/db.php';

$key = strtolower(trim($_GET['dept'] ?? ''));
if (!$key) { echo json_encode(['success' => false, 'message' => 'dept param required']); exit; }

$cmsCode = cmsCodeFromKey($key);
if (!$cmsCode) { echo json_encode(['success' => true, 'placements' => []]); exit; }

$deptId = getDeptId($pdo, $cmsCode);
if (!$deptId) { echo json_encode(['success' => true, 'placements' => []]); exit; }

try {
    $stmt = $pdo->prepare("
        SELECT p.id, p.subtype, p.student_name, p.roll_number,
               p.company_name, p.package, p.role, p.placement_type,
               p.year, p.program_title, p.training_type, p.conducted_by,
               p.start_date, p.end_date, p.number_of_students,
               p.description, p.department
        FROM placements p
        WHERE p.department_id = ?
          AND p.status = 'Published'
        ORDER BY p.year DESC, p.created_at DESC
    ");
    $stmt->execute([$deptId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$p) {
        $p['studentName']      = $p['student_name'];
        $p['rollNumber']       = $p['roll_number'];
        $p['companyName']      = $p['company_name'];
        $p['placementType']    = $p['placement_type'];
        $p['programTitle']     = $p['program_title'];
        $p['trainingType']     = $p['training_type'];
        $p['conductedBy']      = $p['conducted_by'];
        $p['startDate']        = $p['start_date'];
        $p['endDate']          = $p['end_date'];
        $p['numberOfStudents'] = (int)$p['number_of_students'];
        unset($p['student_name'], $p['roll_number'], $p['company_name'],
              $p['placement_type'], $p['program_title'], $p['training_type'],
              $p['conducted_by'], $p['start_date'], $p['end_date'], $p['number_of_students']);
    }
    unset($p);

    echo json_encode(['success' => true, 'placements' => array_values($rows)]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'placements' => []]);
}
