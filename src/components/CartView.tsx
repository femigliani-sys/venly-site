'use client';
import Link from 'next/link';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from './CartProvider';
import { EmptyState } from './ui';
import { formatBRL } from '@/lib/utils';

export function CartView() {
  const { items, hydrated, subtotal, setQuantity, remove } = useCart();

  if (!hydrated) return (
    <div className="grid gap-8 lg:grid-cols-[1.5fr_.7fr]">
      <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 w-full rounded-lg" />)}</div>
      <div className="skeleton h-72 w-full rounded-lg" />
    </div>
  );

  if (!items.length) return (
    <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Seu carrinho está vazio"
      description="Explore a loja oficial e adicione produtos com a identidade Venly Esports."
      action={<Link href="/loja" className="btn-primary btn-sm">Ir para a loja <ArrowRight className="h-3.5 w-3.5" /></Link>} />
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[1.55fr_.7fr]">
      <div>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={`${item.slug}-${item.size}`} className="flex flex-col gap-4 rounded-lg border border-white/10 bg-ink-850 p-4 sm:flex-row sm:items-center">
              <Link href={`/loja/produto/${item.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-sm border border-white/10 bg-ink-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image || '/demo/products/jersey.jpg'} alt={item.name} className="h-full w-full object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/loja/produto/${item.slug}`} className="font-display text-lg font-bold uppercase leading-tight text-white hover:text-pink-400">{item.name}</Link>
                {item.size && <p className="mt-1 text-xs text-mist-500">Tamanho / modelo: <span className="text-mist-300">{item.size}</span></p>}
                <p className="mt-2 font-display text-lg font-bold text-pink-400">{formatBRL(item.price_cents)}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center rounded-sm border border-white/15">
                  <button type="button" aria-label="Diminuir quantidade" onClick={() => setQuantity(item.slug, item.size, item.quantity - 1)} className="flex h-9 w-9 items-center justify-center text-mist-300 hover:text-white"><Minus className="h-3.5 w-3.5" /></button>
                  <span className="w-8 text-center font-display text-sm font-bold text-white">{item.quantity}</span>
                  <button type="button" aria-label="Aumentar quantidade" onClick={() => setQuantity(item.slug, item.size, item.quantity + 1)} className="flex h-9 w-9 items-center justify-center text-mist-300 hover:text-white"><Plus className="h-3.5 w-3.5" /></button>
                </div>
                <span className="w-24 text-right font-display text-lg font-bold text-white">{formatBRL(item.price_cents * item.quantity)}</span>
                <button type="button" aria-label={`Remover ${item.name}`} onClick={() => remove(item.slug, item.size)} className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/10 text-mist-500 transition-all hover:border-red-500/50 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
        <Link href="/loja" className="mt-6 inline-flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-mist-400 hover:text-pink-400">← Continuar comprando</Link>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
          <h2 className="mb-6 font-display text-xl font-bold uppercase text-white">Resumo do pedido</h2>
          <dl className="space-y-3.5 text-sm">
            <div className="flex justify-between text-mist-400"><dt>Subtotal ({items.reduce((n, i) => n + i.quantity, 0)} itens)</dt><dd className="text-white">{formatBRL(subtotal)}</dd></div>
            <div className="flex justify-between text-mist-400"><dt>Frete</dt><dd className="text-mist-300">A calcular</dd></div>
            <div className="flex justify-between border-t border-white/10 pt-4 font-display text-lg font-bold text-white"><dt>Total</dt><dd>{formatBRL(subtotal)}</dd></div>
          </dl>
          <Link href="/checkout" className="btn-primary mt-7 w-full">Finalizar pedido <ArrowRight className="h-4 w-4" /></Link>
          <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-mist-500"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pink-400" /> O carrinho usa armazenamento local estritamente necessário. Nenhum dado de rastreamento é usado.</p>
        </div>
      </aside>
    </div>
  );
}
