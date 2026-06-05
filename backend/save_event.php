<?php
require_once 'config.php';
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$data = json_decode(file_get_contents('php://input'), true);

$required = ['title', 'fromDate', 'venue', 'submittedBy'];
foreach ($required as $f) {
    if (empty($data[$f])) {
        echo json_encode(['success' => false, 'message' => "Missing required field: $f"]);
        exit;
    }
}
// Allow both `eventType` (frontend) and `event_type` (alternate payload)
$eventType = $data['eventType'] ?? $data['event_type'] ?? '';
if (empty($eventType)) {
    echo json_encode(['success' => false, 'message' => 'Missing required field: eventType']);
    exit;
}
// Enforce department ownership on save
require_once 'auth_middleware.php';

try {
    $pdo->beginTransaction();

    $eventDbId = $data['id'] ?? null; // null = new, int = update

    $department = $data['department'] ?? '';
    $department_id = intval($data['department_id'] ?? 0);
    $submittedBy = intval($data['submittedBy'] ?? 0);

    // Enforce department ownership: This corrects department/department_id mapping
    enforceDepartmentOwnershipOnSave($pdo, $department, $department_id, $submittedBy);

    // CRITICAL VALIDATION: Ensure department_id is valid (prevents data corruption)
    validateDepartmentOwnership($department_id, $submittedBy);

    $fields = [
        'event_id'          => $data['eventId']          ?? ('EVT-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6))),
        'title'             => $data['title'],
        'department'        => $department,
        'department_id'     => $department_id,
        'collaboration_dept'=> $data['collaborationDept'] ?? null,
        'event_type'        => $eventType,
        'description'       => $data['description']      ?? null,
        'from_date'         => $data['fromDate'],
        'to_date'           => $data['toDate']            ?? null,
        'mode'              => $data['mode']              ?? 'Offline',
        'venue'             => $data['venue'],
        'address'           => $data['address']           ?? null,
        'duration'          => $data['duration']          ?? null,
        'registration_link' => $data['registrationLink']  ?? null,
        'outcome'           => $data['outcome']           ?? null,
        'participant_types' => json_encode($data['participantTypes'] ?? []),
        'grad_levels'       => json_encode($data['gradLevels']       ?? []),
        'student_years'     => json_encode($data['studentYears']     ?? []),
        'semesters'         => json_encode($data['semesters']        ?? []),
        'total_registered'  => intval($data['totalRegistered']  ?? 0),
        'total_attended'    => intval($data['totalAttended']    ?? 0),
        'approved_budget'   => floatval($data['approvedBudget'] ?? 0),
        'expenditure'       => floatval($data['expenditure']    ?? 0),
        'feedback_link'     => $data['feedbackLink']      ?? null,
        'sponsor_org'       => $data['sponsorOrg']        ?? null,
        'sponsor_amount'    => floatval($data['sponsorAmount'] ?? 0),
        'status'            => $data['status']            ?? 'Draft',
        'submitted_by'      => intval($submittedBy),
    ];

    if ($eventDbId) {
        // UPDATE
        $sets = implode(', ', array_map(fn($k) => "$k = ?", array_keys($fields)));
        $stmt = $pdo->prepare("UPDATE events SET $sets WHERE id = ?");
        $stmt->execute([...array_values($fields), $eventDbId]);
    } else {
        // INSERT
        $cols = implode(', ', array_keys($fields));
        $phs  = implode(', ', array_fill(0, count($fields), '?'));
        $stmt = $pdo->prepare("INSERT INTO events ($cols) VALUES ($phs)");
        $stmt->execute(array_values($fields));
        $eventDbId = $pdo->lastInsertId();
    }

    // ── Resource Persons ──────────────────────────────────────────────────────
    $pdo->prepare("DELETE FROM event_resource_persons WHERE event_id = ?")->execute([$eventDbId]);
    if (!empty($data['resourcePersons'])) {
        $rStmt = $pdo->prepare("INSERT INTO event_resource_persons (event_id, name, qualification, experience, designation, institute, department) VALUES (?,?,?,?,?,?,?)");
        foreach ($data['resourcePersons'] as $rp) {
            $rStmt->execute([$eventDbId, $rp['name'] ?? '', $rp['qualification'] ?? '', $rp['experience'] ?? '', $rp['designation'] ?? '', $rp['institute'] ?? '', $rp['department'] ?? '']);
        }
    }

    // ── Coordinators ──────────────────────────────────────────────────────────
    $pdo->prepare("DELETE FROM event_coordinators WHERE event_id = ?")->execute([$eventDbId]);
    if (!empty($data['coordinators'])) {
        $cStmt = $pdo->prepare("INSERT INTO event_coordinators (event_id, name, email, contact) VALUES (?,?,?,?)");
        foreach ($data['coordinators'] as $c) {
            $cStmt->execute([$eventDbId, $c['name'] ?? '', $c['email'] ?? '', $c['contact'] ?? '']);
        }
    }

    // ── Images: poster + geo photos ───────────────────────────────────────────
    // Images arrive as base64 data URLs: "data:image/jpeg;base64,..."
    // We strip the header and store raw binary in MEDIUMBLOB

    $saveImage = function($base64Url, $type) use ($pdo, $eventDbId) {
        if (empty($base64Url) || !str_contains($base64Url, ',')) return;
        [$meta, $b64] = explode(',', $base64Url, 2);
        preg_match('/data:([^;]+);base64/', $meta, $m);
        $mime   = $m[1] ?? 'image/jpeg';
        $binary = base64_decode($b64);
        if (!$binary) return;
        $pdo->prepare("INSERT INTO event_images (event_id, image_type, image_data, mime_type) VALUES (?,?,?,?)")
            ->execute([$eventDbId, $type, $binary, $mime]);
    };

    // Delete old images of each type before re-inserting
    if (isset($data['poster'])) {
        $pdo->prepare("DELETE FROM event_images WHERE event_id = ? AND image_type = 'poster'")->execute([$eventDbId]);
        $saveImage($data['poster'], 'poster');
    }
    if (isset($data['geoPhotos'])) {
        $pdo->prepare("DELETE FROM event_images WHERE event_id = ? AND image_type = 'geo_photo'")->execute([$eventDbId]);
        foreach ($data['geoPhotos'] as $photo) {
            $saveImage($photo['url'] ?? $photo, 'geo_photo');
        }
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'id' => $eventDbId, 'message' => 'Event saved successfully']);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
