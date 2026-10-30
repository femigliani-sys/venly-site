import Link from 'next/link';
import { ArrowUpRight, Layers3, CircleDot, Clock3, ExternalLink } from 'lucide-react';
import type { MapProject, Member, SocialLink } from '@/lib/types';
import { Chip, DemoBadge } from './ui';
import { formatBRL, cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
  'Publicado': 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
  'Em desenvolvimento': 'border-amber-400/30 bg-amber-400/10 text-amber-300',
  'Projeto conceitual': 'border-pink/30 bg-pink/10 text-pink-400',
};

export function MapCard({ project, priority = false }: { project: MapProject; priority?: boolean }) {
  return (
    <article className="card card-hover group flex flex-col">
      <Link href={`/creates/mapa/${project.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-ink-900" aria-label={`Ver projeto ${project.title}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={project.cover || '/demo/maps/neon-circuit.jpg'} alt={`Arte conceitual do mapa ${project.title}`}
          loading={priority ? 'eager' : 'lazy'} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent opacity-90" />
        <div className="absolute inset-0 bg-pink/0 transition-colors duration-500 group-hover:bg-pink/10" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className={cn('chip', STATUS_STYLES[project.status] || '')}><CircleDot className="h-3 w-3" />{project.status}</span>
          {Boolean(project.is_demo) && <DemoBadge />}
        </div>
        <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-sm transition-all group-hover:border-pink group-hover:bg-pink">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-pink-400">
          <Layers3 className="h-3.5 w-3.5" /> {project.category}
        </div>
        <h3 className="font-display text-2xl font-bold uppercase leading-tight tracking-tight text-white transition-colors group-hover:text-pink-400">{project.title}</h3>
        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-mist-400">{project.summary}</p>
        <Link href={`/creates/mapa/${project.slug}`} className="mt-6 inline-flex items-center gap-2 border-t border-white/10 pt-4 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:text-pink-400">
          Ver projeto <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

export function MemberCard({ member }: { member: Member }) {
  const initials = (member.nickname || member.name).split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <article className="card card-hover group flex flex-col">
      <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-gradient-to-br from-ink-800 to-ink-950">
        <div className="absolute inset-0 grid-bg opacity-70" />
        <div className="absolute -bottom-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-pink/20 blur-3xl transition-opacity group-hover:opacity-100" />
        {member.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.photo} alt={`Foto de ${member.name}`} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-pink/30 bg-ink-900 font-display text-4xl font-bold text-pink-400">{initials}</div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 to-transparent" />
        <span className="absolute bottom-3 left-4 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-pink-400">{member.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-bold uppercase leading-tight text-white">{member.nickname || member.name}</h3>
        {member.nickname && <p className="mt-0.5 text-xs text-mist-500">{member.name}</p>}
        <p className="mt-2 font-display text-[11px] font-bold uppercase tracking-[0.14em] text-pink-400">{member.role}</p>
        {member.game && <p className="mt-2 flex items-center gap-1.5 text-xs text-mist-400"><CircleDot className="h-3 w-3" /> {member.game}</p>}
        {member.bio && <p className="mt-3 line-clamp-3 flex-1 text-[13px] leading-relaxed text-mist-400">{member.bio}</p>}
        {member.socials?.filter((s: SocialLink) => s.url).length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            {member.socials.filter((s: SocialLink) => s.url).map((s: SocialLink) => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-sm border border-white/10 px-2.5 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-mist-300 transition-all hover:border-pink hover:text-pink-400">
                {s.label} <ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function StatusNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-sm border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-[13px] leading-relaxed text-amber-100/90">
      <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
      <p>{children}</p>
    </div>
  );
}

export function PriceTag({ cents, className }: { cents: number; className?: string }) {
  return <span className={cn('font-display text-2xl font-bold text-white', className)}>{formatBRL(cents)}</span>;
}

export { Chip };
