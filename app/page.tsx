import Scanner from "@/components/Scanner";

export default function Home() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-4 pb-16 pt-6">
      <header className="mb-6 flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center border border-accent/40 font-mono text-sm font-semibold text-accent">
            V
          </div>
          <div>
            <h1 className="font-mono text-sm font-semibold uppercase tracking-[0.15em] text-ink">
              Viloyalhome
            </h1>
            <p className="text-[11px] text-ink-muted">
              Foto → localização → ficha do imóvel
            </p>
          </div>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          v3
        </span>
      </header>

      <Scanner />

      <footer className="mt-10 border-t border-line pt-4 text-[11px] leading-relaxed text-ink-muted">
        Endereço via geocodificação reversa. Valor venal, matrícula (ONR) e
        anúncios são serviços externos — abrimos o portal oficial, sem raspagem
        de dados.
      </footer>
    </main>
  );
}
