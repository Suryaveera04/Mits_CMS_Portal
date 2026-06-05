<?php
require_once 'config.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

try {
    require_once 'auth_middleware.php';

    $status = $_GET['status'] ?? null;

    $sql    = "SELECT p.id, p.publication_id, p.title, p.department, p.department_id, p.authors,
                      p.venue, p.publisher, p.doi, p.issn, p.year, p.indexing,
                      p.citation_count, p.abstract, p.tags, p.external_link,
                      p.status, p.submitted_by, p.created_at, p.updated_at
               FROM publications p";
    $where  = [];
    $params = [];

    getDepartmentFilterForFetch($pdo, $where, $params, 'p');
    if ($status) { $where[] = 'p.status = ?'; $params[] = $status; }
    if ($where) { $sql .= " WHERE " . implode(" AND ", $where); }
    $sql .= " ORDER BY p.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $publications = array_map(function($row) {
        $tags = $row['tags'];
        if (is_string($tags)) {
            $decoded = json_decode($tags, true);
            $tags = is_array($decoded) ? $decoded : ($tags ? explode(',', $tags) : []);
        }
        return [
            'id'            => (int)$row['id'],
            '_id'           => (string)$row['id'],
            'publicationId' => $row['publication_id'],
            'title'         => $row['title'],
            'department'    => $row['department'],
            'department_id' => isset($row['department_id']) ? (int)$row['department_id'] : null,
            'authors'       => $row['authors'],
            'venue'         => $row['venue'],
            'publisher'     => $row['publisher'],
            'doi'           => $row['doi'],
            'issn'          => $row['issn'],
            'year'          => $row['year'],
            'indexing'      => $row['indexing'],
            'citationCount' => (int)$row['citation_count'],
            'abstract'      => $row['abstract'],
            'tags'          => $tags,
            'externalLink'  => $row['external_link'],
            'status'        => $row['status'],
            'submittedBy'   => $row['submitted_by'],
            'type'          => 'Publication',
            'createdAt'     => $row['created_at'],
            'updatedAt'     => $row['updated_at'],
        ];
    }, $rows);

    echo json_encode(['success' => true, 'publications' => $publications]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage(), 'publications' => []]);
}
?>
