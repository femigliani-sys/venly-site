'use client';
import { useRef, useState } from 'react';
import { Upload, Plus, Trash2, X, Save } from 'lucide-react';
import { getCsrfToken } from './api';
import { ButtonSpinner } from '@/components/forms/parts';
import { cn } from '@/lib/utils';

export type FieldType = 'text' | 'textarea' | 'markdown' | 'number' | 'price' | 'select' | 'checkbox' | 'tags' | 'images' | 'socials' | 'url';
export type Field = {
  key: string; label: string; type: FieldType; options?: { value: string; label: string }[];
  placeholder?: string; help?: string; full?: boolean; rows?: number; required?: boolean;
};
export type EditorValues = Record<string, unknown>;

async function uploadFiles(files: FileList | File[]): Promise<string[]> {
  const data = new FormData();
  Array.from(files).slice(0, 6).forEach((f) => data.append('files', f));
  const res = await fetch('/api/admin/upload', {
    method: 'POST', body: data, credentials: 'same-origin',
    headers: { 'x-csrf-token': getCsrfToken() },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Falha ao enviar imagem.');
  return (json.data.files as { url: string }[]).map((f) => f.url);
}

export function toEditorValues(fields: Field[], entity: Record<string, unknown> | null): EditorValues {
  const values: EditorValues = {};
  for (const f of fields) {
    const raw = entity?.[f.key];
    switch (f.type) {
      case 'price': values[f.key] = typeof raw === 'number' ? (raw / 100).toFixed(2).replace('.', ',') : ''; break;
      case 'tags': case 'images': values[f.key] = Array.isArray(raw) ? raw.join(', ') : ''; break;
      case 'socials': values[f.key] = Array.isArray(raw) ? raw : []; break;
      case 'checkbox': values[f.key] = Boolean(raw); break;
      case 'number': values[f.key] = typeof raw === 'number' ? raw : 0; break;
      default: values[f.key] = typeof raw === 'string' ? raw : '';
    }
  }
  return values;
}

export function toPayload(fields: Field[], values: EditorValues): EditorValues {
  const out: EditorValues = {};
  for (const f of fields) {
    const v = values[f.key];
    switch (f.type) {
      case 'number': out[f.key] = Number(v) || 0; break;
      case 'price': out[f.key] = Math.round((parseFloat(String(v ?? '0').replace(',', '.')) || 0) * 100); break;
      case 'checkbox': out[f.key] = Boolean(v); break;
      case 'tags': case 'images': out[f.key] = String(v ?? '').split(/[,\n]/).map((s) => s.trim()).filter(Boolean); break;
      case 'socials': out[f.key] = Array.isArray(v) ? v : []; break;
      default: out[f.key] = String(v ?? '').trim();
    }
  }
  return out;
}

export function RecordEditor({ title, fields, initial, onSave, onCancel, busy, errors }: {
  title: string; fields: Field[]; initial: Record<string, unknown> | null;
  onSave: (payload: EditorValues) => void; onCancel: () => void; busy: boolean; errors?: Record<string, string>;
}) {
  const [values, setValues] = useState<EditorValues>(() => toEditorValues(fields, initial));
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const uploadTarget = useRef<string | null>(null);

  const set = (key: string, value: unknown) => {
    setValues((v) => ({ ...v, [key]: value }));
    setUploadError('');
  };

  async function handleFiles(key: string, files: FileList | null) {
    if (!files?.length) return;
    setUploading(key); setUploadError('');
    try {
      const urls = await uploadFiles(files);
      const field = fields.find((f) => f.key === key);
      if (field?.type === 'images') {
        const current = String(values[key] || '').split(',').map((s) => s.trim()).filter(Boolean);
        set(key, [...current, ...urls].join(', '));
      } else set(key, urls[0]);
    } catch (e) { setUploadError(e instanceof Error ? e.message : 'Falha no upload.'); }
    finally { setUploading(null); if (fileRef.current) fileRef.current.value = ''; }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div role="dialog" aria-modal="true" aria-label={title}
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-xl border border-pink/25 bg-[#0B0A13] shadow-2xl sm:rounded-xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-5">
          <h2 className="font-display text-xl font-bold uppercase text-white">{title}</h2>
          <button type="button" onClick={onCancel} aria-label="Fechar" className="rounded-sm border border-white/10 p-2 text-mist-400 hover:border-pink/50 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(toPayload(fields, values)); }} className="flex min-h-0 flex-1 flex-col">
          <div className="grid flex-1 gap-5 overflow-y-auto p-6 sm:grid-cols-2">
            {fields.map((f) => {
              const error = errors?.[f.key];
              const common = 'form-input';
              return (
                <div key={f.key} className={cn(f.full || ['textarea', 'markdown', 'images', 'tags', 'socials'].includes(f.type) ? 'sm:col-span-2' : '')}>
                  <label htmlFor={`ed-${f.key}`} className="form-label">{f.label} {f.required && <span className="text-pink">*</span>}</label>
                  {f.type === 'select' ? (
                    <select id={`ed-${f.key}`} value={String(values[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)} aria-invalid={Boolean(error)} className={common}>
                      <option value="">Selecione…</option>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === 'checkbox' ? (
                    <label className="flex cursor-pointer items-center gap-3 rounded-sm border border-white/10 bg-white/[0.02] px-4 py-3">
                      <input type="checkbox" checked={Boolean(values[f.key])} onChange={(e) => set(f.key, e.target.checked)} className="h-4 w-4 accent-[#FF008F]" />
                      <span className="text-sm text-mist-300">{f.help || 'Ativar'}</span>
                    </label>
                  ) : f.type === 'textarea' || f.type === 'markdown' || f.type === 'images' || f.type === 'tags' ? (
                    <textarea id={`ed-${f.key}`} rows={f.rows || (f.type === 'markdown' ? 8 : 3)} value={String(values[f.key] ?? '')}
                      onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder} aria-invalid={Boolean(error)}
                      className={cn(common, 'resize-y', f.type === 'markdown' && 'font-mono text-[12px]')} />
                  ) : f.type === 'socials' ? (
                    <SocialsEditor value={(values[f.key] as { label: string; url: string }[]) || []} onChange={(v) => set(f.key, v)} />
                  ) : (
                    <input id={`ed-${f.key}`} type={f.type === 'number' || f.type === 'price' ? 'text' : 'text'}
                      inputMode={f.type === 'number' || f.type === 'price' ? 'decimal' : undefined}
                      value={String(values[f.key] ?? '')} onChange={(e) => set(f.key, e.target.value)}
                      placeholder={f.placeholder} aria-invalid={Boolean(error)} className={common} />
                  )}
                  {f.help && f.type !== 'checkbox' && <span className="form-hint">{f.help}</span>}
                  {(f.type === 'url' || f.type === 'images') && (
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <button type="button" onClick={() => { uploadTarget.current = f.key; fileRef.current?.click(); }} disabled={uploading === f.key} className="btn-outline btn-sm">
                        {uploading === f.key ? <><ButtonSpinner /> Enviando…</> : <><Upload className="h-3.5 w-3.5" /> Enviar imagem/arquivo</>}
                      </button>
                      <span className="text-[11px] text-mist-500">PNG, JPG, WEBP ou PDF · máx. 5 MB</span>
                    </div>
                  )}
                  {error && <span className="form-error" role="alert">{error}</span>}
                </div>
              );
            })}
            <input ref={fileRef} type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden"
              onChange={(e) => { if (uploadTarget.current) handleFiles(uploadTarget.current, e.target.files); }} />
            {uploadError && <p role="alert" className="sm:col-span-2 text-sm text-red-300">{uploadError}</p>}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
            <button type="button" onClick={onCancel} className="btn-ghost btn-sm">Cancelar</button>
            <button type="submit" disabled={busy} className="btn-primary btn-sm">{busy ? <><ButtonSpinner /> Salvando…</> : <><Save className="h-4 w-4" /> Salvar</>}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SocialsEditor({ value, onChange }: { value: { label: string; url: string }[]; onChange: (v: { label: string; url: string }[]) => void }) {
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex flex-col gap-2 sm:flex-row">
          <input value={item.label} onChange={(e) => onChange(value.map((v, j) => j === i ? { ...v, label: e.target.value } : v))} placeholder="Nome (ex.: Instagram)" className="form-input sm:w-1/3" />
          <input value={item.url} onChange={(e) => onChange(value.map((v, j) => j === i ? { ...v, url: e.target.value } : v))} placeholder="https://…" className="form-input flex-1" />
          <button type="button" aria-label="Remover link" onClick={() => onChange(value.filter((_, j) => j !== i))} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-white/10 text-mist-500 hover:border-red-500/50 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { label: '', url: '' }])} className="btn-outline btn-sm"><Plus className="h-3.5 w-3.5" /> Adicionar link</button>
    </div>
  );
}
