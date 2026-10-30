'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Cookie, Settings2, ShieldCheck, X, BarChart3, Megaphone, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'venly_consent';
const TOKEN_KEY = 'venly_consent_token';
export const CONSENT_TTL_DAYS = 180;
const TTL_MS = CONSENT_TTL_DAYS * 86_400_000;

export type ConsentChoice = { necessary: true; analytics: boolean; ads: boolean };
export type ConsentRecord = ConsentChoice & { version: string; decidedAt: number; action: string };

type ContextValue = {
  record: ConsentRecord | null;
  ready: boolean;
  version: string;
  openPreferences: () => void;
  save: (choice: Omit<ConsentChoice, 'necessary'>, action: ConsentRecord['action']) => void;
  withdraw: () => void;
  optionalScriptCount: number;
};

const ConsentContext = createContext<ContextValue | null>(null);
export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within ConsentProvider');
  return ctx;
}

function getToken(): string {
  let token = '';
  try { token = localStorage.getItem(TOKEN_KEY) || ''; } catch { /* storage blocked */ }
  if (!token) {
    token = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36);
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage blocked */ }
  }
  return token;
}

/** Remove artefatos opcionais quando o consentimento é recusado/retirado. */
function clearOptionalArtifacts() {
  document.querySelectorAll('script[data-venly-consent]').forEach((el) => el.remove());
  const optionalPrefixes = ['_ga', '_gid', '_gat', '_gcl', '_fbp', '_fbc', 'venly_analytics', 'venly_ads'];
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && optionalPrefixes.some((p) => key.startsWith(p))) localStorage.removeItem(key);
    }
  } catch { /* storage blocked */ }
  optionalPrefixes.forEach((prefix) => {
    document.cookie = `${prefix}=; Max-Age=0; path=/; SameSite=Lax`;
    document.cookie = `${prefix}_=; Max-Age=0; path=/; SameSite=Lax`;
  });
}

function insertOptionalScript(id: string, category: 'analytics' | 'ads', src: string, inline?: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.dataset.venlyConsent = category;
  if (src) script.src = src;
  if (inline) script.textContent = inline;
  document.head.appendChild(script);
}

