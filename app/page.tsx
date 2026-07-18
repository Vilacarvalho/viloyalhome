import Scanner from "@/components/Scanner";

export default function Home() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-4 pb-16 pt-6">
      <header className="mb-6 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
          V
        </div>
        <div>
          <h1 className="text-base font-semibold leading-none text-ink">
            Viloyalhome
          </h1>
          <p className="text-[11px] text-ink-muted">
            Foto → localização → ficha do imóvel · v3
          </p>
        </div>
      </header>

      <Scanner />

      <footer className="mt-10 border-t border-line pt-4 text-[11px] leading-relaxed text-ink-muted">
        Endereço via OpenStreetMap/Nominatim. Valor venal, matrícula (ONR) e
        anúncios são serviços externos — abrimos o portal oficial, sem raspagem
        de dados.
      </footer>
    </main>
  );
}
