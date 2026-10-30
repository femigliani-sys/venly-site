'use client';
import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ShoppingBag } from 'lucide-react';
import type { Product } from '@/lib/types';
import { ProductCard } from './ProductCard';
import { EmptyState } from './ui';
import { cn, normalizeText } from '@/lib/utils';

export function StoreCatalog({ products, categories }: { products: Product[]; categories: string[] }) {
  const [category, setCategory] = useState('Todos');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('relevance');
  const filters = ['Todos', ...categories];

  const filtered = useMemo(() => {
    const list = products.filter((p) => {
      const byCategory = category === 'Todos' || p.category === category;
      return byCategory && normalizeText(`${p.name} ${p.description} ${p.category}`).includes(normalizeText(query));
    });
    if (sort === 'price-asc') list.sort((a, b) => a.price_cents - b.price_cents);
    if (sort === 'price-desc') list.sort((a, b) => b.price_cents - a.price_cents);
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    return list;
  }, [products, category, query, sort]);

  return (
    <div>
      <div className="mb-10 flex flex-col gap-5 rounded-lg border border-white/10 bg-ink-850/60 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 hidden items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-mist-500 sm:inline-flex"><SlidersHorizontal className="h-3.5 w-3.5" /> Categorias</span>
          {filters.map((item) => (
            <button key={item} type="button" onClick={() => setCategory(item)} aria-pressed={category === item}
              className={cn('rounded-sm border px-3.5 py-2 font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-all',
                category === item ? 'border-pink bg-pink text-white shadow-[0_6px_24px_-8px_rgba(255,0,143,.9)]' : 'border-white/[0.12] text-mist-400 hover:border-pink/50 hover:text-white')}>
              {item}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative block w-full sm:w-56">
            <span className="sr-only">Buscar produtos</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produto…" className="form-input py-2.5 pl-10 text-[13px]" />
          </label>
          <label className="block">
            <span className="sr-only">Ordenar por</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="form-input w-full py-2.5 text-[13px] sm:w-40">
              <option value="relevance">Relevância</option>
              <option value="price-asc">Menor preço</option>
              <option value="price-desc">Maior preço</option>
              <option value="name">Nome A–Z</option>
            </select>
          </label>
        </div>
      </div>

      <p className="mb-6 font-display text-[11px] uppercase tracking-[0.18em] text-mist-500" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
      </p>

      {filtered.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      ) : (
        <EmptyState icon={<ShoppingBag className="h-6 w-6" />} title="Nenhum produto encontrado"
          description="Tente outro termo ou categoria. O catálogo é atualizado pelo painel administrativo."
          action={<button type="button" onClick={() => { setCategory('Todos'); setQuery(''); }} className="btn-outline btn-sm">Limpar filtros</button>} />
      )}
    </div>
  );
}
