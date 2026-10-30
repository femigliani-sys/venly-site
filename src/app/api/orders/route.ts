import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { execute, queryOne } from '@/lib/db';
import { orderSchema } from '@/lib/validation';
import { ok, fail, zodFail, readBody } from '@/lib/api';
import { checkRateLimit, clientKey, honeypotPassed } from '@/lib/rate-limit';
import { paymentsConfigured, createCheckoutPreference } from '@/lib/payments';
import { sendNotification, simpleEmail } from '@/lib/mail';
import type { CartItem } from '@/lib/types';
import { formatBRL } from '@/lib/utils';

export const runtime = 'nodejs';

type ProductRow = {
  slug: string; name: string; price_cents: number; images: string; sizes: string; stock: number;
};

export async function POST(request: Request) {
  if (!(await checkRateLimit(clientKey(request, 'order'), 8, 10 * 60_000))) {
    return fail('Muitas tentativas de pedido. Aguarde alguns minutos.', 429);
  }
  const body = await readBody(request);
  if (!honeypotPassed(body.website)) return fail('Não foi possível processar o pedido.', 400);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  const items: CartItem[] = [];
  for (const requested of parsed.data.items) {
    const row = await queryOne<ProductRow>(
      'SELECT slug, name, price_cents, images, sizes, stock FROM products WHERE slug = $1 AND active = 1',
      [requested.slug]
    );
    if (!row) return fail(`Produto indisponível: ${requested.slug}. Atualize o carrinho.`, 409);
    const sizes: string[] = JSON.parse(row.sizes || '[]');
    const size = sizes.length ? requested.size : '';
    if (sizes.length && !sizes.includes(size)) return fail(`Tamanho inválido para ${row.name}.`, 422);
    if (row.stock < requested.quantity) return fail(`Estoque insuficiente para ${row.name}.`, 409);
    const images: string[] = JSON.parse(row.images || '[]');
    items.push({
      slug: row.slug, name: row.name, image: images[0] || '', price_cents: row.price_cents,
      size, quantity: requested.quantity, stock: row.stock,
    });
  }

  const subtotal = items.reduce((n, i) => n + i.price_cents * i.quantity, 0);
  if (subtotal <= 0) return fail('Não foi possível calcular o total do pedido.', 400);
  const shipping = 0; // frete não calculado nesta versão — ver README
  const now = new Date().toISOString();
  const code = `VLY-${now.slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

  await execute(
    `INSERT INTO orders
      (code, customer, items, subtotal_cents, shipping_cents, total_cents, status, payment_status, payment_provider, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [code, JSON.stringify(parsed.data.customer), JSON.stringify(items), subtotal, shipping, subtotal + shipping,
      'Aguardando pagamento', 'not_started', paymentsConfigured() ? 'mercadopago' : '', now, now]
  );

  await sendNotification(`[Venly Store] Novo pedido ${code}`, simpleEmail('Novo pedido registrado', [
    ['Pedido', code], ['Cliente', parsed.data.customer.name], ['E-mail', parsed.data.customer.email],
    ['Itens', items.map((i) => `${i.quantity}x ${i.name} (${i.size || 'único'})`).join('; ')],
    ['Total', formatBRL(subtotal + shipping)], ['Observações', parsed.data.notes], ['Data', now],
  ]));

  if (!paymentsConfigured()) {
    return ok({
      code, status: 'checkout_disabled', redirect: null, total_cents: subtotal + shipping,
      message: 'Pedido registrado, mas o checkout está desativado: nenhum gateway de pagamento foi configurado. Nenhum pagamento foi processado ou cobrado. Nossa equipe entrará em contato para os próximos passos.',
    }, 201);
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const preference = await createCheckoutPreference({ code, items, customer: parsed.data.customer, siteUrl });
    await execute(
      'UPDATE orders SET payment_ref = $1, payment_status = $2, payment_provider = $3, updated_at = $4 WHERE code = $5',
      [preference.id, 'pending', 'mercadopago', new Date().toISOString(), code]
    );
    return ok({ code, status: 'redirect', redirect: preference.initPoint, total_cents: subtotal + shipping }, 201);
  } catch (error) {
    console.error('[venly/orders] checkout preference failed', error);
    return ok({
      code, status: 'payment_error', redirect: null, total_cents: subtotal + shipping,
      message: 'Pedido registrado, mas não foi possível iniciar o pagamento com o gateway. Nossa equipe entrará em contato.',
    }, 201);
  }
}

export async function GET() { return NextResponse.json({ ok: false, error: 'Método não permitido.' }, { status: 405 }); }
