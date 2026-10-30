'use client';
import { useState } from 'react';
import Link from 'next/link';
import { LockKeyhole, AlertTriangle, CheckCircle2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/CartProvider';
import { EMPTY_CUSTOMER, BRAZILIAN_STATES, type CustomerData } from '@/lib/types';
import { EmptyState } from '@/components/ui';
import { ButtonSpinner, FieldError } from './parts';
import { formatBRL } from '@/lib/utils';

type Errors = Record<string, string>;

export function CheckoutForm({ paymentsEnabled }: { paymentsEnabled: boolean }) {
  const { items, subtotal, hydrated, clear } = useCart();
  const [customer, setCustomer] = useState<CustomerData>(EMPTY_CUSTOMER);
  const [notes, setNotes] = useState('');
  const [website, setWebsite] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [result, setResult] = useState<{ code: string; status: string; message?: string } | null>(null);

  const set = (key: keyof CustomerData, value: string) => {
    setCustomer((c) => ({ ...c, [key]: value }));
    setErrors((e) => ({ ...e, [`customer.${key}`]: '', [key]: '' }));
  };

  function validate(): Errors {
    const e: Errors = {};
    if (customer.name.trim().length < 2) e['customer.name'] = 'Informe o nome completo.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) e['customer.email'] = 'Informe um e-mail válido.';
    if (customer.phone.replace(/\D/g, '').length < 8) e['customer.phone'] = 'Informe um telefone válido.';
    if (!/^\d{5}-?\d{3}$/.test(customer.cep)) e['customer.cep'] = 'CEP inválido.';
    if (customer.street.trim().length < 2) e['customer.street'] = 'Informe a rua.';
    if (!customer.number.trim()) e['customer.number'] = 'Informe o número.';
    if (customer.district.trim().length < 2) e['customer.district'] = 'Informe o bairro.';
    if (customer.city.trim().length < 2) e['customer.city'] = 'Informe a cidade.';
    if (!BRAZILIAN_STATES.includes(customer.state)) e['customer.state'] = 'Selecione a UF.';
    return e;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) { document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
    setLoading(true); setNotice('Registrando pedido…');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, notes, website, items: items.map((i) => ({ slug: i.slug, size: i.size, quantity: i.quantity })) }),
      });
      const json = await res.json();
      if (!res.ok) { if (json.fields) setErrors(json.fields as Errors); throw new Error(json.error || 'Não foi possível finalizar o pedido.'); }
      const data = json.data as { code: string; status: string; message?: string; redirect?: string | null };
      if (data.status === 'redirect' && data.redirect) {
        setNotice('Redirecionando para o pagamento…');
        window.location.href = data.redirect;
        return;
      }
      setResult({ code: data.code, status: data.status, message: data.message });
      clear();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro inesperado.';
      setNotice(message);
      setResult({ code: '', status: 'error', message });
    } finally { setLoading(false); }
  }

  if (!hydrated) return <div className="skeleton h-96 w-full rounded-lg" />;
  if (!result && !items.length) return (
    <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Não há itens para finalizar"
      description="Adicione produtos ao carrinho antes de acessar o checkout."
      action={<Link href="/loja" className="btn-primary btn-sm">Ir para a loja</Link>} />
  );

  if (result) {
    const isError = result.status === 'error';
    return (
      <div role="status" className="rounded-lg border border-pink/30 bg-gradient-to-b from-pink/[0.08] to-transparent p-8 sm:p-10">
        {isError ? <AlertTriangle className="mb-5 h-10 w-10 text-amber-300" /> : <CheckCircle2 className="mb-5 h-10 w-10 text-emerald-400" />}
        <h2 className="heading-md text-white">{isError ? 'Não foi possível concluir' : 'Pedido registrado'}</h2>
        {result.code && <p className="mt-4 font-display text-sm uppercase tracking-widest text-pink-400">Pedido {result.code}</p>}
        <p className="text-muted mt-4 max-w-xl">{result.message || (isError ? 'Tente novamente em alguns instantes.' : 'Nossa equipe entrará em contato.')}</p>
        {!isError && <p className="mt-5 rounded-sm border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 text-[13px] leading-relaxed text-amber-100/90">Nenhum pagamento foi processado. Este pedido não representa uma compra concluída até que o gateway de pagamento esteja ativo e a equipe confirme os valores.</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/loja" className="btn-outline btn-sm">Voltar à loja</Link>
          {isError && <button type="button" onClick={() => setResult(null)} className="btn-primary btn-sm">Tentar novamente</button>}
        </div>
      </div>
    );
  }

  const field = (key: keyof CustomerData, label: string, placeholder: string, required = true, span = '') => (
    <div className={span}>
      <label htmlFor={`co-${key}`} className="form-label">{label} {required && <span className="text-pink">*</span>}</label>
      <input id={`co-${key}`} value={customer[key]} onChange={(e) => set(key, e.target.value)} placeholder={placeholder}
        aria-invalid={Boolean(errors[`customer.${key}`] || errors[key])} className="form-input" />
      <FieldError message={errors[`customer.${key}`] || errors[key]} />
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-[1.4fr_.6fr]">
      <div className="space-y-8">
        {!paymentsEnabled && (
          <div role="alert" className="flex items-start gap-3 rounded-sm border border-amber-400/30 bg-amber-400/[0.07] px-5 py-4 text-[13px] leading-relaxed text-amber-100/90">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            <p><strong className="font-display uppercase tracking-wide">Checkout não ativado.</strong> Nenhum gateway de pagamento está configurado neste ambiente. Você pode registrar o pedido, mas nenhum pagamento será cobrado ou simulado.</p>
          </div>
        )}

        <div className="rounded-lg border border-white/10 bg-ink-850 p-6 sm:p-7">
          <h2 className="mb-6 font-display text-xl font-bold uppercase text-white">1. Seus dados</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {field('name', 'Nome completo', 'Nome e sobrenome', true, 'sm:col-span-2')}
            {field('email', 'E-mail', 'voce@email.com', true)}
            {field('phone', 'Telefone / WhatsApp', '(11) 99999-9999', true)}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-ink-850 p-6 sm:p-7">
          <h2 className="mb-6 font-display text-xl font-bold uppercase text-white">2. Endereço de entrega</h2>
          <div className="grid gap-5 sm:grid-cols-6">
            {field('cep', 'CEP', '00000-000', true, 'sm:col-span-2')}
            {field('street', 'Rua / Avenida', 'Nome da rua', true, 'sm:col-span-4')}
            {field('number', 'Número', '123', true, 'sm:col-span-1')}
            {field('complement', 'Complemento (opcional)', 'Apto, bloco…', false, 'sm:col-span-2')}
            {field('district', 'Bairro', 'Bairro', true, 'sm:col-span-3')}
            {field('city', 'Cidade', 'Cidade', true, 'sm:col-span-3')}
            <div className="sm:col-span-2">
              <label htmlFor="co-state" className="form-label">UF <span className="text-pink">*</span></label>
              <select id="co-state" value={customer.state} onChange={(e) => set('state', e.target.value)} aria-invalid={Boolean(errors['customer.state'])} className="form-input">
                <option value="">Selecione</option>
                {BRAZILIAN_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <FieldError message={errors['customer.state']} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-ink-850 p-6 sm:p-7">
          <h2 className="mb-5 font-display text-xl font-bold uppercase text-white">3. Observações</h2>
          <label htmlFor="co-notes" className="form-label">Observações do pedido (opcional)</label>
          <textarea id="co-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input resize-y" placeholder="Alguma informação importante para a entrega?" />
        </div>

        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="co-website">Não preencha</label>
          <input id="co-website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
          <h2 className="mb-6 font-display text-xl font-bold uppercase text-white">Resumo do pedido</h2>
          <ul className="mb-6 max-h-64 space-y-3 overflow-y-auto pr-1">
            {items.map((i) => (
              <li key={`${i.slug}-${i.size}`} className="flex items-center gap-3 border-b border-white/[0.06] pb-3 text-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={i.image || '/demo/products/jersey.jpg'} alt="" className="h-12 w-12 rounded-sm border border-white/10 object-cover" />
                <div className="min-w-0 flex-1"><p className="truncate font-display text-[13px] font-bold uppercase text-white">{i.name}</p><p className="text-[11px] text-mist-500">{i.quantity}x {i.size || 'único'}</p></div>
                <span className="shrink-0 font-display text-sm font-bold text-pink-400">{formatBRL(i.price_cents * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between text-mist-400"><dt>Subtotal</dt><dd className="text-white">{formatBRL(subtotal)}</dd></div>
            <div className="flex justify-between text-mist-400"><dt>Frete</dt><dd>A calcular</dd></div>
            <div className="flex justify-between border-t border-white/10 pt-4 font-display text-lg font-bold text-white"><dt>Total</dt><dd>{formatBRL(subtotal)}</dd></div>
          </dl>
          <button type="submit" disabled={loading} className="btn-primary mt-7 w-full">
            {loading ? <><ButtonSpinner /> Processando…</> : <><LockKeyhole className="h-4 w-4" /> {paymentsEnabled ? 'Ir para o pagamento' : 'Registrar pedido'}</>}
          </button>
          <p className="mt-4 text-[12px] leading-relaxed text-mist-500">Coletamos apenas os dados necessários para o pedido e a entrega. Não armazenamos dados de cartão. Veja a <Link href="/privacidade" className="text-pink-400 underline">Política de Privacidade</Link>.</p>
          {notice && loading && <p className="mt-3 text-center text-xs text-mist-400" role="status">{notice}</p>}
        </div>
      </aside>
    </form>
  );
}
