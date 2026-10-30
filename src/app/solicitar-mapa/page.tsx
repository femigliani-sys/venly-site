import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, MessageCircle, FileText, ArrowUpRight, Clock3, Mail } from 'lucide-react';
import { getCategories } from '@/lib/queries';
import { getContent } from '@/lib/db';
import { PageHero, Chip } from '@/components/ui';
import { MapRequestForm } from '@/components/forms/MapRequestForm';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Solicite seu mapa — Orçamento Venly Creates',
  description: 'Peça um orçamento para um mapa personalizado com a Venly Creates. Preencha o briefing; nossa equipe analisa a ideia e envia uma proposta comercial.',
};

export default async function RequestPage() {
  const categories = (await getCategories('map')).map((c) => c.name);
  const content = await getContent();

  return (
    <>
      <PageHero label="Venly Creates · Pedido de orçamento" title="SOLICITE" accent="SEU MAPA" breadcrumb="Solicitar mapa"
        description="Conte o que você imagina. Analisamos a ideia, discutimos os requisitos e enviamos uma proposta comercial personalizada.">
        <div className="flex flex-wrap gap-2.5">
          <Chip pink>Sem cobrança automática</Chip>
          <Chip>Resposta por e-mail</Chip>
          <Chip>Briefing gratuito</Chip>
        </div>
      </PageHero>

      <section className="section bg-ink-950">
        <div className="container-wide grid gap-12 lg:grid-cols-[1.45fr_.55fr]">
          <Reveal>
            <div className="mb-8 rounded-sm border border-pink/25 bg-pink/[0.06] px-5 py-4">
              <p className="text-[14px] leading-relaxed text-pink-100">
                <strong className="font-display uppercase tracking-wide">Este é um pedido de orçamento.</strong> Nenhum pagamento é solicitado ou processado nesta etapa. Após analisar sua ideia, a equipe entra em contato para alinhar escopo, prazos e valores.
              </p>
            </div>
            <MapRequestForm categories={categories} />
          </Reveal>

          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <Reveal delay={80}>
              <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
                <h2 className="mb-5 font-display text-lg font-bold uppercase text-white">O que acontece depois?</h2>
                <ol className="space-y-5">
                  {[
                    { icon: FileText, title: 'Análise do briefing', text: 'Lemos sua ideia e identificamos os principais requisitos técnicos e criativos.' },
                    { icon: MessageCircle, title: 'Alinhamento', text: 'Entramos em contato para tirar dúvidas e entender escopo, referências e prazos.' },
                    { icon: Clock3, title: 'Proposta comercial', text: 'Enviamos uma proposta com etapas, valores e prazos. Você decide se quer seguir.' },
                  ].map((step, i) => (
                    <li key={step.title} className="flex gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-pink/30 bg-pink/10 text-pink-400"><step.icon className="h-4 w-4" /></div>
                      <div><p className="font-display text-[13px] font-bold uppercase tracking-wide text-white">{i + 1}. {step.title}</p><p className="mt-1.5 text-[13px] leading-relaxed text-mist-400">{step.text}</p></div>
                    </li>
                  ))}
                </ol>
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
                <div className="mb-3 flex items-center gap-2 text-pink-400"><ShieldCheck className="h-5 w-5" /><h2 className="font-display text-base font-bold uppercase text-white">Seus dados</h2></div>
                <p className="text-[13px] leading-relaxed text-mist-400">Coletamos apenas o necessário para responder ao pedido e elaborar a proposta. Os dados ficam restritos ao painel administrativo, não são vendidos nem usados para publicidade e podem ser excluídos mediante solicitação.</p>
                <Link href="/privacidade" className="mt-4 inline-flex items-center gap-1.5 font-display text-[11px] font-bold uppercase tracking-wider text-pink-400 hover:text-white">Política de Privacidade <ArrowUpRight className="h-3.5 w-3.5" /></Link>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
                <div className="mb-3 flex items-center gap-2 text-pink-400"><Mail className="h-5 w-5" /><h2 className="font-display text-base font-bold uppercase text-white">Contato comercial</h2></div>
                {content.contact.commercialEmail || content.contact.email ? (
                  <a href={`mailto:${content.contact.commercialEmail || content.contact.email}`} className="text-sm text-mist-300 underline decoration-pink/50 underline-offset-4 hover:text-white">{content.contact.commercialEmail || content.contact.email}</a>
                ) : (
                  <p className="text-[13px] leading-relaxed text-mist-400">E-mail comercial ainda não configurado. Use o <Link href="/contato" className="text-pink-400 underline">formulário de contato</Link> ou envie sua solicitação por este formulário.</p>
                )}
                {content.contact.discord && <p className="mt-3 text-[13px] text-mist-400">Discord: <span className="text-white">{content.contact.discord}</span></p>}
              </div>
            </Reveal>
          </aside>
        </div>
      </section>
    </>
  );
}
