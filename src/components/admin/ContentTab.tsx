'use client';
import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import type { SiteContent, TextPair, SocialLink } from '@/lib/types';
import { ButtonSpinner } from '@/components/forms/parts';

type Props = { content: SiteContent; onSave: (content: SiteContent) => Promise<void> };

function TextField({ label, value, onChange, multiline, rows, hint }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; rows?: number; hint?: string;
}) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      {multiline
        ? <textarea rows={rows || 3} value={value} onChange={(e) => onChange(e.target.value)} className="form-input resize-y" />
        : <input value={value} onChange={(e) => onChange(e.target.value)} className="form-input" />}
      {hint && <span className="form-hint">{hint}</span>}
    </label>
  );
}

function PairsEditor({ label, value, onChange }: { label: string; value: TextPair[]; onChange: (v: TextPair[]) => void }) {
  return (
    <div>
      <span className="form-label">{label}</span>
      <div className="space-y-3">
        {(value || []).map((pair, i) => (
          <div key={i} className="rounded-sm border border-white/10 bg-white/[0.02] p-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input value={pair.title} onChange={(e) => onChange(value.map((p, j) => j === i ? { ...p, title: e.target.value } : p))} placeholder="Título" className="form-input sm:w-1/3" />
              <input value={pair.text} onChange={(e) => onChange(value.map((p, j) => j === i ? { ...p, text: e.target.value } : p))} placeholder="Texto" className="form-input flex-1" />
              <button type="button" aria-label="Remover item" onClick={() => onChange(value.filter((_, j) => j !== i))} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-white/10 text-mist-500 hover:border-red-500/50 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...(value || []), { title: '', text: '' }])} className="btn-outline btn-sm mt-3"><Plus className="h-3.5 w-3.5" /> Adicionar item</button>
    </div>
  );
}

function SocialsEditor({ value, onChange }: { value: SocialLink[]; onChange: (v: SocialLink[]) => void }) {
  return (
    <div>
      <span className="form-label">Links das redes sociais (deixe a URL vazia para marcar como pendente)</span>
      <div className="space-y-2">
        {(value || []).map((item, i) => (
          <div key={i} className="flex flex-col gap-2 sm:flex-row">
            <input value={item.label} onChange={(e) => onChange(value.map((v, j) => j === i ? { ...v, label: e.target.value } : v))} placeholder="Nome" className="form-input sm:w-1/3" />
            <input value={item.url} onChange={(e) => onChange(value.map((v, j) => j === i ? { ...v, url: e.target.value } : v))} placeholder="https://…" className="form-input flex-1" />
            <button type="button" aria-label="Remover rede" onClick={() => onChange(value.filter((_, j) => j !== i))} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-white/10 text-mist-500 hover:border-red-500/50 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...(value || []), { label: '', url: '' }])} className="btn-outline btn-sm mt-3"><Plus className="h-3.5 w-3.5" /> Adicionar rede</button>
    </div>
  );
}

function Section({ title, description, children, open }: { title: string; description?: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group rounded-lg border border-white/10 bg-ink-850">
      <summary className="cursor-pointer list-none px-6 py-5 font-display text-base font-bold uppercase tracking-wide text-white transition-colors hover:text-pink-400">
        <span className="mr-3 text-pink-400 group-open:rotate-90 inline-block transition-transform">›</span>{title}
        {description && <span className="ml-3 hidden font-sans text-[12px] font-normal normal-case tracking-normal text-mist-500 sm:inline">{description}</span>}
      </summary>
      <div className="space-y-5 border-t border-white/10 px-6 py-6">{children}</div>
    </details>
  );
}

