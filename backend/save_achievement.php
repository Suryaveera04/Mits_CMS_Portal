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

$id               = pick($input, 'id');
$achievement_id   = pick($input, 'achievementId',   'achievement_id') ?: uniqid('ACH-');
$title            = pick($input, 'title');
$achievement_type = pick($input, 'achievementType', 'achievement_type');
$name             = pick($input, 'name');
$department       = pick($input, 'department');
$department_id    = null;
$date             = pick($input, 'date');
$short_desc       = pick($input, 'shortDescription','short_description');
$external_link    = pick($input, 'externalLink',    'external_link');
$status           = pick($input, 'status') ?: 'Draft';
$submitted_by     = pick($input, 'submittedBy',     'submitted_by');

enforceDepartmentOwnershipOnSave($pdo, $department, $department_id, $submitted_by);

// CRITICAL VALIDATION: Ensure department_id is valid (prevents data corruption)
validateDepartmentOwnership($department_id, $submitted_by);

// Handle PDF — frontend sends base64 or raw File object name; store as text reference or blob
$pdf      = isset($input['pdf'])      && is_string($input['pdf'])      ? $input['pdf']      : null;
$pdf_mime = isset($input['pdfMime'])  && is_string($input['pdfMime'])  ? $input['pdfMime']  :
           (isset($input['pdf_mime']) && is_string($input['pdf_mime']) ? $input['pdf_mime'] : 'application/pdf');
$thumb      = isset($input['thumbnail'])     && is_string($input['thumbnail'])     ? $input['thumbnail']     : null;
$thumb_mime = isset($input['thumbnailMime']) && is_string($input['thumbnailMime']) ? $input['thumbnailMime'] :
             (isset($input['thumbnail_mime']) ? $input['thumbnail_mime'] : 'image/jpeg');

try {
    if ($id) {
        // ── UPDATE ──
        $stmt = $pdo->prepare("UPDATE achievements SET
            title            = :title,
            achievement_type = :achievement_type,
            name             = :name,
            department       = :department,
            department_id    = :department_id,
            date             = :date,
            short_description= :short_description,
            external_link    = :external_link,
            status           = :status,
            submitted_by     = :submitted_by
            WHERE id = :id");
        $stmt->execute([
            ':title'            => $title,
            ':achievement_type' => $achievement_type,
            ':name'             => $name,
            ':department'       => $department,
            ':department_id'    => $department_id,
            ':date'             => $date,
            ':short_description'=> $short_desc,
            ':external_link'    => $external_link,
            ':status'           => $status,
            ':submitted_by'     => $submitted_by,
            ':id'               => $id,
        ]);
        echo json_encode(['success' => true, 'id' => (int)$id, 'action' => 'updated']);
    } else {
        // ── INSERT ──
        $stmt = $pdo->prepare("INSERT INTO achievements
            (achievement_id, title, achievement_type, name, department, department_id, date,
             short_description, external_link, pdf, pdf_mime, thumbnail, thumbnail_mime,
             status, submitted_by)
            VALUES
            (:achievement_id, :title, :achievement_type, :name, :department, :department_id, :date,
             :short_description, :external_link, :pdf, :pdf_mime, :thumbnail, :thumbnail_mime,
             :status, :submitted_by)");
        $stmt->execute([
            ':achievement_id'   => $achievement_id,
            ':title'            => $title,
            ':achievement_type' => $achievement_type,
            ':name'             => $name,
            ':department'       => $department,
            ':department_id'    => $department_id,
            ':date'             => $date,
            ':short_description'=> $short_desc,
            ':external_link'    => $external_link,
            ':pdf'              => $pdf,
            ':pdf_mime'         => $pdf_mime,
            ':thumbnail'        => $thumb,
            ':thumbnail_mime'   => $thumb_mime,
            ':status'           => $status,
            ':submitted_by'     => $submitted_by,
        ]);
        $newId = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'id' => (int)$newId, 'action' => 'created']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
