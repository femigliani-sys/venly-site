'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, Map as MapIcon, Tags, ClipboardList, ShoppingBag, ReceiptText, Users, FileText,
  ShieldCheck, Settings, LogOut, Plus, Pencil, Trash2, ExternalLink, ArrowUpRight, Download,
  CheckCircle2, AlertTriangle, Database, Mail, CreditCard, Cookie, LockKeyhole, ArrowUp, ArrowDown, UploadCloud,
} from 'lucide-react';
import type { SiteContent, MapProject, Product, Member, Category, SocialLink } from '@/lib/types';
import { formatBRL, formatDate, slugify, cn } from '@/lib/utils';
import { adminFetch } from './api';
import { RecordEditor, type Field } from './RecordEditor';
import { ContentTab } from './ContentTab';
import { ButtonSpinner } from '@/components/forms/parts';

type Row = Record<string, unknown> & { id: number };
export type AdminData = {
  stats: { maps: number; products: number; members: number; requests: number; newRequests: number; orders: number; contacts: number; newContacts: number; paidRevenueCents: number };
  content: SiteContent;
  categories: Category[];
  maps: MapProject[];
  products: Product[];
  members: Member[];
  requests: Row[];
  orders: Row[];
  contacts: Row[];
  consents: Row[];
  config: { paymentsConfigured: boolean; mailConfigured: boolean; analyticsIdConfigured: boolean; adsConfigured: boolean; adminEmail: string; databaseConfigured: boolean; storageConfigured: boolean; storageMode: string };
};

const TABS = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'maps', label: 'Mapas', icon: MapIcon },
  { id: 'categories', label: 'Categorias', icon: Tags },
  { id: 'requests', label: 'Solicitações', icon: ClipboardList },
  { id: 'products', label: 'Produtos', icon: ShoppingBag },
  { id: 'orders', label: 'Pedidos', icon: ReceiptText },
  { id: 'members', label: 'Integrantes', icon: Users },
  { id: 'contacts', label: 'Mensagens', icon: Mail },
  { id: 'content', label: 'Conteúdo', icon: FileText },
  { id: 'consents', label: 'Consentimentos', icon: ShieldCheck },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

const REQUEST_STATUS = ['Nova', 'Em análise', 'Proposta enviada', 'Em negociação', 'Aprovada', 'Concluída', 'Arquivada'];
const ORDER_STATUS = ['Aguardando pagamento', 'Pago', 'Em preparação', 'Enviado', 'Entregue', 'Cancelado'];
const PAYMENT_STATUS = ['not_started', 'pending', 'approved', 'rejected', 'refunded'];
const CONTACT_STATUS = ['Nova', 'Em atendimento', 'Respondida', 'Arquivada'];

type EditorState = { resource: string; entity: Row | null; title: string } | null;

