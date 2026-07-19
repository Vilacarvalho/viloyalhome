import { ScanLine } from "lucide-react";
import Scanner from "@/components/Scanner";

export default function Home() {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-5 sm:px-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-[#05140b] shadow-[0_4px_16px_rgba(34,197,94,0.35)]">
              <ScanLine size={19} strokeWidth={2.4} />
            </div>
            <div className="leading-tight">
              <h1 className="text-[15px] font-extrabold tracking-tight text-ink">
                Viloyalhome
              </h1>
              <p className="text-[11px] text-ink-muted">Scanner de imóveis</p>
            </div>
          </div>
          <span className="rounded-full border border-line bg-surface/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            beta
          </span>
        </header>

        <Scanner />

        <footer className="mt-12 border-t border-line pt-5 text-[11px] leading-relaxed text-ink-muted">
          Endereço via geocodificação reversa. Valor venal, matrícula (ONR) e
          anúncios são serviços externos — abrimos o portal oficial, sem
          raspagem de dados.
        </footer>
      </div>
    </div>
  );
}
