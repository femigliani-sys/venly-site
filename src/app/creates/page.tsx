import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Layers3, Sparkles, ShieldCheck, MessageSquareText } from 'lucide-react';
import { getContent } from '@/lib/db';
import { getMaps, getCategories } from '@/lib/queries';
import { PageHero, SectionHeading, Chip } from '@/components/ui';
import { StatusNote } from '@/components/cards';
import { MapGallery } from '@/components/MapGallery';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Venly Creates — Portfólio de Mapas',
  description: 'Portfólio profissional da Venly Creates: mapas competitivos, de treinamento, experiências criativas e projetos personalizados. Solicite um orçamento.',
};

export default async function CreatesPage() {
  const content = await getContent();
  const projects = await getMaps();
  const categories = (await getCategories('map')).map((c) => c.name);

  return (
    <>
      <PageHero label="Divisão de criação" title="VENLY" accent="CREATES" breadcrumb="Venly Creates"
        description={content.creates.intro}>
        <div className="flex flex-wrap gap-3">
          <Link href="#portfolio" className="btn-primary btn-sm">Explorar portfólio <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          <Link href="/solicitar-mapa" className="btn-outline btn-sm">Solicite seu mapa</Link>
        </div>
      </PageHero>

      <section className="section bg-ink-950">
        <div className="container-wide">
          <Reveal className="grid gap-8 rounded-lg border border-white/10 bg-gradient-to-br from-pink/[0.07] to-transparent p-8 sm:grid-cols-3 sm:p-10">
            {[
              { icon: Layers3, title: 'Design de níveis', text: 'Layout, fluxo de jogo, pontos de disputa e legibilidade para quem joga.' },
              { icon: Sparkles, title: 'Identidade visual', text: 'Atmosfera, iluminação e linguagem visual alinhadas ao projeto e à marca.' },
              { icon: ShieldCheck, title: 'Processo claro', text: 'Briefing, conceito, produção e entrega com revisões e acompanhamento.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <item.icon className="h-6 w-6 shrink-0 text-pink-400" />
                <div><h2 className="font-display text-lg font-bold uppercase text-white">{item.title}</h2><p className="mt-2 text-sm leading-relaxed text-mist-400">{item.text}</p></div>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section id="portfolio" className="section border-t border-white/10 bg-ink-900 scroll-mt-24">
        <div className="container-wide">
          <Reveal><SectionHeading label="Portfólio" title="Projetos e" accent="conceitos" description="Navegue pelos projetos, filtre por categoria e conheça os detalhes de cada mapa. As categorias podem ser alteradas no painel administrativo." /></Reveal>
          <Reveal delay={120} className="mt-8"><StatusNote>{content.creates.note}</StatusNote></Reveal>
          <div className="mt-12"><MapGallery projects={projects} categories={categories} /></div>
        </div>
      </section>

      <section className="section border-t border-white/10 bg-ink-950">
        <div className="container-wide">
          <Reveal><SectionHeading label="Como trabalhamos" title="Do briefing à" accent="entrega" description="Um processo simples para transformar uma ideia em um ambiente jogável." /></Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {content.creates.process.map((step, i) => (
              <Reveal key={step.title} delay={i * 80}>
                <div className="card h-full p-6 hover:border-pink/40">
                  <span className="font-display text-4xl font-bold text-pink/25">0{i + 1}</span>
                  <h3 className="mt-4 font-display text-lg font-bold uppercase text-white">{step.title.replace(/^0\d\s·\s/, '')}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-mist-400">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-pink/20 bg-[#0B0510] py-20">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
        <div className="pointer-events-none absolute left-1/3 top-0 h-72 w-[600px] rounded-full bg-pink/15 blur-[120px]" />
        <div className="container-wide relative grid items-center gap-10 lg:grid-cols-[1.3fr_.7fr]">
          <Reveal>
            <Chip pink><MessageSquareText className="h-3 w-3" /> SOLICITE SEU MAPA</Chip>
            <h2 className="heading-lg mt-6 text-white">SEU PROJETO <span className="text-gradient">COMEÇA AQUI.</span></h2>
            <p className="text-muted mt-5 max-w-2xl text-base">Envie sua ideia para análise. É um pedido de orçamento: discutimos os requisitos e preparamos uma proposta comercial. Sem cobrança automática e sem compromisso.</p>
          </Reveal>
          <Reveal delay={120} className="flex flex-col gap-3 lg:items-end">
            <Link href="/solicitar-mapa" className="btn-primary group">Preencher solicitação <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></Link>
            <Link href="/contato" className="btn-outline">Falar com a equipe comercial</Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
