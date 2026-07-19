"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, FileSearch, Loader2, LocateFixed, MapPin } from "lucide-react";
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

const STEPS = [
  { icon: Camera, label: "Tire a foto" },
  { icon: LocateFixed, label: "GPS localiza" },
  { icon: FileSearch, label: "Monta a ficha" },
];

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
    <div>
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
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14 lg:py-6">
          {/* Pitch */}
          <div className="animate-rise text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface/60 px-3 py-1 text-xs font-medium text-ink-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Foto → GPS → ficha do imóvel
            </span>
            <h2 className="mx-auto mt-4 max-w-md text-[28px] font-extrabold leading-[1.1] tracking-tight text-ink sm:text-4xl lg:mx-0">
              Descubra qualquer imóvel{" "}
              <span className="text-accent">com uma foto</span>.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-muted lg:mx-0">
              Fotografe a fachada. O GPS do seu aparelho acha o endereço no mapa
              e monta a ficha com cadastro, matrícula e anúncios.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
              {STEPS.map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-ink-muted ring-1 ring-line"
                >
                  <s.icon size={14} className="text-accent" />
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          {/* Scan card */}
          <div className="animate-rise">
            <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-line bg-surface p-7 shadow-card sm:p-8">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl"
              />
              <div className="relative">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/12 text-accent ring-1 ring-accent/20">
                  <Camera size={30} strokeWidth={1.8} />
                </div>
                <h3 className="mt-5 text-center text-lg font-bold text-ink">
                  Escanear imóvel
                </h3>
                <p className="mx-auto mt-1.5 max-w-xs text-center text-sm leading-relaxed text-ink-muted">
                  Tire uma foto na frente do imóvel para começar.
                </p>
                <label
                  htmlFor="scanner-file"
                  aria-disabled={!!busy}
                  className={`mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-4 text-center text-[15px] font-bold text-[#05140b] shadow-[0_8px_24px_rgba(34,197,94,0.3)] transition hover:bg-accent-hover active:scale-[0.99] ${
                    busy ? "pointer-events-none opacity-70" : ""
                  }`}
                >
                  {busy ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Camera size={18} strokeWidth={2.2} />
                  )}
                  {busy ?? "Tirar foto"}
                </label>
                <p className="mt-3 text-center text-[11px] text-ink-muted">
                  Precisa de HTTPS e da sua permissão de GPS.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="animate-rise rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm lg:col-span-2">
              <p className="font-semibold text-danger">Não deu pra concluir</p>
              <p className="mt-1 text-ink-muted">{error}</p>
              <label
                htmlFor="scanner-file"
                className="mt-3 inline-block cursor-pointer text-sm font-semibold text-accent hover:underline"
              >
                Tentar de novo →
              </label>
            </div>
          )}

          {history.length > 0 && (
            <div className="lg:col-span-2">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Escaneados recentemente
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                {history.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => setScan(h)}
                    className="group overflow-hidden rounded-2xl border border-line bg-surface text-left shadow-card transition hover:-translate-y-0.5 hover:border-accent/50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={h.photoDataUrl}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                    <p className="flex items-center gap-1 truncate px-2 py-1.5 text-[11px] text-ink-muted">
                      <MapPin size={11} className="shrink-0 text-accent" />
                      <span className="truncate">
                        {h.address?.city ?? h.address?.suburb ?? "Sem endereço"}
                      </span>
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {scan && (
        <div className="animate-rise">
          <PropertyDossier
            photoDataUrl={scan.photoDataUrl}
            coords={scan.coords}
            address={scan.address}
            onUpdate={handleUpdate}
            onReset={reset}
          />
        </div>
      )}
    </div>
  );
}
