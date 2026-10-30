#!/usr/bin/env node
/**
 * VENLY ESPORTS — redefine a senha do administrador
 * Uso:
 *   ADMIN_EMAIL=admin@venly.local ADMIN_PASSWORD=nova-senha-forte npm run admin:password
 *
 * Lê .env.local / .env e usa DATABASE_URL. Útil quando você esqueceu a senha
 * ou quando a Vercel não tinha ADMIN_PASSWORD na primeira inicialização.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Client } from 'pg';

const root = process.cwd();

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const rawLine of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
}
loadEnvFile(path.join(root, '.env.local'));
loadEnvFile(path.join(root, '.env'));

const url = (process.env.DIRECT_URL || process.env.DATABASE_URL || '').trim();
const email = (process.env.ADMIN_EMAIL || 'admin@venly.local').trim();
const password = (process.env.ADMIN_PASSWORD || '').trim();

if (!url) {
  console.error('[admin] DATABASE_URL não configurada. Veja o README → "Chaves que você precisa configurar".');
  process.exit(1);
}
if (password.length < 10) {
  console.error('[admin] Defina ADMIN_PASSWORD com 10+ caracteres. Exemplo:');
  console.error('        ADMIN_PASSWORD="minha-senha-forte" npm run admin:password');
  process.exit(1);
}

function hashPassword(value) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(value, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

const client = new Client({
  connectionString: url,
  ssl: /@(localhost|127\.0\.0\.1|::1)[:/]/.test(url) || /sslmode=disable/i.test(url) ? undefined : { rejectUnauthorized: false },
});
await client.connect();
try {
  const hash = hashPassword(password);
  let result = await client.query('update admins set password_hash = $1 where lower(email) = lower($2)', [hash, email]);
  if (result.rowCount === 0) {
    result = await client.query(
      'insert into admins (email, password_hash, created_at) values (lower($1), $2, $3) on conflict (email) do update set password_hash = excluded.password_hash',
      [email, hash, new Date().toISOString()]
    );
    console.log(`[admin] Administrador criado/atualizado: ${email}`);
  } else {
    console.log(`[admin] Senha atualizada para: ${email}`);
  }
  // Invalida sessões antigas por segurança.
  await client.query('delete from sessions');
  console.log('[admin] Sessões ativas encerradas. Faça login novamente em /admin.');
} finally {
  await client.end();
}
