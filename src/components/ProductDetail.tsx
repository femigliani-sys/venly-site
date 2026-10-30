'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Minus, Plus, Check, Package, Truck, ShieldCheck, ArrowLeft } from 'lucide-react';
import type { Product } from '@/lib/types';
import { useCart } from './CartProvider';
import { DemoBadge } from './ui';
import { formatBRL, cn } from '@/lib/utils';

export function ProductDetail({ product, paymentsEnabled }: { product: Product; paymentsEnabled: boolean }) {
  const images = product.images.length ? product.images : ['/demo/products/jersey.jpg'];
  const [current, setCurrent] = useState(0);
  const [size, setSize] = useState(product.sizes.length === 1 ? product.sizes[0] : '');
  const [quantity, setQuantity] = useState(1);
  const { add, notify } = useCart();
  const soldOut = product.stock <= 0;

  function handleAdd() {
    if (product.sizes.length > 1 && !size) { notify('Selecione um tamanho.', 'error'); return; }
    if (quantity > product.stock) { notify('Quantidade maior que o estoque disponível.', 'error'); return; }
    add(product, size, quantity);
  }

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      <div>
        <div className="relative overflow-hidden rounded-lg border border-white/10 bg-ink-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[current]} alt={`${product.name} — imagem ${current + 1}`} className="aspect-square w-full object-cover" />
          <div className="absolute left-4 top-4 flex flex-col gap-2">
            {Boolean(product.is_demo) && <DemoBadge />}
            {soldOut && <span className="chip border-red-400/30 bg-red-400/10 text-red-300">Esgotado</span>}
          </div>
        </div>
        {images.length > 1 && (
          <div className="mt-4 flex gap-3">
            {images.map((image, i) => (
              <button key={image} type="button" onClick={() => setCurrent(i)} aria-label={`Ver imagem ${i + 1}`}
                className={cn('h-20 w-20 overflow-hidden rounded-sm border transition-all', current === i ? 'border-pink' : 'border-white/10 opacity-60 hover:opacity-100')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <Link href="/loja" className="mb-6 inline-flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-mist-400 transition-colors hover:text-pink-400"><ArrowLeft className="h-3.5 w-3.5" /> Voltar à loja</Link>
        <p className="eyebrow mb-3">{product.category}</p>
        <h1 className="heading-md text-white">{product.name}</h1>
        <div className="mt-6 flex flex-wrap items-baseline gap-3">
          <span className="font-display text-4xl font-bold text-white">{formatBRL(product.price_cents)}</span>
          <span className="text-sm text-mist-500">preço em BRL</span>
        </div>
        <p className="mt-6 border-l-2 border-pink/60 pl-4 text-[15px] leading-relaxed text-mist-300">{product.description}</p>

        {product.sizes.length > 0 && (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <span className="form-label mb-0">Tamanho / modelo</span>
              {size && <span className="font-display text-[11px] uppercase tracking-wider text-pink-400">Selecionado: {size}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((option) => (
                <button key={option} type="button" onClick={() => setSize(option)} aria-pressed={size === option}
                  className={cn('min-w-[52px] rounded-sm border px-4 py-2.5 font-display text-[12px] font-bold uppercase tracking-wide transition-all',
                    size === option ? 'border-pink bg-pink text-white' : 'border-white/15 text-mist-300 hover:border-pink/60 hover:text-white')}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="flex items-center rounded-sm border border-white/15">
            <button type="button" aria-label="Diminuir quantidade" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="flex h-11 w-11 items-center justify-center text-mist-300 hover:text-white"><Minus className="h-4 w-4" /></button>
            <span className="w-10 text-center font-display text-lg font-bold text-white" aria-live="polite">{quantity}</span>
            <button type="button" aria-label="Aumentar quantidade" onClick={() => setQuantity((q) => Math.min(product.stock || 20, q + 1))} className="flex h-11 w-11 items-center justify-center text-mist-300 hover:text-white"><Plus className="h-4 w-4" /></button>
          </div>
          <span className="text-[13px] text-mist-400">{soldOut ? 'Sem estoque' : <><Package className="mr-1.5 inline h-4 w-4 text-pink-400" /> {product.stock} unidades disponíveis</>}</span>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={handleAdd} disabled={soldOut} className="btn-primary flex-1 disabled:opacity-40">
            <ShoppingBag className="h-4 w-4" /> {soldOut ? 'Indisponível' : 'Adicionar ao carrinho'}
          </button>
          <Link href="/carrinho" className="btn-outline">Ver carrinho</Link>
        </div>

        <div className="mt-9 space-y-3 border-t border-white/10 pt-7 text-[13px] leading-relaxed text-mist-400">
          <p className="flex items-start gap-3"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-pink-400" /> Frete não calculado nesta versão. O valor final deve ser confirmado antes do pagamento.</p>
          <p className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-pink-400" /> Não coletamos dados de cartão no site. Quando ativo, o pagamento é processado pelo gateway.</p>
          <p className={cn('flex items-start gap-3', paymentsEnabled ? 'text-emerald-300' : 'text-amber-200/90')}>
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            {paymentsEnabled ? 'Checkout com Mercado Pago configurado neste ambiente.' : 'Checkout não ativado: nenhum gateway de pagamento configurado. Pedidos ficam registrados para contato da equipe.'}
          </p>
        </div>
      </div>
    </div>
  );
}
