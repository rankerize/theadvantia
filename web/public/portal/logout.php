<?php
// Cierre de sesión del portal (solo por POST desde el propio sitio).
declare(strict_types=1);
define('ADV_PORTAL', true);
require __DIR__ . '/_lib.php';

adv_security_headers();

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && adv_same_origin()) {
    adv_logout();
    header('Location: /acceso?e=salida', true, 303);
    exit;
}
header('Location: /aplicativos', true, 303);
exit;
