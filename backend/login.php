<?php
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

// Support both JSON body and form-urlencoded bodies
$rawBody = file_get_contents('php://input');
$rawBody = stripslashes($rawBody); // handle escaped JSON from some Windows clients/tools
$data = json_decode($rawBody, true);
if (!is_array($data)) $data = $_POST;

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';
$role     = $data['role']     ?? '';

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

require_once 'jwt_utils.php';

$stmt = $pdo->prepare("SELECT * FROM $table WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Migration-safe password verify: check both hashed (modern) and plain text (legacy)
if (!$user || ($user['password'] !== $password && !password_verify($password, $user['password']))) {
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    exit;
}

unset($user['password']);

$user['role'] = strtoupper($role);
$user['_id']  = $user['id'];

// Normalise the display name across all three tables
$user['name'] = $user['faculty_name'] ?? $user['name'] ?? $user['username'];

// Ensure department and department_id exists
$user['department'] = $user['department'] ?? null;
$user['department_id'] = $user['department_id'] ?? null;

// Replace raw BLOB with a URL — binary data cannot be JSON-encoded
$hasAvatar = !empty($user['avatar']);
unset($user['avatar']);
$user['avatar'] = $hasAvatar
    ? "http://localhost/backend/get_avatar.php?id={$user['id']}&role={$role}&t=" . time()
    : null;

// Generate JWT token
$tokenPayload = [
    'id'            => $user['id'],
    'username'      => $user['username'],
    'role'          => $user['role'],
    'department_id' => $user['department_id'],
    'department'    => $user['department']
];
$token = generateJWT($tokenPayload);

echo json_encode([
    'success' => true, 
    'user'    => $user,
    'token'   => $token
]);
?>
