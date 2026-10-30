import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Play, Layers3, CircleDot, Images, ExternalLink } from 'lucide-react';
import { getMapBySlug, getMaps } from '@/lib/queries';
import { Chip, DemoBadge, EmptyState } from '@/components/ui';
import { MapCard } from '@/components/cards';
import { Reveal } from '@/components/Reveal';
import { truncate } from '@/lib/utils';

type Props = { params: Promise<{ slug: string }> };

function safeVideoEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') {
      const id = u.searchParams.get('v');
      if (id && /^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1);
      if (/^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (u.hostname === 'player.vimeo.com' || u.hostname === 'vimeo.com') {
      const id = u.pathname.split('/').filter(Boolean).pop();
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
  } catch { /* invalid URL */ }
  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getMapBySlug(slug);
  if (!project) return { title: 'Projeto não encontrado' };
  return { title: `${project.title} — Venly Creates`, description: truncate(project.summary || project.description, 155) };
}

export default async function MapDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await getMapBySlug(slug);
  if (!project) notFound();
  const embed = project.video_url ? safeVideoEmbed(project.video_url) : null;
  const related = (await getMaps({ category: project.category })).filter((m) => m.id !== project.id).slice(0, 3);

  return (
    <>
      <section className="relative overflow-hidden border-b border-white/10 bg-ink-900 pt-32 pb-0 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-pink/10 blur-[110px]" />
        <div className="container-wide relative pb-12">
          <Link href="/creates" className="mb-8 inline-flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-mist-400 transition-colors hover:text-pink-400">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao portfólio
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <Chip pink><Layers3 className="h-3 w-3" /> {project.category}</Chip>
            <Chip><CircleDot className="h-3 w-3" /> {project.status}</Chip>
            {Boolean(project.is_demo) && <DemoBadge />}
          </div>
          <h1 className="heading-lg mt-6 max-w-4xl text-white">{project.title}</h1>
          <p className="text-muted mt-5 max-w-2xl text-base sm:text-lg">{project.summary}</p>
        </div>
        <div className="container-wide relative">
          <div className="relative overflow-hidden rounded-t-lg border border-b-0 border-white/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={project.cover || '/demo/maps/neon-circuit.jpg'} alt={`Capa do projeto ${project.title}`} className="aspect-[21/9] w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-pink via-pink-400 to-transparent" />
          </div>
        </div>
      </section>

      <section className="section bg-ink-950">
        <div className="container-wide grid gap-14 lg:grid-cols-[1.5fr_.7fr]">
          <div>
            <Reveal>
              <p className="eyebrow mb-4 flex items-center gap-3"><span className="h-px w-8 bg-pink" /> SOBRE O PROJETO</p>
              <h2 className="heading-md text-white">A proposta por trás do mapa</h2>
              <div className="mt-6 space-y-5 text-[15px] leading-[1.9] text-mist-300">
                {project.description.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
              </div>
            </Reveal>

            {project.gallery.length > 0 && (
              <Reveal delay={100} className="mt-14">
                <div className="mb-5 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-pink-400"><Images className="h-4 w-4" /> Galeria de imagens</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {project.gallery.map((image, i) => (
                    <a key={image} href={image} target="_blank" rel="noopener noreferrer" className="group relative block overflow-hidden rounded-sm border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image} alt={`Imagem ${i + 1} do projeto ${project.title}`} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <span className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"><ArrowUpRight className="h-4 w-4" /></span>
                    </a>
                  ))}
                </div>
              </Reveal>
            )}

            {embed && (
              <Reveal delay={140} className="mt-14">
                <div className="mb-5 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-pink-400"><Play className="h-4 w-4" /> Vídeo de apresentação</div>
                <div className="aspect-video overflow-hidden rounded-sm border border-white/10">
                  <iframe src={embed} title={`Vídeo do projeto ${project.title}`} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
                </div>
              </Reveal>
            )}
            {project.video_url && !embed && (
              <p className="mt-10 text-sm text-mist-400">Vídeo de apresentação: <a href={project.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-pink-400 hover:text-white">assistir <ExternalLink className="h-3.5 w-3.5" /></a></p>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
              <h3 className="mb-5 font-display text-lg font-bold uppercase text-white">Ficha técnica</h3>
              <dl className="space-y-4">
                {[
                  ['Projeto', project.title], ['Categoria', project.category], ['Status', project.status],
                  ['Imagens adicionais', String(project.gallery.length)],
                  ['Tipo de conteúdo', project.is_demo ? 'Demonstrativo' : 'Projeto cadastrado'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-4 border-b border-white/[0.07] pb-3 last:border-0">
                    <dt className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-mist-500">{label}</dt>
                    <dd className="text-right text-sm text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            {Boolean(project.is_demo) && (
              <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-5 text-[13px] leading-relaxed text-amber-100/90">
                <strong className="font-display uppercase tracking-wide">Conteúdo demonstrativo.</strong> Este projeto existe apenas para apresentar o formato do portfólio. Não representa cliente, publicação ou resultado real.
              </div>
            )}
            <div className="rounded-lg border border-pink/25 bg-gradient-to-b from-pink/[0.09] to-transparent p-6">
              <h3 className="font-display text-xl font-bold uppercase text-white">Quer algo assim?</h3>
              <p className="mt-3 text-sm leading-relaxed text-mist-300">Solicite um mapa personalizado. É um pedido de orçamento — sem cobrança automática.</p>
              <Link href="/solicitar-mapa" className="btn-primary btn-sm mt-6 w-full">Solicitar orçamento <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </div>
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section border-t border-white/10 bg-ink-900">
          <div className="container-wide">
            <h2 className="heading-md mb-10 text-white">Outros projetos <span className="text-gradient">relacionados</span></h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((m, i) => <Reveal key={m.id} delay={i * 80}><MapCard project={m} /></Reveal>)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
