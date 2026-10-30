'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { Logo } from './ui';
import { useCart } from './CartProvider';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Início' },
  { href: '/creates', label: 'Venly Creates' },
  { href: '/loja', label: 'Loja' },
  { href: '/equipe', label: 'Equipe' },
  { href: '/sobre', label: 'Sobre' },
  { href: '/contato', label: 'Contato' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { count, hydrated } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) return null;

  return (
    <>
      <header className={cn('fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled ? 'border-b border-white/10 bg-[#06060B]/90 backdrop-blur-xl' : 'border-b border-transparent bg-gradient-to-b from-black/70 to-transparent')}>
        <div className="container-wide flex h-[74px] items-center justify-between gap-6">
          <Link href="/" className="group flex items-center gap-3" aria-label="Venly Esports — página inicial">
            <Logo size={40} priority className="ring-1 ring-white/15 transition-all group-hover:ring-pink/60" />
            <span className="hidden font-display text-[19px] font-bold uppercase leading-[0.9] tracking-[0.02em] text-white sm:block">
              VENLY<br /><span className="text-[10px] tracking-[0.42em] text-pink-400">ESPORTS</span>
            </span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href}
                className={cn('relative px-3.5 py-2 font-display text-[12px] font-bold uppercase tracking-[0.1em] transition-colors',
                  isActive(item.href) ? 'text-white' : 'text-mist-400 hover:text-white')}>
                {item.label}
                <span className={cn('absolute inset-x-3.5 bottom-0 h-px origin-left bg-pink transition-transform duration-300', isActive(item.href) ? 'scale-x-100' : 'scale-x-0 hover:scale-x-100')} />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/carrinho" aria-label={`Carrinho com ${count} itens`}
              className="relative flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 text-mist-300 transition-all hover:border-pink/60 hover:text-white">
              <ShoppingBag className="h-[18px] w-[18px]" />
              {hydrated && count > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-pink px-1 font-display text-[10px] font-bold text-white">{count > 99 ? '99+' : count}</span>}
            </Link>
            <Link href="/solicitar-mapa" className="btn-primary btn-sm hidden xl:inline-flex">Solicitar mapa <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            <button type="button" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Fechar menu' : 'Abrir menu'} aria-expanded={open}
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-white/10 text-white transition-colors hover:border-pink/60 lg:hidden">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={cn('fixed inset-0 z-40 bg-[#050509]/98 backdrop-blur-xl transition-all duration-300 lg:hidden', open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0')}
        aria-hidden={!open}>
        <div className="grid-bg absolute inset-0 opacity-40" />
        <nav aria-label="Navegação móvel" className="container-wide relative flex h-full flex-col justify-center gap-1 pt-16">
          {NAV.map((item, index) => (
            <Link key={item.href} href={item.href}
              style={{ transitionDelay: `${index * 40}ms` }}
              className={cn('flex items-center justify-between border-b border-white/10 py-4 font-display text-3xl font-bold uppercase tracking-tight transition-all duration-300',
                open ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0', isActive(item.href) ? 'text-pink-400' : 'text-white hover:text-pink-400')}>
              {item.label}<ArrowUpRight className="h-5 w-5 opacity-50" />
            </Link>
          ))}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/solicitar-mapa" className="btn-primary btn-sm">Solicitar mapa</Link>
            <Link href="/carrinho" className="btn-outline btn-sm">Ver carrinho</Link>
          </div>
          <p className="mt-10 font-display text-[11px] uppercase tracking-[0.24em] text-mist-500">VENLY ESPORTS · COMUNIDADE & CRIAÇÃO</p>
        </nav>
      </div>
    </>
  );
}
