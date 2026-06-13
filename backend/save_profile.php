<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$data        = json_decode(file_get_contents('php://input'), true);
$faculty_id   = $data['faculty_id']  ?? '';
$user_role    = strtoupper($data['user_role'] ?? 'FACULTY');
$profile_data = $data['profile_data'] ?? [];
$basic_info   = $data['basic_info']   ?? [];   // name, designation, email, qualification, avatar
$status       = $profile_data['status'] ?? 'Draft';

if (empty($faculty_id)) {
    echo json_encode(['success' => false, 'message' => 'Faculty ID required']);
    exit;
}

// For HOD role: resolve the faculty_login.id via email so profile
// section inserts use the correct FK (hod_login.id != faculty_login.id)
if ($user_role === 'HOD') {
    $stmt = $pdo->prepare("SELECT email FROM hod_login WHERE id = ? LIMIT 1");
    $stmt->execute([$faculty_id]);
    $hodRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($hodRow && !empty($hodRow['email'])) {
        $stmt2 = $pdo->prepare("SELECT id FROM faculty_login WHERE email = ? LIMIT 1");
        $stmt2->execute([$hodRow['email']]);
        $flRow = $stmt2->fetch(PDO::FETCH_ASSOC);
        if ($flRow) {
            $faculty_id = $flRow['id']; // use faculty_login.id for all profile tables
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROUTING LOGIC
//
//  • status = 'Pending'  → Faculty submitted for HOD approval
//                          Save full profile snapshot to pending_profile_data (temp table)
//                          Do NOT touch main profile tables yet
//
//  • status = 'Draft'    → Faculty saved a local draft (not submitted)
//                          Save directly to main tables (no approval needed for drafts)
//
//  • HOD role            → HOD saves their own profile, goes directly to main tables
// ─────────────────────────────────────────────────────────────────────────────

try {
    if ($status === 'Pending' && $user_role === 'FACULTY') {
        // ── Save to TEMP table only ───────────────────────────────────────────
        $pdo->beginTransaction();

        // Upsert: one pending row per faculty at a time
        $stmt = $pdo->prepare("SELECT id FROM pending_profile_data WHERE faculty_id = ?");
        $stmt->execute([$faculty_id]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);

        // Store profile sections + basic_info together in the snapshot
        $snapshot = array_merge($profile_data, ['_basic_info' => $basic_info]);
        $json = json_encode($snapshot);

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE pending_profile_data SET profile_json = ?, updated_at = NOW() WHERE faculty_id = ?");
            $stmt->execute([$json, $faculty_id]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO pending_profile_data (faculty_id, profile_json) VALUES (?, ?)");
            $stmt->execute([$faculty_id, $json]);
        }

        // Mark faculty status as Pending
        $stmt = $pdo->prepare("UPDATE faculty_login SET profile_status = 'Pending' WHERE id = ?");
        $stmt->execute([$faculty_id]);

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Profile submitted for approval']);

    } else {
        // ── Save directly to MAIN tables (Draft save or HOD) ─────────────────
        $pdo->beginTransaction();

        $dbStatus = ($user_role === 'HOD') ? 'Approved' : 'Draft';
        // HOD records live in hod_login; faculty records live in faculty_login
        if ($user_role === 'HOD') {
            $stmt = $pdo->prepare("UPDATE hod_login SET profile_status = ? WHERE id = ?");
        } else {
            $stmt = $pdo->prepare("UPDATE faculty_login SET profile_status = ? WHERE id = ?");
        }
        $stmt->execute([$dbStatus, $faculty_id]);

        saveToMainTables($pdo, $faculty_id, $profile_data);

        $pdo->commit();
        echo json_encode(['success' => true, 'message' => 'Profile saved successfully']);
    }

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: write all profile sections to the main faculty_* tables
// ─────────────────────────────────────────────────────────────────────────────
function saveToMainTables($pdo, $faculty_id, $profile_data) {

    // Education
    if (isset($profile_data['education']) && is_array($profile_data['education'])) {
        $pdo->prepare("DELETE FROM faculty_education WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_education (faculty_id, course, specialization, branch, college, year) VALUES (?, ?, ?, ?, ?, ?)");
        foreach ($profile_data['education'] as $r) {
            $stmt->execute([$faculty_id, $r['course'] ?? '', $r['specialization'] ?? '', $r['branch'] ?? '', $r['college'] ?? '', $r['year'] ?? '']);
        }
    }

    // Post Doctoral
    if (isset($profile_data['postDoctoral']) && is_array($profile_data['postDoctoral'])) {
        $pdo->prepare("DELETE FROM faculty_post_doctoral WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_post_doctoral (faculty_id, institution, research_area, duration, description) VALUES (?, ?, ?, ?, ?)");
        foreach ($profile_data['postDoctoral'] as $r) {
            $stmt->execute([$faculty_id, $r['institution'] ?? '', $r['researchArea'] ?? '', $r['duration'] ?? '', $r['description'] ?? '']);
        }
    }

    // Research Interest
    if (isset($profile_data['researchInterest'])) {
        $pdo->prepare("DELETE FROM faculty_research_interest WHERE faculty_id = ?")->execute([$faculty_id]);
        if (!empty($profile_data['researchInterest'])) {
            $pdo->prepare("INSERT INTO faculty_research_interest (faculty_id, research_interest) VALUES (?, ?)")
                ->execute([$faculty_id, $profile_data['researchInterest']]);
        }
    }

    // Research Profile
    if (isset($profile_data['researchProfile']) && is_array($profile_data['researchProfile'])) {
        $pdo->prepare("DELETE FROM faculty_research_profile WHERE faculty_id = ?")->execute([$faculty_id]);
        $rp = $profile_data['researchProfile'];
        if (!empty($rp)) {
            $pdo->prepare("INSERT INTO faculty_research_profile (faculty_id, scopus_link, vidwan_link, google_scholar_link, orcid, h_index) VALUES (?, ?, ?, ?, ?, ?)")
                ->execute([$faculty_id, $rp['scopusLink'] ?? '', $rp['vidwanLink'] ?? '', $rp['googleScholarLink'] ?? '', $rp['orcid'] ?? '', $rp['hIndex'] ?? '']);
        }
    }

    // Research Details
    if (isset($profile_data['researchDetails'])) {
        $pdo->prepare("DELETE FROM faculty_research_details WHERE faculty_id = ?")->execute([$faculty_id]);
        if (!empty($profile_data['researchDetails'])) {
            $pdo->prepare("INSERT INTO faculty_research_details (faculty_id, research_details) VALUES (?, ?)")
                ->execute([$faculty_id, $profile_data['researchDetails']]);
        }
    }

    // Consultancy Projects
    if (isset($profile_data['consultancyProjects']) && is_array($profile_data['consultancyProjects'])) {
        $pdo->prepare("DELETE FROM faculty_consultancy_projects WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_consultancy_projects (faculty_id, title, funding_agency, amount, duration, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($profile_data['consultancyProjects'] as $r) {
            $stmt->execute([$faculty_id, $r['title'] ?? '', $r['fundingAgency'] ?? '', $r['amount'] ?? '', $r['duration'] ?? '', $r['role'] ?? '', $r['status'] ?? '']);
        }
    }

    // Funded Projects
    if (isset($profile_data['fundedProjects']) && is_array($profile_data['fundedProjects'])) {
        $pdo->prepare("DELETE FROM faculty_funded_projects WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_funded_projects (faculty_id, title, funding_agency, amount, duration, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
        foreach ($profile_data['fundedProjects'] as $r) {
            $stmt->execute([$faculty_id, $r['title'] ?? '', $r['fundingAgency'] ?? '', $r['amount'] ?? '', $r['duration'] ?? '', $r['role'] ?? '', $r['status'] ?? '']);
        }
    }

    // Patents
    if (isset($profile_data['patents']) && is_array($profile_data['patents'])) {
        $pdo->prepare("DELETE FROM faculty_patents WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_patents (faculty_id, title, patent_number, status, filing_date, grant_date) VALUES (?, ?, ?, ?, ?, ?)");
        foreach ($profile_data['patents'] as $r) {
            $stmt->execute([$faculty_id, $r['title'] ?? '', $r['patentNumber'] ?? '', $r['status'] ?? '', $r['filingDate'] ?? null, $r['grantDate'] ?? null]);
        }
    }

    // Books / Chapters
    if (isset($profile_data['booksChapters']) && is_array($profile_data['booksChapters'])) {
        $pdo->prepare("DELETE FROM faculty_books_chapters WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_books_chapters (faculty_id, title, publisher, isbn, year, authors) VALUES (?, ?, ?, ?, ?, ?)");
        foreach ($profile_data['booksChapters'] as $r) {
            $stmt->execute([$faculty_id, $r['title'] ?? '', $r['publisher'] ?? '', $r['isbn'] ?? '', $r['year'] ?? '', $r['authors'] ?? '']);
        }
    }

    // Awards
    if (isset($profile_data['awardsRecognition']) && is_array($profile_data['awardsRecognition'])) {
        $pdo->prepare("DELETE FROM faculty_awards WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_awards (faculty_id, award_name, organization, year, description) VALUES (?, ?, ?, ?, ?)");
        foreach ($profile_data['awardsRecognition'] as $r) {
            $stmt->execute([$faculty_id, $r['awardName'] ?? '', $r['organization'] ?? '', $r['year'] ?? '', $r['description'] ?? '']);
        }
    }

    // Industry Collaboration
    if (isset($profile_data['industryCollaboration']) && is_array($profile_data['industryCollaboration'])) {
        $pdo->prepare("DELETE FROM faculty_industry_collaboration WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_industry_collaboration (faculty_id, organization, type, duration, outcome) VALUES (?, ?, ?, ?, ?)");
        foreach ($profile_data['industryCollaboration'] as $r) {
            $stmt->execute([$faculty_id, $r['organization'] ?? '', $r['type'] ?? '', $r['duration'] ?? '', $r['outcome'] ?? '']);
        }
    }

    // Academic Exposure
    if (isset($profile_data['academicExposure']) && is_array($profile_data['academicExposure'])) {
        $pdo->prepare("DELETE FROM faculty_academic_exposure WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_academic_exposure (faculty_id, program, institution, country, year) VALUES (?, ?, ?, ?, ?)");
        foreach ($profile_data['academicExposure'] as $r) {
            $stmt->execute([$faculty_id, $r['program'] ?? '', $r['institution'] ?? '', $r['country'] ?? '', $r['year'] ?? '']);
        }
    }

    // Events Organised
    if (isset($profile_data['eventsOrganised']) && is_array($profile_data['eventsOrganised'])) {
        $pdo->prepare("DELETE FROM faculty_events_organised WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_events_organised (faculty_id, event_name, role, location, date) VALUES (?, ?, ?, ?, ?)");
        foreach ($profile_data['eventsOrganised'] as $r) {
            $stmt->execute([$faculty_id, $r['eventName'] ?? '', $r['role'] ?? '', $r['location'] ?? '', $r['date'] ?? null]);
        }
    }

    // Events Attended
    if (isset($profile_data['eventsAttended']) && is_array($profile_data['eventsAttended'])) {
        $pdo->prepare("DELETE FROM faculty_events_attended WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_events_attended (faculty_id, event_name, role, location, date) VALUES (?, ?, ?, ?, ?)");
        foreach ($profile_data['eventsAttended'] as $r) {
            $stmt->execute([$faculty_id, $r['eventName'] ?? '', $r['role'] ?? '', $r['location'] ?? '', $r['date'] ?? null]);
        }
    }

    // Professional Affiliations
    if (isset($profile_data['professionalAffiliations']) && is_array($profile_data['professionalAffiliations'])) {
        $pdo->prepare("DELETE FROM faculty_affiliations WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_affiliations (faculty_id, organization_name, membership_type, duration) VALUES (?, ?, ?, ?)");
        foreach ($profile_data['professionalAffiliations'] as $r) {
            $stmt->execute([$faculty_id, $r['organizationName'] ?? '', $r['membershipType'] ?? '', $r['duration'] ?? '']);
        }
    }

    // Invitations
    if (isset($profile_data['invitations']) && is_array($profile_data['invitations'])) {
        $pdo->prepare("DELETE FROM faculty_invitations WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_invitations (faculty_id, event_name, role, organization, date) VALUES (?, ?, ?, ?, ?)");
        foreach ($profile_data['invitations'] as $r) {
            $stmt->execute([$faculty_id, $r['eventName'] ?? '', $r['role'] ?? '', $r['organization'] ?? '', $r['date'] ?? null]);
        }
    }

    // Academic Visit
    if (isset($profile_data['academicVisit']) && is_array($profile_data['academicVisit'])) {
        $pdo->prepare("DELETE FROM faculty_academic_visit WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_academic_visit (faculty_id, institution, purpose, duration, outcome) VALUES (?, ?, ?, ?, ?)");
        foreach ($profile_data['academicVisit'] as $r) {
            $stmt->execute([$faculty_id, $r['institution'] ?? '', $r['purpose'] ?? '', $r['duration'] ?? '', $r['outcome'] ?? '']);
        }
    }

    // Outreach Activities
    if (isset($profile_data['outreachActivities']) && is_array($profile_data['outreachActivities'])) {
        $pdo->prepare("DELETE FROM faculty_outreach_activities WHERE faculty_id = ?")->execute([$faculty_id]);
        $stmt = $pdo->prepare("INSERT INTO faculty_outreach_activities (faculty_id, activity_name, description, location, date) VALUES (?, ?, ?, ?, ?)");
        foreach ($profile_data['outreachActivities'] as $r) {
            $stmt->execute([$faculty_id, $r['activityName'] ?? '', $r['description'] ?? '', $r['location'] ?? '', $r['date'] ?? null]);
        }
    }

    // Other Info
    if (isset($profile_data['otherInfo'])) {
        $pdo->prepare("DELETE FROM faculty_other_info WHERE faculty_id = ?")->execute([$faculty_id]);
        if (!empty($profile_data['otherInfo'])) {
            $pdo->prepare("INSERT INTO faculty_other_info (faculty_id, other_info) VALUES (?, ?)")
                ->execute([$faculty_id, $profile_data['otherInfo']]);
        }
    }
}
?>
