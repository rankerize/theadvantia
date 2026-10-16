#!/usr/bin/env node
// Cuentas del portal de clientes ADVANTIA.
//
// La fuente es portal-usuarios.json (solo hashes bcrypt, nunca claves). Cada cambio regenera
// public/portal/_users.php, que es lo que lee el servidor. Después: commit y desplegar.
//
//   node scripts/portal-usuarios.mjs agregar <correo> "<Nombre o empresa>" "<Plan>"
//   node scripts/portal-usuarios.mjs clave <correo>          (nueva clave)
//   node scripts/portal-usuarios.mjs desactivar <correo>     (corta el acceso al instante)
//   node scripts/portal-usuarios.mjs activar <correo>
//   node scripts/portal-usuarios.mjs listar
//
// La clave se muestra una sola vez en la terminal: entrégala al cliente por un canal privado.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomInt } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import bcrypt from 'bcryptjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DB = join(ROOT, 'portal-usuarios.json');
const PHP = join(ROOT, 'public', 'portal', '_users.php');
const PLANES = ['Esencial', 'Crecimiento', 'Catálogo', 'Enterprise', 'Equipo ADVANTIA'];

const load = () => (existsSync(DB) ? JSON.parse(readFileSync(DB, 'utf8')) : {});
const today = () => new Date().toISOString().slice(0, 10);

// Clave legible de 16 caracteres, sin caracteres ambiguos (0/O, 1/l/I)
function newPassword() {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 16; i++) out += abc[randomInt(abc.length)];
  return out.replace(/(.{4})(?!$)/g, '$1-');
}

// bcryptjs genera $2a$/$2b$; PHP los verifica igual con el prefijo $2y$
const hash = (pw) => bcrypt.hashSync(pw, 12).replace(/^\$2[ab]\$/, '$2y$');

const phpString = (s) => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

function save(db) {
  const sorted = Object.fromEntries(Object.entries(db).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(DB, JSON.stringify(sorted, null, 2) + '\n');
  const rows = Object.entries(sorted).map(([email, u]) =>
    `    ${phpString(email)} => ['name' => ${phpString(u.name)}, 'plan' => ${phpString(u.plan)}, ` +
    `'hash' => ${phpString(u.hash)}, 'active' => ${u.active ? 'true' : 'false'}],`);
  writeFileSync(PHP, [
    '<?php',
    '// Cuentas del portal de clientes. GENERADO por scripts/portal-usuarios.mjs: no editar a mano.',
    '// Solo contiene hashes bcrypt. .htaccess bloquea el acceso directo a este archivo.',
    "if (!defined('ADV_PORTAL')) {",
    '    http_response_code(404);',
    '    exit;',
    '}',
    'return [',
    ...rows,
    '];',
    '',
  ].join('\n'));
}

function need(db, email) {
  if (!db[email]) { console.error(`No existe la cuenta ${email}. Usa: listar`); process.exit(1); }
}

const [cmd, rawEmail, name, plan] = process.argv.slice(2);
const email = (rawEmail || '').trim().toLowerCase();
const db = load();

switch (cmd) {
  case 'agregar': {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name || !plan) {
      console.error('Uso: agregar <correo> "<Nombre o empresa>" "<Plan>"'); process.exit(1);
    }
    if (!PLANES.includes(plan)) { console.error(`Plan no válido. Usa uno de: ${PLANES.join(', ')}`); process.exit(1); }
    if (db[email]) { console.error(`La cuenta ${email} ya existe. Para otra clave usa: clave ${email}`); process.exit(1); }
    const pw = newPassword();
    db[email] = { name, plan, hash: hash(pw), active: true, created: today() };
    save(db);
    console.log(`Cuenta creada: ${email} (${plan})\nClave (se muestra solo esta vez): ${pw}`);
    break;
  }
  case 'clave': {
    need(db, email);
    const pw = newPassword();
    db[email].hash = hash(pw);
    db[email].updated = today();
    save(db);
    console.log(`Nueva clave para ${email} (se muestra solo esta vez): ${pw}`);
    break;
  }
  case 'desactivar':
  case 'activar': {
    need(db, email);
    db[email].active = cmd === 'activar';
    db[email].updated = today();
    save(db);
    console.log(`${email}: ${cmd === 'activar' ? 'activa' : 'desactivada'}`);
    break;
  }
  case 'listar': {
    const rows = Object.entries(db);
    if (!rows.length) console.log('Sin cuentas.');
    for (const [e, u] of rows) console.log(`${u.active ? 'activa     ' : 'desactivada'}  ${e}  ·  ${u.name}  ·  ${u.plan}  ·  desde ${u.created}`);
    break;
  }
  default:
    console.log('Comandos: agregar, clave, desactivar, activar, listar. Ver el encabezado de este archivo.');
}
