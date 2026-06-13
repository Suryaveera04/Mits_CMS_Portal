<?php
require_once 'jwt_utils.php';

// Allow preflight options request
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function getBearerToken() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_change_key_case($requestHeaders, CASE_LOWER);
        if (isset($requestHeaders['authorization'])) {
            $headers = trim($requestHeaders['authorization']);
        }
    }
    
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

function authenticate() {
    $token = getBearerToken();
    if (!$token) {
        return null;
    }
    return verifyJWT($token);
}

function requireAuth() {
    $user = authenticate();
    if (!$user) {
        header('HTTP/1.0 401 Unauthorized');
        echo json_encode(['success' => false, 'message' => 'Unauthorized access. Invalid or missing token.']);
        exit;
    }
    return $user;
}

function requireRole($allowedRoles) {
    $user = requireAuth();
    $role = strtoupper($user['role'] ?? '');

    if (is_array($allowedRoles)) {
        $allowedRoles = array_map('strtoupper', $allowedRoles);
        if (!in_array($role, $allowedRoles)) {
            header('HTTP/1.0 403 Forbidden');
            echo json_encode(['success' => false, 'message' => 'Forbidden. Insufficient permissions.']);
            exit;
        }
    } else {
        if ($role !== strtoupper($allowedRoles)) {
            header('HTTP/1.0 403 Forbidden');
            echo json_encode(['success' => false, 'message' => 'Forbidden. Insufficient permissions.']);
            exit;
        }
    }
    return $user;
}

/**
 * VALIDATION: Ensures department_id was properly assigned and is valid.
 * Call this after enforceDepartmentOwnershipOnSave() in every save endpoint.
 * Prevents silent data corruption from NULL department_id values.
 */
function validateDepartmentOwnership($department_id, $submitted_by) {
    // Both must be valid positive integers
    $dept_id = intval($department_id);
    $user_id = intval($submitted_by);

    if ($dept_id <= 0) {
        header('HTTP/1.0 500 Internal Server Error');
        echo json_encode(['success' => false, 'message' => 'CRITICAL: Record not assigned to valid department. Aborting save.']);
        exit;
    }

    if ($user_id <= 0) {
        header('HTTP/1.0 500 Internal Server Error');
        echo json_encode(['success' => false, 'message' => 'CRITICAL: Record not attributed to valid user. Aborting save.']);
        exit;
    }

    return true;
}

/**
 * Resolves the department filtering query parameters securely.
 * For HOD/Faculty: isolates to their own department using department_id.
 * For Admin: resolves based on $_GET['department'] query string to department_id.
 * CRITICAL FIX: Uses department_id (INT FK) not department (VARCHAR)
 */
function getDepartmentFilterForFetch($pdo, &$where, &$params, $tableAlias = '') {
    $user   = authenticate(); // null if not logged in
    $prefix = $tableAlias ? $tableAlias . '.' : '';
    $role   = strtoupper($user['role'] ?? '');

    if ($user && in_array($role, ['HOD', 'FACULTY'])) {
        // Logged-in HOD/Faculty: always restrict to their own department only
        $where[]  = "{$prefix}department_id = ?";
        $params[] = intval($user['department_id']);
    } elseif ($user && $role === 'ADMIN') {
        // Admin: optionally filter by ?department= query param
        $dept = $_GET['department'] ?? null;
        if ($dept) {
            $where[]  = "{$prefix}department_id = (SELECT id FROM departments WHERE code = ? LIMIT 1)";
            $params[] = $dept;
        }
    }
    // No token (public visitor): no department filter applied — all content visible
}

/**
 * Enforces department ownership on save/update operations.
 * CRITICAL: Automatically binds record to authenticated user's department.
 * Does NOT trust frontend-provided department_id values.
 *
 * For HOD/Faculty: FORCES own department_id (cannot be overridden)
 * For Admin: Resolves department_id from input department code
 *
 * Validates that department_id is NEVER NULL for department-owned content.
 */
function enforceDepartmentOwnershipOnSave($pdo, &$department, &$department_id, &$submitted_by) {
    $user = requireAuth();

    // Validate user has department_id
    if (empty($user['department_id']) || !is_numeric($user['department_id'])) {
        header('HTTP/1.0 403 Forbidden');
        echo json_encode(['success' => false, 'message' => 'User account not properly configured with department. Contact administrator.']);
        exit;
    }

    if (in_array(strtoupper($user['role'] ?? ''), ['HOD', 'FACULTY'])) {
        // FORCE user's own department - CANNOT be overridden by frontend
        $department = $user['department'] ?? 'UNKNOWN';
        $department_id = intval($user['department_id']);
        $submitted_by = intval($user['id']);

        // CRITICAL VALIDATION: Ensure department_id is valid
        if ($department_id <= 0) {
            header('HTTP/1.0 500 Internal Server Error');
            echo json_encode(['success' => false, 'message' => 'Invalid department context in user session']);
            exit;
        }
    } else {
        // Admin: Can create for any department (but must specify)
        if (empty($department)) {
            header('HTTP/1.0 400 Bad Request');
            echo json_encode(['success' => false, 'message' => 'Admin users must specify department code']);
            exit;
        }

        $stmt = $pdo->prepare("SELECT id FROM departments WHERE code = ? LIMIT 1");
        $stmt->execute([$department]);
        $result = $stmt->fetchColumn();

        if (!$result) {
            header('HTTP/1.0 400 Bad Request');
            echo json_encode(['success' => false, 'message' => 'Invalid department code specified']);
            exit;
        }

        $department_id = intval($result);
        $submitted_by = intval($user['id']);
    }

    // FINAL VALIDATION: department_id must be valid
    if ($department_id <= 0) {
        header('HTTP/1.0 500 Internal Server Error');
        echo json_encode(['success' => false, 'message' => 'Failed to assign valid department to record']);
        exit;
    }
}
?>
