<?php
// Portal de clientes ADVANTIA: sesión, cuentas y límite de intentos.
// Solo se carga desde login.php, gate.php y logout.php; .htaccess bloquea el acceso directo.
declare(strict_types=1);

if (!defined('ADV_PORTAL')) {
    http_response_code(404);
    exit;
}

const ADV_ORIGIN = 'https://theadvantia.com';
const ADV_SESSION = 'adv_portal';
const ADV_IDLE = 7200;          // la sesión se cierra tras 2 horas sin actividad
const ADV_ABSOLUTE = 43200;     // y como máximo a las 12 horas de iniciada
const ADV_WINDOW = 900;         // ventana para contar intentos fallidos (15 min)
const ADV_LOCK = 900;           // bloqueo tras superar el límite (15 min)
const ADV_MAX_ACCOUNT = 5;      // intentos fallidos por cuenta
const ADV_MAX_IP = 30;          // intentos fallidos por dirección IP
// Hash de una clave aleatoria: iguala el tiempo de respuesta cuando el correo no existe
const ADV_DUMMY_HASH = '$2y$12$Y3D5kK.GevBLRMtFuyVO0OEw/ix8aKo66WigIKWCD.dPVxRzQxPii';
const ADV_SLUG = '/^[a-z0-9-]{1,60}$/';

function adv_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.use_trans_sid', '0');
    session_name(ADV_SESSION);
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

/** Cuentas: correo => [name, plan, hash, active]. Generadas por scripts/portal-usuarios.mjs */
function adv_users(): array
{
    $users = require __DIR__ . '/_users.php';
    return is_array($users) ? $users : [];
}

/** Usuario con sesión válida, o null. Cierra la sesión vencida o de una cuenta desactivada. */
function adv_current_user(): ?array
{
    adv_session_start();
    $email = $_SESSION['email'] ?? null;
    if (!is_string($email) || $email === '') {
        return null;
    }
    $now = time();
    $last = (int)($_SESSION['last'] ?? 0);
    $created = (int)($_SESSION['created'] ?? 0);
    if ($now - $last > ADV_IDLE || $now - $created > ADV_ABSOLUTE) {
        adv_logout();
        return null;
    }
    $users = adv_users();
    $user = $users[$email] ?? null;
    if (!is_array($user) || empty($user['active'])) {
        adv_logout();
        return null;
    }
    $_SESSION['last'] = $now;
    return ['email' => $email, 'name' => (string)($user['name'] ?? ''), 'plan' => (string)($user['plan'] ?? '')];
}

function adv_logout(): void
{
    adv_session_start();
    $_SESSION = [];
    setcookie(ADV_SESSION, '', [
        'expires' => time() - 42000,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_destroy();
}

/** El formulario debe venir del propio sitio (protección CSRF por origen). */
function adv_same_origin(): bool
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        return $origin === ADV_ORIGIN;
    }
    $referer = $_SERVER['HTTP_REFERER'] ?? '';
    return $referer !== '' && strpos($referer, ADV_ORIGIN . '/') === 0;
}

/** Carpeta privada para los contadores de intentos, fuera de public_html (sobrevive a los despliegues). */
function adv_data_dir(): string
{
    $root = $_SERVER['DOCUMENT_ROOT'] ?? '';
    $dir = $root !== '' ? dirname(rtrim($root, '/')) . '/portal_data' : '';
    if ($dir !== '' && (is_dir($dir) || @mkdir($dir, 0700, true)) && is_writable($dir)) {
        return $dir;
    }
    return rtrim(sys_get_temp_dir(), '/\\');
}

function adv_rl_path(string $key): string
{
    return adv_data_dir() . '/adv_rl_' . hash('sha256', $key) . '.json';
}

function adv_rl_read(string $key): array
{
    $file = adv_rl_path($key);
    $data = is_file($file) ? json_decode((string)@file_get_contents($file), true) : null;
    if (!is_array($data)) {
        $data = [];
    }
    return ['first' => (int)($data['first'] ?? 0), 'count' => (int)($data['count'] ?? 0), 'locked' => (int)($data['locked'] ?? 0)];
}

function adv_rl_locked(string $key): bool
{
    return adv_rl_read($key)['locked'] > time();
}

function adv_rl_fail(string $key, int $max): void
{
    $now = time();
    $data = adv_rl_read($key);
    if ($now - $data['first'] > ADV_WINDOW) {
        $data = ['first' => $now, 'count' => 0, 'locked' => 0];
    }
    $data['count']++;
    if ($data['count'] >= $max) {
        $data['locked'] = $now + ADV_LOCK;
    }
    @file_put_contents(adv_rl_path($key), (string)json_encode($data), LOCK_EX);
}

function adv_rl_clear(string $key): void
{
    @unlink(adv_rl_path($key));
}

function adv_security_headers(): void
{
    header('Cache-Control: private, no-store');
    header('X-Robots-Tag: noindex, nofollow');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('X-Content-Type-Options: nosniff');
}
