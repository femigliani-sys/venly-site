'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, Map as MapIcon } from 'lucide-react';
import type { MapProject } from '@/lib/types';
import { MapCard } from './cards';
import { EmptyState } from './ui';
import { cn, normalizeText } from '@/lib/utils';

export function MapGallery({ projects, categories }: { projects: MapProject[]; categories: string[] }) {
  const [category, setCategory] = useState('Todos');
  const [query, setQuery] = useState('');
  const filters = ['Todos', ...categories];
  const filtered = useMemo(() => projects.filter((p) => {
    const byCategory = category === 'Todos' || p.category === category;
    const haystack = normalizeText(`${p.title} ${p.summary} ${p.category} ${p.status}`);
    return byCategory && haystack.includes(normalizeText(query));
  }), [projects, category, query]);

  return (
    <div>
      <div className="mb-10 flex flex-col gap-5 rounded-lg border border-white/10 bg-ink-850/60 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-2 hidden items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-mist-500 sm:inline-flex"><SlidersHorizontal className="h-3.5 w-3.5" /> Filtros</span>
          {filters.map((item) => (
            <button key={item} type="button" onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={cn('rounded-sm border px-3.5 py-2 font-display text-[11px] font-bold uppercase tracking-[0.1em] transition-all',
                category === item ? 'border-pink bg-pink text-white shadow-[0_6px_24px_-8px_rgba(255,0,143,.9)]' : 'border-white/[0.12] text-mist-400 hover:border-pink/50 hover:text-white')}>
              {item}
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:w-72">
          <span className="sr-only">Buscar projetos</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mist-500" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar projeto…" className="form-input py-2.5 pl-10 text-[13px]" />
        </label>
      </div>

      <p className="mb-6 font-display text-[11px] uppercase tracking-[0.18em] text-mist-500" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'projeto encontrado' : 'projetos encontrados'}
      </p>

      {filtered.length ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project, i) => <MapCard key={project.id} project={project} priority={i < 3} />)}
        </div>
      ) : (
        <EmptyState icon={<MapIcon className="h-6 w-6" />} title="Nenhum projeto encontrado"
          description="Tente outro termo ou selecione outra categoria. Novos mapas podem ser cadastrados pelo painel administrativo."
          action={<button type="button" onClick={() => { setCategory('Todos'); setQuery(''); }} className="btn-outline btn-sm">Limpar filtros</button>} />
      )}

      <div className="mt-10 flex items-center justify-center">
        <Link href="/solicitar-mapa" className="btn-outline btn-sm">Não encontrou o que procurava? Solicite um mapa personalizado</Link>
      </div>
    </div>
  );
}
