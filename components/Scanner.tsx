"use client";

import { useEffect, useRef, useState } from "react";
import PropertyDossier from "@/components/PropertyDossier";
import {
  getDeviceLocation,
  getExifLocation,
  reverseGeocode,
} from "@/lib/geo";
import type { Coords, Scan } from "@/lib/types";

const HISTORY_KEY = "viloyalhome.history.v1";
const HISTORY_MAX = 12;

/** Downscale + re-encode so previews/history stay small in localStorage. */
function fileToDataUrl(file: File, maxSize = 1280): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Não foi possível processar a imagem."));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Arquivo de imagem inválido."));
    };
    img.src = url;
  });
}

function loadHistory(): Scan[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as Scan[]) : [];
  } catch {
    return [];
  }
}

export default function Scanner() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scan, setScan] = useState<Scan | null>(null);
  const [history, setHistory] = useState<Scan[]>([]);

  useEffect(() => {
    // localStorage is client-only, so this has to run after mount (a lazy
    // initializer would execute during SSR and never re-read on the client).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(loadHistory());
  }, []);

  function persist(next: Scan) {
    const updated = [next, ...history.filter((s) => s.id !== next.id)].slice(
      0,
      HISTORY_MAX
    );
    setHistory(updated);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // Storage full or unavailable — history is best-effort only.
    }
  }

  async function handleFile(file: File) {
    setError(null);
    setScan(null);

    try {
      setBusy("Processando a foto…");
      const photoDataUrl = await fileToDataUrl(file);

      setBusy("Obtendo a localização…");
      let coords: Coords | null = null;
      try {
        coords = await getDeviceLocation();
      } catch (deviceErr) {
        // Fall back to GPS embedded in the photo, if any.
        coords = await getExifLocation(file);
        if (!coords) throw deviceErr;
      }

      let address = null;
      if (coords) {
        setBusy("Identificando o endereço…");
        address = await reverseGeocode(coords);
      }

      const next: Scan = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        photoDataUrl,
        coords,
        address,
      };
      setScan(next);
      persist(next);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Algo deu errado ao escanear o imóvel."
      );
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setScan(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleUpdate(patch: Partial<Pick<Scan, "coords" | "address">>) {
    setScan((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Visually hidden (not display:none) so the <label> reliably opens the
          camera on iOS Safari, which blocks JS-triggered clicks on file inputs. */}
      <input
        ref={inputRef}
        id="scanner-file"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {!scan && (
        <div className="relative overflow-hidden border border-line bg-surface p-6 text-center">
          <div className="pointer-events-none absolute inset-0 opacity-[0.04]">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "linear-gradient(var(--color-ink) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />
          </div>
          <div className="relative">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-accent/40 text-accent">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden
              >
                <path d="M4 8V6a2 2 0 0 1 2-2h2m8 0h2a2 2 0 0 1 2 2v2M4 16v2a2 2 0 0 0 2 2h2m8 0h2a2 2 0 0 0 2-2v-2" />
                <circle cx="12" cy="12" r="3.5" />
              </svg>
            </div>
            <h2 className="font-mono text-sm font-semibold uppercase tracking-[0.1em] text-ink">
              Escanear imóvel
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">
              Tire uma foto na frente do imóvel. O GPS do seu aparelho localiza
              o endereço e monta a ficha.
            </p>
            <label
              htmlFor="scanner-file"
              aria-disabled={!!busy}
              className={`mt-5 block w-full cursor-pointer bg-accent px-4 py-3.5 text-center font-mono text-sm font-semibold uppercase tracking-wider text-[#06110c] transition-colors hover:bg-accent-hover ${
                busy ? "pointer-events-none opacity-60" : ""
              }`}
            >
              {busy ?? "Tirar foto"}
            </label>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
              Requer HTTPS + permissão de GPS
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="border border-danger/40 bg-danger/10 p-4 text-sm text-ink">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-danger">
            Não deu pra concluir
          </p>
          <p className="mt-1.5 text-ink-muted">{error}</p>
          <label
            htmlFor="scanner-file"
            className="mt-3 inline-block cursor-pointer text-sm font-medium text-accent hover:underline"
          >
            Tentar de novo →
          </label>
        </div>
      )}

      {scan && (
        <div className="space-y-4">
          <PropertyDossier
            photoDataUrl={scan.photoDataUrl}
            coords={scan.coords}
            address={scan.address}
            onUpdate={handleUpdate}
          />
          <button
            type="button"
            onClick={reset}
            className="w-full border border-line bg-surface px-4 py-3 font-mono text-sm uppercase tracking-wider text-ink transition-colors hover:border-accent"
          >
            Escanear outro imóvel
          </button>
        </div>
      )}

      {!scan && history.length > 0 && (
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            Escaneados recentemente
          </p>
          <div className="grid grid-cols-3 gap-2">
            {history.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setScan(h)}
                className="group overflow-hidden border border-line text-left transition-colors hover:border-accent/60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={h.photoDataUrl}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <p className="truncate px-1.5 py-1 font-mono text-[10px] text-ink-muted">
                  {h.address?.city ?? h.address?.suburb ?? "Sem endereço"}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