export function ConsentProvider({ children, version, policyTitle, policyText, analyticsId, adsScriptUrl }: {
  children: React.ReactNode; version: string; policyTitle: string; policyText: string;
  analyticsId?: string; adsScriptUrl?: string;
}) {
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [ready, setReady] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [draft, setDraft] = useState<Omit<ConsentChoice, 'necessary'>>({ analytics: false, ads: false });
  const [optionalScriptCount, setOptionalScriptCount] = useState(0);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let valid: ConsentRecord | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ConsentRecord;
        if (parsed && parsed.version === version && typeof parsed.decidedAt === 'number' && Date.now() - parsed.decidedAt < TTL_MS) {
          valid = { ...parsed, necessary: true, analytics: Boolean(parsed.analytics), ads: Boolean(parsed.ads) };
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch { /* invalid storage */ }
    setRecord(valid);
    setDraft({ analytics: Boolean(valid?.analytics), ads: Boolean(valid?.ads) });
    setShowBanner(!valid);
    setReady(true);
  }, [version]);

  /** Real gating: optional scripts exist in the DOM only while consent is valid. */
  useEffect(() => {
    if (!ready) return;
    const allowed = record;
    if (!allowed || (!allowed.analytics && !allowed.ads)) {
      clearOptionalArtifacts();
      setOptionalScriptCount(0);
    } else {
      if (!allowed.analytics) document.querySelectorAll('script[data-venly-consent="analytics"]').forEach((el) => el.remove());
      if (!allowed.ads) document.querySelectorAll('script[data-venly-consent="ads"]').forEach((el) => el.remove());
    }
    if (allowed?.analytics && analyticsId) {
      insertOptionalScript('venly-analytics-loader', 'analytics', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`);
      insertOptionalScript('venly-analytics-config', 'analytics', '', `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${analyticsId.replace(/'/g, '')}',{anonymize_ip:true});`);
    }
    if (allowed?.ads && adsScriptUrl && /^https:\/\//.test(adsScriptUrl)) {
      insertOptionalScript('venly-ads-loader', 'ads', adsScriptUrl);
    }
    const count = document.querySelectorAll('script[data-venly-consent]').length;
    setOptionalScriptCount(count);
    // Expose state for functional verification (no personal data).
    (window as unknown as Record<string, unknown>).__VENLY_CONSENT__ = {
      version,
      necessary: true,
      analytics: Boolean(allowed?.analytics),
      ads: Boolean(allowed?.ads),
      optionalScriptsActive: count,
      configuredAnalytics: Boolean(analyticsId),
      configuredAds: Boolean(adsScriptUrl),
    };
    window.dispatchEvent(new CustomEvent('venly:consentchange', { detail: (window as unknown as Record<string, unknown>).__VENLY_CONSENT__ }));
  }, [ready, record, analyticsId, adsScriptUrl, version]);

  const save = useCallback((choice: Omit<ConsentChoice, 'necessary'>, action: ConsentRecord['action']) => {
    const next: ConsentRecord = {
      necessary: true, analytics: Boolean(choice.analytics), ads: Boolean(choice.ads),
      version, decidedAt: Date.now(), action,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
    setRecord(next);
    setDraft({ analytics: next.analytics, ads: next.ads });
    setShowBanner(false);
    setPrefsOpen(false);
    // Registro do consentimento (identificador opaco, sem dados pessoais).
    try {
      void fetch('/api/consent', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: getToken(), version, necessary: true, analytics: next.analytics, ads: next.ads, action }),
        keepalive: true,
      });
    } catch { /* logging failure must not block navigation */ }
  }, [version]);

  const openPreferences = useCallback(() => {
    setDraft({ analytics: Boolean(record?.analytics), ads: Boolean(record?.ads) });
    setPrefsOpen(true);
  }, [record]);

  const withdraw = useCallback(() => save({ analytics: false, ads: false }, 'withdraw'), [save]);

  useEffect(() => {
    if (!prefsOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPrefsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prefsOpen]);

  const value = useMemo<ContextValue>(() => ({ record, ready, version, openPreferences, save, withdraw, optionalScriptCount }),
    [record, ready, version, openPreferences, save, withdraw, optionalScriptCount]);

  return (
    <ConsentContext.Provider value={value}>
      {children}

      {ready && showBanner && !prefsOpen && (
        <div ref={bannerRef} role="dialog" aria-modal="false" aria-labelledby="cookie-title" aria-describedby="cookie-desc"
          className="fixed bottom-3 left-3 right-3 z-[100] animate-fade-up rounded-lg border border-pink/35 bg-[#0B0912]/95 p-5 shadow-[0_24px_80px_-20px_rgba(0,0,0,.95)] backdrop-blur-xl sm:bottom-6 sm:left-6 sm:right-auto sm:w-[400px]">
          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-pink to-transparent" />
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-pink/30 bg-pink/10 text-pink-400"><Cookie className="h-5 w-5" /></div>
            <div>
              <h2 id="cookie-title" className="font-display text-lg font-bold uppercase tracking-wide text-white">{policyTitle}</h2>
              <p className="mt-1 font-display text-[10px] uppercase tracking-[0.2em] text-pink-400">Aviso v{version}</p>
            </div>
          </div>
          <p id="cookie-desc" className="text-[13px] leading-relaxed text-mist-300">
            {policyText} Recusar não afeta nenhuma função essencial.{' '}
            <Link href="/cookies" className="text-pink-400 underline underline-offset-2 hover:text-white">Política de Cookies</Link>.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => save({ analytics: true, ads: true }, 'accept_all')}
              className="btn-primary btn-sm w-full">Aceitar todos</button>
            <button type="button" onClick={() => save({ analytics: false, ads: false }, 'reject_optional')}
              className="btn-outline btn-sm w-full">Recusar não essenciais</button>
          </div>
          <button type="button" onClick={openPreferences}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-sm py-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-mist-300 transition-colors hover:text-pink-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink">
            <Settings2 className="h-3.5 w-3.5" /> Configurar preferências
          </button>
        </div>
      )}

      {prefsOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="presentation"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setPrefsOpen(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="prefs-title"
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-xl border border-pink/30 bg-[#0B0912] p-6 shadow-2xl sm:rounded-xl sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow mb-2">Privacidade</p>
                <h2 id="prefs-title" className="font-display text-2xl font-bold uppercase text-white">Preferências de cookies</h2>
              </div>
              <button type="button" aria-label="Fechar" onClick={() => setPrefsOpen(false)} className="rounded-sm border border-white/10 p-2 text-mist-400 hover:border-pink/50 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-mist-400">Escolha quais categorias opcionais você autoriza. Nada é marcado previamente. Você pode alterar esta escolha a qualquer momento pelo rodapé.</p>

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4 rounded-sm border border-white/10 bg-white/[0.02] p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                  <div><h3 className="font-display text-sm font-bold uppercase text-white">Estritamente necessários</h3>
                    <p className="mt-1 text-xs leading-relaxed text-mist-400">Sessão, segurança, carrinho e registro da sua escolha. Sempre ativos e não usados para rastreamento.</p></div>
                </div>
                <span className="mt-1 shrink-0 rounded-full bg-emerald-500/15 px-2 py-1 font-display text-[10px] font-bold uppercase text-emerald-300">Ativo</span>
              </div>
              {([['analytics', 'Análise e desempenho', BarChart3], ['ads', 'Publicidade e rastreamento', Megaphone]] as const).map(([key, title, Icon]) => (
                <label key={key} className="flex cursor-pointer items-start justify-between gap-4 rounded-sm border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-pink/30">
                  <span className="flex gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-pink-400" />
                    <span>
                      <span className="block font-display text-sm font-bold uppercase text-white">{title}</span>
                      <span className="mt-1 block text-xs leading-relaxed text-mist-400">
                        {key === 'analytics' ? 'Medem o uso do site para melhorias. Nenhuma ferramenta está configurada nesta versão.' : 'Personalizam anúncios e medem campanhas. Nenhuma ferramenta está configurada nesta versão.'}
                      </span>
                    </span>
                  </span>
                  <input type="checkbox" checked={draft[key]} onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.checked }))}
                    className="mt-1 h-5 w-5 shrink-0 cursor-pointer accent-[#FF008F]" aria-label={title} />
                </label>
              ))}
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => save(draft, 'custom')} className="btn-primary btn-sm w-full">Salvar preferências</button>
              <button type="button" onClick={() => save({ analytics: false, ads: false }, 'reject_optional')} className="btn-outline btn-sm w-full">Recusar não essenciais</button>
            </div>
            <button type="button" onClick={() => save({ analytics: true, ads: true }, 'accept_all')}
              className="mt-3 w-full rounded-sm py-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-mist-300 hover:text-pink-400">Aceitar todos</button>
            <p className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-relaxed text-mist-500">Sua escolha é registrada com a versão do aviso e expira em {CONSENT_TTL_DAYS} dias. <Link href="/cookies" className="text-pink-400 underline">Entenda as categorias</Link>.</p>
          </div>
        </div>
      )}
    </ConsentContext.Provider>
  );
}

export function ConsentStatus() {
  const { record, ready, version, openPreferences, withdraw, optionalScriptCount } = useConsent();
  if (!ready) return <div className="skeleton h-40 w-full rounded-lg" />;
  const expires = record ? new Date(record.decidedAt + TTL_MS).toLocaleDateString('pt-BR') : null;
  return (
    <div className="rounded-lg border border-white/10 bg-ink-850 p-6 sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className={cn('h-2.5 w-2.5 rounded-full', record ? 'bg-emerald-400' : 'bg-amber-400')} />
        <h3 className="font-display text-xl font-bold uppercase text-white">Estado atual do consentimento</h3>
      </div>
      <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        {[
          ['Situação', record ? 'Escolha registrada' : 'Aguardando escolha'],
          ['Versão do aviso', version],
          ['Necessários', 'Sempre ativos'],
          ['Análise e desempenho', record?.analytics ? 'Autorizado' : 'Desativado'],
          ['Publicidade e rastreamento', record?.ads ? 'Autorizado' : 'Desativado'],
          ['Scripts opcionais ativos', String(optionalScriptCount)],
          ['Revisão da escolha', expires || '—'],
          ['Registrada em', record ? new Date(record.decidedAt).toLocaleString('pt-BR') : '—'],
        ].map(([label, value]) => (
          <div key={label} className="border-b border-white/[0.06] pb-3">
            <dt className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-mist-500">{label}</dt>
            <dd className={cn('mt-1 text-sm font-medium', value === 'Autorizado' ? 'text-emerald-300' : value === 'Desativado' ? 'text-mist-300' : 'text-white')}>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" onClick={openPreferences} className="btn-primary btn-sm"><Settings2 className="h-4 w-4" /> Alterar preferências</button>
        <button type="button" onClick={withdraw} className="btn-outline btn-sm"><RotateCcw className="h-4 w-4" /> Retirar consentimento</button>
      </div>
      <p className="mt-5 text-xs leading-relaxed text-mist-500">A retirada remove scripts opcionais e limpa o armazenamento associado. Ela se aplica imediatamente às novas navegações.</p>
    </div>
  );
}
