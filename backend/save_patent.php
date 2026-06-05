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

// Accept both camelCase (frontend) and snake_case (direct API calls)
function pick($input, ...$keys) {
    foreach ($keys as $k) {
        if (isset($input[$k]) && $input[$k] !== null && $input[$k] !== '') return $input[$k];
    }
    return isset($input[$keys[0]]) ? $input[$keys[0]] : null;
}

require_once 'auth_middleware.php';

$id                 = pick($input, 'id');
$title              = pick($input, 'title');
$patent_type        = pick($input, 'patentType', 'patent_type');
$inventors          = pick($input, 'inventors');
$department         = pick($input, 'department');
$department_id      = intval(pick($input, 'department_id') ?? 0);
$patent_number      = pick($input, 'patentNumber', 'patent_number');
$application_number = pick($input, 'applicationNumber', 'application_number');
$filing_date        = pick($input, 'filingDate', 'filing_date');
$published_date     = pick($input, 'publishedDate', 'published_date');
$office             = pick($input, 'office');
$abstract           = pick($input, 'abstract');
$external_link      = pick($input, 'externalLink', 'external_link');
$status             = pick($input, 'status') ?: 'Draft';
$submitted_by       = intval(pick($input, 'submittedBy', 'submitted_by') ?? 0);

// Enforce department ownership: This corrects department/department_id mapping
enforceDepartmentOwnershipOnSave($pdo, $department, $department_id, $submitted_by);

// CRITICAL VALIDATION: Ensure department_id is valid (prevents data corruption)
validateDepartmentOwnership($department_id, $submitted_by);

$document           = isset($input['document']) && is_string($input['document']) ? $input['document'] : null;
$document_mime      = isset($input['documentMime']) ? $input['documentMime'] : (isset($input['document_mime']) ? $input['document_mime'] : 'application/pdf');

try {
    if ($id) {
        $stmt = $pdo->prepare("UPDATE patents SET
            title              = :title,
            patent_type        = :patent_type,
            inventors          = :inventors,
            department         = :department,
            department_id      = :department_id,
            patent_number      = :patent_number,
            application_number = :application_number,
            filing_date        = :filing_date,
            published_date     = :published_date,
            office             = :office,
            abstract           = :abstract,
            external_link      = :external_link,
            status             = :status,
            submitted_by       = :submitted_by
            WHERE patent_id = :id");
        $stmt->execute([
            ':title'              => $title,
            ':patent_type'        => $patent_type,
            ':inventors'          => $inventors,
            ':department'         => $department,
            ':department_id'      => $department_id,
            ':patent_number'      => $patent_number,
            ':application_number' => $application_number,
            ':filing_date'        => $filing_date,
            ':published_date'     => $published_date,
            ':office'             => $office,
            ':abstract'           => $abstract,
            ':external_link'      => $external_link,
            ':status'             => $status,
            ':submitted_by'       => $submitted_by,
            ':id'                 => $id,
        ]);
        echo json_encode(['success' => true, 'id' => (int)$id, 'action' => 'updated']);
    } else {
        $stmt = $pdo->prepare("INSERT INTO patents
            (title, patent_type, inventors, department, department_id, patent_number, application_number,
             filing_date, published_date, office, abstract, external_link, document,
             document_mime, status, submitted_by)
            VALUES
            (:title, :patent_type, :inventors, :department, :department_id, :patent_number, :application_number,
             :filing_date, :published_date, :office, :abstract, :external_link, :document,
             :document_mime, :status, :submitted_by)");
        $stmt->execute([
            ':title'              => $title,
            ':patent_type'        => $patent_type,
            ':inventors'          => $inventors,
            ':department'         => $department,
            ':department_id'      => $department_id,
            ':patent_number'      => $patent_number,
            ':application_number' => $application_number,
            ':filing_date'        => $filing_date,
            ':published_date'     => $published_date,
            ':office'             => $office,
            ':abstract'           => $abstract,
            ':external_link'      => $external_link,
            ':document'           => $document,
            ':document_mime'      => $document_mime,
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
