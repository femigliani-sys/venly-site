import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowUpRight } from 'lucide-react';
import { getContent } from '@/lib/db';
import { PageHero, Chip } from '@/components/ui';
import { Markdown } from '@/components/Markdown';
import { StatusNote } from '@/components/cards';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Como a Venly Esports coleta, usa, protege e retém dados pessoais neste site, e como exercer seus direitos previstos na LGPD.',
};

export default async function PrivacyPage() {
  const c = await getContent();
  return (
    <>
      <PageHero label="LGPD · Lei nº 13.709/2018" title="POLÍTICA DE" accent="PRIVACIDADE" breadcrumb="Privacidade"
        description="Transparência sobre quais dados este site coleta, por que são necessários e como você pode exercer seus direitos.">
        <div className="flex flex-wrap gap-2.5">
          <Chip pink>Coleta mínima de dados</Chip>
          <Chip>Sem venda de dados</Chip>
          <Chip>Revisão pendente</Chip>
        </div>
      </PageHero>

      <section className="section bg-ink-950">
        <div className="container-wide grid gap-12 lg:grid-cols-[1.5fr_.5fr]">
          <Reveal className="max-w-3xl">
            <StatusNote>{c.legal.privacyNote}</StatusNote>
            <div className="mt-10"><Markdown content={c.legal.privacy} /></div>
          </Reveal>
          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-lg border border-pink/25 bg-gradient-to-b from-pink/[0.08] to-transparent p-6">
              <ShieldCheck className="mb-4 h-7 w-7 text-pink-400" />
              <h2 className="font-display text-lg font-bold uppercase text-white">Exerça seus direitos</h2>
              <p className="mt-3 text-[13px] leading-relaxed text-mist-300">Solicite acesso, correção, exclusão ou informações sobre o tratamento dos seus dados pelo canal de contato.</p>
              <Link href="/contato?assunto=privacidade" className="btn-primary btn-sm mt-5 w-full">Abrir solicitação <ArrowUpRight className="h-3.5 w-3.5" /></Link>
              {c.contact.privacyEmail && <p className="mt-4 text-xs text-mist-400">Ou escreva para <a href={`mailto:${c.contact.privacyEmail}`} className="text-pink-400 underline">{c.contact.privacyEmail}</a>.</p>}
            </div>
            <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
              <h2 className="mb-3 font-display text-base font-bold uppercase text-white">Documentos relacionados</h2>
              <ul className="space-y-2.5 text-sm text-mist-400">
                <li><Link href="/cookies" className="hover:text-pink-400">Política de Cookies →</Link></li>
                <li><Link href="/termos" className="hover:text-pink-400">Termos de Uso →</Link></li>
                <li><Link href="/contato" className="hover:text-pink-400">Canal de contato →</Link></li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
