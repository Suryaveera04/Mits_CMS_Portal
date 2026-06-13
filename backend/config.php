<?php

// Dynamically detect BASE_URL so avatar URLs are never hardcoded to localhost
$_protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$_host     = $_SERVER['HTTP_HOST'] ?? 'localhost';
define('BASE_URL', $_protocol . '://' . $_host . '/backend');

/*
|--------------------------------------------------------------------------
| CORS Configuration
|--------------------------------------------------------------------------
*/

$allowedOrigins = [
    'https://mits-cms-portal.netlify.app',
    'https://mits-cms.freedev.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    // Same-origin requests have no Origin header — allow them
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

/*
|--------------------------------------------------------------------------
| JSON Response Header
|--------------------------------------------------------------------------
*/

if (!defined('SKIP_JSON_HEADER')) {
    header('Content-Type: application/json; charset=utf-8');
}

/*
|--------------------------------------------------------------------------
| Database Configuration
|--------------------------------------------------------------------------
*/

$host     = 'sql205.infinityfree.com';
$dbname   = 'if0_42135264_mits_cms';
$username = 'if0_42135264';
$password = 'Suryamsv04';

/*
|--------------------------------------------------------------------------
| PDO Connection
|--------------------------------------------------------------------------
*/

try {

    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

} catch (PDOException $e) {

    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);

    exit();
}