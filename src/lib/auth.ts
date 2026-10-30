import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { ensureSeeded, execute, queryOne, verifyPassword } from './db';

export const SESSION_COOKIE = 'venly_session';
export const CSRF_COOKIE = 'venly_csrf';
const SESSION_DAYS = 7;

type Admin = { id: number; email: string };

function sha(value: string) { return crypto.createHash('sha256').update(value).digest('hex'); }

export async function login(email: string, password: string): Promise<{ token: string; csrf: string } | null> {
  await ensureSeeded();
  const row = await queryOne<{ id: number; email: string; password_hash: string }>(
    'SELECT id, email, password_hash FROM admins WHERE lower(email) = lower($1)',
    [email.trim()]
  );
  if (!row || !verifyPassword(password, row.password_hash)) return null;
  const token = crypto.randomBytes(32).toString('base64url');
  const csrf = crypto.randomBytes(24).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  await execute(
    'INSERT INTO sessions (token_hash, admin_id, expires_at, created_at) VALUES ($1,$2,$3,$4)',
    [sha(token), row.id, expires, new Date().toISOString()]
  );
  return { token, csrf };
}

export async function getAdmin(): Promise<Admin | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const row = await queryOne<{ id: number; email: string; expires_at: string }>(
      `SELECT a.id, a.email, s.expires_at FROM sessions s
       JOIN admins a ON a.id = s.admin_id WHERE s.token_hash = $1`,
      [sha(token)]
    );
    if (!row || new Date(row.expires_at).getTime() < Date.now()) return null;
    return { id: row.id, email: row.email };
  } catch { return null; }
}

export async function logout(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    try { await execute('DELETE FROM sessions WHERE token_hash = $1', [sha(token)]); } catch { /* sessão já inválida */ }
  }
}

export async function destroySessionByToken(token: string): Promise<void> {
  await execute('DELETE FROM sessions WHERE token_hash = $1', [sha(token)]);
}

/** CSRF double-submit: the JS client echoes the non-httpOnly cookie in a header. */
export function csrfValid(request: Request): boolean {
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/(?:^|;\s*)venly_csrf=([^;]+)/);
  const header = request.headers.get('x-csrf-token');
  if (!match || !header) return false;
  const a = Buffer.from(decodeURIComponent(match[1]));
  const b = Buffer.from(header);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Reject state-changing requests whose Origin clearly differs from the site host. */
export function originValid(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // non-browser clients (curl / server-to-server)
  try {
    const originHost = new URL(origin).hostname;
    const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').split(':')[0];
    if (!host) return false;
    if (host === originHost) return true;
    if (/localhost|127\.0\.0\.1/.test(host) && /localhost|127\.0\.0\.1/.test(originHost)) return true;
    if (host.endsWith('.e2b.app') && originHost.endsWith('.e2b.app')) return true;
    // Preview deployments da Vercel (ex.: venly-git-main-user.vercel.app).
    if (host.endsWith('.vercel.app') && originHost.endsWith('.vercel.app')) return true;
    return false;
  } catch { return false; }
}

// Secure cookies are enabled when the public site URL is HTTPS (produção).
// Keeping them off for local HTTP allows the project to be tested end-to-end.
const secureCookies = (process.env.NEXT_PUBLIC_SITE_URL || '').startsWith('https://');
export const cookieOptions = {
  httpOnly: true, sameSite: 'strict' as const, secure: secureCookies,
  path: '/', maxAge: SESSION_DAYS * 86_400,
};
export const csrfCookieOptions = {
  httpOnly: false, sameSite: 'strict' as const, secure: secureCookies,
  path: '/', maxAge: SESSION_DAYS * 86_400,
};
