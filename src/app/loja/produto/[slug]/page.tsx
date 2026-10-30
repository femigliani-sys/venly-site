import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug, getProducts } from '@/lib/queries';
import { ProductDetail } from '@/components/ProductDetail';
import { ProductCard } from '@/components/ProductCard';
import { Reveal } from '@/components/Reveal';
import { truncate } from '@/lib/utils';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Produto não encontrado' };
  return { title: product.name, description: truncate(product.description || `Produto oficial ${product.name} da Venly Esports.`, 155) };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = (await getProducts({ category: product.category })).filter((p) => p.id !== product.id).slice(0, 4);
  const paymentsEnabled = Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN);

  return (
    <>
      <section className="section bg-ink-950 pt-32 sm:pt-40">
        <div className="container-wide"><ProductDetail product={product} paymentsEnabled={paymentsEnabled} /></div>
      </section>
      {related.length > 0 && (
        <section className="section border-t border-white/10 bg-ink-900">
          <div className="container-wide">
            <h2 className="heading-md mb-10 text-white">Você também pode <span className="text-gradient">gostar</span></h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p, i) => <Reveal key={p.id} delay={i * 70}><ProductCard product={p} /></Reveal>)}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
