import { execute, query } from '@/lib/db';
import { consentSchema } from '@/lib/validation';
import { ok, fail, zodFail, readBody } from '@/lib/api';
import { checkRateLimit, clientKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/** Registers an anonymous consent event. No IP, e-mail or identifying data is stored. */
export async function POST(request: Request) {
  if (!(await checkRateLimit(clientKey(request, 'consent'), 30, 60 * 60_000))) return fail('Limite de requisições excedido.', 429);
  const body = await readBody(request);
  const parsed = consentSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);
  const { token, version, necessary, analytics, ads, action } = parsed.data;

  await execute(
    'INSERT INTO consent_logs (token, version, necessary, analytics, ads, action, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
    [token.slice(0, 80), version, necessary ? 1 : 0, analytics ? 1 : 0, ads ? 1 : 0, action, new Date().toISOString()]
  );

  // Retention: keep consent records for at most 13 months (TTL 180d + 12 months).
  if (Math.random() < 0.05) {
    const cutoff = new Date(Date.now() - 395 * 86_400_000).toISOString();
    void query('DELETE FROM consent_logs WHERE created_at < $1', [cutoff]).catch(() => {});
  }

  return ok({ recorded: true }, 201);
}
