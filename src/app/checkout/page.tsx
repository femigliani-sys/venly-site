import type { Metadata } from 'next';
import { PageHero, Chip } from '@/components/ui';
import { CheckoutForm } from '@/components/forms/CheckoutForm';

export const metadata: Metadata = { title: 'Finalizar pedido — Checkout', description: 'Finalize seu pedido na loja oficial Venly Esports.', robots: { index: false, follow: false } };

export default function CheckoutPage() {
  const paymentsEnabled = Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN);
  return (
    <>
      <PageHero label="Venly Store · Finalização" title="FINALIZAR" accent="PEDIDO" breadcrumb="Checkout"
        description="Confira os itens, informe os dados de entrega e registre seu pedido.">
        <div className="flex flex-wrap gap-2.5">
          <Chip pink={!paymentsEnabled} className={paymentsEnabled ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : ''}>
            {paymentsEnabled ? 'Pagamento configurado' : 'Checkout não ativado'}
          </Chip>
          <Chip>Dados protegidos</Chip>
        </div>
      </PageHero>
      <section className="section bg-ink-950">
        <div className="container-wide"><CheckoutForm paymentsEnabled={paymentsEnabled} /></div>
      </section>
    </>
  );
}
