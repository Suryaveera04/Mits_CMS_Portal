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

$id                 = pick($input, 'id');
$placement_id       = pick($input, 'placementId', 'placement_id') ?: uniqid('PLC-');
$subtype            = pick($input, 'subtype');
$department         = pick($input, 'department');
$department_id      = intval(pick($input, 'department_id') ?? 0);
$student_name       = pick($input, 'studentName', 'student_name');
$roll_number        = pick($input, 'rollNumber', 'roll_number');
$company_name       = pick($input, 'companyName', 'company_name');
$package            = pick($input, 'package');
$role               = pick($input, 'role');
$placement_type     = pick($input, 'placementType', 'placement_type');
$year               = pick($input, 'year');
$program_title      = pick($input, 'programTitle', 'program_title');
$training_type      = pick($input, 'trainingType', 'training_type');
$conducted_by       = pick($input, 'conductedBy', 'conducted_by');
$start_date         = pick($input, 'startDate', 'start_date');
$end_date           = pick($input, 'endDate', 'end_date');
$number_of_students = pick($input, 'numberOfStudents', 'number_of_students') ?: 0;
$description        = pick($input, 'description');
$status             = pick($input, 'status') ?: 'Draft';
$submitted_by       = intval(pick($input, 'submittedBy', 'submitted_by') ?? 0);

// Enforce department ownership: This corrects department/department_id mapping
enforceDepartmentOwnershipOnSave($pdo, $department, $department_id, $submitted_by);

// CRITICAL VALIDATION: Ensure department_id is valid (prevents data corruption)
validateDepartmentOwnership($department_id, $submitted_by);

$offer_letter_url   = isset($input['offerLetterUrl']) && is_string($input['offerLetterUrl']) ? $input['offerLetterUrl'] : null;
$offer_letter_mime  = 'application/pdf';
$student_photo_url  = isset($input['studentPhotoUrl']) && is_string($input['studentPhotoUrl']) ? $input['studentPhotoUrl'] : null;
$student_photo_mime = 'image/jpeg';
$certificate_url    = isset($input['certificateUrl']) && is_string($input['certificateUrl']) ? $input['certificateUrl'] : null;
$certificate_mime   = 'application/pdf';

try {
    if ($id) {
        $stmt = $pdo->prepare("UPDATE placements SET
            subtype            = :subtype,
            department         = :department,
            department_id      = :department_id,
            student_name       = :student_name,
            roll_number        = :roll_number,
            company_name       = :company_name,
            package            = :package,
            role               = :role,
            placement_type     = :placement_type,
            year               = :year,
            program_title      = :program_title,
            training_type      = :training_type,
            conducted_by       = :conducted_by,
            start_date         = :start_date,
            end_date           = :end_date,
            number_of_students = :number_of_students,
            description        = :description,
            status             = :status,
            submitted_by       = :submitted_by
            WHERE id = :id");
        $stmt->execute([
            ':subtype'            => $subtype,
            ':department'         => $department,
            ':department_id'      => $department_id,
            ':student_name'       => $student_name,
            ':roll_number'        => $roll_number,
            ':company_name'       => $company_name,
            ':package'            => $package,
            ':role'               => $role,
            ':placement_type'     => $placement_type,
            ':year'               => $year,
            ':program_title'      => $program_title,
            ':training_type'      => $training_type,
            ':conducted_by'       => $conducted_by,
            ':start_date'         => $start_date,
            ':end_date'           => $end_date,
            ':number_of_students' => $number_of_students,
            ':description'        => $description,
            ':status'             => $status,
            ':submitted_by'       => $submitted_by,
            ':id'                 => $id,
        ]);
        echo json_encode(['success' => true, 'id' => (int)$id, 'action' => 'updated']);
    } else {
        $stmt = $pdo->prepare("INSERT INTO placements
            (placement_id, subtype, department, department_id, student_name, roll_number, company_name,
             package, role, placement_type, year, offer_letter_url, offer_letter_mime,
             student_photo_url, student_photo_mime, program_title, training_type, conducted_by,
             start_date, end_date, number_of_students, description, certificate_url, certificate_mime,
             status, submitted_by)
            VALUES
            (:placement_id, :subtype, :department, :department_id, :student_name, :roll_number, :company_name,
             :package, :role, :placement_type, :year, :offer_letter_url, :offer_letter_mime,
             :student_photo_url, :student_photo_mime, :program_title, :training_type, :conducted_by,
             :start_date, :end_date, :number_of_students, :description, :certificate_url, :certificate_mime,
             :status, :submitted_by)");
        $stmt->execute([
            ':placement_id'       => $placement_id,
            ':subtype'            => $subtype,
            ':department'         => $department,
            ':department_id'      => $department_id,
            ':student_name'       => $student_name,
            ':roll_number'        => $roll_number,
            ':company_name'       => $company_name,
            ':package'            => $package,
            ':role'               => $role,
            ':placement_type'     => $placement_type,
            ':year'               => $year,
            ':offer_letter_url'   => $offer_letter_url,
            ':offer_letter_mime'  => $offer_letter_mime,
            ':student_photo_url'  => $student_photo_url,
            ':student_photo_mime' => $student_photo_mime,
            ':program_title'      => $program_title,
            ':training_type'      => $training_type,
            ':conducted_by'       => $conducted_by,
            ':start_date'         => $start_date,
            ':end_date'           => $end_date,
            ':number_of_students' => $number_of_students,
            ':description'        => $description,
            ':certificate_url'    => $certificate_url,
            ':certificate_mime'   => $certificate_mime,
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
