import type { Metadata } from 'next';
import { PageHero } from '@/components/ui';
import { CartView } from '@/components/CartView';

export const metadata: Metadata = { title: 'Carrinho de compras', description: 'Revise os itens do seu carrinho na loja oficial Venly Esports.' };

export default function CartPage() {
  return (
    <>
      <PageHero label="Venly Store" title="SEU" accent="CARRINHO" breadcrumb="Carrinho" description="Revise os itens, ajuste as quantidades e siga para a finalização do pedido." />
      <section className="section bg-ink-950"><div className="container-wide"><CartView /></div></section>
    </>
  );
}
