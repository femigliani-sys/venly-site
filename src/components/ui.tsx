import Link from 'next/link';
import { ArrowUpRight, SearchX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ size = 40, className, priority = false }: { size?: number; className?: string; priority?: boolean }) {
  return (
    // Arquivo oficial da marca — usado sem alterações, recortes ou recriações.
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.png" alt="Logo oficial Venly Esports" width={size} height={size}
      className={cn('shrink-0 rounded-[10px] object-cover', className)}
      style={{ width: size, height: size }} loading={priority ? 'eager' : 'lazy'} />
  );
}

export function SectionHeading({ label, title, accent, description, align = 'left', className }: {
  label?: string; title: string; accent?: string; description?: string; align?: 'left' | 'center'; className?: string;
}) {
  return (
    <div className={cn(align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl', className)}>
      {label && <p className="eyebrow mb-4 flex items-center gap-3"><span className="h-px w-8 bg-pink" />{label}</p>}
      <h2 className="heading-lg text-white">{title} {accent && <span className="text-gradient">{accent}</span>}</h2>
      {description && <p className="text-muted mt-5 max-w-2xl text-base">{description}</p>}
    </div>
  );
}

export function PageHero({ label, title, accent, description, breadcrumb, children }: {
  label: string; title: string; accent?: string; description?: string; breadcrumb?: string; children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-ink-900 pt-36 pb-16 sm:pt-44 sm:pb-24">
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-pink/[0.12] blur-[120px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-px w-1/2 bg-gradient-to-l from-pink/60 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-ink to-transparent" />
      <div className="container-wide relative">
        {breadcrumb && <p className="mb-6 font-display text-[11px] uppercase tracking-[0.25em] text-mist-500">Home <span className="mx-2 text-pink">/</span> {breadcrumb}</p>}
        <p className="eyebrow mb-5 flex items-center gap-3"><span className="h-px w-8 bg-pink" />{label}</p>
        <h1 className="heading-lg max-w-5xl text-white">{title} {accent && <span className="text-gradient glow-text">{accent}</span>}</h1>
        {description && <p className="text-muted mt-6 max-w-2xl text-base sm:text-lg">{description}</p>}
        {children && <div className="mt-8">{children}</div>}
      </div>
      <div className="pointer-events-none absolute bottom-0 right-8 hidden font-display text-[13rem] font-bold leading-none text-white/[0.018] lg:block">VENLY</div>
    </section>
  );
}

export function Chip({ children, pink, className }: { children: React.ReactNode; pink?: boolean; className?: string }) {
  return <span className={cn('chip', pink && 'chip-pink', className)}>{children}</span>;
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-sm border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 font-display text-[10px] font-bold uppercase tracking-[0.14em] text-amber-300', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" /> Demonstrativo
    </span>
  );
}

export function EmptyState({ title, description, action, icon }: {
  title: string; description?: string; action?: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.015] px-6 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-pink/25 bg-pink/5 text-pink-400">
        {icon || <SearchX className="h-6 w-6" />}
      </div>
      <h3 className="font-display text-xl font-bold uppercase tracking-wide text-white">{title}</h3>
      {description && <p className="text-muted mt-3 max-w-md text-sm">{description}</p>}
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <Loader2 className="h-4 w-4 animate-spin text-pink" /> <span>{label || 'Carregando…'}</span>
    </span>
  );
}

export function TextLink({ href, children, external, className }: {
  href: string; children: React.ReactNode; external?: boolean; className?: string;
}) {
  const classes = cn('group inline-flex items-center gap-1.5 font-display text-[12px] font-bold uppercase tracking-[0.16em] text-pink-400 transition-colors hover:text-white', className);
  if (external) return <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>{children}<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></a>;
  return <Link href={href} className={classes}>{children}<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>;
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="form-error" role="alert">{message}</span>;
}

export function FormNotice({ type, children }: { type: 'success' | 'error' | 'info'; children: React.ReactNode }) {
  const styles = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    error: 'border-red-500/30 bg-red-500/10 text-red-200',
    info: 'border-pink/30 bg-pink/10 text-pink-100',
  };
  return <div role={type === 'error' ? 'alert' : 'status'} className={cn('rounded-sm border px-4 py-3.5 text-sm leading-relaxed', styles[type])}>{children}</div>;
}
