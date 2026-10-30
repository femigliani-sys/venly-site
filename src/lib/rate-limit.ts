import 'server-only';
import crypto from 'node:crypto';
import { query, queryOne } from './db';

const SECRET = process.env.AUTH_SECRET || 'venly-local-secret';

/** Hash of client IP + purpose. We never persist the raw IP address. */
export function clientKey(request: Request, purpose: string): string {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  const ip = forwarded.split(',')[0].trim() || request.headers.get('x-real-ip') || 'unknown';
  return crypto.createHash('sha256').update(`${SECRET}:${ip}:${purpose}`).digest('hex').slice(0, 40);
}

/**
 * Janela deslizante em uma única instrução (atômica no Postgres):
 * se a janela expirou, reinicia a contagem; senão incrementa.
 * Retorna false quando o limite foi atingido.
 */
export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = Date.now();
  const row = await queryOne<{ count: number }>(
    `INSERT INTO rate_limits (key, count, window_start) VALUES ($1, 1, $2)
     ON CONFLICT (key) DO UPDATE SET
       count = CASE WHEN EXCLUDED.window_start - rate_limits.window_start > $3 THEN 1 ELSE rate_limits.count + 1 END,
       window_start = CASE WHEN EXCLUDED.window_start - rate_limits.window_start > $3 THEN EXCLUDED.window_start ELSE rate_limits.window_start END
     RETURNING count::int AS count`,
    [key, now, windowMs]
  );

  // Limpeza oportunista de registros antigos (~3% das chamadas).
  if (Math.random() < 0.03) {
    void query('DELETE FROM rate_limits WHERE window_start < $1', [now - 86_400_000]).catch(() => {});
  }

  if (!row) return true;
  return row.count <= limit;
}

/** Honeypot: bots commonly fill every field. */
export function honeypotPassed(value: unknown): boolean {
  return typeof value === 'undefined' || value === '' || value === null;
}
