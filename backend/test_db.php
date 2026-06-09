<?php

require_once 'public_api/db.php';

echo json_encode([
    'success' => true,
    'message' => 'Database Connected'
]);