import 'server-only';
import { getAdmin, csrfValid, originValid } from './auth';
import { fail } from './api';

/** Every /api/admin request requires a valid server-side session. */
export async function requireAdminApi(request: Request, mutation = false): Promise<Response | null> {
  const admin = await getAdmin();
  if (!admin) return fail('Sessão expirada ou não autorizada. Faça login novamente.', 401);
  if (!originValid(request)) return fail('Origem da requisição não autorizada.', 403);
  if (mutation && !csrfValid(request)) return fail('Token CSRF inválido. Recarregue a página.', 403);
  return null;
}