export function AdminApp({ initial }: { initial: AdminData }) {
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState('overview');
  const [editor, setEditor] = useState<EditorState>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  function flash(type: 'success' | 'error', text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4200);
  }
  async function reload() {
    const next = await adminFetch<AdminData>('/api/admin/bootstrap');
    setData(next);
  }
  const categoryOptions = (type: string) => data.categories.filter((c) => c.type === type).map((c) => ({ value: c.name, label: c.name }));

  function openNew(resource: string) {
    const titles: Record<string, string> = { maps: 'Novo mapa', products: 'Novo produto', members: 'Novo integrante', categories: 'Nova categoria' };
    setErrors({}); setEditor({ resource, entity: null, title: titles[resource] || 'Novo registro' });
  }
  function openEdit(resource: string, entity: Row) {
    const titles: Record<string, string> = { maps: 'Editar mapa', products: 'Editar produto', members: 'Editar integrante', categories: 'Editar categoria' };
    setErrors({}); setEditor({ resource, entity, title: titles[resource] || 'Editar registro' });
  }

  async function saveRecord(payload: Record<string, unknown>) {
    if (!editor) return;
    const { resource, entity } = editor;
    if ((resource === 'maps' || resource === 'products') && !String(payload.slug || '').trim()) {
      payload.slug = slugify(String(payload.title || payload.name || 'projeto'));
    }
    setBusy(true); setErrors({});
    try {
      await adminFetch(entity ? `/api/admin/${resource}/${entity.id}` : `/api/admin/${resource}`, {
        method: entity ? 'PATCH' : 'POST', body: JSON.stringify(payload),
      });
      await reload(); setEditor(null); flash('success', 'Registro salvo com sucesso.');
    } catch (e) {
      const err = e as Error & { fields?: Record<string, string> };
      setErrors(err.fields || {}); flash('error', err.message);
    } finally { setBusy(false); }
  }

  async function removeRecord(resource: string, id: number, label: string) {
    if (!window.confirm(`Excluir "${label}"? Esta ação não pode ser desfeita.`)) return;
    setBusy(true);
    try { await adminFetch(`/api/admin/${resource}/${id}`, { method: 'DELETE' }); await reload(); flash('success', 'Registro excluído.'); }
    catch (e) { flash('error', (e as Error).message); }
    finally { setBusy(false); }
  }

  async function patchStatus(resource: string, id: number, payload: Record<string, unknown>) {
    try { await adminFetch(`/api/admin/${resource}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }); await reload(); flash('success', 'Status atualizado.'); }
    catch (e) { flash('error', (e as Error).message); }
  }

  /** Reordering: swap the display order of two records using full validated payloads. */
  function entityPayload(resource: string, row: Row): Record<string, unknown> {
    const list = (v: unknown) => Array.isArray(v) ? v : [];
    if (resource === 'maps') return {
      slug: row.slug, title: row.title, category: row.category, summary: row.summary, description: row.description,
      status: row.status, cover: row.cover, gallery: list(row.gallery), video_url: row.video_url,
      featured: Boolean(row.featured), is_demo: Boolean(row.is_demo), sort_order: Number(row.sort_order) || 0,
    };
    if (resource === 'products') return {
      slug: row.slug, name: row.name, description: row.description, price_cents: Number(row.price_cents) || 0,
      category: row.category, images: list(row.images), sizes: list(row.sizes), stock: Number(row.stock) || 0,
      active: Boolean(row.active), featured: Boolean(row.featured), is_demo: Boolean(row.is_demo), sort_order: Number(row.sort_order) || 0,
    };
    if (resource === 'members') return {
      name: row.name, nickname: row.nickname, role: row.role, game: row.game, bio: row.bio,
      photo: row.photo, category: row.category, socials: list(row.socials), sort_order: Number(row.sort_order) || 0,
    };
    return { type: row.type, name: row.name, slug: row.slug, sort_order: Number(row.sort_order) || 0 };
  }

  async function moveRow(resource: string, rows: Row[], id: number, direction: -1 | 1) {
    const sorted = [...rows].sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) || a.id - b.id);
    const i = sorted.findIndex((r) => r.id === id);
    const j = i + direction;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    try {
      await Promise.all([
        adminFetch(`/api/admin/${resource}/${sorted[i].id}`, { method: 'PATCH', body: JSON.stringify({ ...entityPayload(resource, sorted[i]), sort_order: j * 10 }) }),
        adminFetch(`/api/admin/${resource}/${sorted[j].id}`, { method: 'PATCH', body: JSON.stringify({ ...entityPayload(resource, sorted[j]), sort_order: i * 10 }) }),
      ]);
      await reload(); flash('success', 'Ordem atualizada.');
    } catch (e) { flash('error', (e as Error).message); }
  }

  async function saveContent(content: SiteContent) {
    try { await adminFetch('/api/admin/content', { method: 'POST', body: JSON.stringify({ content }) }); await reload(); flash('success', 'Conteúdo salvo. Atualize as páginas públicas para ver as mudanças.'); }
    catch (e) { flash('error', (e as Error).message); }
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    window.location.href = '/admin';
  }

  function fieldsFor(resource: string): Field[] {
    if (resource === 'maps') return [
      { key: 'slug', label: 'Slug (URL)', type: 'text', placeholder: 'meu-mapa', help: 'Letras minúsculas, números e hífens. Deixe vazio para gerar do título.' },
      { key: 'title', label: 'Nome do projeto', type: 'text', required: true },
      { key: 'category', label: 'Categoria', type: 'select', options: categoryOptions('map'), required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Publicado', 'Em desenvolvimento', 'Projeto conceitual'].map((v) => ({ value: v, label: v })) },
      { key: 'cover', label: 'Imagem de capa', type: 'url', placeholder: '/demo/maps/…', help: 'Cole uma URL ou envie um arquivo.' },
      { key: 'video_url', label: 'Vídeo de apresentação (URL)', type: 'text', placeholder: 'https://youtube.com/watch?v=…' },
      { key: 'gallery', label: 'Galeria de imagens', type: 'images', help: 'Separe várias URLs por vírgula ou envie arquivos.' },
      { key: 'summary', label: 'Resumo curto', type: 'textarea', rows: 2 },
      { key: 'description', label: 'Descrição completa', type: 'textarea', rows: 6 },
      { key: 'sort_order', label: 'Ordem de exibição', type: 'number' },
      { key: 'featured', label: 'Destacar no site', type: 'checkbox', help: 'Aparece entre os projetos em destaque.' },
      { key: 'is_demo', label: 'Conteúdo demonstrativo', type: 'checkbox', help: 'Exibe o selo “Demonstrativo” no site público.' },
    ];
    if (resource === 'products') return [
      { key: 'slug', label: 'Slug (URL)', type: 'text', placeholder: 'meu-produto' },
      { key: 'name', label: 'Nome do produto', type: 'text', required: true },
      { key: 'category', label: 'Categoria', type: 'select', options: categoryOptions('product'), required: true },
      { key: 'price_cents', label: 'Preço (R$)', type: 'price', placeholder: '129,90', help: 'Valor em reais; armazene centavos automaticamente.' },
      { key: 'stock', label: 'Estoque disponível', type: 'number' },
      { key: 'sizes', label: 'Tamanhos / modelos', type: 'tags', help: 'Separe por vírgula. Ex.: P, M, G, GG. Deixe vazio se não houver variação.' },
      { key: 'images', label: 'Imagens do produto', type: 'images', help: 'Separe várias URLs por vírgula ou envie arquivos.' },
      { key: 'description', label: 'Descrição', type: 'textarea', rows: 4 },
      { key: 'sort_order', label: 'Ordem de exibição', type: 'number' },
      { key: 'active', label: 'Produto ativo', type: 'checkbox', help: 'Desmarque para ocultar da loja.' },
      { key: 'featured', label: 'Destaque na loja', type: 'checkbox' },
      { key: 'is_demo', label: 'Produto demonstrativo', type: 'checkbox', help: 'Exibe o selo “Demonstrativo” e avisa que o preço é ilustrativo.' },
    ];
    if (resource === 'members') return [
      { key: 'name', label: 'Nome', type: 'text', required: true },
      { key: 'nickname', label: 'Nickname', type: 'text' },
      { key: 'role', label: 'Função', type: 'text', required: true, placeholder: 'Ex.: Criador de mapas' },
      { key: 'game', label: 'Jogo principal', type: 'text' },
      { key: 'category', label: 'Categoria', type: 'select', options: categoryOptions('member'), required: true },
      { key: 'photo', label: 'Foto / avatar', type: 'url', placeholder: 'https://…' },
      { key: 'bio', label: 'Breve descrição', type: 'textarea', rows: 4 },
      { key: 'socials', label: 'Redes sociais', type: 'socials' },
      { key: 'sort_order', label: 'Ordem de exibição', type: 'number', help: 'Use para reordenar os integrantes.' },
    ];
    return [
      { key: 'type', label: 'Tipo', type: 'select', options: [{ value: 'map', label: 'Mapas' }, { value: 'product', label: 'Produtos' }, { value: 'member', label: 'Integrantes' }], required: true },
      { key: 'name', label: 'Nome da categoria', type: 'text', required: true },
      { key: 'slug', label: 'Slug (opcional)', type: 'text' },
      { key: 'sort_order', label: 'Ordem', type: 'number' },
    ];
  }

  function RecordList({ resource, rows, title, description, onMove }: { resource: string; rows: Row[]; title: string; description: string; onMove: (resource: string, rows: Row[], id: number, direction: -1 | 1) => void }) {
    return (
      <div>
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="font-display text-2xl font-bold uppercase text-white">{title}</h2><p className="mt-1 text-sm text-mist-400">{description}</p></div>
          <button type="button" onClick={() => openNew(resource)} className="btn-primary btn-sm"><Plus className="h-4 w-4" /> Novo registro</button>
        </div>
        {rows.length === 0 ? <EmptyRow text="Nenhum registro cadastrado." /> : (
          <div className="overflow-hidden rounded-lg border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-white/10 bg-white/[0.03] font-display text-[10px] uppercase tracking-[0.16em] text-mist-500">
                  <tr>
                    <th className="px-5 py-3.5 font-bold">Nome / título</th>
                    <th className="px-5 py-3.5 font-bold">Categoria</th>
                    <th className="px-5 py-3.5 font-bold">Detalhes</th>
                    <th className="px-5 py-3.5 text-right font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {rows.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-5 py-4">
                        <p className="font-display text-[14px] font-bold uppercase text-white">{String(row.title || row.name)}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-mist-500">{String(row.slug || row.nickname || '')}</p>
                      </td>
                      <td className="px-5 py-4 text-mist-300">{String(row.category || row.type || '—')}</td>
                      <td className="px-5 py-4 text-xs text-mist-400">
                        {resource === 'products' && <>{formatBRL(Number(row.price_cents) || 0)} · {String(row.stock)} un. {Number(row.active) === 0 && <span className="text-red-400">· inativo</span>}</>}
                        {resource === 'maps' && <>{String(row.status)}{Boolean(row.is_demo) && ' · demonstrativo'}</>}
                        {resource === 'members' && String(row.role || '')}
                        {resource === 'categories' && `ordem ${String(row.sort_order ?? 0)}`}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-1.5">
                          <button type="button" onClick={() => onMove(resource, rows, row.id, -1)} aria-label="Mover para cima" className="flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 text-mist-400 hover:border-pink/60 hover:text-pink-400"><ArrowUp className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => onMove(resource, rows, row.id, 1)} aria-label="Mover para baixo" className="flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 text-mist-400 hover:border-pink/60 hover:text-pink-400"><ArrowDown className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => openEdit(resource, row)} aria-label="Editar" className="flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 text-mist-400 hover:border-pink/60 hover:text-pink-400"><Pencil className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={() => removeRecord(resource, row.id, String(row.title || row.name))} aria-label="Excluir" className="flex h-8 w-8 items-center justify-center rounded-sm border border-white/10 text-mist-400 hover:border-red-500/60 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 pt-0">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="border-b border-white/10 bg-[#08080F] lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 px-5 py-5 lg:block">
            <Link href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Venly Esports" width={36} height={36} className="rounded-[8px]" />
              <span className="font-display text-base font-bold uppercase leading-none text-white">VENLY<br /><span className="text-[9px] tracking-[0.35em] text-pink-400">ADMIN</span></span>
            </Link>
            <button type="button" onClick={logout} className="flex items-center gap-2 font-display text-[10px] font-bold uppercase tracking-wider text-mist-400 hover:text-pink-400 lg:mt-5 lg:hidden"><LogOut className="h-3.5 w-3.5" /> Sair</button>
          </div>
          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-6" aria-label="Navegação do painel">
            {TABS.map((item) => (
              <button key={item.id} type="button" onClick={() => setTab(item.id)}
                className={cn('flex shrink-0 items-center gap-3 rounded-sm px-3 py-2.5 text-left font-display text-[12px] font-bold uppercase tracking-[0.08em] transition-all',
                  tab === item.id ? 'bg-pink/15 text-pink-400 shadow-[inset_2px_0_0_#FF008F]' : 'text-mist-400 hover:bg-white/[0.04] hover:text-white')}>
                <item.icon className="h-4 w-4" /><span className="whitespace-nowrap">{item.label}</span>
                {item.id === 'requests' && data.stats.newRequests > 0 && <span className="ml-auto rounded-full bg-pink px-1.5 py-0.5 text-[10px] text-white">{data.stats.newRequests}</span>}
              </button>
            ))}
          </nav>
          <div className="hidden border-t border-white/10 p-4 lg:block">
            <p className="mb-2 font-display text-[10px] uppercase tracking-[0.16em] text-mist-500">Sessão</p>
            <p className="mb-3 truncate text-xs text-mist-300">{data.config.adminEmail}</p>
            <button type="button" onClick={logout} className="btn-outline btn-sm w-full"><LogOut className="h-3.5 w-3.5" /> Sair</button>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#08080F]/80 px-5 py-4 backdrop-blur sm:px-8">
            <div><p className="font-display text-[10px] uppercase tracking-[0.22em] text-pink-400">Painel administrativo</p><h1 className="font-display text-xl font-bold uppercase text-white">{TABS.find((t) => t.id === tab)?.label}</h1></div>
            <div className="flex items-center gap-2">
              <Link href="/" target="_blank" className="btn-outline btn-sm hidden sm:inline-flex">Ver site <ExternalLink className="h-3.5 w-3.5" /></Link>
              <button type="button" onClick={reload} className="btn-outline btn-sm">Atualizar dados</button>
            </div>
          </header>

          <div className="px-5 py-8 sm:px-8 sm:py-10">
            {message && <div role="status" className={cn('mb-6 flex items-center gap-2 rounded-sm border px-4 py-3 text-sm', message.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-red-500/30 bg-red-500/10 text-red-200')}>
              {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{message.text}
            </div>}

            {tab === 'overview' && <Overview data={data} go={setTab} />}
            {tab === 'maps' && <RecordList resource="maps" rows={data.maps as unknown as Row[]} title="Portfólio de mapas" description="Cadastre, edite e remova os projetos exibidos na Venly Creates." onMove={moveRow} />}
            {tab === 'products' && <RecordList resource="products" rows={data.products as unknown as Row[]} title="Produtos da loja" description="Gerencie catálogo, preços em BRL, variações e estoque." onMove={moveRow} />}
            {tab === 'members' && <RecordList resource="members" rows={data.members as unknown as Row[]} title="Integrantes" description="Cadastre apenas integrantes oficiais. O site não inventa perfis." onMove={moveRow} />}
            {tab === 'categories' && <RecordList resource="categories" rows={data.categories as unknown as Row[]} title="Categorias" description="Categorias de mapas, produtos e integrantes. Renomear atualiza os registros vinculados." onMove={moveRow} />}
            {tab === 'requests' && <RequestsTab rows={data.requests} notes={notes} setNotes={setNotes} patch={patchStatus} remove={removeRecord} />}
            {tab === 'orders' && <OrdersTab rows={data.orders} patch={patchStatus} />}
            {tab === 'contacts' && <ContactsTab rows={data.contacts} patch={patchStatus} remove={removeRecord} />}
            {tab === 'content' && <ContentTab content={data.content} onSave={saveContent} />}
            {tab === 'consents' && <ConsentsTab rows={data.consents} version={data.content.consent.version} config={data.config} />}
            {tab === 'settings' && <SettingsTab data={data} />}
          </div>
        </div>
      </div>

      {editor && <RecordEditor title={editor.title} fields={fieldsFor(editor.resource)} initial={editor.entity as Record<string, unknown> | null} onSave={saveRecord} onCancel={() => setEditor(null)} busy={busy} errors={errors} />}
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.015] px-6 py-12 text-center text-sm text-mist-400">{text}</div>;
}

function StatCard({ label, value, icon: Icon, hint }: { label: string; value: string | number; icon: React.ElementType; hint?: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-ink-850 p-5">
      <div className="flex items-start justify-between"><p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mist-500">{label}</p><Icon className="h-4 w-4 text-pink-400" /></div>
      <p className="mt-4 font-display text-3xl font-bold text-white">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-mist-500">{hint}</p>}
    </div>
  );
}

function Overview({ data, go }: { data: AdminData; go: (tab: string) => void }) {
  const s = data.stats;
  return (
    <div className="space-y-8">
      <div><h2 className="font-display text-2xl font-bold uppercase text-white">Bem-vindo ao painel</h2><p className="mt-1 text-sm text-mist-400">Gerencie todo o conteúdo e os dados operacionais do site em um só lugar.</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mapas no portfólio" value={s.maps} icon={MapIcon} hint="Venly Creates" />
        <StatCard label="Produtos" value={s.products} icon={ShoppingBag} hint="Loja oficial" />
        <StatCard label="Solicitações" value={s.requests} icon={ClipboardList} hint={`${s.newRequests} novas`} />
        <StatCard label="Pedidos" value={s.orders} icon={ReceiptText} hint={`${formatBRL(s.paidRevenueCents)} aprovados`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
          <h3 className="mb-5 font-display text-lg font-bold uppercase text-white">Status das integrações</h3>
          <div className="space-y-3">
            {[
              { icon: CreditCard, label: 'Mercado Pago (checkout)', ok: data.config.paymentsConfigured, hint: 'MERCADO_PAGO_ACCESS_TOKEN + WEBHOOK_SECRET' },
              { icon: Mail, label: 'E-mail de notificação', ok: data.config.mailConfigured, hint: 'RESEND_API_KEY + NOTIFICATION_EMAIL + EMAIL_FROM' },
              { icon: Cookie, label: 'Análise opcional', ok: data.config.analyticsIdConfigured, hint: 'Só é carregada após consentimento' },
              { icon: Cookie, label: 'Publicidade opcional', ok: data.config.adsConfigured, hint: 'Só é carregada após consentimento' },
              { icon: Database, label: 'Banco de dados (Supabase Postgres)', ok: data.config.databaseConfigured, hint: 'DATABASE_URL — pooler 6543' },
              { icon: UploadCloud, label: 'Uploads (Supabase Storage)', ok: data.config.storageConfigured, hint: data.config.storageMode },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-sm border border-white/[0.07] bg-white/[0.02] px-4 py-3">
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-pink-400" />
                <div className="min-w-0 flex-1"><p className="text-sm text-white">{item.label}</p><p className="mt-0.5 truncate text-[11px] text-mist-500">{item.hint}</p></div>
                <span className={cn('shrink-0 rounded-full px-2.5 py-1 font-display text-[10px] font-bold uppercase', item.ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-400/10 text-amber-300')}>{item.ok ? 'Ativo' : 'Inativo'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-pink/25 bg-gradient-to-b from-pink/[0.08] to-transparent p-6">
          <h3 className="mb-4 font-display text-lg font-bold uppercase text-white">Ações rápidas</h3>
          <div className="space-y-2.5">
            <button type="button" onClick={() => go('maps')} className="btn-primary btn-sm w-full justify-between">Cadastrar mapa <ArrowUpRight className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => go('products')} className="btn-outline btn-sm w-full justify-between">Adicionar produto <ArrowUpRight className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => go('requests')} className="btn-outline btn-sm w-full justify-between">Ver solicitações ({s.newRequests} novas) <ArrowUpRight className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => go('content')} className="btn-outline btn-sm w-full justify-between">Editar textos do site <ArrowUpRight className="h-3.5 w-3.5" /></button>
          </div>
          <p className="mt-6 border-t border-white/10 pt-5 text-[12px] leading-relaxed text-mist-400">Integrações externas exigem variáveis de ambiente. Veja o <code className="text-pink-400">README.md</code> e o arquivo <code className="text-pink-400">.env.example</code>.</p>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
        <h3 className="mb-4 font-display text-lg font-bold uppercase text-white">Últimas solicitações</h3>
        {data.requests.length ? <div className="space-y-3">{data.requests.slice(0, 4).map((r) => (
          <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-3 text-sm last:border-0">
            <span className="text-white">{String(r.project_name)}</span>
            <span className="text-xs text-mist-500">{String(r.name)} · {formatDate(String(r.created_at))}</span>
            <span className="chip chip-pink">{String(r.status)}</span>
          </div>
        ))}</div> : <p className="text-sm text-mist-400">Nenhuma solicitação recebida ainda.</p>}
      </div>
    </div>
  );
}

function RequestsTab({ rows, notes, setNotes, patch, remove }: {
  rows: Row[]; notes: Record<number, string>; setNotes: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  patch: (r: string, id: number, p: Record<string, unknown>) => void; remove: (r: string, id: number, label: string) => void;
}) {
  return (
    <div>
      <div className="mb-7"><h2 className="font-display text-2xl font-bold uppercase text-white">Solicitações de mapas</h2><p className="mt-1 text-sm text-mist-400">Pedidos de orçamento recebidos pelo site. Atualize o status e registre notas internas.</p></div>
      {rows.length === 0 ? <EmptyRow text="Nenhuma solicitação recebida ainda." /> : (
        <div className="space-y-4">{rows.map((r) => {
          const attachments = (Array.isArray(r.attachments) ? r.attachments : []) as { url: string; name: string }[];
          return (
            <div key={r.id} className="rounded-lg border border-white/10 bg-ink-850 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="font-display text-[10px] uppercase tracking-[0.18em] text-pink-400">VM-{new Date(String(r.created_at)).getFullYear()}-{String(r.id).padStart(5, '0')} · {formatDate(String(r.created_at))}</p><h3 className="mt-1 font-display text-xl font-bold uppercase text-white">{String(r.project_name)}</h3><p className="mt-1 text-sm text-mist-400">{String(r.name)} · <a href={`mailto:${String(r.email)}`} className="text-pink-400 hover:text-white">{String(r.email)}</a></p></div>
                <div className="flex items-center gap-2"><label className="sr-only" htmlFor={`req-status-${r.id}`}>Status</label>
                  <select id={`req-status-${r.id}`} value={String(r.status)} onChange={(e) => patch('requests', r.id, { status: e.target.value })}
                    className="form-input w-auto py-2 text-[12px]">{REQUEST_STATUS.map((s) => <option key={s}>{s}</option>)}</select>
                  <button type="button" aria-label="Excluir solicitação" onClick={() => remove('requests', r.id, String(r.project_name))} className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/10 text-mist-400 hover:border-red-500/60 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {([['Tipo de mapa', r.map_type], ['Contato alternativo', r.contact], ['Orçamento', r.budget], ['Prazo', r.deadline]] as [string, unknown][]).map(([label, value]) => (
                  <div key={label}><p className="font-display text-[10px] uppercase tracking-[0.16em] text-mist-500">{label}</p><p className="mt-1 break-words text-sm text-white">{String(value || '—')}</p></div>
                ))}
              </div>
              <div className="mt-5"><p className="font-display text-[10px] uppercase tracking-[0.16em] text-mist-500">Descrição</p><p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-mist-300">{String(r.description)}</p></div>
              {String(r.refs) && <div className="mt-4"><p className="font-display text-[10px] uppercase tracking-[0.16em] text-mist-500">Referências</p><p className="mt-1.5 break-all text-sm text-mist-300">{String(r.refs)}</p></div>}
              {attachments.length > 0 && <div className="mt-4"><p className="font-display text-[10px] uppercase tracking-[0.16em] text-mist-500">Anexos (acesso restrito)</p><div className="mt-2 flex flex-wrap gap-2">{attachments.map((a) => <a key={a.url} href={a.url} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm"><Download className="h-3.5 w-3.5" /> {a.name}</a>)}</div></div>}
              <div className="mt-5 border-t border-white/10 pt-4"><label htmlFor={`req-notes-${r.id}`} className="form-label">Notas internas</label>
                <textarea id={`req-notes-${r.id}`} rows={2} className="form-input resize-y text-[13px]" value={notes[r.id] ?? String(r.notes || '')} onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))} placeholder="Registre detalhes do contato, proposta ou próximos passos…" />
                <button type="button" onClick={() => patch('requests', r.id, { status: String(r.status), notes: notes[r.id] ?? String(r.notes || '') })} className="btn-outline btn-sm mt-2">Salvar notas</button>
              </div>
            </div>
          );
        })}</div>
      )}
    </div>
  );
}

function OrdersTab({ rows, patch }: { rows: Row[]; patch: (r: string, id: number, p: Record<string, unknown>) => void }) {
  return (
    <div>
      <div className="mb-7"><h2 className="font-display text-2xl font-bold uppercase text-white">Histórico de pedidos</h2><p className="mt-1 text-sm text-mist-400">Pedidos registrados na loja. Nenhum pagamento é simulado quando o gateway não está configurado.</p></div>
      {rows.length === 0 ? <EmptyRow text="Nenhum pedido registrado ainda." /> : (
        <div className="space-y-4">{rows.map((o) => {
          const customer = (o.customer || {}) as Record<string, string>;
          const items = (Array.isArray(o.items) ? o.items : []) as { name: string; size: string; quantity: number; price_cents: number }[];
          return (
            <div key={o.id} className="rounded-lg border border-white/10 bg-ink-850 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="font-display text-lg font-bold uppercase text-pink-400">{String(o.code)}</p><p className="mt-1 text-xs text-mist-500">{formatDate(String(o.created_at))} · {customer.name} · {customer.email}</p></div>
                <p className="font-display text-2xl font-bold text-white">{formatBRL(Number(o.total_cents) || 0)}</p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div><p className="font-display text-[10px] uppercase tracking-[0.16em] text-mist-500">Itens</p><ul className="mt-2 space-y-1 text-sm text-mist-300">{items.map((i, n) => <li key={n}>{i.quantity}× {i.name} {i.size && `(${i.size})`} — {formatBRL(i.price_cents * i.quantity)}</li>)}</ul></div>
                <div><p className="font-display text-[10px] uppercase tracking-[0.16em] text-mist-500">Entrega</p><p className="mt-2 text-sm leading-relaxed text-mist-300">{customer.street}, {customer.number} {customer.complement && `· ${customer.complement}`}<br />{customer.district} · {customer.city}/{customer.state} · CEP {customer.cep}<br />{customer.phone}</p></div>
              </div>
              <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-white/10 pt-4">
                <label className="block"><span className="form-label">Status do pedido</span><select value={String(o.status)} onChange={(e) => patch('orders', o.id, { status: e.target.value })} className="form-input w-auto py-2 text-[12px]">{ORDER_STATUS.map((s) => <option key={s}>{s}</option>)}</select></label>
                <label className="block"><span className="form-label">Pagamento</span><select value={String(o.payment_status)} onChange={(e) => patch('orders', o.id, { status: String(o.status), payment_status: e.target.value })} className="form-input w-auto py-2 text-[12px]">{PAYMENT_STATUS.map((s) => <option key={s}>{s}</option>)}</select></label>
                <span className="ml-auto text-[11px] text-mist-500">Provedor: {String(o.payment_provider || 'nenhum')}</span>
              </div>
            </div>
          );
        })}</div>
      )}
    </div>
  );
}

function ContactsTab({ rows, patch, remove }: { rows: Row[]; patch: (r: string, id: number, p: Record<string, unknown>) => void; remove: (r: string, id: number, label: string) => void }) {
  return (
    <div>
      <div className="mb-7"><h2 className="font-display text-2xl font-bold uppercase text-white">Mensagens de contato</h2><p className="mt-1 text-sm text-mist-400">Inclui solicitações de direitos LGPD enviadas pelo formulário de contato.</p></div>
      {rows.length === 0 ? <EmptyRow text="Nenhuma mensagem recebida ainda." /> : (
        <div className="space-y-4">{rows.map((c) => (
          <div key={c.id} className="rounded-lg border border-white/10 bg-ink-850 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><p className="font-display text-base font-bold uppercase text-white">{String(c.subject)}</p><p className="mt-1 text-xs text-mist-500">{String(c.name)} · <a href={`mailto:${String(c.email)}`} className="text-pink-400">{String(c.email)}</a> · {formatDate(String(c.created_at))}</p></div>
              <div className="flex items-center gap-2"><select value={String(c.status)} onChange={(e) => patch('contacts', c.id, { status: e.target.value })} className="form-input w-auto py-2 text-[12px]">{CONTACT_STATUS.map((s) => <option key={s}>{s}</option>)}</select>
                <button type="button" aria-label="Excluir mensagem" onClick={() => remove('contacts', c.id, String(c.subject))} className="flex h-9 w-9 items-center justify-center rounded-sm border border-white/10 text-mist-400 hover:border-red-500/60 hover:text-red-400"><Trash2 className="h-4 w-4" /></button></div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-mist-300">{String(c.message)}</p>
          </div>
        ))}</div>
      )}
    </div>
  );
}

function ConsentsTab({ rows, version, config }: { rows: Row[]; version: string; config: AdminData['config'] }) {
  return (
    <div className="space-y-6">
      <div><h2 className="font-display text-2xl font-bold uppercase text-white">Registro de consentimentos</h2><p className="mt-1 text-sm text-mist-400">Escolhas registradas de forma anônima (identificador opaco, versão, categorias, data). Nenhum IP ou e-mail é armazenado.</p></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Versão atual do aviso" value={version} icon={Cookie} hint="Alterável em Conteúdo → Aviso de consentimento" />
        <StatCard label="Registros recentes" value={rows.length} icon={ShieldCheck} hint="Últimos 100 eventos" />
        <StatCard label="Ferramentas opcionais" value={(config.analyticsIdConfigured ? 1 : 0) + (config.adsConfigured ? 1 : 0)} icon={LockKeyhole} hint="Só ativam com consentimento válido" />
      </div>
      <div className="rounded-sm border border-pink/20 bg-pink/[0.05] px-5 py-4 text-[13px] leading-relaxed text-mist-300">Por padrão, apenas cookies/armazenamento estritamente necessários são usados. Ao recusar, scripts opcionais não são injetados e artefatos opcionais são removidos. A escolha expira em 180 dias e pode ser alterada pelo rodapé.</div>
      {rows.length === 0 ? <EmptyRow text="Nenhuma escolha registrada ainda." /> : (
        <div className="overflow-x-auto rounded-lg border border-white/10"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-white/10 bg-white/[0.03] font-display text-[10px] uppercase tracking-[0.16em] text-mist-500"><tr><th className="px-5 py-3.5">Data</th><th className="px-5 py-3.5">Versão</th><th className="px-5 py-3.5">Ação</th><th className="px-5 py-3.5">Análise</th><th className="px-5 py-3.5">Publicidade</th><th className="px-5 py-3.5">Token (parcial)</th></tr></thead>
          <tbody className="divide-y divide-white/[0.06]">{rows.map((r) => <tr key={r.id} className="hover:bg-white/[0.02]"><td className="px-5 py-3 text-mist-300">{formatDate(String(r.created_at))}</td><td className="px-5 py-3 text-white">{String(r.version)}</td><td className="px-5 py-3 text-pink-400">{String(r.action)}</td><td className="px-5 py-3">{Number(r.analytics) ? 'Sim' : 'Não'}</td><td className="px-5 py-3">{Number(r.ads) ? 'Sim' : 'Não'}</td><td className="px-5 py-3 font-mono text-[11px] text-mist-500">{String(r.token).slice(0, 8)}…</td></tr>)}</tbody></table></div>
      )}
    </div>
  );
}

function SettingsTab({ data }: { data: AdminData }) {
  const [current, setCurrent] = useState(''); const [next, setNext] = useState(''); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    try { await adminFetch('/api/admin/password', { method: 'POST', body: JSON.stringify({ current, next }) }); setMsg('Senha alterada com sucesso.'); setCurrent(''); setNext(''); }
    catch (err) { setMsg((err as Error).message); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-6">
      <div><h2 className="font-display text-2xl font-bold uppercase text-white">Configurações</h2><p className="mt-1 text-sm text-mist-400">Segurança do painel e integrações que dependem de variáveis de ambiente.</p></div>
      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={changePassword} className="rounded-lg border border-white/10 bg-ink-850 p-6">
          <div className="mb-5 flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-pink-400" /><h3 className="font-display text-lg font-bold uppercase text-white">Alterar senha do admin</h3></div>
          <label className="block"><span className="form-label">Senha atual</span><input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="form-input" required /></label>
          <label className="mt-4 block"><span className="form-label">Nova senha (mín. 10 caracteres)</span><input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="form-input" minLength={10} required /></label>
          {msg && <p className="mt-4 text-sm text-pink-400" role="status">{msg}</p>}
          <button type="submit" disabled={busy} className="btn-primary btn-sm mt-5">{busy ? <><ButtonSpinner /> Salvando…</> : 'Alterar senha'}</button>
          <p className="mt-4 text-[12px] leading-relaxed text-mist-500">Em produção, prefira definir <code className="text-pink-400">ADMIN_PASSWORD</code> no ambiente e remova o arquivo de credencial inicial.</p>
        </form>
        <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
          <div className="mb-5 flex items-center gap-2"><Database className="h-5 w-5 text-pink-400" /><h3 className="font-display text-lg font-bold uppercase text-white">Ambiente e integrações</h3></div>
          <dl className="space-y-3 text-sm">{[['Banco de dados', data.config.databaseConfigured ? 'Supabase Postgres (DATABASE_URL)' : 'Não configurado — defina DATABASE_URL'], ['Uploads', data.config.storageMode], ['Admin', data.config.adminEmail], ['Checkout', data.config.paymentsConfigured ? 'Mercado Pago configurado' : 'Desativado — configure MERCADO_PAGO_ACCESS_TOKEN'], ['E-mail', data.config.mailConfigured ? 'Resend configurado' : 'Desativado — configure RESEND_API_KEY'], ['Analytics opcional', data.config.analyticsIdConfigured ? 'ID configurado (consentimento obrigatório)' : 'Nenhuma ferramenta'], ['Publicidade opcional', data.config.adsConfigured ? 'Script configurado (consentimento obrigatório)' : 'Nenhuma ferramenta']].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1 border-b border-white/[0.06] pb-3 sm:flex-row sm:justify-between sm:gap-6"><dt className="shrink-0 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-mist-500">{k}</dt><dd className="text-right text-mist-300">{v}</dd></div>
          ))}</dl>
          <p className="mt-5 text-[12px] leading-relaxed text-mist-500">Consulte o <code className="text-pink-400">README.md</code> (seção “Chaves que você precisa configurar”) para ativar Mercado Pago, e-mail e analytics. Banco e Storage são configurados por variáveis de ambiente no deploy.</p>
        </div>
      </div>
      <div className="rounded-lg border border-white/10 bg-ink-850 p-6">
        <h3 className="mb-3 font-display text-lg font-bold uppercase text-white">Privacidade e retenção</h3>
        <p className="text-[13px] leading-relaxed text-mist-400">Exclua solicitações, mensagens e pedidos diretamente nas respectivas abas quando os dados não forem mais necessários ou mediante pedido do titular. A política de privacidade e os avisos de cookies podem ser editados na aba Conteúdo. Registros de consentimento são anônimos e expiram automaticamente.</p>
        <Link href="/cookies" target="_blank" className="btn-outline btn-sm mt-5">Ver estado do consentimento <ExternalLink className="h-3.5 w-3.5" /></Link>
      </div>
    </div>
  );
}
