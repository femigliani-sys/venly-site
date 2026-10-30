import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { contactSchema } from '@/lib/validation';
import { ok, fail, zodFail, readBody } from '@/lib/api';
import { checkRateLimit, clientKey, honeypotPassed } from '@/lib/rate-limit';
import { sendNotification, simpleEmail } from '@/lib/mail';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!(await checkRateLimit(clientKey(request, 'contact'), 6, 10 * 60_000))) {
    return fail('Muitas mensagens enviadas em pouco tempo. Tente novamente em alguns minutos.', 429);
  }
  const body = await readBody(request);
  if (!honeypotPassed(body.website)) return fail('Não foi possível enviar a mensagem.', 400);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  const { name, email, subject, message } = parsed.data;
  const now = new Date().toISOString();
  const row = await queryOne<{ id: number }>(
    'INSERT INTO contacts (name, email, subject, message, status, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
    [name, email, subject, message, 'Nova', now]
  );

  await sendNotification(`[Venly] Novo contato: ${subject}`, simpleEmail('Novo contato recebido pelo site', [
    ['Nome', name], ['E-mail', email], ['Assunto', subject], ['Mensagem', message], ['Data', now],
  ]));

  return ok({ id: row?.id ?? 0, message: 'Mensagem enviada com sucesso.' }, 201);
}

export async function GET() { return NextResponse.json({ ok: false, error: 'Método não permitido.' }, { status: 405 }); }