export function ContentTab({ content, onSave }: Props) {
  const [draft, setDraft] = useState<SiteContent>(() => JSON.parse(JSON.stringify(content)) as SiteContent);
  const [busy, setBusy] = useState(false);

  const patch = (path: string, value: unknown) => {
    setDraft((current) => {
      const next = JSON.parse(JSON.stringify(current)) as Record<string, Record<string, unknown>>;
      const keys = path.split('.');
      let target: Record<string, unknown> = next;
      for (let i = 0; i < keys.length - 1; i++) target = target[keys[i]] as Record<string, unknown>;
      target[keys[keys.length - 1]] = value;
      return next as unknown as SiteContent;
    });
  };
  const val = (path: string): string => {
    let target: unknown = draft;
    for (const key of path.split('.')) target = (target as Record<string, unknown>)?.[key];
    return typeof target === 'string' ? target : '';
  };
  const arr = <T,>(path: string): T[] => {
    let target: unknown = draft;
    for (const key of path.split('.')) target = (target as Record<string, unknown>)?.[key];
    return (Array.isArray(target) ? target : []) as T[];
  };
  const text = (path: string, label: string, multiline = false, rows?: number, hint?: string) => (
    <TextField label={label} value={val(path)} onChange={(v) => patch(path, v)} multiline={multiline} rows={rows} hint={hint} />
  );

  async function save() {
    setBusy(true);
    try { await onSave(draft); } finally { setBusy(false); }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h2 className="font-display text-2xl font-bold uppercase text-white">Conteúdo do site</h2><p className="mt-1 text-sm text-mist-400">Todos os textos, links e avisos são editáveis aqui — sem alterar o código.</p></div>
        <button type="button" onClick={save} disabled={busy} className="btn-primary btn-sm">{busy ? <><ButtonSpinner /> Salvando…</> : <><Save className="h-4 w-4" /> Salvar alterações</>}</button>
      </div>

      <Section title="Página inicial" description="hero, chamadas e prévia das áreas" open>
        <div className="grid gap-5 sm:grid-cols-2">
          {text('home.eyebrow', 'Chamada superior (eyebrow)')}
          {text('home.previewLabel', 'Rótulo da seção de áreas')}
          {text('home.titleTop', 'Título — primeira linha')}
          {text('home.titleAccent', 'Título — linha destacada em rosa')}
          {text('home.primaryCta', 'Texto do botão principal')}
          {text('home.secondaryCta', 'Texto do botão secundário')}
          {text('home.previewTitle', 'Título das áreas', false, undefined, 'Use um ponto para separar a parte em rosa.')}
        </div>
        {text('home.description', 'Descrição principal', true, 3)}
        {text('home.previewText', 'Descrição das áreas', true, 2)}
        <TextField label="Frases do ticker (separadas por vírgula)" value={arr<string>('home.ticker').join(', ')} onChange={(v) => patch('home.ticker', v.split(',').map((s) => s.trim()).filter(Boolean))} />
      </Section>

      <Section title="Sobre a Venly" description="história, missão, visão, valores e áreas">
        {text('about.intro', 'Apresentação curta', true, 2)}
        {text('about.history', 'História', true, 5)}
        <div className="grid gap-5 sm:grid-cols-2">{text('about.mission', 'Missão', true, 4)}{text('about.vision', 'Visão de futuro', true, 4)}</div>
        {text('about.creates', 'Texto sobre a Venly Creates', true, 4)}
        {text('about.pendingNote', 'Aviso de conteúdo provisório', true, 2)}
        <PairsEditor label="Valores" value={arr<TextPair>('about.values')} onChange={(v) => patch('about.values', v)} />
        <PairsEditor label="Áreas de atuação" value={arr<TextPair>('about.areas')} onChange={(v) => patch('about.areas', v)} />
      </Section>

      <Section title="Venly Creates" description="introdução, processo e aviso do portfólio">
        {text('creates.intro', 'Introdução', true, 3)}
        {text('creates.note', 'Aviso sobre projetos demonstrativos', true, 3)}
        <PairsEditor label="Etapas do processo (ex.: 01 · Briefing)" value={arr<TextPair>('creates.process')} onChange={(v) => patch('creates.process', v)} />
      </Section>

      <Section title="Loja oficial" description="textos e avisos do catálogo">
        {text('store.intro', 'Introdução', true, 2)}
        {text('store.notice', 'Aviso de catálogo demonstrativo', true, 3)}
      </Section>

      <Section title="Contato e redes sociais" description="e-mails, Discord e links configuráveis">
        <div className="grid gap-5 sm:grid-cols-2">
          {text('contact.email', 'E-mail geral')}
          {text('contact.commercialEmail', 'E-mail comercial')}
          {text('contact.privacyEmail', 'E-mail de privacidade / LGPD')}
          {text('contact.discord', 'Discord oficial')}
        </div>
        {text('contact.pendingNote', 'Aviso de links pendentes', true, 2)}
        <SocialsEditor value={arr<SocialLink>('contact.socials')} onChange={(v) => patch('contact.socials', v)} />
      </Section>

      <Section title="Política de Privacidade" description="Markdown — revise antes de publicar">
        {text('legal.privacyNote', 'Aviso de versão inicial', true, 3)}
        <TextField label="Texto completo (Markdown)" value={val('legal.privacy')} onChange={(v) => patch('legal.privacy', v)} multiline rows={16} hint="Use ## para títulos, listas com - e **negrito**." />
      </Section>

      <Section title="Política de Cookies" description="Markdown — categorias e funcionamento">
        <TextField label="Texto completo (Markdown)" value={val('legal.cookiesPolicy')} onChange={(v) => patch('legal.cookiesPolicy', v)} multiline rows={14} />
      </Section>

      <Section title="Termos de Uso" description="Markdown — condições de uso">
        <TextField label="Texto completo (Markdown)" value={val('legal.terms')} onChange={(v) => patch('legal.terms', v)} multiline rows={14} />
      </Section>

      <Section title="Aviso de consentimento e rodapé" description="versão do aviso e textos finais">
        <div className="grid gap-5 sm:grid-cols-2">
          {text('consent.version', 'Versão do aviso de cookies', false, undefined, 'Ao alterar, novas escolhas serão solicitadas aos visitantes.')}
          {text('consent.policyTitle', 'Título do banner')}
        </div>
        {text('consent.policyText', 'Texto do banner', true, 3)}
        {text('footer.note', 'Nota do rodapé', true, 2)}
      </Section>

      <div className="flex justify-end"><button type="button" onClick={save} disabled={busy} className="btn-primary btn-sm">{busy ? <><ButtonSpinner /> Salvando…</> : <><Save className="h-4 w-4" /> Salvar alterações</>}</button></div>
    </div>
  );
}
