<?php
// Control de acceso a las páginas del portal. El .htaccess envía aquí toda URL limpia que no
// sea una página pública; las páginas del portal viven en /_portal (bloqueada por HTTP).
declare(strict_types=1);
define('ADV_PORTAL', true);
require __DIR__ . '/_lib.php';

$slug = (string)($_GET['p'] ?? '');
$file = __DIR__ . '/../_portal/' . $slug . '.html';

if (!preg_match(ADV_SLUG, $slug) || !is_file($file)) {
    http_response_code(404);
    header('Content-Type: text/html; charset=UTF-8');
    readfile(__DIR__ . '/../404.html');
    exit;
}

adv_security_headers();
$hadSession = isset($_COOKIE[ADV_SESSION]);
$user = adv_current_user();

if ($user === null) {
    header('Location: /acceso?next=' . rawurlencode($slug) . ($hadSession ? '&e=sesion' : ''), true, 302);
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
$html = (string)file_get_contents($file);
echo str_replace('%%PORTAL_USER%%', htmlspecialchars($user['name'], ENT_QUOTES, 'UTF-8'), $html);
