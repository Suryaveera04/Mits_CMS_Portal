<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$data          = json_decode(file_get_contents('php://input'), true);
$submission_id = $data['id']         ?? '';
$status        = $data['status']     ?? '';
$comment       = $data['comment']    ?? '';
$reviewed_by   = $data['reviewedBy'] ?? '';

if (empty($submission_id) || empty($status)) {
    echo json_encode(['success' => false, 'message' => 'Submission ID and status required']);
    exit;
}

try {
    // Fetch the submission
    $stmt = $pdo->prepare("SELECT * FROM submissions WHERE id = ?");
    $stmt->execute([$submission_id]);
    $submission = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$submission) {
        echo json_encode(['success' => false, 'message' => 'Submission not found']);
        exit;
    }

    $faculty_id = $submission['user_id'];

    // Build updated comments array
    $comments = $submission['comments'] ? json_decode($submission['comments'], true) : [];
    if (!is_array($comments)) $comments = [$submission['comments']];
    if (!empty($comment)) $comments[] = $comment;

    $pdo->beginTransaction();

    // ── Update the submission record ─────────────────────────────────────────
    $pdo->prepare("
        UPDATE submissions
        SET status = ?, reviewed_by = ?, reviewed_date = NOW(), comments = ?, updated_at = NOW()
        WHERE id = ?
    ")->execute([$status, $reviewed_by, json_encode($comments), $submission_id]);

    // ── Handle Profile submissions ────────────────────────────────────────────
    if ($submission['type'] === 'Profile') {

        if ($status === 'Approved') {
            // 1. Read the pending snapshot from temp table
            $stmt = $pdo->prepare("SELECT profile_json FROM pending_profile_data WHERE faculty_id = ?");
            $stmt->execute([$faculty_id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($row) {
                $pendingProfile = json_decode($row['profile_json'], true);

                // 2. Apply basic info (name, designation, email, qualification) to faculty_login
                // NOTE: avatar is already stored as BLOB by upload_avatar.php at upload time
                // We only update the text fields here
                $basicInfo = $pendingProfile['_basic_info'] ?? [];
                if (!empty($basicInfo)) {
                    $pdo->prepare("
                        UPDATE faculty_login
                        SET faculty_name = ?, designation = ?, email = ?, qualification = ?
                        WHERE id = ?
                    ")->execute([
                        $basicInfo['name']          ?? null,
                        $basicInfo['designation']   ?? null,
                        $basicInfo['email']         ?? null,
                        $basicInfo['qualification'] ?? null,
                        $faculty_id
                    ]);
                }

                // 3. Write pending profile sections into main profile tables
                saveToMainTables($pdo, $faculty_id, $pendingProfile);

                // 4. Delete temp data — your idea ✅
                $pdo->prepare("DELETE FROM pending_profile_data WHERE faculty_id = ?")
                    ->execute([$faculty_id]);
            }

            // 4. Mark faculty profile as Approved
            $pdo->prepare("UPDATE faculty_login SET profile_status = 'Approved' WHERE id = ?")
                ->execute([$faculty_id]);

        } elseif ($status === 'Rejected') {
            // Just delete temp data — pending changes are discarded ✅
            $pdo->prepare("DELETE FROM pending_profile_data WHERE faculty_id = ?")
                ->execute([$faculty_id]);

            // Revert faculty status back to Draft so they can edit and resubmit
            $pdo->prepare("UPDATE faculty_login SET profile_status = 'Draft' WHERE id = ?")
                ->execute([$faculty_id]);
        }
    }

    $pdo->commit();

    // Return updated submission to frontend
    $stmt = $pdo->prepare("
        SELECT id, user_id as userId, title, type, status, department,
               submitted_by as submittedBy, submitted_date as date,
               reviewed_by as reviewedBy, reviewed_date as reviewedDate,
               change_description as changeDescription, comments,
               created_at as createdAt, updated_at as updatedAt
        FROM submissions WHERE id = ?
    ");
    $stmt->execute([$submission_id]);
    $updated = $stmt->fetch(PDO::FETCH_ASSOC);
    $updated['_id']      = $updated['id'];
    $updated['comments'] = json_decode($updated['comments'], true) ?: [];

    echo json_encode(['success' => true, 'submission' => $updated]);

} catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: write all profile sections to the main faculty_* tables
// (same function as in save_profile.php — keeps both files self-contained)
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
