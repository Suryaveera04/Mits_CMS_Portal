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

$id             = pick($input, 'id');
$publication_id = pick($input, 'publicationId', 'publication_id') ?: uniqid('PUB-');
$title          = pick($input, 'title');
$department     = pick($input, 'department');
$department_id  = intval(pick($input, 'department_id') ?? 0);
$authors        = pick($input, 'authors');
$venue          = pick($input, 'venue');
$publisher      = pick($input, 'publisher');
$doi            = pick($input, 'doi');
$issn           = pick($input, 'issn');
$year           = pick($input, 'year');
$indexing       = pick($input, 'indexing');
$citation_count = pick($input, 'citationCount', 'citation_count') ?: 0;
$abstract       = pick($input, 'abstract');
// Tags may be sent as an array or a comma-separated string
$tags_raw       = pick($input, 'tags');
$tags           = is_array($tags_raw) ? json_encode($tags_raw) : $tags_raw;
$external_link  = pick($input, 'externalLink', 'external_link');
$status         = pick($input, 'status') ?: 'Draft';
$submitted_by   = intval(pick($input, 'submittedBy', 'submitted_by') ?? 0);

// Enforce department ownership: This corrects department/department_id mapping
enforceDepartmentOwnershipOnSave($pdo, $department, $department_id, $submitted_by);

// CRITICAL VALIDATION: Ensure department_id is valid (prevents data corruption)
validateDepartmentOwnership($department_id, $submitted_by);

$pdf            = isset($input['pdf']) && is_string($input['pdf']) ? $input['pdf'] : null;
$pdf_mime       = isset($input['pdfMime']) ? $input['pdfMime'] : (isset($input['pdf_mime']) ? $input['pdf_mime'] : 'application/pdf');

try {
    if ($id) {
        $stmt = $pdo->prepare("UPDATE publications SET
            title          = :title,
            department     = :department,
            department_id  = :department_id,
            authors        = :authors,
            venue          = :venue,
            publisher      = :publisher,
            doi            = :doi,
            issn           = :issn,
            year           = :year,
            indexing       = :indexing,
            citation_count = :citation_count,
            abstract       = :abstract,
            tags           = :tags,
            external_link  = :external_link,
            status         = :status,
            submitted_by   = :submitted_by
            WHERE id = :id");
        $stmt->execute([
            ':title'          => $title,
            ':department'     => $department,
            ':department_id'  => $department_id,
            ':authors'        => $authors,
            ':venue'          => $venue,
            ':publisher'      => $publisher,
            ':doi'            => $doi,
            ':issn'           => $issn,
            ':year'           => $year,
            ':indexing'       => $indexing,
            ':citation_count' => $citation_count,
            ':abstract'       => $abstract,
            ':tags'           => $tags,
            ':external_link'  => $external_link,
            ':status'         => $status,
            ':submitted_by'   => $submitted_by,
            ':id'             => $id,
        ]);
        echo json_encode(['success' => true, 'id' => (int)$id, 'action' => 'updated']);
    } else {
        $stmt = $pdo->prepare("INSERT INTO publications
            (publication_id, title, department, department_id, authors, venue, publisher, doi, issn,
             year, indexing, citation_count, abstract, tags, external_link, pdf, pdf_mime,
             status, submitted_by)
            VALUES
            (:publication_id, :title, :department, :department_id, :authors, :venue, :publisher, :doi, :issn,
             :year, :indexing, :citation_count, :abstract, :tags, :external_link, :pdf, :pdf_mime,
             :status, :submitted_by)");
        $stmt->execute([
            ':publication_id' => $publication_id,
            ':title'          => $title,
            ':department'     => $department,
            ':department_id'  => $department_id,
            ':authors'        => $authors,
            ':venue'          => $venue,
            ':publisher'      => $publisher,
            ':doi'            => $doi,
            ':issn'           => $issn,
            ':year'           => $year,
            ':indexing'       => $indexing,
            ':citation_count' => $citation_count,
            ':abstract'       => $abstract,
            ':tags'           => $tags,
            ':external_link'  => $external_link,
            ':pdf'            => $pdf,
            ':pdf_mime'       => $pdf_mime,
            ':status'         => $status,
            ':submitted_by'   => $submitted_by,
        ]);
        $newId = $pdo->lastInsertId();
        echo json_encode(['success' => true, 'id' => (int)$newId, 'action' => 'created']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
