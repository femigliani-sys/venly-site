'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RotateCcw, AlertTriangle, ArrowLeft, Database, ExternalLink } from 'lucide-react';

type Health = {
  database?: string;
  databaseMessage?: string;
  databaseHint?: string;
  storage?: string;
};

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [health, setHealth] = useState<Health | null>(null);

  // Em produção o Next não expõe a mensagem do servidor no cliente. Consultamos
  // /api/health para saber se o problema é de configuração (banco/Storage) e,
  // se for, mostramos o passo a passo — em vez de um "erro inesperado" genérico.
  useEffect(() => {
    fetch('/api/health', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => setHealth(json?.data ?? null))
      .catch(() => setHealth(null));
  }, []);

  const databaseDown = health?.database === 'error';

  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden bg-ink-950 px-5 py-28">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-40" />
      <div className={databaseDown ? 'relative w-full max-w-2xl' : 'relative max-w-lg text-center'}>
        <AlertTriangle className={`${databaseDown ? '' : 'mx-auto'} mb-6 h-12 w-12 text-pink-400`} />
        <p className="eyebrow mb-3">ALGO DEU ERRADO</p>
        <h1 className="heading-md text-white">{databaseDown ? 'BANCO DE DADOS NÃO CONFIGURADO' : 'NÃO FOI POSSÍVEL CARREGAR'}</h1>

        {databaseDown ? (
          <div className="mt-5 space-y-4 text-left text-[14px] leading-relaxed text-mist-300">
            <p>
              O site subiu, mas não conseguiu falar com o Postgres/Supabase. Isso normalmente acontece quando
              <code className="mx-1 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[12px] text-pink-300">DATABASE_URL</code>
              não está definida ou o schema ainda não foi aplicado.
            </p>
            {health?.databaseMessage && (
              <p className="rounded-sm border border-red-400/30 bg-red-500/10 px-4 py-3 font-mono text-[12px] text-red-200">
                {health.databaseMessage}
              </p>
            )}
            <ol className="list-decimal space-y-2 pl-5">
              <li>No Supabase: <strong>Project Settings → Database → Connection string (URI)</strong> e copie a URL.</li>
              <li>Cole em <code className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[12px]">DATABASE_URL</code> no <code className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[12px]">.env.local</code> (ou na Vercel → Settings → Environment Variables).</li>
              <li>Rode <code className="rounded bg-black/60 px-1.5 py-0.5 font-mono text-[12px]">npm run db:migrate</code> para criar as tabelas e os buckets.</li>
              <li>Recarregue esta página.</li>
            </ol>
            {health?.databaseHint && <p className="text-[13px] text-mist-500">{health.databaseHint}</p>}
            <p className="text-[13px] text-mist-500">
              O passo a passo completo (com todas as chaves) está no README, seção “Chaves que você precisa configurar”.
            </p>
          </div>
        ) : (
          <p className="text-muted mt-5">Ocorreu um erro inesperado ao exibir esta página. Tente novamente ou volte para a página inicial.</p>
        )}

        {error.digest && <p className="mt-4 font-mono text-[11px] text-mist-500">Código: {error.digest}</p>}

        <div className={`mt-8 flex flex-wrap gap-3 ${databaseDown ? '' : 'justify-center'}`}>
          <button type="button" onClick={reset} className="btn-primary btn-sm"><RotateCcw className="h-3.5 w-3.5" /> Tentar novamente</button>
          <Link href="/" className="btn-outline btn-sm"><ArrowLeft className="h-3.5 w-3.5" /> Página inicial</Link>
          <a href="/api/health" className="btn-outline btn-sm" target="_blank" rel="noreferrer">
            <Database className="h-3.5 w-3.5" /> Diagnóstico <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
