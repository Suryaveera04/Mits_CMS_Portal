<?php
require_once 'config.php';
require_once 'jwt_utils.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);
if (!is_array($data)) $data = $_POST;

$username = trim($data['username'] ?? '');
$password = $data['password'] ?? '';
$role     = strtolower($data['role'] ?? '');

if (empty($username) || empty($password) || empty($role)) {
    echo json_encode(['success' => false, 'message' => 'All fields required']);
    exit;
}

switch ($role) {
    case 'admin':   $table = 'admin_login';   break;
    case 'hod':     $table = 'hod_login';     break;
    case 'faculty': $table = 'faculty_login'; break;
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid role']);
        exit;
}

$stmt = $pdo->prepare("SELECT * FROM $table WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || ($user['password'] !== $password && !password_verify($password, $user['password']))) {
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    exit;
}

unset($user['password']);

$user['role'] = strtoupper($role);
$user['_id']  = $user['id'];
$user['name'] = $user['faculty_name'] ?? $user['name'] ?? $user['username'];
$user['department']    = $user['department']    ?? null;
$user['department_id'] = $user['department_id'] ?? null;

$hasAvatar = !empty($user['avatar']);
unset($user['avatar']);
$user['avatar'] = $hasAvatar
    ? BASE_URL . "/get_avatar.php?id={$user['id']}&role={$role}&t=" . time()
    : null;

$token = generateJWT([
    'id'            => $user['id'],
    'username'      => $user['username'],
    'role'          => $user['role'],
    'department_id' => $user['department_id'],
    'department'    => $user['department']
]);

echo json_encode(['success' => true, 'user' => $user, 'token' => $token]);
?>
