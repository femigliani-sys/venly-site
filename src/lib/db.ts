import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Pool, type QueryResultRow } from 'pg';
import { DEFAULT_CONTENT } from './content';
import { CATEGORIES, DEMO_MAPS, DEMO_PRODUCTS, slugify } from './demo-data';
import type { SiteContent } from './types';

export { slugify };

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Erro de configuração/infraestrutura do banco. A mensagem é escrita para ser
 * útil tanto no log do servidor quanto na tela de erro (Vercel → Functions →
 * Logs) e sempre aponta o próximo passo.
 */
export class DatabaseUnavailableError extends Error {
  readonly setupHint: string;
  constructor(message: string, setupHint = 'Rode `npm run db:migrate` e confira DATABASE_URL no .env.local (ou nas Environment Variables da Vercel).') {
    super(message);
    this.name = 'DatabaseUnavailableError';
    this.setupHint = setupHint;
  }
}

const CONNECTION_KEYS = ['DATABASE_URL', 'POSTGRES_URL', 'SUPABASE_DB_URL'] as const;

function rawConnectionString(): string | null {
  for (const key of CONNECTION_KEYS) {
    const value = process.env[key];
    if (value && value.trim()) return value.trim();
  }
  return null;
}

export function databaseConfigured(): boolean {
  return Boolean(rawConnectionString());
}

type GlobalWithPool = {
  __venlyPool?: Pool;
  __venlySeed?: Promise<void>;
};
const g = globalThis as unknown as GlobalWithPool;

export function getPool(): Pool {
  if (g.__venlyPool) return g.__venlyPool;
  const connectionString = rawConnectionString();
  if (!connectionString) {
    throw new DatabaseUnavailableError(
      'DATABASE_URL não configurada: o site não tem onde ler/gravar dados.',
      'Defina DATABASE_URL (connection string do Supabase) no .env.local e na Vercel → Settings → Environment Variables.'
    );
  }

  const isLocal = /@(localhost|127\.0\.0\.1|::1|host\.docker\.internal)[:/]/.test(connectionString);
  const hasSslMode = /[?&]sslmode=/i.test(connectionString);

  const pool = new Pool({
    connectionString,
    // Supabase (Supavisor) e serverless: poucas conexões por instância.
    max: Number(process.env.PG_POOL_MAX || (process.env.VERCEL ? 3 : 10)),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
    allowExitOnIdle: Boolean(process.env.VERCEL),
    // Em hosts remotos sem sslmode explícito, o Supabase exige TLS.
    ssl: isLocal || hasSslMode ? undefined : { rejectUnauthorized: false },
    application_name: 'venly-esports',
  });

  pool.on('error', (error) => {
    console.error('[venly/db] erro inesperado na conexão:', error.message);
  });

  g.__venlyPool = pool;
  return pool;
}

type PgError = { code?: string; message?: string };

/** Traduz erros técnicos do Postgres em mensagens acionáveis. */
function friendly(error: unknown): Error {
  const err = error as PgError;
  const code = err?.code || '';
  if (code === '42P01') {
    return new DatabaseUnavailableError(
      'As tabelas do banco ainda não existem (schema não aplicado).',
      'Rode `npm run db:migrate` apontando para o DATABASE_URL do Supabase. Alternativa: cole o conteúdo de supabase/schema.sql no SQL Editor do Supabase.'
    );
  }
  if (code === '3D000') {
    return new DatabaseUnavailableError('O banco informado em DATABASE_URL não existe.', 'No Supabase, use a connection string do projeto (Project Settings → Database).');
  }
  if (code === '28P01' || code === '28000') {
    return new DatabaseUnavailableError('Usuário ou senha do banco recusados.', 'Confira a senha em DATABASE_URL (Project Settings → Database → Reset password).');
  }
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EHOSTUNREACH', 'EAI_AGAIN'].includes(code)) {
    return new DatabaseUnavailableError('Não foi possível conectar ao Postgres/Supabase.', 'Verifique a host/porta em DATABASE_URL e se o projeto Supabase está ativo.');
  }
  return error instanceof Error ? error : new Error(String(error));
}

export async function query<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  try {
    const result = await getPool().query<T>(sql, params);
    return result.rows;
  } catch (error) {
    throw friendly(error);
  }
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: unknown[] = []): Promise<number> {
  try {
    const result = await getPool().query(sql, params);
    return result.rowCount ?? 0;
  } catch (error) {
    throw friendly(error);
  }
}

