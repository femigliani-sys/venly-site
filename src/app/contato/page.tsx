import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, Gamepad2, ArrowUpRight, ShieldCheck, Handshake, Layers3 } from 'lucide-react';
import { getContent } from '@/lib/db';
import { PageHero, Chip } from '@/components/ui';
import { ContactForm } from '@/components/forms/ContactForm';
import { Reveal } from '@/components/Reveal';
import { isValidHttpUrl } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Contato — Venly Esports',
  description: 'Fale com a Venly Esports: contato comercial, parcerias, solicitações de mapas e assuntos de privacidade.',
};

const SUBJECT_MAP: Record<string, string> = { parcerias: 'Parcerias', mapas: 'Mapas personalizados', privacidade: 'Privacidade e dados pessoais', loja: 'Loja e pedidos' };

export default async function ContactPage({ searchParams }: { searchParams: Promise<{ assunto?: string }> }) {
  const { assunto } = await searchParams;
  const c = (await getContent()).contact;
  const defaultSubject = assunto ? SUBJECT_MAP[assunto] : undefined;
  const socials = c.socials.filter((s) => s.url && isValidHttpUrl(s.url));

  return (
    <>
      <PageHero label="Fale com a gente" title="VAMOS" accent="CONVERSAR" breadcrumb="Contato"
        description="Comercial, parcerias, projetos especiais e assuntos de privacidade. Escolha o melhor canal e envie sua mensagem." />

      <section className="section bg-ink-950">
        <div className="container-wide grid gap-12 lg:grid-cols-[1.25fr_.75fr]">
          <Reveal>
            <div className="mb-9 rounded-lg border border-white/10 bg-ink-850 p-6 sm:p-8">
              <h2 className="heading-md text-white">Envie sua mensagem</h2>
              <p className="text-muted mt-3 text-sm">Responderemos pelo e-mail informado. Coletamos apenas os dados necessários para responder sua solicitação.</p>
              <div className="mt-7"><ContactForm defaultSubject={defaultSubject} /></div>
            </div>
          </Reveal>

          <aside className="space-y-5">
            <Reveal delay={80}>
              <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
                <h2 className="mb-5 font-display text-lg font-bold uppercase text-white">Contato comercial</h2>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-pink-400" />
                    {c.commercialEmail || c.email
                      ? <a href={`mailto:${c.commercialEmail || c.email}`} className="break-all text-mist-300 hover:text-pink-400">{c.commercialEmail || c.email}</a>
                      : <p className="text-mist-400">E-mail comercial <span className="text-amber-300">pendente de configuração</span>. Use o formulário ao lado.</p>}
                  </div>
                  <div className="flex items-start gap-3"><Gamepad2 className="mt-0.5 h-4 w-4 shrink-0 text-pink-400" />
                    {c.discord ? <span className="text-mist-300">{c.discord}</span> : <p className="text-mist-400">Discord oficial <span className="text-amber-300">pendente de configuração</span>.</p>}
                  </div>
                  <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-pink-400" />
                    {c.privacyEmail ? <a href={`mailto:${c.privacyEmail}`} className="break-all text-mist-300 hover:text-pink-400">{c.privacyEmail}</a>
                      : <p className="text-mist-400">Para assuntos de privacidade, use o formulário com o assunto <strong className="text-mist-200">Privacidade e dados pessoais</strong>.</p>}
                  </div>
                </div>
                <p className="mt-5 border-t border-white/10 pt-4 text-[12px] leading-relaxed text-mist-500">{c.pendingNote}</p>
              </div>
            </Reveal>

            <Reveal delay={140}>
              <div className="rounded-lg border border-pink/25 bg-gradient-to-b from-pink/[0.08] to-transparent p-6">
                <h2 className="mb-4 font-display text-lg font-bold uppercase text-white">Atalhos rápidos</h2>
                <div className="space-y-2.5">
                  <Link href="/solicitar-mapa" className="btn-primary btn-sm w-full"><Layers3 className="h-4 w-4" /> Solicitar um mapa</Link>
                  <Link href="/contato?assunto=parcerias" className="btn-outline btn-sm w-full"><Handshake className="h-4 w-4" /> Falar sobre parcerias</Link>
                  <Link href="/contato?assunto=privacidade" className="btn-outline btn-sm w-full"><ShieldCheck className="h-4 w-4" /> Privacidade e LGPD</Link>
                </div>
              </div>
            </Reveal>

            <Reveal delay={200}>
              <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
                <h2 className="mb-4 font-display text-lg font-bold uppercase text-white">Redes sociais</h2>
                {socials.length ? (
                  <ul className="space-y-2.5">
                    {socials.map((s) => <li key={s.label}><a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-mist-300 hover:text-pink-400">{s.label} <ArrowUpRight className="h-3.5 w-3.5" /></a></li>)}
                  </ul>
                ) : (
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">{c.socials.map((s) => <Chip key={s.label}>{s.label}: pendente</Chip>)}</div>
                    <p className="text-[13px] leading-relaxed text-mist-400">Os links oficiais ainda não foram informados. Eles podem ser configurados no painel administrativo sem alterar o código.</p>
                  </div>
                )}
              </div>
            </Reveal>
          </aside>
        </div>
      </section>
    </>
  );
}
