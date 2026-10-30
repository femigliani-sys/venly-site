import type { Metadata } from 'next';
import { PageHero, SectionHeading, EmptyState, Chip } from '@/components/ui';
import { MemberCard } from '@/components/cards';
import { getMembers, getCategories } from '@/lib/queries';
import { Reveal } from '@/components/Reveal';
import { Users, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Integrantes e equipe', description: 'Conheça os integrantes oficiais da Venly Esports: direção, jogadores, criadores e equipe de desenvolvimento de mapas.' };

export default async function TeamPage() {
  const members = await getMembers();
  const categories = await getCategories('member');
  const grouped = categories.map((c) => ({ category: c.name, people: members.filter((m) => m.category === c.name) }));
  const uncategorized = members.filter((m) => !categories.some((c) => c.name === m.category));

  return (
    <>
      <PageHero label="Pessoas por trás da marca" title="NOSSA" accent="EQUIPE" breadcrumb="Equipe"
        description="Integrantes oficiais da Venly Esports, organizados por área de atuação. Os perfis são cadastrados e mantidos pelo painel administrativo." />

      <section className="section bg-ink-950">
        <div className="container-wide">
          <Reveal><SectionHeading label="Áreas de atuação" title="Uma equipe," accent="várias funções" description="As categorias abaixo são configuráveis. Cada integrante pode ter foto, nickname, função, jogo principal, descrição e links oficiais." /></Reveal>
          <div className="mt-9 flex flex-wrap gap-2.5">
            {categories.map((c) => <Chip key={c.id} pink>{c.name}</Chip>)}
          </div>

          {members.length === 0 ? (
            <Reveal delay={100} className="mt-12">
              <EmptyState icon={<Users className="h-6 w-6" />} title="Nenhum integrante cadastrado ainda"
                description="Para não divulgar informações não oficiais, esta página está vazia até que os perfis reais sejam adicionados pelo painel administrativo. As categorias já estão prontas para receber os integrantes."
                action={<Link href="/sobre" className="btn-outline btn-sm">Conheça a organização <ArrowUpRight className="h-3.5 w-3.5" /></Link>} />
            </Reveal>
          ) : (
            <div className="mt-14 space-y-16">
              {[...grouped, ...(uncategorized.length ? [{ category: 'Outros', people: uncategorized }] : [])]
                .filter((g) => g.people.length > 0)
                .map((group, gi) => (
                  <div key={group.category}>
                    <Reveal className="mb-8 flex items-center gap-4">
                      <span className="font-display text-sm font-bold text-pink/50">0{gi + 1}</span>
                      <h2 className="heading-md text-white">{group.category}</h2>
                      <span className="h-px flex-1 bg-gradient-to-r from-pink/40 to-transparent" />
                      <span className="font-display text-xs text-mist-500">{group.people.length} {group.people.length === 1 ? 'integrante' : 'integrantes'}</span>
                    </Reveal>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      {group.people.map((member, i) => <Reveal key={member.id} delay={i * 70}><MemberCard member={member} /></Reveal>)}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
