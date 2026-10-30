#!/usr/bin/env node
/**
 * VENLY ESPORTS — migração do banco (PostgreSQL / Supabase)
 * -----------------------------------------------------------------------------
 * Uso:
 *   npm run db:migrate            aplica supabase/schema.sql (idempotente)
 *   npm run db:reset              APAGA todas as tabelas e recria do zero
 *
 * O que este script faz:
 *   1. Carrega .env.local / .env (fora da Vercel) ou usa as variáveis do ambiente.
 *   2. Aplica o schema (supabase/schema.sql).
 *   3. Cria o administrador inicial (ADMIN_EMAIL + ADMIN_PASSWORD).
 *   4. Cria os buckets do Supabase Storage usados pelos uploads.
 *
 * Os dados demonstrativos (mapas, produtos, textos) são inseridos pelo próprio
 * site no primeiro acesso, depois que as tabelas existem.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const reset = process.argv.includes('--reset');

// ---------------------------------------------------------------------------
// Ambiente (.env.local e .env) — não sobrescreve variáveis já definidas.
// ---------------------------------------------------------------------------
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (!match) continue;
    const key = match[1];
    if (process.env[key] !== undefined) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
loadEnvFile(path.join(root, '.env.local'));
loadEnvFile(path.join(root, '.env'));

const DATABASE_URL = (process.env.DIRECT_URL || process.env.DATABASE_URL || '').trim();
if (!DATABASE_URL) {
  console.error(`
[migração] DATABASE_URL não encontrada.

1) Copie o .env.example para .env.local:
     cp .env.example .env.local
2) No Supabase: Project Settings → Database → Connection string → URI
   cole em DATABASE_URL (use a porta 6543 / Transaction pooler para o site;
   para migrar, a 5432 / Session pooler também funciona).
3) Rode novamente: npm run db:migrate
`);
  process.exit(1);
}

const target = (() => {
  try {
    const url = new URL(DATABASE_URL);
    return `${url.hostname}:${url.port || '5432'}${url.pathname}`;
  } catch {
    return '(connection string inválida)';
  }
})();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

const DROP_SQL = `
drop table if exists rate_limits cascade;
drop table if exists consent_logs cascade;
drop table if exists contacts cascade;
drop table if exists members cascade;
drop table if exists orders cascade;
drop table if exists products cascade;
drop table if exists map_requests cascade;
drop table if exists maps cascade;
drop table if exists categories cascade;
drop table if exists settings cascade;
drop table if exists sessions cascade;
drop table if exists admins cascade;
`;

async function createBuckets() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) {
    console.log('[migração] Storage: Supabase não configurado — uploads usarão disco local (apenas desenvolvimento).');
    return;
  }
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const PUBLIC = (process.env.SUPABASE_STORAGE_BUCKET_PUBLIC || 'venly-public').trim();
  const PRIVATE = (process.env.SUPABASE_STORAGE_BUCKET_PRIVATE || 'venly-private').trim();

  const buckets = [
    { name: PUBLIC, public: true, label: 'imagens públicas (mapas, produtos, integrantes)' },
    { name: PRIVATE, public: false, label: 'anexos privados de orçamento' },
  ];

  for (const bucket of buckets) {
    const { error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
      fileSizeLimit: '5MB',
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
    });
    if (!error) {
      console.log(`[migração] Bucket criado: ${bucket.name} (${bucket.label})`);
    } else if (/already exists|Duplicate/i.test(error.message)) {
      console.log(`[migração] Bucket já existe: ${bucket.name}`);
    } else {
      console.warn(`[migração] Não foi possível criar o bucket "${bucket.name}": ${error.message}`);
      console.warn('            Crie manualmente em Supabase → Storage → New bucket (público para imagens, privado para anexos).');
    }
  }
}

async function main() {
  console.log(`[migração] Banco: ${target}`);
  console.log(`[migração] Modo: ${reset ? 'RESET (apaga tudo e recria)' : 'aplicar schema (idempotente)'}`);

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: /@(localhost|127\.0\.0\.1|::1)[:/]/.test(DATABASE_URL) || /sslmode=disable/i.test(DATABASE_URL)
      ? undefined
      : { rejectUnauthorized: false },
    connectionTimeoutMillis: 20_000,
    application_name: 'venly-migrate',
  });

  await client.connect();
  try {
    if (reset) {
      console.log('[migração] Removendo tabelas existentes…');
      await client.query(DROP_SQL);
    }

    const schema = fs.readFileSync(path.join(root, 'supabase', 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('[migração] Schema aplicado com sucesso.');

    // Administrador inicial -------------------------------------------------
    const { rows } = await client.query('select count(*)::int as n from admins');
    if (rows[0].n === 0) {
      const email = (process.env.ADMIN_EMAIL || 'admin@venly.local').trim();
      const generated = !process.env.ADMIN_PASSWORD;
      const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
      await client.query(
        'insert into admins (email, password_hash, created_at) values (lower($1), $2, $3) on conflict (email) do nothing',
        [email, hashPassword(password), new Date().toISOString()]
      );
      if (generated) {
        try {
          fs.mkdirSync(path.join(root, 'data'), { recursive: true });
          fs.writeFileSync(
            path.join(root, 'data', 'ADMIN_CREDENTIALS.txt'),
            `VENLY ESPORTS — credencial inicial do painel\nGerada em: ${new Date().toISOString()}\nE-mail: ${email}\nSenha: ${password}\n\nApague este arquivo e defina ADMIN_PASSWORD no ambiente em produção.\n`,
            { mode: 0o600 }
          );
        } catch { /* disco somente leitura */ }
        console.log(`\n[migração] Administrador criado: ${email}`);
        console.log(`[migração] Senha gerada: ${password}`);
        console.log('[migração] Guarde a senha e defina ADMIN_PASSWORD nas variáveis de ambiente.\n');
      } else {
        console.log(`[migração] Administrador criado: ${email} (senha definida em ADMIN_PASSWORD)`);
      }
    } else {
      console.log('[migração] Administrador já existe — mantido.');
    }

    // Contagem final --------------------------------------------------------
    const tables = ['admins', 'settings', 'categories', 'maps', 'products', 'members', 'map_requests', 'orders', 'contacts', 'consent_logs'];
    const counts = [];
    for (const table of tables) {
      const res = await client.query(`select count(*)::int as n from ${table}`);
      counts.push(`${table}=${res.rows[0].n}`);
    }
    console.log(`[migração] Registros: ${counts.join(', ')}`);
  } finally {
    await client.end();
  }

  await createBuckets();

  console.log(`
[migração] Concluído.

Próximos passos:
  • Local:  npm run dev   → http://localhost:3000  (dados demo criados no 1º acesso)
  • Vercel: faça o deploy e confira /api/health (deve retornar status "healthy")
`);
}

main().catch((error) => {
  console.error('\n[migração] Falhou:', error.message);
  if (/password authentication failed/i.test(error.message)) {
    console.error('           Confira usuário/senha na DATABASE_URL (Supabase → Project Settings → Database).');
  }
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(error.message)) {
    console.error('           Host inacessível: verifique host/porta e se o projeto Supabase está ativo.');
  }
  if (/self[- ]signed certificate/i.test(error.message)) {
    console.error('           Adicione ?sslmode=require ao final da DATABASE_URL.');
  }
  process.exit(1);
});
