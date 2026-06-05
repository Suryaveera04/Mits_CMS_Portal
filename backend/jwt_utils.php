<?php
if (!defined('JWT_SECRET')) {
    define('JWT_SECRET', 'mits_cms_super_secret_key_12345!');
}

function base64UrlEncode($data) {
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
}

function base64UrlDecode($data) {
    $remainder = strlen($data) % 4;
    if ($remainder) {
        $padlen = 4 - $remainder;
        $data .= str_repeat('=', $padlen);
    }
    return base64_decode(str_replace(['-', '_'], ['+', '/'], $data));
}

function generateJWT($payload) {
    // Add default expiration (24 hours) if not set
    if (!isset($payload['exp'])) {
        $payload['exp'] = time() + (24 * 60 * 60);
    }
    
    $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
    $base64UrlHeader = base64UrlEncode($header);
    $base64UrlPayload = base64UrlEncode(json_encode($payload));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, JWT_SECRET, true);
    $base64UrlSignature = base64UrlEncode($signature);
    
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}

function verifyJWT($jwt) {
    $parts = explode('.', $jwt);
    if (count($parts) !== 3) {
        return false;
    }
    
    list($header, $payload, $signature) = $parts;
    $validSignature = base64UrlEncode(hash_hmac('sha256', $header . "." . $payload, JWT_SECRET, true));
    
    if (!hash_equals($signature, $validSignature)) {
        return false;
    }
    
    $decodedPayload = json_decode(base64UrlDecode($payload), true);
    
    // Check expiration
    if (isset($decodedPayload['exp']) && $decodedPayload['exp'] < time()) {
        return false;
    }
    
    return $decodedPayload;
}
?>
