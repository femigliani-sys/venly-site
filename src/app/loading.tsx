export default function Loading() {
  return (
    <div className="min-h-[80vh] bg-ink-950 pt-36">
      <div className="container-wide">
        <div className="skeleton h-3 w-40 rounded-full" />
        <div className="skeleton mt-8 h-14 w-2/3 rounded-lg" />
        <div className="skeleton mt-5 h-5 w-1/2 rounded-full" />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="skeleton h-64 rounded-lg" />)}
        </div>
        <p className="mt-10 text-center font-display text-[11px] uppercase tracking-[0.2em] text-mist-500">Carregando Venly Esports…</p>
      </div>
    </div>
  );
}
