import type { Metadata } from 'next';
import { getContent } from '@/lib/db';
import { getProducts, getCategories } from '@/lib/queries';
import { PageHero, Chip } from '@/components/ui';
import { StoreCatalog } from '@/components/StoreCatalog';
import { StatusNote } from '@/components/cards';
import { Reveal } from '@/components/Reveal';
import { LockKeyhole, Truck, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Loja Oficial — Venly Store',
  description: 'Loja oficial da Venly Esports: camisetas, jerseys, moletons, bonés e acessórios gamer. Catálogo com filtros e carrinho de compras.',
};

export default async function StorePage() {
  const content = await getContent();
  const products = await getProducts();
  const categories = (await getCategories('product')).map((c) => c.name);
  const paymentsEnabled = Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN);

  return (
    <>
      <PageHero label="Venly Store" title="LOJA" accent="OFICIAL" breadcrumb="Loja" description={content.store.intro}>
        <div className="flex flex-wrap gap-2.5">
          <Chip pink>Produtos oficiais</Chip>
          <Chip>Pagamento em BRL</Chip>
          <Chip>{paymentsEnabled ? 'Checkout configurado' : 'Checkout não ativado'}</Chip>
        </div>
      </PageHero>

      <section className="section bg-ink-950">
        <div className="container-wide">
          <Reveal><StatusNote>{content.store.notice}</StatusNote></Reveal>
          <div className="mt-10"><StoreCatalog products={products} categories={categories} /></div>
        </div>
      </section>

      <section className="section-tight border-t border-white/10 bg-ink-900">
        <div className="container-wide grid gap-6 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: 'Compra transparente', text: 'Preços em reais, estoque visível e resumo do pedido antes de finalizar.' },
            { icon: Truck, title: 'Entrega', text: 'Coletamos apenas os dados de endereço necessários para a entrega.' },
            { icon: LockKeyhole, title: 'Pagamento seguro', text: 'Nenhum dado de cartão é armazenado no site; o gateway trata o pagamento.' },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 80}>
              <div className="flex gap-4 rounded-sm border border-white/10 bg-white/[0.02] p-5">
                <item.icon className="h-6 w-6 shrink-0 text-pink-400" />
                <div><h2 className="font-display text-base font-bold uppercase text-white">{item.title}</h2><p className="mt-1.5 text-[13px] leading-relaxed text-mist-400">{item.text}</p></div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
