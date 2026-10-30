import Link from 'next/link';
import { ArrowUpRight, ArrowDown, Sparkles, Users, Swords, Boxes, ShoppingBag, Layers3, ArrowRight, MoveUpRight, Crosshair, ScanLine, Zap } from 'lucide-react';
import { getContent } from '@/lib/db';
import { getFeaturedMaps, getProducts, getCategories } from '@/lib/queries';
import { Reveal } from '@/components/Reveal';
import { Logo, SectionHeading, Chip } from '@/components/ui';
import { MapCard, StatusNote } from '@/components/cards';
import { ProductCard } from '@/components/ProductCard';

export default async function HomePage() {
  const content = await getContent();
  const maps = await getFeaturedMaps(3);
  const products = (await getProducts()).filter((p) => p.featured).slice(0, 4);
  const productCategories = (await getCategories('product')).map((c) => c.name);

  const areas = [
    { n: '01', title: 'Venly Esports', accent: 'A ORGANIZAÇÃO', text: 'A identidade por trás de tudo: comunidade gamer, mentalidade competitiva e vontade de evoluir.', href: '/sobre', icon: Swords },
    { n: '02', title: 'Venly Creates', accent: 'DIVISÃO DE CRIAÇÃO', text: 'Mapas, ambientes e experiências jogáveis. Conceitos, produção e entrega para projetos próprios e personalizados.', href: '/creates', icon: Layers3, featured: true },
    { n: '03', title: 'Loja Oficial', accent: 'PRODUTOS VENLY', text: 'Jerseys, camisetas, moletons e acessórios com a identidade da marca.', href: '/loja', icon: ShoppingBag },
    { n: '04', title: 'Integrantes', accent: 'NOSSA EQUIPE', text: 'As pessoas que constroem a Venly: gestão, jogadores, criadores e desenvolvimento.', href: '/equipe', icon: Users },
    { n: '05', title: 'Portfólio', accent: 'PROJETOS RECENTES', text: 'Conheça os mapas e conceitos que estão sendo desenvolvidos pela Venly Creates.', href: '/creates#portfolio', icon: Boxes },
  ];

  return (
    <>
      {/* ================= HERO ================= */}
      <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink-950">
        {/* background layers */}
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero-arena.jpg" alt="" aria-hidden="true" className="h-full w-full object-cover object-center opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050509] via-[#050509]/85 to-[#050509]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050509] via-transparent to-[#050509]/70" />
          <div className="absolute inset-0 grid-bg opacity-40" />
          <div className="absolute -left-40 top-1/3 h-[560px] w-[560px] rounded-full bg-pink/20 blur-[140px]" />
          <div className="absolute -right-20 bottom-0 h-[420px] w-[420px] rounded-full bg-pink/10 blur-[120px]" />
          <div className="pointer-events-none absolute inset-y-0 left-[8%] hidden w-px bg-gradient-to-b from-transparent via-pink/30 to-transparent lg:block" />
          <div className="pointer-events-none absolute inset-y-0 right-[12%] hidden w-px bg-gradient-to-b from-transparent via-white/10 to-transparent lg:block" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 animate-scan bg-gradient-to-b from-transparent via-pink/[0.035] to-transparent" />
        </div>

        <div className="container-wide relative z-10 grid w-full items-center gap-14 pb-28 pt-32 lg:grid-cols-[1.22fr_.78fr] lg:gap-8 lg:pb-32 lg:pt-40">
          <div className="max-w-3xl">
            <Reveal>
              <div className="mb-8 flex flex-wrap items-center gap-3">
                <Chip pink><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-400" /> {content.home.eyebrow}</Chip>
              </div>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="heading-xl text-white">
                {content.home.titleTop}
                <br />
                <span className="text-gradient glow-text">{content.home.titleAccent}</span>
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <p className="mt-8 max-w-xl border-l-2 border-pink/60 pl-5 text-[15px] leading-relaxed text-mist-300 sm:text-base">
                {content.home.description}
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/sobre" className="btn-primary group">{content.home.primaryCta} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
                <Link href="/creates" className="btn-outline group">{content.home.secondaryCta} <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
              </div>
            </Reveal>
            <Reveal delay={340}>
              <div className="mt-14 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/10 pt-6">
                {[
                  { icon: Users, label: 'Comunidade', sub: 'Gente que joga junto' },
                  { icon: Swords, label: 'Competição', sub: 'Mentalidade de evolução' },
                  { icon: Layers3, label: 'Criação', sub: 'Mapas e experiências' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-pink-400" />
                    <div>
                      <p className="font-display text-[13px] font-bold uppercase tracking-[0.12em] text-white">{item.label}</p>
                      <p className="text-[11px] text-mist-500">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Logo showcase — arquivo oficial, sem alterações */}
          <Reveal delay={200} className="relative hidden justify-center lg:flex">
            <div className="relative flex h-[440px] w-[440px] items-center justify-center">
              <div className="absolute inset-0 animate-spin-slow rounded-full border border-dashed border-pink/25" />
              <div className="absolute inset-8 rounded-full border border-white/[0.06]" />
              <div className="absolute inset-16 rounded-full border border-pink/10" />
              <div className="absolute inset-0 rounded-full bg-pink/15 blur-[90px]" />
              <div className="absolute -left-6 top-16 flex items-center gap-2 rounded-sm border border-white/10 bg-black/60 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-mist-300 backdrop-blur">
                <ScanLine className="h-3.5 w-3.5 text-pink-400" /> IDENTITY / 001
              </div>
              <div className="absolute -right-2 bottom-20 flex items-center gap-2 rounded-sm border border-white/10 bg-black/60 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-mist-300 backdrop-blur">
                <Crosshair className="h-3.5 w-3.5 text-pink-400" /> READY TO PLAY
              </div>
              <div className="relative animate-float">
                <div className="absolute -inset-8 rounded-full bg-pink/25 blur-3xl" />
                <Logo size={260} priority className="relative rounded-[28px] shadow-[0_40px_120px_-30px_rgba(255,0,143,.85)] ring-1 ring-white/20" />
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap font-display text-[11px] font-bold uppercase tracking-[0.4em] text-white/70">VENLY ESPORTS</div>
            </div>
          </Reveal>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-white/10 bg-black/55 backdrop-blur-md">
          <div className="container-wide flex h-16 items-center justify-between gap-6">
            <div className="hidden items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.22em] text-mist-500 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink" /> ONLINE · BUILDING THE NEXT LEVEL
            </div>
            <div className="relative flex-1 overflow-hidden sm:flex-none">
              <div className="flex w-max animate-marquee gap-8 whitespace-nowrap font-display text-[11px] font-bold uppercase tracking-[0.2em] text-mist-400">
                {[...content.home.ticker, ...content.home.ticker].map((item, i) => (
                  <span key={i} className="flex items-center gap-8">{item}<span className="text-pink">✦</span></span>
                ))}
              </div>
            </div>
            <a href="#universo" className="hidden items-center gap-2 font-display text-[10px] font-bold uppercase tracking-[0.2em] text-mist-400 transition-colors hover:text-pink-400 sm:flex">
              Explore <ArrowDown className="h-3.5 w-3.5 animate-bounce" />
            </a>
          </div>
        </div>
      </section>

      {/* ================= PREVIEW DAS ÁREAS ================= */}
      <section id="universo" className="section bg-ink-950">
        <div className="pointer-events-none absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-pink/[0.05] blur-[120px]" />
        <div className="container-wide relative">
          <Reveal><SectionHeading label={content.home.previewLabel} title={content.home.previewTitle.split('.')[0] + '.'} accent={content.home.previewTitle.split('.').slice(1).join('.').trim()} description={content.home.previewText} /></Reveal>

          <div className="mt-14 grid auto-rows-[minmax(210px,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {areas.map((area, index) => (
              <Reveal key={area.n} delay={index * 70} className={area.featured ? 'sm:col-span-2 lg:row-span-2' : ''}>
                <Link href={area.href} className={`card card-hover group relative flex h-full flex-col justify-between overflow-hidden p-6 ${area.featured ? 'sm:p-8' : ''}`}>
                  {area.featured && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/images/creates-grid.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover opacity-35 transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#08070f] via-[#08070f]/70 to-transparent" />
                    </>
                  )}
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-pink/10 blur-3xl transition-opacity group-hover:opacity-100" />
                  <div className="relative flex items-start justify-between">
                    <span className="font-display text-[11px] font-bold tracking-[0.28em] text-pink-400">/{area.n}</span>
                    <area.icon className={`text-pink-400 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110 ${area.featured ? 'h-8 w-8' : 'h-6 w-6'}`} />
                  </div>
                  <div className="relative mt-8">
                    <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-[0.22em] text-mist-500">{area.accent}</p>
                    <h3 className={`font-display font-bold uppercase leading-none tracking-tight text-white transition-colors group-hover:text-pink-400 ${area.featured ? 'text-4xl sm:text-5xl' : 'text-2xl'}`}>{area.title}</h3>
                    <p className={`mt-4 max-w-md text-sm leading-relaxed text-mist-400 ${area.featured ? 'sm:text-[15px]' : ''}`}>{area.text}</p>
                    <span className="mt-6 inline-flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-colors group-hover:text-pink-400">
                      Acessar área <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CREATES SPOTLIGHT ================= */}
      <section className="section relative overflow-hidden border-y border-white/10 bg-ink-900">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="container-wide relative grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="relative order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-lg border border-pink/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/creates-grid.jpg" alt="Visualização abstrata de construção de mapas" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-transparent" />
              <div className="absolute left-5 top-5 flex items-center gap-2 rounded-sm border border-pink/30 bg-black/70 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-pink-300 backdrop-blur">
                <Zap className="h-3.5 w-3.5" /> LEVEL DESIGN / WIREFRAME
              </div>
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                <p className="font-display text-2xl font-bold uppercase text-white">Do conceito ao jogável<span className="text-pink">.</span></p>
                <span className="hidden font-mono text-[10px] text-mist-400 sm:block">VENLY CREATES ©</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 -z-10 h-40 w-40 rounded-lg border border-pink/20" />
          </Reveal>

          <div className="order-1 lg:order-2">
            <Reveal>
              <p className="eyebrow mb-4 flex items-center gap-3"><span className="h-px w-8 bg-pink" /> DIVISÃO DE CRIAÇÃO</p>
              <h2 className="heading-lg text-white">VENLY <span className="text-gradient">CREATES</span></h2>
              <p className="text-muted mt-6 text-base">{content.creates.intro}</p>
            </Reveal>
            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {content.creates.process.map((step, i) => (
                <Reveal key={step.title} delay={i * 70}>
                  <div className="rounded-sm border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-pink/40">
                    <p className="font-display text-[11px] font-bold uppercase tracking-[0.16em] text-pink-400">{step.title}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-mist-400">{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={280}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/creates" className="btn-primary btn-sm group">Ver portfólio <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></Link>
                <Link href="/solicitar-mapa" className="btn-outline btn-sm">Solicite seu mapa</Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= MAPAS EM DESTAQUE ================= */}
      <section className="section bg-ink-950">
        <div className="container-wide">
          <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading label="Portfólio Venly Creates" title="Projetos em" accent="destaque" description="Uma amostra do formato do nosso portfólio. Todos os itens abaixo são demonstrativos até o cadastro dos projetos oficiais." />
            <Link href="/creates" className="btn-outline btn-sm shrink-0">Ver todos os projetos <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {maps.map((map, i) => <Reveal key={map.id} delay={i * 90}><MapCard project={map} priority /></Reveal>)}
          </div>
          <Reveal delay={200} className="mt-8"><StatusNote>{content.creates.note}</StatusNote></Reveal>
        </div>
      </section>

      {/* ================= LOJA ================= */}
      <section className="section border-t border-white/10 bg-ink-900">
        <div className="container-wide">
          <Reveal className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <SectionHeading label="Venly Store" title="Vista a" accent="marca" description={content.store.intro} />
            <Link href="/loja" className="btn-outline btn-sm shrink-0">Ir para a loja <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product, i) => <Reveal key={product.id} delay={i * 80} className="h-full"><ProductCard product={product} /></Reveal>)}
          </div>
          <Reveal delay={220} className="mt-8"><StatusNote>{content.store.notice}</StatusNote></Reveal>
        </div>
      </section>

      {/* ================= CTA FINAL ================= */}
      <section className="relative overflow-hidden border-t border-pink/20 bg-[#0B0510] py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink/15 blur-[120px]" />
        <div className="container-wide relative flex flex-col items-start justify-between gap-10 lg:flex-row lg:items-center">
          <Reveal className="max-w-2xl">
            <p className="eyebrow mb-4 flex items-center gap-3"><span className="h-px w-8 bg-pink" /> VAMOS CRIAR JUNTOS</p>
            <h2 className="heading-lg text-white">TEM UMA IDEIA? <span className="text-gradient">VAMOS CONSTRUIR.</span></h2>
            <p className="text-muted mt-5 max-w-xl text-base">Conte o que você imagina para o seu mapa. Analisamos a ideia, discutimos os requisitos e enviamos uma proposta comercial — sem cobrança automática.</p>
          </Reveal>
          <Reveal delay={120} className="flex flex-col gap-3">
            <Link href="/solicitar-mapa" className="btn-primary group">Solicite seu mapa <MoveUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></Link>
            <Link href="/contato" className="btn-outline">Falar sobre parcerias</Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
