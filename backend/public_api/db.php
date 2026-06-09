<?php

$host     = 'sql205.infinityfree.com';
$dbname   = 'if0_42135264_mits_cms'; // Replace XXX with your actual DB name
$username = 'if0_42135264';
$password = 'Suryamsv04'; // Replace with your actual password

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'DB connection failed',
        'error' => $e->getMessage()
    ]);
    exit;
}

// Map college-website dept key → CMS department code
function cmsCodeFromKey(string $key): ?string {
    $map = [
        'cse'   => 'CSE',
        'ce'    => 'CIVIL',
        'eee'   => 'EEE',
        'me'    => 'MECH',
        'ece'   => 'ECE',
        'ai'    => 'AI',
        'aiml'  => 'AIML',
        'cseds' => 'DS',
        'csecs' => 'CS',
    ];

    return $map[strtolower($key)] ?? null;
}

// Returns the department_id from the departments table for a given CMS code
function getDeptId(PDO $pdo, string $cmsCode): ?int {
    $stmt = $pdo->prepare(
        "SELECT id FROM departments WHERE code = ? LIMIT 1"
    );

    $stmt->execute([$cmsCode]);

    $id = $stmt->fetchColumn();

    return $id !== false ? (int)$id : null;
}