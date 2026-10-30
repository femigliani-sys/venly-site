import type { Metadata } from 'next';
import { getAdmin } from '@/lib/auth';
import { getAdminData } from '@/lib/queries';
import { AdminLogin } from '@/components/admin/AdminLogin';
import { AdminApp } from '@/components/admin/AdminApp';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Painel administrativo', robots: { index: false, follow: false } };

export default async function AdminPage() {
  const admin = await getAdmin();
  if (!admin) return <AdminLogin email={process.env.ADMIN_EMAIL || 'admin@venly.local'} />;
  return <AdminApp initial={await getAdminData()} />;
}
