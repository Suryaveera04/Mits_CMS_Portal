<?php
require_once 'config.php';
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

try {
    require_once 'auth_middleware.php';

    $status = $_GET['approvalStatus'] ?? null;

    $where  = [];
    $params = [];
    getDepartmentFilterForFetch($pdo, $where, $params, 'm');
    if ($status) { $where[] = 'm.approval_status = ?'; $params[] = $status; }
    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $stmt = $pdo->prepare("SELECT m.*, h.name AS submitted_by_name FROM mous m LEFT JOIN hod_login h ON h.id = m.submitted_by $whereSQL ORDER BY m.created_at DESC");
    $stmt->execute($params);
    $mous = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($mous as &$mou) {
        $id = $mou['id'];

        $mou['collab_areas'] = json_decode($mou['collab_areas'] ?? '[]', true);

        // Coordinators
        $s = $pdo->prepare("SELECT * FROM mou_coordinators WHERE mou_id = ?");
        $s->execute([$id]);
        $coords = $s->fetchAll(PDO::FETCH_ASSOC);
        $mou['internalCoordinators'] = array_values(array_filter($coords, fn($c) => $c['coordinator_type'] === 'internal'));
        $mou['externalCoordinators'] = array_values(array_filter($coords, fn($c) => $c['coordinator_type'] === 'external'));

        // Signing image URLs
        $s = $pdo->prepare("SELECT id FROM mou_images WHERE mou_id = ?");
        $s->execute([$id]);
        $mou['signingImages'] = array_map(fn($r) => [
            'id'  => 'mou' . $r['id'],
            'url' => "http://localhost/backend/get_content_image.php?table=mou_images&id={$r['id']}"
        ], $s->fetchAll(PDO::FETCH_ASSOC));

        // Camel-case aliases
        $mou['_id']               = $mou['id'];
        $mou['type']              = 'MoU';
        $mou['mouId']             = $mou['mou_id'];
        $mou['partnerOrg']        = $mou['partner_org'];
        $mou['orgType']           = $mou['org_type'];
        $mou['mouCategory']       = $mou['mou_category'];
        $mou['startDate']         = $mou['start_date'];
        $mou['endDate']           = $mou['end_date'];
        $mou['renewalOption']     = $mou['renewal_option'];
        $mou['collabAreas']       = $mou['collab_areas'];
        $mou['studentBenefits']   = $mou['student_benefits'];
        $mou['facultyBenefits']   = $mou['faculty_benefits'];
        $mou['expectedOutcomes']  = $mou['expected_outcomes'];
        $mou['activitiesConducted'] = $mou['activities_conducted'];
        $mou['studentsBenefited'] = $mou['students_benefited'];
        $mou['internshipsProvided'] = $mou['internships_provided'];
        $mou['jointEvents']       = $mou['joint_events'];
        $mou['approvalStatus']    = $mou['approval_status'];
        $mou['submittedByName']   = $mou['submitted_by_name'];
    }

    echo json_encode(['success' => true, 'mous' => $mous]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
