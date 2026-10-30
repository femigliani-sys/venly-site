import { ok } from '@/lib/api';
import { databaseConfigured, databaseStatus } from '@/lib/db';
import { storageConfigured } from '@/lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const database = await databaseStatus();
  return ok({
    status: database.ok ? 'healthy' : 'degraded',
    database: database.ok ? 'ok' : 'error',
    databaseMessage: database.error,
    databaseHint: database.hint,
    databaseConfigured: databaseConfigured(),
    storage: storageConfigured() ? 'supabase_storage' : 'local_disk',
    checkout: process.env.MERCADO_PAGO_ACCESS_TOKEN ? 'configured' : 'disabled',
    email: process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL ? 'configured' : 'disabled',
    optionalAnalytics: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? 'configured_consent_required' : 'disabled',
    optionalAds: process.env.NEXT_PUBLIC_ADS_SCRIPT_URL ? 'configured_consent_required' : 'disabled',
    timestamp: new Date().toISOString(),
  });
}