// ---------------------------------------------------------------------------
// Senhas
// ---------------------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split(':');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const candidate = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(hash, 'hex');
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Dados iniciais (idempotente — pode rodar em várias instâncias ao mesmo tempo)
// ---------------------------------------------------------------------------
async function seed(): Promise<void> {
  const now = new Date().toISOString();

  // Admin: criado a partir de ADMIN_EMAIL/ADMIN_PASSWORD ou com senha aleatória.
  const admins = await queryOne<{ n: number }>('SELECT COUNT(*)::int AS n FROM admins');
  if (!admins || admins.n === 0) {
    const email = (process.env.ADMIN_EMAIL || 'admin@venly.local').trim();
    const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
    await execute(
      'INSERT INTO admins (email, password_hash, created_at) VALUES (lower($1), $2, $3) ON CONFLICT (email) DO NOTHING',
      [email, hashPassword(password), now]
    );
    if (!process.env.ADMIN_PASSWORD) {
      const text = `VENLY ESPORTS — credencial inicial do painel\nGerada em: ${now}\nE-mail: ${email}\nSenha: ${password}\n\nApague este arquivo e defina ADMIN_PASSWORD no ambiente em produção.\n`;
      console.warn(`[venly] ADMIN_PASSWORD não definida. Credencial inicial do admin: ${email} / ${password}`);
      console.warn('[venly] Defina ADMIN_PASSWORD nas variáveis de ambiente e troque a senha no painel.');
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(path.join(DATA_DIR, 'ADMIN_CREDENTIALS.txt'), text, { mode: 0o600 });
      } catch {
        // Em produção serverless o disco pode ser somente leitura — o log acima é a fonte.
      }
    }
  }

  // Conteúdo institucional padrão (editável no painel).
  await execute(
    `INSERT INTO settings (key, value, updated_at) VALUES ('content', $1, $2)
     ON CONFLICT (key) DO NOTHING`,
    [JSON.stringify(DEFAULT_CONTENT), now]
  );

  // Categorias iniciais.
  for (const [index, [type, name]] of CATEGORIES.entries()) {
    await execute(
      `INSERT INTO categories (type, name, slug, sort_order) VALUES ($1, $2, $3, $4)
       ON CONFLICT (type, slug) DO NOTHING`,
      [type, name, slugify(name), index]
    );
  }

  // Mapas demonstrativos (somente se não houver nenhum).
  const maps = await queryOne<{ n: number }>('SELECT COUNT(*)::int AS n FROM maps');
  if (maps && maps.n === 0) {
    for (const [index, map] of DEMO_MAPS.entries()) {
      await execute(
        `INSERT INTO maps
          (slug, title, category, summary, description, status, cover, gallery, video_url, featured, is_demo, sort_order, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'',$9,1,$10,$11,$11)
         ON CONFLICT (slug) DO NOTHING`,
        [map.slug, map.title, map.category, map.summary, map.description, map.status, map.cover,
          JSON.stringify(map.gallery), map.featured, index, now]
      );
    }
  }

  // Produtos demonstrativos (somente se não houver nenhum).
  const products = await queryOne<{ n: number }>('SELECT COUNT(*)::int AS n FROM products');
  if (products && products.n === 0) {
    for (const [index, product] of DEMO_PRODUCTS.entries()) {
      await execute(
        `INSERT INTO products
          (slug, name, description, price_cents, category, images, sizes, stock, active, featured, is_demo, sort_order, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,1,$9,1,$10,$11,$11)
         ON CONFLICT (slug) DO NOTHING`,
        [product.slug, product.name, product.description, product.price_cents, product.category,
          JSON.stringify([product.image]), JSON.stringify(product.sizes), product.stock,
          index < 3 ? 1 : 0, index, now]
      );
    }
  }

  // Limpeza de sessões expiradas.
  await execute('DELETE FROM sessions WHERE expires_at < $1', [now]);
}

/** Garante (uma única vez por processo) que o conteúdo inicial existe. */
export async function ensureSeeded(): Promise<void> {
  if (!g.__venlySeed) {
    g.__venlySeed = seed().catch((error) => {
      g.__venlySeed = undefined;
      throw error;
    });
  }
  return g.__venlySeed;
}

/** Verificação usada pelo /api/health — não dispara seed. */
export async function databaseStatus(): Promise<{ ok: boolean; error?: string; hint?: string }> {
  if (!databaseConfigured()) {
    return { ok: false, error: 'DATABASE_URL ausente', hint: 'Configure a connection string do Supabase.' };
  }
  try {
    await query('SELECT 1 FROM settings LIMIT 1');
    return { ok: true };
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return { ok: false, error: error.message, hint: error.setupHint };
    return { ok: false, error: error instanceof Error ? error.message : 'erro desconhecido' };
  }
}

// ---------------------------------------------------------------------------
// Conteúdo institucional editável (tabela settings, JSON)
// ---------------------------------------------------------------------------
function deepMerge<T>(base: T, patch: unknown): T {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch as Record<string, unknown>)) {
    const current = out[key];
    if (value && typeof value === 'object' && !Array.isArray(value) && current && typeof current === 'object' && !Array.isArray(current)) {
      out[key] = deepMerge(current, value);
    } else if (value !== undefined) {
      out[key] = value;
    }
  }
  return out as T;
}

export async function getContent(): Promise<SiteContent> {
  await ensureSeeded();
  const row = await queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'content'");
  if (!row) return DEFAULT_CONTENT;
  try {
    return deepMerge(DEFAULT_CONTENT, JSON.parse(row.value));
  } catch {
    return DEFAULT_CONTENT;
  }
}

export async function setContent(content: SiteContent): Promise<void> {
  await execute(
    `INSERT INTO settings (key, value, updated_at) VALUES ('content', $1, $2)
     ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [JSON.stringify(content), new Date().toISOString()]
  );
}

/** Atualização parcial vinda do painel — preserva campos padrão que não vieram. */
export async function patchContent(patch: unknown): Promise<SiteContent> {
  const merged = deepMerge(await getContent(), patch);
  await setContent(merged);
  return merged;
}
