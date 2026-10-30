'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Send, Paperclip, X, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { ButtonSpinner, FieldError } from './parts';

type Attachment = { url: string; name: string; size: number; type: string };
type Errors = Record<string, string>;

const INITIAL = {
  name: '', email: '', contact: '', map_type: '', project_name: '', description: '',
  refs: '', budget: '', deadline: '', website: '',
};

export function MapRequestForm({ categories }: { categories: string[] }) {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState<Errors>({});
  const [privacyAck, setPrivacyAck] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');
  const [protocol, setProtocol] = useState('');
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [notice, setNotice] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof INITIAL, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  function validate(): Errors {
    const e: Errors = {};
    if (values.name.trim().length < 2) e.name = 'Informe seu nome ou o nome da empresa.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = 'Informe um e-mail válido.';
    if (!values.map_type) e.map_type = 'Selecione o tipo de mapa.';
    if (values.project_name.trim().length < 2) e.project_name = 'Dê um nome ou ideia inicial ao projeto.';
    if (values.description.trim().length < 20) e.description = 'Descreva a ideia com pelo menos 20 caracteres.';
    if (!privacyAck) e.privacyAck = 'Confirme que você leu o aviso de privacidade.';
    return e;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      document.querySelector('[aria-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setStatus('loading'); setNotice('Validando e registrando sua solicitação…');
    try {
      let attachments: Attachment[] = [];
      if (files.length) {
        setNotice('Enviando arquivos de referência…');
        const data = new FormData();
        files.forEach((f) => data.append('files', f));
        const uploadRes = await fetch('/api/uploads/reference', { method: 'POST', body: data });
        const uploadJson = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadJson.error || 'Falha ao enviar os arquivos.');
        attachments = uploadJson.data.files as Attachment[];
      }
      setNotice('Registrando pedido de orçamento…');
      const res = await fetch('/api/map-requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, attachments }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.fields) setErrors(json.fields as Errors);
        throw new Error(json.error || 'Não foi possível enviar a solicitação.');
      }
      setProtocol(json.data.protocol);
      setFeedback(json.data.message);
      setEmailSent(json.data.emailNotification === 'sent');
      setStatus('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setStatus('error');
      setNotice(error instanceof Error ? error.message : 'Erro inesperado. Tente novamente.');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg border border-pink/30 bg-gradient-to-b from-pink/[0.08] to-transparent p-8 sm:p-10" role="status">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10"><CheckCircle2 className="h-7 w-7 text-emerald-400" /></div>
        <p className="eyebrow mb-3">Solicitação registrada</p>
        <h2 className="heading-md text-white">Recebemos sua ideia<span className="text-pink">.</span></h2>
        <p className="text-muted mt-4 max-w-xl">{feedback}</p>
        <div className="mt-6 inline-flex flex-col gap-1 rounded-sm border border-white/10 bg-black/40 px-5 py-3">
          <span className="font-display text-[10px] uppercase tracking-[0.2em] text-mist-500">Protocolo</span>
          <span className="font-display text-xl font-bold tracking-wider text-pink-400">{protocol}</span>
        </div>
        <p className="mt-5 text-[13px] leading-relaxed text-mist-400">
          {emailSent === false
            ? 'Observação: o envio de e-mails ainda não está configurado neste ambiente; sua solicitação foi salva no painel administrativo e será analisada pela equipe.'
            : 'Nossa equipe analisará os requisitos e entrará em contato para discutir o projeto e enviar uma proposta comercial.'}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/creates" className="btn-outline btn-sm">Voltar ao portfólio</Link>
          <button type="button" onClick={() => { setValues(INITIAL); setFiles([]); setPrivacyAck(false); setProtocol(''); setStatus('idle'); }} className="btn-primary btn-sm">Enviar outra solicitação</button>
        </div>
      </div>
    );
  }

  const input = (key: keyof typeof INITIAL, label: string, placeholder: string, type = 'text', required = false) => (
    <div>
      <label htmlFor={`mr-${key}`} className="form-label">{label} {required && <span className="text-pink">*</span>}</label>
      <input id={`mr-${key}`} name={key} type={type} value={values[key]} onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder} aria-invalid={Boolean(errors[key])} className="form-input" />
      <FieldError message={errors[key]} />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        {input('name', 'Nome do cliente ou empresa', 'Como podemos chamar você?', 'text', true)}
        {input('email', 'E-mail para contato', 'voce@empresa.com', 'email', true)}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {input('contact', 'Discord ou outro contato (opcional)', '@seuusuario')}
        <div>
          <label htmlFor="mr-map_type" className="form-label">Tipo de mapa <span className="text-pink">*</span></label>
          <select id="mr-map_type" name="map_type" value={values.map_type} onChange={(e) => set('map_type', e.target.value)}
            aria-invalid={Boolean(errors.map_type)} className="form-input">
            <option value="">Selecione uma categoria</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            <option value="Outro">Outro / não sei ainda</option>
          </select>
          <FieldError message={errors.map_type} />
        </div>
      </div>
      {input('project_name', 'Nome ou ideia inicial do projeto', 'Ex.: Arena de treino para 5 jogadores', 'text', true)}
      <div>
        <label htmlFor="mr-description" className="form-label">Descrição detalhada da ideia <span className="text-pink">*</span></label>
        <textarea id="mr-description" name="description" rows={6} value={values.description} onChange={(e) => set('description', e.target.value)}
          placeholder="Conte sobre o jogo, o objetivo do mapa, o público, o estilo visual, mecânicas desejadas e qualquer requisito importante…"
          aria-invalid={Boolean(errors.description)} className="form-input resize-y" />
        <div className="flex items-start justify-between gap-4">
          <FieldError message={errors.description} />
          <span className="mt-1.5 shrink-0 text-[11px] text-mist-500">{values.description.length}/4000</span>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {input('budget', 'Orçamento estimado (opcional)', 'Ex.: R$ 2.000 a R$ 5.000')}
        {input('deadline', 'Prazo desejado (opcional)', 'Ex.: 45 dias')}
      </div>
      <div>
        <label htmlFor="mr-refs" className="form-label">Referências visuais ou links de inspiração (opcional)</label>
        <textarea id="mr-refs" name="refs" rows={3} value={values.refs} onChange={(e) => set('refs', e.target.value)}
          placeholder="Links, nomes de mapas, estilos, cores ou descrições que ajudem a entender a referência." className="form-input resize-y" />
      </div>

      <div>
        <span className="form-label">Anexar imagens ou arquivos de referência (opcional)</span>
        <div className="rounded-sm border border-dashed border-white/15 bg-white/[0.02] p-5">
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => fileInput.current?.click()} className="btn-outline btn-sm">
              <Paperclip className="h-4 w-4" /> Selecionar arquivos
            </button>
            <p className="text-xs leading-relaxed text-mist-500">PNG, JPG, WEBP ou PDF · até 5 MB cada · máximo de 4 arquivos.</p>
          </div>
          <input ref={fileInput} type="file" multiple accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden"
            onChange={(e) => {
              const selected = Array.from(e.target.files || []).slice(0, 4);
              setFiles(selected);
              if (selected.some((f) => f.size > 5 * 1024 * 1024)) setErrors((x) => ({ ...x, files: 'Algum arquivo ultrapassa 5 MB.' }));
              else setErrors((x) => ({ ...x, files: '' }));
            }} />
          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((file, i) => (
                <li key={`${file.name}-${i}`} className="flex items-center justify-between gap-3 rounded-sm bg-white/[0.04] px-3 py-2 text-xs text-mist-300">
                  <span className="truncate">{file.name} <span className="text-mist-500">· {(file.size / 1024).toFixed(0)} KB</span></span>
                  <button type="button" aria-label={`Remover ${file.name}`} onClick={() => setFiles((f) => f.filter((_, index) => index !== i))} className="text-mist-500 hover:text-pink-400"><X className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          )}
          <FieldError message={errors.files} />
        </div>
      </div>

      <div className="rounded-sm border border-white/10 bg-white/[0.02] p-5">
        <div className="mb-3 flex items-center gap-2 font-display text-[11px] font-bold uppercase tracking-[0.16em] text-pink-400">
          <ShieldCheck className="h-4 w-4" /> Privacidade e finalidade dos dados
        </div>
        <p className="text-[13px] leading-relaxed text-mist-400">
          Coletamos apenas nome, e-mail, contato opcional e as informações do projeto para analisar sua ideia, elaborar uma proposta comercial e entrar em contato com você. Os dados são armazenados com acesso restrito no painel administrativo, não são vendidos nem usados para publicidade e podem ser excluídos mediante solicitação. Consulte a{' '}
          <Link href="/privacidade" className="text-pink-400 underline underline-offset-2 hover:text-white">Política de Privacidade</Link> e use o{' '}
          <Link href="/contato" className="text-pink-400 underline underline-offset-2 hover:text-white">formulário de contato</Link> para exercer seus direitos.
        </p>
        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={privacyAck} onChange={(e) => { setPrivacyAck(e.target.checked); setErrors((x) => ({ ...x, privacyAck: '' })); }}
            aria-invalid={Boolean(errors.privacyAck)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#FF008F]" />
          <span className="text-[13px] leading-relaxed text-mist-300">Estou ciente de como meus dados serão utilizados para responder a este pedido de orçamento. <span className="text-pink">*</span></span>
        </label>
        <FieldError message={errors.privacyAck} />
      </div>

      {/* honeypot — invisível para humanos */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="mr-website">Não preencha este campo</label>
        <input id="mr-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={(e) => set('website', e.target.value)} />
      </div>

      {status === 'error' && <div role="alert" className="rounded-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{notice}</div>}

      <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-mist-500">Este formulário é um <strong className="text-mist-300">pedido de orçamento</strong>. Nenhuma cobrança é feita automaticamente.</p>
        <button type="submit" disabled={status === 'loading'} className="btn-primary w-full sm:w-auto">
          {status === 'loading' ? <><ButtonSpinner /> {notice}</> : <><Send className="h-4 w-4" /> Enviar solicitação</>}
        </button>
      </div>
    </form>
  );
}
