<?php

define('BASE_URL', 'https://mits-cms.freedev.app/backend');

// Allowed Frontend Origins (production only)
$allowedOrigins = [
    'https://mits-cms.netlify.app',
    'https://mits-cms.freedev.app'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only set JSON content-type for API files
if (!defined('SKIP_JSON_HEADER')) {
    header('Content-Type: application/json');
}

/*
|--------------------------------------------------------------------------
| Database Configuration
|--------------------------------------------------------------------------
|
| Replace the values below with your InfinityFree credentials.
|
*/

$host     = 'sql205.infinityfree.com';
$dbname   = 'if0_42135264_mits_cms';
$username = 'if0_42135264';
$password = 'Suryamsv04';

try {

    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

} catch (PDOException $e) {

    echo json_encode([
        'success' => false,
        'message' => 'Connection failed: ' . $e->getMessage()
    ]);

    exit();
}
?>