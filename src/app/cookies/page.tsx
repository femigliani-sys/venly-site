import type { Metadata } from 'next';
import Link from 'next/link';
import { Cookie, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { getContent } from '@/lib/db';
import { PageHero, Chip } from '@/components/ui';
import { Markdown } from '@/components/Markdown';
import { ConsentStatus } from '@/components/ConsentProvider';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: 'Categorias de cookies usadas pela Venly Esports, gerenciamento de consentimento e como alterar suas preferências.',
};

export default async function CookiesPage() {
  const c = await getContent();
  return (
    <>
      <PageHero label="Privacidade · Consentimento" title="POLÍTICA DE" accent="COOKIES" breadcrumb="Cookies"
        description="Entenda quais tecnologias são necessárias para o site funcionar e como as categorias opcionais são tratadas.">
        <div className="flex flex-wrap gap-2.5">
          <Chip pink>Necessários sempre ativos</Chip>
          <Chip>Opcionais desativados por padrão</Chip>
          <Chip>Versão {c.consent.version}</Chip>
        </div>
      </PageHero>

      <section className="section bg-ink-950">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-[1.5fr_.7fr]">
            <Reveal className="max-w-3xl">
              <div className="mb-10 flex items-start gap-4 rounded-sm border border-pink/25 bg-pink/[0.06] p-5">
                <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-pink-400" />
                <p className="text-[14px] leading-relaxed text-pink-100">{c.consent.policyText}</p>
              </div>
              <Markdown content={c.legal.cookiesPolicy} />
            </Reveal>
            <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
              <ConsentStatus />
              <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
                <ShieldCheck className="mb-4 h-6 w-6 text-pink-400" />
                <h2 className="font-display text-lg font-bold uppercase text-white">Como testamos</h2>
                <ol className="mt-3 space-y-3 text-[13px] leading-relaxed text-mist-400">
                  <li><strong className="text-white">1.</strong> Abra o site em uma janela privada e recuse os cookies não essenciais. O campo “Scripts opcionais ativos” deve permanecer em 0.</li>
                  <li><strong className="text-white">2.</strong> Aceite todos: as categorias mudam e, se houver ferramentas configuradas, seus scripts passam a ser carregados.</li>
                  <li><strong className="text-white">3.</strong> Use “Alterar preferências” ou “Retirar consentimento” para desativar novamente.</li>
                  <li><strong className="text-white">4.</strong> No console do navegador, <code className="text-pink-400">window.__VENLY_CONSENT__</code> mostra o estado aplicado.</li>
                </ol>
              </div>
              <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
                <h2 className="mb-3 font-display text-base font-bold uppercase text-white">Links úteis</h2>
                <ul className="space-y-2.5 text-sm text-mist-400">
                  <li><Link href="/privacidade" className="hover:text-pink-400">Política de Privacidade <ArrowUpRight className="inline h-3 w-3" /></Link></li>
                  <li><Link href="/termos" className="hover:text-pink-400">Termos de Uso <ArrowUpRight className="inline h-3 w-3" /></Link></li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
