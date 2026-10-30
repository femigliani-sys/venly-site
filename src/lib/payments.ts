import 'server-only';
import crypto from 'node:crypto';
import type { CartItem, CustomerData } from './types';

export function paymentsConfigured(): boolean {
  return Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN);
}

type PreferenceInput = {
  code: string;
  items: CartItem[];
  customer: CustomerData;
  siteUrl: string;
};

/**
 * Creates a Mercado Pago Checkout Pro preference. Only called when the access
 * token is configured; no fake/simulated payment is ever produced.
 */
export async function createCheckoutPreference(input: PreferenceInput): Promise<{ initPoint: string; id: string }> {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) throw new Error('payments_not_configured');
  const [firstName, ...rest] = input.customer.name.trim().split(/\s+/);
  const lastName = rest.join(' ') || firstName;
  const body = {
    items: input.items.map((item) => ({
      id: item.slug,
      title: `${item.name}${item.size ? ` · ${item.size}` : ''}`.slice(0, 120),
      description: 'Produto Venly Esports',
      picture_url: item.image.startsWith('http') ? item.image : `${input.siteUrl}${item.image}`,
      category_id: 'others',
      quantity: item.quantity,
      currency_id: 'BRL',
      unit_price: Number((item.price_cents / 100).toFixed(2)),
    })),
    payer: {
      name: firstName,
      surname: lastName,
      email: input.customer.email,
      phone: { number: input.customer.phone.replace(/\D/g, '').slice(0, 20) },
      address: {
        zip_code: input.customer.cep,
        street_name: input.customer.street,
        street_number: input.customer.number,
        neighborhood: input.customer.district,
        city: input.customer.city,
        federal_unit: input.customer.state,
      },
    },
    back_urls: {
      success: `${input.siteUrl}/checkout/retorno?status=success&pedido=${input.code}`,
      failure: `${input.siteUrl}/checkout/retorno?status=failure&pedido=${input.code}`,
      pending: `${input.siteUrl}/checkout/retorno?status=pending&pedido=${input.code}`,
    },
    external_reference: input.code,
    statement_descriptor: (process.env.MERCADO_PAGO_STATEMENT_DESCRIPTOR || 'VENLY').slice(0, 22),
    notification_url: `${input.siteUrl}/api/payments/webhook`,
    auto_return: 'approved',
  };
  const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'X-Idempotency-Key': input.code },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12_000),
  });
  const data = await res.json().catch(() => ({})) as { init_point?: string; sandbox_init_point?: string; id?: string; message?: string };
  if (!res.ok || !data.id) {
    console.error('[venly/payments] preference error', res.status, data.message);
    throw new Error('preference_failed');
  }
  const useSandbox = process.env.MERCADO_PAGO_USE_SANDBOX === 'true';
  return { initPoint: (useSandbox ? data.sandbox_init_point : data.init_point) || data.init_point || '', id: data.id };
}

/** Verifies the x-signature header sent by Mercado Pago webhooks (v2 manifest). */
export function verifyWebhookSignature(request: Request, body: string, dataId: string): boolean {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret) return false;
  const signature = request.headers.get('x-signature') || '';
  const parts = Object.fromEntries(signature.split(',').map((p) => {
    const [k, ...v] = p.trim().split('=');
    return [k, v.join('=')];
  })) as Record<string, string>;
  const ts = parts.ts || '';
  const received = parts.v1 || '';
  const manifest = `id:${dataId};request-id:${request.headers.get('x-request-id') || ''};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  const a = Buffer.from(expected); const b = Buffer.from(received);
  return a.length === b.length && crypto.timingSafeEqual(a, b) && body.length >= 0;
}
