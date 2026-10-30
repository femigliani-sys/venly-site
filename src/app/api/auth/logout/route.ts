import { logout, SESSION_COOKIE, CSRF_COOKIE } from '@/lib/auth';
import { ok } from '@/lib/api';

export const runtime = 'nodejs';

export async function POST() {
  await logout();
  const response = ok({ authenticated: false });
  response.cookies.set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  response.cookies.set(CSRF_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
