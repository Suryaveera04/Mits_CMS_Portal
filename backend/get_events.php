<?php
require_once 'config.php';
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

try {
    require_once 'auth_middleware.php';

    $status = $_GET['status']     ?? null;

    $where  = [];
    $params = [];
    getDepartmentFilterForFetch($pdo, $where, $params, 'e');
    if ($status) { $where[] = 'e.status = ?';       $params[] = $status; }
    $whereSQL = $where ? 'WHERE ' . implode(' AND ', $where) : '';

    $stmt = $pdo->prepare("
        SELECT e.*,
               h.name AS submitted_by_name
        FROM events e
        LEFT JOIN hod_login h ON h.id = e.submitted_by
        $whereSQL
        ORDER BY e.created_at DESC
    ");
    $stmt->execute($params);
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($events as &$ev) {
        $id = $ev['id'];

        // Decode JSON arrays
        foreach (['participant_types','grad_levels','student_years','semesters'] as $col) {
            $ev[$col] = json_decode($ev[$col] ?? '[]', true);
        }

        // Resource persons
        $s = $pdo->prepare("SELECT * FROM event_resource_persons WHERE event_id = ?");
        $s->execute([$id]);
        $ev['resourcePersons'] = $s->fetchAll(PDO::FETCH_ASSOC);

        // Coordinators
        $s = $pdo->prepare("SELECT * FROM event_coordinators WHERE event_id = ?");
        $s->execute([$id]);
        $ev['coordinators'] = $s->fetchAll(PDO::FETCH_ASSOC);

        // Poster URL
        $s = $pdo->prepare("SELECT id FROM event_images WHERE event_id = ? AND image_type = 'poster' LIMIT 1");
        $s->execute([$id]);
        $row = $s->fetch(PDO::FETCH_ASSOC);
        $ev['poster'] = $row ? BASE_URL . "/get_content_image.php?table=event_images&id={$row['id']}" : null;

        // Geo photos URLs
        $s = $pdo->prepare("SELECT id FROM event_images WHERE event_id = ? AND image_type = 'geo_photo'");
        $s->execute([$id]);
        $ev['geoPhotos'] = array_map(fn($r) => [
            'id'  => 'geo' . $r['id'],
            'url' => BASE_URL . "/get_content_image.php?table=event_images&id={$r['id']}"
        ], $s->fetchAll(PDO::FETCH_ASSOC));

        // Camel-case key aliases for frontend
        $ev['_id']              = $ev['id'];
        $ev['eventId']          = $ev['event_id'];
        $ev['eventType']        = $ev['event_type'];
        $ev['type']             = 'Event'; 
        $ev['collaborationDept']= $ev['collaboration_dept'];
        $ev['fromDate']         = $ev['from_date'];
        $ev['toDate']           = $ev['to_date'];
        $ev['registrationLink'] = $ev['registration_link'];
        $ev['participantTypes'] = $ev['participant_types'];
        $ev['gradLevels']       = $ev['grad_levels'];
        $ev['studentYears']     = $ev['student_years'];
        $ev['totalRegistered']  = $ev['total_registered'];
        $ev['totalAttended']    = $ev['total_attended'];
        $ev['approvedBudget']   = $ev['approved_budget'];
        $ev['feedbackLink']     = $ev['feedback_link'];
        $ev['sponsorOrg']       = $ev['sponsor_org'];
        $ev['sponsorAmount']    = $ev['sponsor_amount'];
        $ev['submittedByName']  = $ev['submitted_by_name'];
    }

    echo json_encode(['success' => true, 'events' => $events]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
?>
