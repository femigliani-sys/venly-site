import type { Metadata } from 'next';
import Link from 'next/link';
import { Target, Eye, Compass, ArrowUpRight, Layers3, Users, Trophy, Package } from 'lucide-react';
import { getContent } from '@/lib/db';
import { PageHero, SectionHeading } from '@/components/ui';
import { StatusNote } from '@/components/cards';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Sobre a Venly Esports',
  description: 'Conheça a Venly Esports: missão, visão, valores, áreas de atuação e a divisão Venly Creates de criação de mapas.',
};

const AREA_ICONS = [Users, Trophy, Package, Layers3];

export default async function AboutPage() {
  const c = (await getContent()).about;
  return (
    <>
      <PageHero label="Sobre a organização" title="QUEM É A" accent="VENLY" breadcrumb="Sobre nós" description={c.intro} />

      <section className="section bg-ink-950">
        <div className="container-wide grid gap-14 lg:grid-cols-[1.2fr_.8fr]">
          <Reveal>
            <p className="eyebrow mb-4 flex items-center gap-3"><span className="h-px w-8 bg-pink" /> NOSSA HISTÓRIA</p>
            <h2 className="heading-lg text-white">CONSTRUINDO O <span className="text-gradient">PRÓXIMO NÍVEL.</span></h2>
            <p className="mt-7 text-[15px] leading-[1.9] text-mist-300">{c.history}</p>
            <div className="mt-8"><StatusNote>{c.pendingNote}</StatusNote></div>
          </Reveal>
          <Reveal delay={120} className="grid gap-4 self-start sm:grid-cols-2 lg:grid-cols-1">
            {[
              { icon: Target, label: 'Missão', text: c.mission },
              { icon: Eye, label: 'Visão de futuro', text: c.vision },
            ].map((item) => (
              <div key={item.label} className="card p-6 sm:p-7">
                <item.icon className="mb-5 h-7 w-7 text-pink-400" />
                <h3 className="font-display text-xl font-bold uppercase text-white">{item.label}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mist-400">{item.text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section border-t border-white/10 bg-ink-900">
        <div className="container-wide">
          <Reveal><SectionHeading label="O que nos move" title="Nossos" accent="valores" /></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.values.map((value, i) => (
              <Reveal key={value.title} delay={i * 80}>
                <div className="card card-hover h-full p-6">
                  <span className="font-display text-4xl font-bold text-pink/25">0{i + 1}</span>
                  <h3 className="mt-5 font-display text-lg font-bold uppercase leading-tight text-white">{value.title}</h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-mist-400">{value.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section border-t border-white/10 bg-ink-950">
        <div className="container-wide">
          <Reveal><SectionHeading label="Onde atuamos" title="Áreas de" accent="atuação" /></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {c.areas.map((area, i) => {
              const Icon = AREA_ICONS[i % AREA_ICONS.length];
              return (
                <Reveal key={area.title} delay={i * 80}>
                  <div className="flex gap-5 rounded-lg border border-white/10 bg-ink-850 p-6 transition-colors hover:border-pink/40">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-pink/30 bg-pink/10 text-pink-400"><Icon className="h-5 w-5" /></div>
                    <div><h3 className="font-display text-lg font-bold uppercase text-white">{area.title}</h3><p className="mt-2 text-sm leading-relaxed text-mist-400">{area.text}</p></div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-pink/20 bg-[#0B0510] py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="pointer-events-none absolute right-1/4 top-0 h-80 w-[600px] rounded-full bg-pink/15 blur-[120px]" />
        <div className="container-wide relative grid items-center gap-10 lg:grid-cols-[1.2fr_.8fr]">
          <Reveal>
            <div className="mb-5 flex items-center gap-3"><Layers3 className="h-6 w-6 text-pink-400" /><span className="eyebrow">DIVISÃO DE CRIAÇÃO</span></div>
            <h2 className="heading-lg text-white">VENLY <span className="text-gradient">CREATES</span></h2>
            <p className="text-muted mt-6 max-w-2xl text-base">{c.creates}</p>
          </Reveal>
          <Reveal delay={120} className="flex flex-col gap-3 lg:items-end">
            <Link href="/creates" className="btn-primary group">Ver portfólio de mapas <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></Link>
            <Link href="/solicitar-mapa" className="btn-outline">Solicite seu mapa</Link>
            <Compass className="mt-4 hidden h-10 w-10 text-pink/30 lg:block" />
          </Reveal>
        </div>
      </section>
    </>
  );
}
