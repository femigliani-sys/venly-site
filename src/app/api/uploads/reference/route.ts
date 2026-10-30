import { ok, fail } from '@/lib/api';
import { checkRateLimit, clientKey } from '@/lib/rate-limit';
import { storeFile, MAX_UPLOAD_FILES } from '@/lib/uploads';

export const runtime = 'nodejs';

/** Anonymous reference files for a quote request. Stored privately, admin-only access. */
export async function POST(request: Request) {
  if (!(await checkRateLimit(clientKey(request, 'reference-upload'), 12, 15 * 60_000))) {
    return fail('Limite de envio de arquivos atingido. Tente novamente mais tarde.', 429);
  }
  let form: FormData;
  try { form = await request.formData(); }
  catch { return fail('Envio inválido.', 400); }
  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (!files.length) return fail('Nenhum arquivo recebido.', 400);
  if (files.length > MAX_UPLOAD_FILES) return fail(`Envie no máximo ${MAX_UPLOAD_FILES} arquivos.`, 400);
  try {
    const stored = [];
    for (const file of files) stored.push(await storeFile(file, 'private'));
    return ok({ files: stored }, 201);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Falha ao processar o arquivo.', 400);
  }
}
