import { login, SESSION_COOKIE, CSRF_COOKIE, cookieOptions, csrfCookieOptions } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { ok, fail, zodFail, readBody } from '@/lib/api';
import { checkRateLimit, clientKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const key = clientKey(request, 'admin-login');
  if (!(await checkRateLimit(key, 8, 10 * 60_000))) return fail('Muitas tentativas de login. Aguarde alguns minutos.', 429);
  const parsed = loginSchema.safeParse(await readBody(request));
  if (!parsed.success) return zodFail(parsed.error);
  const session = await login(parsed.data.email, parsed.data.password);
  if (!session) return fail('E-mail ou senha incorretos.', 401);
  const response = ok({ authenticated: true });
  response.cookies.set(SESSION_COOKIE, session.token, cookieOptions);
  response.cookies.set(CSRF_COOKIE, session.csrf, csrfCookieOptions);
  return response;
}
