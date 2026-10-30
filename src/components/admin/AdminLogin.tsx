'use client';
import { useState } from 'react';
import Link from 'next/link';
import { LockKeyhole, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/ui';
import { ButtonSpinner } from '@/components/forms/parts';

export function AdminLogin({ email }: { email: string }) {
  const [values, setValues] = useState({ email, password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Falha no login.');
      window.location.href = '/admin';
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha no login.');
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-ink-950 px-5 py-20">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink/15 blur-[130px]" />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-mist-400 hover:text-pink-400"><ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site</Link>
        <div className="rounded-lg border border-white/10 bg-[#0B0A13]/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-7 flex items-center gap-3">
            <Logo size={46} priority />
            <div><p className="font-display text-lg font-bold uppercase leading-none text-white">VENLY ESPORTS</p><p className="mt-1 font-display text-[10px] uppercase tracking-[0.25em] text-pink-400">Painel administrativo</p></div>
          </div>
          <div className="mb-6 flex items-start gap-3 rounded-sm border border-pink/20 bg-pink/[0.05] px-4 py-3 text-[12px] leading-relaxed text-mist-300">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-pink-400" /> Área restrita. O acesso é protegido por sessão no servidor, CSRF e limitação de tentativas.
          </div>
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="ad-email" className="form-label">E-mail</label>
              <input id="ad-email" type="email" required value={values.email} onChange={(e) => setValues({ ...values, email: e.target.value })} className="form-input" autoComplete="username" />
            </div>
            <div>
              <label htmlFor="ad-pass" className="form-label">Senha</label>
              <input id="ad-pass" type="password" required value={values.password} onChange={(e) => setValues({ ...values, password: e.target.value })} className="form-input" placeholder="••••••••••••" autoComplete="current-password" />
            </div>
            {error && <div role="alert" className="rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <><ButtonSpinner /> Entrando…</> : <><LockKeyhole className="h-4 w-4" /> Entrar no painel</>}
            </button>
          </form>
          <p className="mt-6 border-t border-white/10 pt-5 text-[11px] leading-relaxed text-mist-500">A credencial inicial é gerada localmente na primeira execução (arquivo <code className="text-pink-400">data/ADMIN_CREDENTIALS.txt</code>) ou definida por <code className="text-pink-400">ADMIN_EMAIL</code>/<code className="text-pink-400">ADMIN_PASSWORD</code>.</p>
        </div>
      </div>
    </div>
  );
}
