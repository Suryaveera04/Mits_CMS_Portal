<?php
require_once 'config.php';
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

try {
    require_once 'auth_middleware.php';

    $status = $_GET['status'] ?? null;

    $sql    = "SELECT patent_id AS id, title, patent_type, inventors, department, department_id,
                      patent_number, application_number, filing_date, published_date,
                      office, abstract, external_link, status, submitted_by,
                      created_at, updated_at
               FROM patents p";
    $where  = [];
    $params = [];

    getDepartmentFilterForFetch($pdo, $where, $params, 'p');
    if ($status) { $where[] = 'p.status = ?'; $params[] = $status; }
    if ($where) { $sql .= " WHERE " . implode(" AND ", $where); }
    $sql .= " ORDER BY created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $patents = array_map(function($row) {
        return [
            'id'                => (int)$row['id'],
            '_id'               => (string)$row['id'],
            'title'             => $row['title'],
            'patentType'        => $row['patent_type'],
            'inventors'         => $row['inventors'],
            'department'        => $row['department'],
            'department_id'     => isset($row['department_id']) ? (int)$row['department_id'] : null,
            'patentNumber'      => $row['patent_number'],
            'applicationNumber' => $row['application_number'],
            'filingDate'        => $row['filing_date'],
            'publishedDate'     => $row['published_date'],
            'office'            => $row['office'],
            'abstract'          => $row['abstract'],
            'externalLink'      => $row['external_link'],
            'status'            => $row['status'],
            'submittedBy'       => $row['submitted_by'],
            'type'              => 'Patent',
            'createdAt'         => $row['created_at'],
            'updatedAt'         => $row['updated_at'],
        ];
    }, $rows);

    echo json_encode(['success' => true, 'patents' => $patents]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage(), 'patents' => []]);
}
?>
