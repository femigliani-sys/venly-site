import type { Metadata } from 'next';
import { getContent } from '@/lib/db';
import { PageHero, Chip } from '@/components/ui';
import { Markdown } from '@/components/Markdown';
import { StatusNote } from '@/components/cards';
import { Reveal } from '@/components/Reveal';

export const metadata: Metadata = { title: 'Termos de Uso', description: 'Termos de Uso do site Venly Esports, incluindo conteúdo demonstrativo, solicitações de mapas, loja e pagamentos.' };

export default async function TermsPage() {
  const c = await getContent();
  return (
    <>
      <PageHero label="Documentos oficiais" title="TERMOS DE" accent="USO" breadcrumb="Termos de Uso"
        description="Condições de uso deste site, dos formulários, do portfólio e da loja oficial.">
        <div className="flex flex-wrap gap-2.5"><Chip pink>Versão inicial</Chip><Chip>Revisão antes da publicação</Chip></div>
      </PageHero>
      <section className="section bg-ink-950">
        <div className="container-wide max-w-4xl">
          <Reveal>
            <StatusNote>Este texto é uma versão inicial e descreve o funcionamento atual do site. Deve ser revisado antes da publicação definitiva, especialmente após a definição dos dados societários, canais oficiais e integrações de pagamento.</StatusNote>
            <div className="mt-10"><Markdown content={c.legal.terms} /></div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
