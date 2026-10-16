<?php
// Inicio de sesión del portal de clientes. Recibe el formulario de /acceso.
declare(strict_types=1);
define('ADV_PORTAL', true);
require __DIR__ . '/_lib.php';

adv_security_headers();

function adv_back(string $code, string $next): void
{
    $query = '?e=' . $code . ($next !== '' ? '&next=' . rawurlencode($next) : '');
    header('Location: /acceso' . $query, true, 303);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Location: /acceso', true, 303);
    exit;
}

$next = (string)($_POST['next'] ?? '');
if (!preg_match(ADV_SLUG, $next)) {
    $next = '';
}
if (!adv_same_origin()) {
    adv_back('origen', $next);
}
// Campo trampa: las personas no lo ven; los robots lo llenan
if ((string)($_POST['empresa_web'] ?? '') !== '') {
    adv_back('credenciales', $next);
}

$email = strtolower(trim((string)($_POST['email'] ?? '')));
$password = (string)($_POST['password'] ?? '');
if ($email === '' || $password === '' || strlen($email) > 254 || strlen($password) > 200) {
    adv_back('credenciales', $next);
}

$ipKey = 'ip|' . ($_SERVER['REMOTE_ADDR'] ?? '');
$accountKey = 'cuenta|' . $email;
if (adv_rl_locked($ipKey) || adv_rl_locked($accountKey)) {
    adv_back('bloqueado', $next);
}

$users = adv_users();
$user = $users[$email] ?? null;
$hash = (is_array($user) && isset($user['hash'])) ? (string)$user['hash'] : ADV_DUMMY_HASH;
$valid = password_verify($password, $hash) && is_array($user) && !empty($user['active']);

if (!$valid) {
    usleep(300000);
    adv_rl_fail($ipKey, ADV_MAX_IP);
    adv_rl_fail($accountKey, ADV_MAX_ACCOUNT);
    adv_back('credenciales', $next);
}

adv_rl_clear($accountKey);
adv_session_start();
session_regenerate_id(true);
$now = time();
$_SESSION = ['email' => $email, 'created' => $now, 'last' => $now];

header('Location: /' . ($next !== '' ? $next : 'aplicativos'), true, 303);
exit;
