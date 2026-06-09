<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$faculty_id = $_GET['faculty_id'] ?? '';
$user_role  = strtoupper($_GET['role'] ?? 'FACULTY');  // FACULTY or HOD

if (empty($faculty_id)) {
    echo json_encode(['success' => false, 'message' => 'Faculty ID required']);
    exit;
}

try {
    $profile = [
        'status' => 'Draft',
        'education' => [],
        'postDoctoral' => [],
        'researchInterest' => '',
        'researchProfile' => [],
        'researchDetails' => '',
        'consultancyProjects' => [],
        'fundedProjects' => [],
        'patents' => [],
        'booksChapters' => [],
        'awardsRecognition' => [],
        'industryCollaboration' => [],
        'academicExposure' => [],
        'eventsOrganised' => [],
        'eventsAttended' => [],
        'professionalAffiliations' => [],
        'invitations' => [],
        'academicVisit' => [],
        'outreachActivities' => [],
        'otherInfo' => ''
    ];

    // Get basic info — check the correct table first based on role
    $isHod = ($user_role === 'HOD');
    if ($isHod) {
        $stmt = $pdo->prepare("SELECT profile_status, name AS display_name, designation, email, qualification, avatar FROM hod_login WHERE id = ?");
        $stmt->execute([$faculty_id]);
        $faculty = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$faculty) {
            // fallback
            $stmt = $pdo->prepare("SELECT profile_status, faculty_name AS display_name, designation, email, qualification, avatar FROM faculty_login WHERE id = ?");
            $stmt->execute([$faculty_id]);
            $faculty = $stmt->fetch(PDO::FETCH_ASSOC);
            $isHod = false;
        }
    } else {
        $stmt = $pdo->prepare("SELECT profile_status, faculty_name AS display_name, designation, email, qualification, avatar FROM faculty_login WHERE id = ?");
        $stmt->execute([$faculty_id]);
        $faculty = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if ($faculty) {
        $profile['status'] = $faculty['profile_status'] ?? 'Draft';
        $role = $isHod ? 'hod' : 'faculty';
        $avatarUrl = !empty($faculty['avatar'])
            ? BASE_URL . "/get_avatar.php?id={$faculty_id}&role={$role}&t=" . time()
            : null;
        $profile['_basic_info'] = [
            'name'          => $faculty['display_name'],
            'designation'   => $faculty['designation'],
            'email'         => $faculty['email'],
            'qualification' => $faculty['qualification'],
            'avatar'        => $avatarUrl,
        ];
    }

    // If status is Pending, return the snapshot from temp table so faculty
    // sees exactly what they submitted (not the old approved data)
    if ($profile['status'] === 'Pending') {
        $stmt = $pdo->prepare("SELECT profile_json FROM pending_profile_data WHERE faculty_id = ?");
        $stmt->execute([$faculty_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $pending = json_decode($row['profile_json'], true);
            $pending['status'] = 'Pending';
            // Always attach current _basic_info (avatar URL from faculty_login)
            $pending['_basic_info'] = $profile['_basic_info'];
            echo json_encode(['success' => true, 'profile' => $pending]);
            exit;
        }
    }

    // Education
    $stmt = $pdo->prepare("SELECT id, course, specialization, branch, college, year FROM faculty_education WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['education'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Post Doctoral
    $stmt = $pdo->prepare("SELECT id, institution, research_area as researchArea, duration, description FROM faculty_post_doctoral WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['postDoctoral'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Research Interest
    $stmt = $pdo->prepare("SELECT research_interest FROM faculty_research_interest WHERE faculty_id = ? LIMIT 1");
    $stmt->execute([$faculty_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $profile['researchInterest'] = $row ? $row['research_interest'] : '';

    // Research Profile
    $stmt = $pdo->prepare("SELECT scopus_link as scopusLink, vidwan_link as vidwanLink, google_scholar_link as googleScholarLink, orcid, h_index as hIndex FROM faculty_research_profile WHERE faculty_id = ? LIMIT 1");
    $stmt->execute([$faculty_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $profile['researchProfile'] = $row ?: [];

    // Research Details
    $stmt = $pdo->prepare("SELECT research_details FROM faculty_research_details WHERE faculty_id = ? LIMIT 1");
    $stmt->execute([$faculty_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $profile['researchDetails'] = $row ? $row['research_details'] : '';

    // Consultancy Projects
    $stmt = $pdo->prepare("SELECT id, title, funding_agency as fundingAgency, amount, duration, role, status FROM faculty_consultancy_projects WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['consultancyProjects'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Funded Projects
    $stmt = $pdo->prepare("SELECT id, title, funding_agency as fundingAgency, amount, duration, role, status FROM faculty_funded_projects WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['fundedProjects'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Patents
    $stmt = $pdo->prepare("SELECT id, title, patent_number as patentNumber, status, filing_date as filingDate, grant_date as grantDate FROM faculty_patents WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['patents'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Books/Chapters
    $stmt = $pdo->prepare("SELECT id, title, publisher, isbn, year, authors FROM faculty_books_chapters WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['booksChapters'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Awards
    $stmt = $pdo->prepare("SELECT id, award_name as awardName, organization, year, description FROM faculty_awards WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['awardsRecognition'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Industry Collaboration
    $stmt = $pdo->prepare("SELECT id, organization, type, duration, outcome FROM faculty_industry_collaboration WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['industryCollaboration'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Academic Exposure
    $stmt = $pdo->prepare("SELECT id, program, institution, country, year FROM faculty_academic_exposure WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['academicExposure'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Events Organised
    $stmt = $pdo->prepare("SELECT id, event_name as eventName, role, location, date FROM faculty_events_organised WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['eventsOrganised'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Events Attended
    $stmt = $pdo->prepare("SELECT id, event_name as eventName, role, location, date FROM faculty_events_attended WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['eventsAttended'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Professional Affiliations
    $stmt = $pdo->prepare("SELECT id, organization_name as organizationName, membership_type as membershipType, duration FROM faculty_affiliations WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['professionalAffiliations'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Invitations
    $stmt = $pdo->prepare("SELECT id, event_name as eventName, role, organization, date FROM faculty_invitations WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['invitations'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Academic Visit
    $stmt = $pdo->prepare("SELECT id, institution, purpose, duration, outcome FROM faculty_academic_visit WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['academicVisit'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Outreach Activities
    $stmt = $pdo->prepare("SELECT id, activity_name as activityName, description, location, date FROM faculty_outreach_activities WHERE faculty_id = ?");
    $stmt->execute([$faculty_id]);
    $profile['outreachActivities'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Other Info
    $stmt = $pdo->prepare("SELECT other_info FROM faculty_other_info WHERE faculty_id = ? LIMIT 1");
    $stmt->execute([$faculty_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $profile['otherInfo'] = $row ? $row['other_info'] : '';

    echo json_encode(['success' => true, 'profile' => $profile]);

} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>
