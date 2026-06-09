<?php
require_once 'config.php';

// get_content_image.php — serves BLOB images from content tables
// Usage examples:
//   get_content_image.php?table=event_images&id=5
//   get_content_image.php?table=news&id=3&field=cover_image
//   get_content_image.php?table=trending&id=1&field=cover_image

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

$allowed = [
    'event_images' => ['data_col' => 'image_data', 'mime_col' => 'mime_type'],
    'mou_images'   => ['data_col' => 'image_data', 'mime_col' => 'mime_type'],
    'news_images'  => ['data_col' => 'image_data', 'mime_col' => 'mime_type'],
    'news'         => ['data_col' => 'cover_image', 'mime_col' => 'cover_mime'],
    'trending'     => ['data_col' => 'cover_image', 'mime_col' => 'cover_mime'],
];

$table = $_GET['table'] ?? '';
$id    = intval($_GET['id'] ?? 0);
$field = $_GET['field'] ?? null; // optional override for data column

if (!isset($allowed[$table]) || $id <= 0) {
    http_response_code(400);
    exit('Invalid request');
}

$dataCol = $field ?? $allowed[$table]['data_col'];
$mimeCol = $allowed[$table]['mime_col'];

$stmt = $pdo->prepare("SELECT `$dataCol`, `$mimeCol` FROM `$table` WHERE id = ?");
$stmt->execute([$id]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row || empty($row[$dataCol])) {
    http_response_code(404);
    exit('Image not found');
}

$mime = $row[$mimeCol] ?: 'image/jpeg';
header("Content-Type: $mime");
header('Cache-Control: public, max-age=86400');
echo $row[$dataCol];
?>
