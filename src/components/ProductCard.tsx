'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, ArrowUpRight, PackageX } from 'lucide-react';
import type { Product } from '@/lib/types';
import { DemoBadge } from './ui';
import { useCart } from './CartProvider';
import { formatBRL } from '@/lib/utils';

export function ProductCard({ product }: { product: Product }) {
  const { add, notify } = useCart();
  const router = useRouter();
  const soldOut = product.stock <= 0;

  function handleAdd() {
    if (soldOut) { notify('Produto sem estoque no momento.', 'error'); return; }
    if (product.sizes.length > 1) {
      notify('Escolha o tamanho na página do produto.', 'info');
      router.push(`/loja/produto/${product.slug}`);
      return;
    }
    add(product, product.sizes[0] || '');
  }

  return (
    <article className="card card-hover group flex flex-col">
      <Link href={`/loja/produto/${product.slug}`} className="relative block aspect-square overflow-hidden bg-ink-900" aria-label={`Ver ${product.name}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.images[0] || '/demo/products/jersey.jpg'} alt={product.name} loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-col items-start gap-2">
          {Boolean(product.is_demo) && <DemoBadge />}
          {product.featured ? <span className="chip chip-pink">Destaque</span> : null}
        </div>
        {soldOut && <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-sm border border-red-400/30 bg-black/70 px-2.5 py-1.5 font-display text-[10px] font-bold uppercase tracking-widest text-red-300"><PackageX className="h-3 w-3" /> Esgotado</span>}
        <span className="absolute right-3 top-3 font-display text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">{product.category}</span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-bold uppercase leading-tight text-white transition-colors group-hover:text-pink-400">
          <Link href={`/loja/produto/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-[13px] leading-relaxed text-mist-400">{product.description}</p>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="font-display text-2xl font-bold text-white">{formatBRL(product.price_cents)}</span>
          <span className="text-[11px] text-mist-500">em até 1x</span>
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <button type="button" onClick={handleAdd} disabled={soldOut}
            className="btn-primary btn-sm w-full disabled:opacity-40">
            <ShoppingBag className="h-3.5 w-3.5" /> {soldOut ? 'Indisponível' : 'Adicionar'}
          </button>
          <Link href={`/loja/produto/${product.slug}`} aria-label={`Detalhes de ${product.name}`}
            className="flex h-[38px] w-[38px] items-center justify-center rounded-sm border border-white/15 text-mist-300 transition-all hover:border-pink hover:text-pink-400">
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}
