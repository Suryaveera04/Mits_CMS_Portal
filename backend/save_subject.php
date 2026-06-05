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

$id           = pick($input, 'id');
$subject_id   = pick($input, 'subjectId', 'subject_id') ?: uniqid('SUB-');
$code         = pick($input, 'code');
$name         = pick($input, 'name');
$department   = pick($input, 'department');
$department_id= intval(pick($input, 'department_id') ?? 0);
$regulation   = pick($input, 'regulation');
$semester     = pick($input, 'semester');
$credits      = pick($input, 'credits');
$faculty      = pick($input, 'faculty');
$resources    = pick($input, 'resources');
$status       = pick($input, 'status') ?: 'Draft';
$submitted_by = intval(pick($input, 'submittedBy', 'submitted_by') ?? 0);

// Enforce department ownership: This corrects department/department_id mapping
enforceDepartmentOwnershipOnSave($pdo, $department, $department_id, $submitted_by);

// CRITICAL VALIDATION: Ensure department_id is valid (prevents data corruption)
validateDepartmentOwnership($department_id, $submitted_by);

$syllabus           = isset($input['syllabus']) && is_string($input['syllabus']) ? $input['syllabus'] : null;
$syllabus_mime      = 'application/pdf';
$lecture_notes      = isset($input['lectureNotes']) && is_string($input['lectureNotes']) ? $input['lectureNotes'] : null;
$lecture_notes_mime = 'application/pdf';
$lab_manual         = isset($input['labManual']) && is_string($input['labManual']) ? $input['labManual'] : null;
$lab_manual_mime    = 'application/pdf';
$question_bank      = isset($input['questionBank']) && is_string($input['questionBank']) ? $input['questionBank'] : null;
$question_bank_mime = 'application/pdf';

try {
    if ($id) {
        $stmt = $pdo->prepare("UPDATE subjects SET
            code         = :code,
            name         = :name,
            department   = :department,
            department_id= :department_id,
            regulation   = :regulation,
            semester     = :semester,
            credits      = :credits,
            faculty      = :faculty,
            resources    = :resources,
            status       = :status,
            submitted_by = :submitted_by
            WHERE id = :id");
        $stmt->execute([
            ':code'         => $code,
            ':name'         => $name,
            ':department'   => $department,
            ':department_id'=> $department_id,
            ':regulation'   => $regulation,
            ':semester'     => $semester,
            ':credits'      => $credits,
            ':faculty'      => $faculty,
            ':resources'    => $resources,
            ':status'       => $status,
            ':submitted_by' => $submitted_by,
            ':id'           => $id,
        ]);
        echo json_encode(['success' => true, 'id' => (int)$id, 'action' => 'updated']);
    } else {
        $stmt = $pdo->prepare("INSERT INTO subjects
            (subject_id, code, name, department, department_id, regulation, semester, credits,
             faculty, syllabus, syllabus_mime, lecture_notes, lecture_notes_mime,
             lab_manual, lab_manual_mime, question_bank, question_bank_mime, resources,
             status, submitted_by)
            VALUES
            (:subject_id, :code, :name, :department, :department_id, :regulation, :semester, :credits,
             :faculty, :syllabus, :syllabus_mime, :lecture_notes, :lecture_notes_mime,
             :lab_manual, :lab_manual_mime, :question_bank, :question_bank_mime, :resources,
             :status, :submitted_by)");
        $stmt->execute([
            ':subject_id'         => $subject_id,
            ':code'               => $code,
            ':name'               => $name,
            ':department'         => $department,
            ':department_id'      => $department_id,
            ':regulation'         => $regulation,
            ':semester'           => $semester,
            ':credits'            => $credits,
            ':faculty'            => $faculty,
            ':syllabus'           => $syllabus,
            ':syllabus_mime'      => $syllabus_mime,
            ':lecture_notes'      => $lecture_notes,
            ':lecture_notes_mime' => $lecture_notes_mime,
            ':lab_manual'         => $lab_manual,
            ':lab_manual_mime'    => $lab_manual_mime,
            ':question_bank'      => $question_bank,
            ':question_bank_mime' => $question_bank_mime,
            ':resources'          => $resources,
            ':status'             => $status,
            ':submitted_by'       => $submitted_by,
        ]);
        $newId = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'id' => (int)$newId, 'action' => 'created']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
