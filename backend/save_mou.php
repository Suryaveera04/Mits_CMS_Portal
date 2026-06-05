<?php
require_once 'config.php';
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$data = json_decode(file_get_contents('php://input'), true);

if (empty($data['title']) || empty($data['partnerOrg'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

// Enforce department ownership on save
require_once 'auth_middleware.php';

try {
    $pdo->beginTransaction();

    $mouDbId = $data['id'] ?? null;

    $department = $data['department'] ?? '';
    $department_id = intval($data['department_id'] ?? 0);
    $submittedBy = intval($data['submittedBy'] ?? 0);

    // Enforce department ownership: This corrects department/department_id mapping
    enforceDepartmentOwnershipOnSave($pdo, $department, $department_id, $submittedBy);

    // CRITICAL VALIDATION: Ensure department_id is valid (prevents data corruption)
    validateDepartmentOwnership($department_id, $submittedBy);

    $fields = [
        'mou_id'              => $data['mouId']              ?? ('MOU-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -6))),
        'title'               => $data['title'],
        'department'          => $department,
        'department_id'       => $department_id,
        'partner_org'         => $data['partnerOrg'],
        'org_type'            => $data['orgType']            ?? null,
        'country'             => $data['country']            ?? 'India',
        'mou_category'        => $data['mouCategory']        ?? null,
        'start_date'          => $data['startDate']          ?? null,
        'end_date'            => $data['endDate']            ?? null,
        'duration'            => $data['duration']           ?? null,
        'status'              => $data['status']             ?? 'Active',
        'renewal_option'      => $data['renewalOption']      ?? 'No',
        'purpose'             => $data['purpose']            ?? null,
        'scope'               => $data['scope']              ?? null,
        'objectives'          => $data['objectives']         ?? null,
        'collab_areas'        => json_encode($data['collabAreas'] ?? []),
        'student_benefits'    => $data['studentBenefits']    ?? null,
        'faculty_benefits'    => $data['facultyBenefits']    ?? null,
        'expected_outcomes'   => $data['expectedOutcomes']   ?? null,
        'activities_conducted'=> intval($data['activitiesConducted'] ?? 0),
        'students_benefited'  => intval($data['studentsBenefited']   ?? 0),
        'internships_provided'=> intval($data['internshipsProvided'] ?? 0),
        'joint_events'        => intval($data['jointEvents']         ?? 0),
        'approval_status'     => $data['approvalStatus']     ?? 'Draft',
        'submitted_by'        => $submittedBy,
    ];

    if ($mouDbId) {
        $sets = implode(', ', array_map(fn($k) => "$k = ?", array_keys($fields)));
        $pdo->prepare("UPDATE mous SET $sets WHERE id = ?")->execute([...array_values($fields), $mouDbId]);
    } else {
        $cols = implode(', ', array_keys($fields));
        $phs  = implode(', ', array_fill(0, count($fields), '?'));
        $pdo->prepare("INSERT INTO mous ($cols) VALUES ($phs)")->execute(array_values($fields));
        $mouDbId = $pdo->lastInsertId();
    }

    // ── Coordinators ──────────────────────────────────────────────────────────
    $pdo->prepare("DELETE FROM mou_coordinators WHERE mou_id = ?")->execute([$mouDbId]);
    $cStmt = $pdo->prepare("INSERT INTO mou_coordinators (mou_id, coordinator_type, name, designation, email, contact) VALUES (?,?,?,?,?,?)");

    foreach ($data['internalCoordinators'] ?? [] as $c) {
        $cStmt->execute([$mouDbId, 'internal', $c['name'] ?? '', '', $c['email'] ?? '', $c['contact'] ?? '']);
    }
    foreach ($data['externalCoordinators'] ?? [] as $c) {
        $cStmt->execute([$mouDbId, 'external', $c['name'] ?? '', $c['designation'] ?? '', $c['email'] ?? '', $c['contact'] ?? '']);
    }

    // ── Signing Images ────────────────────────────────────────────────────────
    if (isset($data['signingImages'])) {
        $pdo->prepare("DELETE FROM mou_images WHERE mou_id = ?")->execute([$mouDbId]);
        $iStmt = $pdo->prepare("INSERT INTO mou_images (mou_id, image_data, mime_type) VALUES (?,?,?)");
        foreach ($data['signingImages'] as $img) {
            $url = $img['url'] ?? $img;
            if (empty($url) || !str_contains($url, ',')) continue;
            [$meta, $b64] = explode(',', $url, 2);
            preg_match('/data:([^;]+);base64/', $meta, $m);
            $mime   = $m[1] ?? 'image/jpeg';
            $binary = base64_decode($b64);
            if ($binary) $iStmt->execute([$mouDbId, $binary, $mime]);
        }
    }

    $pdo->commit();
    echo json_encode(['success' => true, 'id' => $mouDbId, 'message' => 'MoU saved successfully']);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>

