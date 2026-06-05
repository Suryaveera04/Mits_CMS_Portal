<?php
require_once 'config.php';
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['title'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// Enforce department ownership on save
require_once 'auth_middleware.php';

// Helper: decode base64 data URL → binary
function decodeImage($dataUrl) {
    if (empty($dataUrl) || !str_contains($dataUrl, ',')) return null;
    [$meta, $b64] = explode(',', $dataUrl, 2);
    preg_match('/data:([^;]+);base64/', $meta, $m);
    return ['binary' => base64_decode($b64), 'mime' => $m[1] ?? 'image/jpeg'];
}

try {
    $pdo->beginTransaction();

    $newsDbId = $data['id'] ?? null;

    $department = $data['department'] ?? '';
    $department_id = intval($data['department_id'] ?? 0);
    $submittedBy = intval($data['submittedBy'] ?? 0);

    // Enforce department ownership: This corrects department/department_id mapping
    enforceDepartmentOwnershipOnSave($pdo, $department, $department_id, $submittedBy);

    // CRITICAL VALIDATION: Ensure department_id is valid (prevents data corruption)
    validateDepartmentOwnership($department_id, $submittedBy);

    // Cover image binary
    $coverImg  = decodeImage($data['coverImage'] ?? '');
    $coverBin  = $coverImg['binary'] ?? null;
    $coverMime = $coverImg['mime']   ?? 'image/jpeg';

    $fields = [
        'news_id'      => $data['newsId']    ?? ('NEWS-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6))),
        'title'        => $data['title'],
        'department'   => $department,
        'department_id'=> $department_id,
        'category'     => $data['category']   ?? null,
        'date'         => $data['date']        ?? date('Y-m-d'),
        'summary'      => $data['summary']     ?? null,
        'full_content' => $data['fullContent'] ?? null,
        'tags'         => json_encode($data['tags'] ?? []),
        'featured'     => $data['featured']    ?? 'No',
        'visibility'   => $data['visibility']  ?? 'College Wide',
        'status'       => $data['status']      ?? 'Draft',
        'submitted_by' => $submittedBy,
    ];

    if ($newsDbId) {
        $sets = implode(', ', array_map(fn($k) => "$k = ?", array_keys($fields)));
        if ($coverBin) {
            $pdo->prepare("UPDATE news SET $sets, cover_image = ?, cover_mime = ? WHERE id = ?")
                ->execute([...array_values($fields), $coverBin, $coverMime, $newsDbId]);
        } else {
            $pdo->prepare("UPDATE news SET $sets WHERE id = ?")->execute([...array_values($fields), $newsDbId]);
        }
    } else {
        $fields['cover_image'] = $coverBin;
        $fields['cover_mime']  = $coverMime;
        $cols = implode(', ', array_keys($fields));
        $phs  = implode(', ', array_fill(0, count($fields), '?'));
        $stmt = $pdo->prepare("INSERT INTO news ($cols) VALUES ($phs)");
        $vals = array_values($fields);
        foreach ($vals as $i => $v) {
            if ($i === array_search('cover_image', array_keys($fields))) {
                $stmt->bindValue($i + 1, $v, PDO::PARAM_LOB);
            } else {
                $stmt->bindValue($i + 1, $v);
            }
        }
        $stmt->execute();
        $newsDbId = $pdo->lastInsertId();
    }

    // ── Gallery Images ────────────────────────────────────────────────────────
    if (isset($data['gallery'])) {
        $pdo->prepare("DELETE FROM news_images WHERE news_id = ?")->execute([$newsDbId]);
        $iStmt = $pdo->prepare("INSERT INTO news_images (news_id, image_data, mime_type, sort_order) VALUES (?,?,?,?)");
        foreach ($data['gallery'] as $idx => $img) {
            $url = $img['url'] ?? $img;
            $decoded = decodeImage($url);
            if ($decoded && $decoded['binary']) {
                $iStmt->bindValue(1, $newsDbId);
                $iStmt->bindValue(2, $decoded['binary'], PDO::PARAM_LOB);
                $iStmt->bindValue(3, $decoded['mime']);
                $iStmt->bindValue(4, $idx);
                $iStmt->execute();
            }
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'id' => $newsDbId, 'message' => 'News saved successfully']);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
