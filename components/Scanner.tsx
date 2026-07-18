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

  return (
    <div className="space-y-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {!scan && (
        <div className="rounded-2xl border border-line bg-surface p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 text-2xl">
            📸
          </div>
          <h2 className="text-lg font-medium text-ink">Escaneie um imóvel</h2>
          <p className="mx-auto mt-1 max-w-xs text-sm text-ink-muted">
            Tire uma foto na frente do imóvel. Usamos o GPS do seu aparelho para
            achar o endereço e montar a ficha.
          </p>
          <button
            type="button"
            disabled={!!busy}
            onClick={() => inputRef.current?.click()}
            className="mt-5 w-full rounded-xl bg-accent px-4 py-3 font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            {busy ?? "Tirar foto"}
          </button>
          <p className="mt-3 text-[11px] text-ink-muted">
            A localização precisa de HTTPS e da sua permissão de GPS.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-ink">
          <p className="font-medium text-danger">Não deu pra concluir</p>
          <p className="mt-1 text-ink-muted">{error}</p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-3 text-sm font-medium text-accent hover:underline"
          >
            Tentar de novo →
          </button>
        </div>
      )}

      {scan && (
        <div className="space-y-4">
          <PropertyDossier
            photoDataUrl={scan.photoDataUrl}
            coords={scan.coords}
            address={scan.address}
          />
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 font-medium text-ink transition-colors hover:border-accent"
          >
            Escanear outro imóvel
          </button>
        </div>
      )}

      {!scan && history.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-ink-muted">
            Escaneados recentemente
          </p>
          <div className="grid grid-cols-3 gap-2">
            {history.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setScan(h)}
                className="group overflow-hidden rounded-lg border border-line text-left"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={h.photoDataUrl}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <p className="truncate px-1.5 py-1 text-[10px] text-ink-muted">
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
