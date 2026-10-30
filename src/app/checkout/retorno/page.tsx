import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, Clock3, AlertTriangle } from 'lucide-react';
import { PageHero } from '@/components/ui';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = { title: 'Retorno do pagamento', robots: { index: false, follow: false } };

export default async function PaymentReturnPage({ searchParams }: { searchParams: Promise<{ status?: string; pedido?: string }> }) {
  const { status, pedido } = await searchParams;
  const approved = status === 'success';
  const pending = status === 'pending';
  const Icon = approved ? CheckCircle2 : pending ? Clock3 : AlertTriangle;
  const color = approved ? 'text-emerald-400' : pending ? 'text-amber-300' : 'text-red-400';
  const title = approved ? 'Pagamento em análise' : pending ? 'Pagamento pendente' : 'Pagamento não concluído';
  const description = approved
    ? 'Recebemos o retorno do gateway. A confirmação definitiva acontece quando o pagamento é aprovado e processado pelo provedor.'
    : pending
      ? 'Seu pagamento está pendente de confirmação pelo provedor. Assim que houver atualização, o status do pedido é atualizado.'
      : 'Não foi possível concluir o pagamento. Nenhuma cobrança foi confirmada. Você pode tentar novamente ou falar com a equipe.';

  return (
    <>
      <PageHero label="Venly Store · Retorno" title="STATUS DO" accent="PAGAMENTO" breadcrumb="Checkout" />
      <section className="section bg-ink-950">
        <div className="container-wide max-w-3xl">
          <Reveal className="rounded-lg border border-white/10 bg-ink-850 p-8 sm:p-10">
            <Icon className={`mb-6 h-12 w-12 ${color}`} />
            <h2 className="heading-md text-white">{title}</h2>
            <p className="text-muted mt-4">{description}</p>
            {pedido && <p className="mt-6 inline-block rounded-sm border border-white/10 bg-black/40 px-4 py-2 font-display text-sm uppercase tracking-widest text-pink-400">Pedido {pedido}</p>}
            <p className="mt-6 text-[13px] leading-relaxed text-mist-500">Este retorno não substitui a confirmação do gateway. O status oficial do pedido é atualizado pela notificação de pagamento (webhook) quando a integração está configurada.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/loja" className="btn-primary btn-sm">Voltar à loja</Link>
              <Link href="/contato" className="btn-outline btn-sm">Falar com a equipe</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
