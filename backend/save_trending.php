<?php
require_once 'config.php';
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['title'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

require_once 'auth_middleware.php';

function decodeImage($dataUrl) {
    if (empty($dataUrl) || !str_contains($dataUrl, ',')) return null;
    [$meta, $b64] = explode(',', $dataUrl, 2);
    preg_match('/data:([^;]+);base64/', $meta, $m);
    $bin = base64_decode($b64);
    return $bin ? ['binary' => $bin, 'mime' => $m[1] ?? 'image/jpeg'] : null;
}

try {
    $pdo->beginTransaction();

    $trendDbId   = $data['id'] ?? null;
    $coverImg    = decodeImage($data['coverImage'] ?? '');
    $department    = $data['department']    ?? '';
    $department_id = intval($data['department_id'] ?? 0);
    $submitted_by  = intval($data['submittedBy']   ?? 0);

    // Enforce department ownership — forces the authenticated user's own department
    enforceDepartmentOwnershipOnSave($pdo, $department, $department_id, $submitted_by);
    validateDepartmentOwnership($department_id, $submitted_by);

    $fields = [
        'title'         => $data['title'],
        'reel_url'      => $data['reelUrl']  ?? null,
        'date'          => $data['date']      ?? null,
        'status'        => $data['status']    ?? 'Draft',
        'submitted_by'  => $submitted_by,
        'department_id' => $department_id,
    ];

    if ($trendDbId) {
        $sets = implode(', ', array_map(fn($k) => "$k = ?", array_keys($fields)));
        if ($coverImg) {
            $stmt = $pdo->prepare("UPDATE trending SET $sets, cover_image = ?, cover_mime = ? WHERE id = ?");
            $vals = array_values($fields);
            foreach ($vals as $i => $v) $stmt->bindValue($i + 1, $v);
            $stmt->bindValue(count($vals) + 1, $coverImg['binary'], PDO::PARAM_LOB);
            $stmt->bindValue(count($vals) + 2, $coverImg['mime']);
            $stmt->bindValue(count($vals) + 3, $trendDbId);
            $stmt->execute();
        } else {
            $pdo->prepare("UPDATE trending SET $sets WHERE id = ?")->execute([...array_values($fields), $trendDbId]);
        }
    } else {
        if ($coverImg) {
            $stmt = $pdo->prepare("INSERT INTO trending (title, reel_url, date, status, submitted_by, department_id, cover_image, cover_mime) VALUES (?,?,?,?,?,?,?,?)");
            $stmt->bindValue(1, $fields['title']);
            $stmt->bindValue(2, $fields['reel_url']);
            $stmt->bindValue(3, $fields['date']);
            $stmt->bindValue(4, $fields['status']);
            $stmt->bindValue(5, $fields['submitted_by']);
            $stmt->bindValue(6, $fields['department_id']);
            $stmt->bindValue(7, $coverImg['binary'], PDO::PARAM_LOB);
            $stmt->bindValue(8, $coverImg['mime']);
            $stmt->execute();
        } else {
            $cols = implode(', ', array_keys($fields));
            $phs  = implode(', ', array_fill(0, count($fields), '?'));
            $pdo->prepare("INSERT INTO trending ($cols) VALUES ($phs)")->execute(array_values($fields));
        }
        $trendDbId = $pdo->lastInsertId();
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'id' => $trendDbId, 'message' => 'Trending saved successfully']);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
