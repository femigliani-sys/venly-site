'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Send, CheckCircle2 } from 'lucide-react';
import { ButtonSpinner, FieldError } from './parts';

const SUBJECTS = ['Geral', 'Parcerias', 'Mapas personalizados', 'Privacidade e dados pessoais', 'Loja e pedidos', 'Imprensa'] as const;
const INITIAL = { name: '', email: '', subject: 'Geral', message: '', website: '' };

export function ContactForm({ defaultSubject }: { defaultSubject?: string }) {
  const [values, setValues] = useState({ ...INITIAL, subject: defaultSubject || 'Geral' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [notice, setNotice] = useState('');

  const set = (key: keyof typeof values, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const e: Record<string, string> = {};
    if (values.name.trim().length < 2) e.name = 'Informe seu nome.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = 'Informe um e-mail válido.';
    if (values.message.trim().length < 10) e.message = 'Escreva uma mensagem com pelo menos 10 caracteres.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
      const json = await res.json();
      if (!res.ok) { if (json.fields) setErrors(json.fields); throw new Error(json.error || 'Falha ao enviar.'); }
      setStatus('success');
      setValues({ ...INITIAL, subject: defaultSubject || 'Geral' });
    } catch (error) {
      setStatus('error');
      setNotice(error instanceof Error ? error.message : 'Erro inesperado.');
    }
  }

  if (status === 'success') return (
    <div role="status" className="rounded-lg border border-pink/30 bg-gradient-to-b from-pink/[0.08] to-transparent p-8">
      <CheckCircle2 className="mb-5 h-10 w-10 text-emerald-400" />
      <h2 className="heading-md text-white">Mensagem enviada<span className="text-pink">.</span></h2>
      <p className="text-muted mt-3">Recebemos sua mensagem e responderemos pelo e-mail informado. Obrigado pelo contato.</p>
      <button type="button" onClick={() => setStatus('idle')} className="btn-outline btn-sm mt-7">Enviar outra mensagem</button>
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="ct-name" className="form-label">Nome <span className="text-pink">*</span></label>
          <input id="ct-name" value={values.name} onChange={(e) => set('name', e.target.value)} aria-invalid={Boolean(errors.name)} className="form-input" placeholder="Seu nome" />
          <FieldError message={errors.name} />
        </div>
        <div>
          <label htmlFor="ct-email" className="form-label">E-mail <span className="text-pink">*</span></label>
          <input id="ct-email" type="email" value={values.email} onChange={(e) => set('email', e.target.value)} aria-invalid={Boolean(errors.email)} className="form-input" placeholder="voce@email.com" />
          <FieldError message={errors.email} />
        </div>
      </div>
      <div>
        <label htmlFor="ct-subject" className="form-label">Assunto <span className="text-pink">*</span></label>
        <select id="ct-subject" value={values.subject} onChange={(e) => set('subject', e.target.value)} className="form-input">
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
        </select>
        <p className="form-hint">Para acesso, correção ou exclusão de dados pessoais, escolha “Privacidade e dados pessoais”.</p>
      </div>
      <div>
        <label htmlFor="ct-message" className="form-label">Mensagem <span className="text-pink">*</span></label>
        <textarea id="ct-message" rows={7} value={values.message} onChange={(e) => set('message', e.target.value)} aria-invalid={Boolean(errors.message)} className="form-input resize-y" placeholder="Como podemos ajudar?" />
        <FieldError message={errors.message} />
      </div>
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="ct-website">Não preencha</label>
        <input id="ct-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set('website', e.target.value)} />
      </div>
      <p className="text-xs leading-relaxed text-mist-500">Seus dados são usados apenas para responder a esta mensagem. Veja a <Link href="/privacidade" className="text-pink-400 underline">Política de Privacidade</Link>.</p>
      {status === 'error' && <div role="alert" className="rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{notice}</div>}
      <button type="submit" disabled={status === 'loading'} className="btn-primary w-full sm:w-auto">
        {status === 'loading' ? <><ButtonSpinner /> Enviando…</> : <><Send className="h-4 w-4" /> Enviar mensagem</>}
      </button>
    </form>
  );
}
