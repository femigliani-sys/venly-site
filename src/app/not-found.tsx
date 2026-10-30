import Link from 'next/link';
import { ArrowLeft, SearchX } from 'lucide-react';
import { Logo } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-ink-950 px-5 py-28">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-50" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink/15 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-[#050509] to-transparent" />
      <div className="relative max-w-xl text-center">
        <Logo size={64} className="mx-auto mb-8" priority />
        <p className="eyebrow mb-4 flex justify-center gap-3"><span className="h-px w-8 self-center bg-pink" /> ERRO 404 <span className="h-px w-8 self-center bg-pink" /></p>
        <h1 className="heading-lg text-white">PÁGINA <span className="text-gradient">NÃO ENCONTRADA</span></h1>
        <p className="text-muted mx-auto mt-6 max-w-md">O endereço que você tentou acessar não existe ou foi movido. Volte para a página inicial e continue explorando o universo Venly.</p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary btn-sm"><ArrowLeft className="h-3.5 w-3.5" /> Voltar ao início</Link>
          <Link href="/creates" className="btn-outline btn-sm"><SearchX className="h-3.5 w-3.5" /> Ver portfólio</Link>
        </div>
      </div>
    </div>
  );
}
