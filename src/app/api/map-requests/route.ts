import { NextResponse } from 'next/server';
import { getContent, query, queryOne } from '@/lib/db';
import { mapRequestSchema } from '@/lib/validation';
import { ok, fail, zodFail, readBody } from '@/lib/api';
import { checkRateLimit, clientKey, honeypotPassed } from '@/lib/rate-limit';
import { sendNotification, simpleEmail } from '@/lib/mail';

export const runtime = 'nodejs';

type Attachment = { url: string; name: string; size: number; type: string };
const VALID_ATTACHMENT = /^\/api\/uploads\/private\/[a-f0-9]{36}\.(png|jpg|webp|pdf)$/;

export async function POST(request: Request) {
  if (!(await checkRateLimit(clientKey(request, 'map-request'), 5, 10 * 60_000))) {
    return fail('Muitas solicitações em pouco tempo. Tente novamente em alguns minutos.', 429);
  }
  const body = await readBody(request);
  if (!honeypotPassed(body.website)) return fail('Não foi possível enviar a solicitação.', 400);

  const rawAttachments = Array.isArray(body.attachments) ? body.attachments : [];
  const attachments: Attachment[] = rawAttachments
    .filter((a): a is Attachment => Boolean(a && typeof a === 'object' && 'url' in a && typeof (a as Attachment).url === 'string'))
    .filter((a) => VALID_ATTACHMENT.test(a.url))
    .slice(0, 4)
    .map((a) => ({ url: a.url, name: String(a.name || 'arquivo').slice(0, 120), size: Number(a.size) || 0, type: String(a.type || '').slice(0, 60) }));

  const parsed = mapRequestSchema.safeParse({ ...body, attachments: undefined });
  if (!parsed.success) return zodFail(parsed.error);

  const { name, email, contact, map_type, project_name, description, refs, budget, deadline } = parsed.data;
  const content = await getContent();
  const categories = await query<{ name: string }>("SELECT name FROM categories WHERE type = 'map'");
  if (!categories.some((c) => c.name === map_type) && map_type !== 'Outro') {
    return fail('Tipo de mapa inválido.', 422, { map_type: 'Selecione uma categoria válida.' });
  }

  const now = new Date().toISOString();
  const inserted = await queryOne<{ id: number }>(
    `INSERT INTO map_requests
      (name, email, contact, map_type, project_name, description, refs, budget, deadline, attachments, status, notes, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
    [name, email, contact, map_type, project_name, description, refs, budget, deadline,
      JSON.stringify(attachments), 'Nova', '', now]
  );
  const id = inserted?.id ?? 0;
  const protocol = `VM-${new Date().getFullYear()}-${String(id).padStart(5, '0')}`;

  const mail = await sendNotification(`[Venly Creates] Novo pedido de orçamento ${protocol}`, simpleEmail('Nova solicitação de mapa personalizado', [
    ['Protocolo', protocol], ['Nome / empresa', name], ['E-mail', email], ['Contato alternativo', contact],
    ['Tipo de mapa', map_type], ['Projeto', project_name], ['Descrição', description], ['Referências', refs],
    ['Orçamento', budget], ['Prazo', deadline], ['Anexos', attachments.map((a) => a.name).join(', ')],
    ['Privacidade', content.legal.privacyNote], ['Data', now],
  ]));

  return ok({
    id, protocol,
    message: 'Pedido de orçamento registrado com sucesso. Nossa equipe analisará a ideia e entrará em contato para conversar sobre requisitos e proposta comercial. Nenhuma cobrança foi feita.',
    emailNotification: mail.sent ? 'sent' : 'not_configured',
  }, 201);
}

export async function GET() { return NextResponse.json({ ok: false, error: 'Método não permitido.' }, { status: 405 }); }
