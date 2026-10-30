import 'server-only';

type MailResult = { sent: boolean; reason?: string };

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL && process.env.EMAIL_FROM);
}

/**
 * Optional transactional e-mail via Resend HTTP API. No SDK, no data sent when
 * the integration is not configured. Failures never block the user's request.
 */
export async function sendNotification(subject: string, html: string): Promise<MailResult> {
  if (!mailConfigured()) return { sent: false, reason: 'not_configured' };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [process.env.NOTIFICATION_EMAIL],
        subject: subject.slice(0, 180),
        html,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('[venly/mail] provider responded', res.status, (await res.text()).slice(0, 300));
      return { sent: false, reason: `provider_${res.status}` };
    }
    return { sent: true };
  } catch (error) {
    console.error('[venly/mail] send failed', error);
    return { sent: false, reason: 'network_error' };
  }
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export function simpleEmail(title: string, lines: [string, string][]): string {
  const rows = lines.map(([k, v]) => `<tr><td style="padding:6px 12px;color:#8b8b9a;font:12px Arial">${escapeHtml(k)}</td><td style="padding:6px 12px;color:#161622;font:14px Arial;white-space:pre-wrap">${escapeHtml(v || '—')}</td></tr>`).join('');
  return `<div style="background:#f4f4f8;padding:32px;font-family:Arial,sans-serif"><div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden"><div style="background:#FF008F;padding:20px 24px;color:#fff;font:700 20px Arial">VENLY ESPORTS</div><div style="padding:24px"><h2 style="font:700 18px Arial;color:#101018">${escapeHtml(title)}</h2><table style="width:100%;border-collapse:collapse">${rows}</table></div></div></div>`;
}
