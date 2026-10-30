import { execute, queryOne } from '@/lib/db';
import { verifyWebhookSignature } from '@/lib/payments';

export const runtime = 'nodejs';

/**
 * Mercado Pago payment notifications. Only enabled with BOTH access token and
 * webhook secret configured — otherwise we never mark an order as paid.
 */
export async function POST(request: Request) {
  if (!process.env.MERCADO_PAGO_ACCESS_TOKEN || !process.env.MERCADO_PAGO_WEBHOOK_SECRET) {
    return Response.json({ received: true, ignored: 'payments_not_configured' }, { status: 202 });
  }
  const raw = await request.text();
  const dataId = new URL(request.url).searchParams.get('data.id') || '';
  if (!verifyWebhookSignature(request, raw, dataId)) {
    console.warn('[venly/payments] invalid webhook signature');
    return Response.json({ error: 'invalid_signature' }, { status: 401 });
  }
  let payload: { type?: string; data?: { id?: string } } = {};
  try { payload = JSON.parse(raw); } catch { /* keep empty */ }
  if (payload.type !== 'payment') return Response.json({ received: true }, { status: 200 });
  const paymentId = payload.data?.id || dataId;
  if (!paymentId || !/^\d+$/.test(String(paymentId))) return Response.json({ received: true }, { status: 200 });

  try {
    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}` },
      signal: AbortSignal.timeout(10_000), cache: 'no-store',
    });
    if (!res.ok) return Response.json({ error: 'payment_fetch_failed' }, { status: 502 });
    const payment = await res.json() as { status?: string; external_reference?: string };
    const code = payment.external_reference || '';
    if (!code) return Response.json({ received: true }, { status: 200 });

    const order = await queryOne<{ id: number; payment_status: string; items: string }>(
      'SELECT id, payment_status, items FROM orders WHERE code = $1',
      [code]
    );
    if (!order) return Response.json({ received: true }, { status: 200 });

    const status = payment.status === 'approved' ? 'approved' : payment.status === 'rejected' ? 'rejected' : 'pending';

    // Idempotency: only debit stock on the first approval notification.
    if (status === 'approved' && order.payment_status !== 'approved') {
      let items: { slug: string; quantity: number }[] = [];
      try { items = JSON.parse(order.items); } catch { /* malformed snapshot */ }
      for (const item of items) {
        if (item?.slug && Number.isInteger(item.quantity) && item.quantity > 0) {
          await execute(
            'UPDATE products SET stock = GREATEST(0, stock - $1), updated_at = $2 WHERE slug = $3',
            [item.quantity, new Date().toISOString(), item.slug]
          );
        }
      }
    }

    await execute(
      'UPDATE orders SET payment_status = $1, status = $2, updated_at = $3 WHERE id = $4',
      [status, status === 'approved' ? 'Pago' : status === 'rejected' ? 'Cancelado' : 'Aguardando pagamento', new Date().toISOString(), order.id]
    );

    return Response.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[venly/payments] webhook error', error);
    return Response.json({ error: 'webhook_error' }, { status: 502 });
  }
}
