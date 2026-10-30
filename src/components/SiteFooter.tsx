'use client';
import Link from 'next/link';
import { ArrowUpRight, Cookie, Instagram, Youtube, Twitch, Music2, Gamepad2, AtSign, Mail } from 'lucide-react';
import type { SocialLink } from '@/lib/types';
import { Logo } from './ui';
import { useConsent } from './ConsentProvider';

const SOCIAL_ICONS: Record<string, React.ElementType> = {
  Instagram, 'X / Twitter': AtSign, TikTok: Music2, YouTube: Youtube, Twitch, Discord: Gamepad2,
};

export function SiteFooter({ socials, note, email }: { socials: SocialLink[]; note: string; email: string }) {
  const { openPreferences } = useConsent();
  const year = new Date().getFullYear();
  const configured = socials.filter((s) => s.url);

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#06060C]">
      <div className="pointer-events-none absolute -bottom-40 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-pink/[0.07] blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-30" />
      <div className="container-wide relative py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="mb-6 inline-flex items-center gap-3">
              <Logo size={52} />
              <span className="font-display text-2xl font-bold uppercase leading-none text-white">VENLY<br /><span className="text-xs tracking-[0.42em] text-pink-400">ESPORTS</span></span>
            </Link>
            <p className="text-sm leading-relaxed text-mist-400">Comunidade, competitividade e criação de mapas. Uma organização de esports construída para jogar em outro nível.</p>
            <p className="mt-5 text-xs leading-relaxed text-mist-500">{note}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {socials.map((social) => {
                const Icon = SOCIAL_ICONS[social.label] || ArrowUpRight;
                const content = <><Icon className="h-4 w-4" /><span className="sr-only">{social.label}</span></>;
                return social.url
                  ? <a key={social.label} href={social.url} target="_blank" rel="noopener noreferrer" title={social.label}
                      className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/10 text-mist-300 transition-all hover:-translate-y-0.5 hover:border-pink hover:bg-pink/10 hover:text-pink-400">{content}</a>
                  : <span key={social.label} title={`${social.label} — link pendente`} aria-label={`${social.label}: link pendente`}
                      className="flex h-9 w-9 items-center justify-center rounded-sm border border-dashed border-white/10 text-mist-500/60">{content}</span>;
              })}
            </div>
            {configured.length === 0 && <p className="mt-3 text-[11px] text-mist-500">Redes oficiais: links pendentes de configuração.</p>}
          </div>

          <div>
            <h3 className="mb-5 font-display text-[11px] font-bold uppercase tracking-[0.24em] text-pink-400">Navegação</h3>
            <ul className="space-y-3 text-sm text-mist-400">
              {[['Início', '/'], ['Venly Creates', '/creates'], ['Loja oficial', '/loja'], ['Equipe', '/equipe'], ['Sobre nós', '/sobre'], ['Contato', '/contato']].map(([label, href]) => (
                <li key={href}><Link href={href} className="transition-colors hover:text-pink-400">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-5 font-display text-[11px] font-bold uppercase tracking-[0.24em] text-pink-400">Venly Creates</h3>
            <ul className="space-y-3 text-sm text-mist-400">
              <li><Link href="/creates" className="transition-colors hover:text-pink-400">Portfólio de mapas</Link></li>
              <li><Link href="/solicitar-mapa" className="transition-colors hover:text-pink-400">Solicite seu mapa</Link></li>
              <li><Link href="/contato" className="transition-colors hover:text-pink-400">Parcerias</Link></li>
              <li><Link href="/carrinho" className="transition-colors hover:text-pink-400">Meu carrinho</Link></li>
              <li><Link href="/checkout" className="transition-colors hover:text-pink-400">Checkout</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-5 font-display text-[11px] font-bold uppercase tracking-[0.24em] text-pink-400">Institucional</h3>
            <ul className="space-y-3 text-sm text-mist-400">
              <li><Link href="/privacidade" className="transition-colors hover:text-pink-400">Política de Privacidade</Link></li>
              <li><Link href="/cookies" className="transition-colors hover:text-pink-400">Política de Cookies</Link></li>
              <li><Link href="/termos" className="transition-colors hover:text-pink-400">Termos de Uso</Link></li>
              <li><button type="button" onClick={openPreferences} className="inline-flex items-center gap-1.5 text-left transition-colors hover:text-pink-400"><Cookie className="h-3.5 w-3.5" /> Preferências de cookies</button></li>
              <li><Link href="/admin" className="transition-colors hover:text-pink-400">Painel administrativo</Link></li>
            </ul>
            <div className="mt-6 space-y-2 text-xs text-mist-500">
              {email ? <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-pink-400"><Mail className="h-3.5 w-3.5" /> {email}</a>
                : <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> E-mail oficial pendente</span>}
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-7 text-xs text-mist-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Venly Esports. Todos os direitos reservados.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacidade" className="hover:text-pink-400">Privacidade</Link>
            <Link href="/cookies" className="hover:text-pink-400">Cookies</Link>
            <Link href="/termos" className="hover:text-pink-400">Termos</Link>
            <button type="button" onClick={openPreferences} className="inline-flex items-center gap-1.5 hover:text-pink-400"><Cookie className="h-3.5 w-3.5" /> Preferências de cookies</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
