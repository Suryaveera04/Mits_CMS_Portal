<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid input']);
    exit;
}

function pick($input, ...$keys) {
    foreach ($keys as $k) {
        if (isset($input[$k]) && $input[$k] !== null && $input[$k] !== '') return $input[$k];
    }
    return isset($input[$keys[0]]) ? $input[$keys[0]] : null;
}

require_once 'auth_middleware.php';

$id            = pick($input, 'id');
$project_id    = pick($input, 'projectId', 'project_id') ?: uniqid('PRJ-');
$title         = pick($input, 'title');
$department    = pick($input, 'department');
$department_id = intval(pick($input, 'department_id') ?? 0);
$academic_year = pick($input, 'academicYear', 'academic_year');
$team          = pick($input, 'team');
$guide         = pick($input, 'guide');
// Stack may be array or string
$stack_raw     = pick($input, 'stack');
$stack         = is_array($stack_raw) ? implode(', ', $stack_raw) : $stack_raw;
$github        = pick($input, 'github');
$demo          = pick($input, 'demo');
$abstract      = pick($input, 'abstract');
$status        = pick($input, 'status') ?: 'Draft';
$submitted_by  = intval(pick($input, 'submittedBy', 'submitted_by') ?? 0);

// Enforce department ownership: This corrects department/department_id mapping
enforceDepartmentOwnershipOnSave($pdo, $department, $department_id, $submitted_by);

// CRITICAL VALIDATION: Ensure department_id is valid (prevents data corruption)
validateDepartmentOwnership($department_id, $submitted_by);

$report        = isset($input['report']) && is_string($input['report']) ? $input['report'] : null;
$report_mime   = isset($input['reportMime']) ? $input['reportMime'] : (isset($input['report_mime']) ? $input['report_mime'] : 'application/pdf');

try {
    if ($id) {
        $stmt = $pdo->prepare("UPDATE projects SET
            title         = :title,
            department    = :department,
            department_id = :department_id,
            academic_year = :academic_year,
            team          = :team,
            guide         = :guide,
            stack         = :stack,
            github        = :github,
            demo          = :demo,
            abstract      = :abstract,
            status        = :status,
            submitted_by  = :submitted_by
            WHERE id = :id");
        $stmt->execute([
            ':title'         => $title,
            ':department'    => $department,
            ':department_id' => $department_id,
            ':academic_year' => $academic_year,
            ':team'          => $team,
            ':guide'         => $guide,
            ':stack'         => $stack,
            ':github'        => $github,
            ':demo'          => $demo,
            ':abstract'      => $abstract,
            ':status'        => $status,
            ':submitted_by'  => $submitted_by,
            ':id'            => $id,
        ]);
        echo json_encode(['success' => true, 'id' => (int)$id, 'action' => 'updated']);
    } else {
        $stmt = $pdo->prepare("INSERT INTO projects
            (project_id, title, department, department_id, academic_year, team, guide, stack,
             github, demo, abstract, report, report_mime, status, submitted_by)
            VALUES
            (:project_id, :title, :department, :department_id, :academic_year, :team, :guide, :stack,
             :github, :demo, :abstract, :report, :report_mime, :status, :submitted_by)");
        $stmt->execute([
            ':project_id'    => $project_id,
            ':title'         => $title,
            ':department'    => $department,
            ':department_id' => $department_id,
            ':academic_year' => $academic_year,
            ':team'          => $team,
            ':guide'         => $guide,
            ':stack'         => $stack,
            ':github'        => $github,
            ':demo'          => $demo,
            ':abstract'      => $abstract,
            ':report'        => $report,
            ':report_mime'   => $report_mime,
            ':status'        => $status,
            ':submitted_by'  => $submitted_by,
        ]);
        $newId = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'id' => (int)$newId, 'action' => 'created']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
