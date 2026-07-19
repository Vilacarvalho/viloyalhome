"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  ChevronRight,
  Eye,
  Navigation,
  Pencil,
  ScrollText,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import CadastreCard from "@/components/CadastreCard";
import type { Address, Coords } from "@/lib/types";
import { formatCoords, reverseGeocode } from "@/lib/geo";
import {
  certidaoPrivadaLink,
  googleMapsLink,
  listingsSearchLink,
  onrCertidaoLink,
  streetViewLink,
} from "@/lib/portals";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-56 w-full animate-pulse rounded-2xl border border-line bg-surface-2 lg:h-64" />
  ),
});

const SOURCE_LABEL: Record<Coords["source"], string> = {
  device: "GPS do aparelho",
  exif: "GPS embutido na foto",
  manual: "Ajustado no mapa",
};

function addressToLabel(a: Omit<Address, "label">): string {
  return [
    [a.road, a.houseNumber].filter(Boolean).join(", "),
    a.suburb,
    a.city,
    a.state,
    a.postcode,
  ]
    .filter(Boolean)
    .join(", ");
}

function heroTitle(address: Address | null): string {
  if (!address) return "Imóvel escaneado";
  if (address.road)
    return [address.road, address.houseNumber].filter(Boolean).join(", ");
  return address.suburb ?? address.city ?? "Imóvel escaneado";
}

function StatTile({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2.5">
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-ink-muted">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-ink outline-none transition focus:border-accent"
      />
    </label>
  );
}

type Action = {
  title: string;
  desc: string;
  href: string;
  cta: string;
  tag?: string;
  Icon: typeof ScrollText;
  badge: string;
  hover: string;
};

function ActionRow({ action }: { action: Action }) {
  const { title, desc, href, tag, Icon, badge, hover } = action;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`group flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-3.5 shadow-card transition hover:-translate-y-0.5 ${hover}`}
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${badge}`}
      >
        <Icon size={20} strokeWidth={1.9} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-bold text-ink">{title}</p>
          {tag && (
            <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
              {tag}
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">
          {desc}
        </p>
      </div>
      <ChevronRight
        size={18}
        className="shrink-0 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-ink"
      />
    </a>
  );
}

export default function PropertyDossier({
  photoDataUrl,
  coords,
  address,
  onUpdate,
  onReset,
}: {
  photoDataUrl: string;
  coords: Coords | null;
  address: Address | null;
  onUpdate: (patch: { coords?: Coords; address?: Address | null }) => void;
  onReset: () => void;
}) {
  const [locating, setLocating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    road: address?.road ?? "",
    houseNumber: address?.houseNumber ?? "",
    suburb: address?.suburb ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    postcode: address?.postcode ?? "",
  });

  async function handlePinMoved(lat: number, lon: number) {
    const newCoords: Coords = { lat, lon, source: "manual" };
    setLocating(true);
    try {
      const newAddress = await reverseGeocode(newCoords);
      onUpdate({ coords: newCoords, address: newAddress });
    } finally {
      setLocating(false);
    }
  }

  function startEditing() {
    setDraft({
      road: address?.road ?? "",
      houseNumber: address?.houseNumber ?? "",
      suburb: address?.suburb ?? "",
      city: address?.city ?? "",
      state: address?.state ?? "",
      postcode: address?.postcode ?? "",
    });
    setEditing(true);
  }

  function saveEditing() {
    const next: Address = { ...draft, label: addressToLabel(draft) };
    onUpdate({ address: next });
    setEditing(false);
  }

  const actions: Action[] = [
    {
      title: "Matrícula do imóvel",
      desc: "Pedir certidão ou localizar o cartório no ONR. Oficial, direto no cartório, pago à parte. Em Cascavel, o GeoCascavel já mostra o cartório.",
      href: onrCertidaoLink(),
      cta: "Abrir",
      tag: "ONR · oficial",
      Icon: ScrollText,
      badge: "bg-gold/12 text-gold",
      hover: "hover:border-gold/50",
    },
    {
      title: "Certidão com ajuda de terceiro",
      desc: "Serviço privado (não é o governo) que pede a certidão por você, cobrando taxa. Mais mão na roda, mas mais caro que o ONR.",
      href: certidaoPrivadaLink(),
      cta: "Abrir",
      tag: "Privado",
      Icon: ShieldCheck,
      badge: "bg-violet/12 text-violet",
      hover: "hover:border-violet/50",
    },
    {
      title: "Está à venda / anunciado?",
      desc: "Busca por este endereço nos portais (VivaReal, Zap, OLX, Imovelweb).",
      href: listingsSearchLink(address),
      cta: "Buscar",
      tag: "Busca",
      Icon: Search,
      badge: "bg-accent/12 text-accent",
      hover: "hover:border-accent/50",
    },
  ];

  return (
    <div>
      <button
        type="button"
        onClick={onReset}
        className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/70 px-3.5 py-1.5 text-sm font-medium text-ink-muted transition hover:border-accent/40 hover:text-ink"
      >
        <ArrowLeft size={15} />
        Escanear outro
      </button>

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start">
        {/* Left: hero + map (sticky on desktop) */}
        <div className="space-y-4 lg:sticky lg:top-5">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl border border-line shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoDataUrl}
              alt="Foto do imóvel"
              className="aspect-[4/3] w-full object-cover"
            />
            {coords && (
              <>
                <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="gps-ping absolute inline-flex h-full w-full rounded-full bg-accent" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                  </span>
                  GPS{coords.accuracy ? ` ±${Math.round(coords.accuracy)}m` : ""}
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-16">
                  <p className="text-[11px] font-medium text-white/70">
                    {locating ? "Atualizando…" : SOURCE_LABEL[coords.source]}
                  </p>
                  <p className="mt-0.5 text-lg font-bold leading-snug text-white">
                    {heroTitle(address)}
                  </p>
                  <span className="tabnum mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                    <Navigation size={11} />
                    {formatCoords(coords)}
                  </span>
                </div>
              </>
            )}
          </div>

          {coords && (
            <div>
              <MapView coords={coords} draggable onPinMoved={handlePinMoved} />
              <p className="mt-2 px-1 text-[11px] leading-relaxed text-ink-muted">
                Errou em condomínio ou rua sem número? Arraste o pino até a casa
                exata para atualizar, ou edite os campos ao lado.
              </p>
            </div>
          )}
        </div>

        {/* Right: address + cadastre + actions */}
        <div className="space-y-4">
          {/* Address */}
          <section className="rounded-2xl border border-line bg-surface p-4 shadow-card sm:p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Endereço
              </h3>
              {!editing ? (
                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-accent transition hover:bg-elevated"
                >
                  <Pencil size={13} />
                  Editar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-muted transition hover:text-ink"
                >
                  <X size={13} />
                  Cancelar
                </button>
              )}
            </div>

            {!editing && (
              <>
                <p className="mt-2 text-[15px] font-medium leading-snug text-ink">
                  {locating
                    ? "Atualizando endereço…"
                    : (address?.label ??
                      "Endereço não identificado para esta coordenada.")}
                </p>
                {address && (
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <StatTile label="Logradouro" value={address.road} />
                    <StatTile label="Número" value={address.houseNumber} />
                    <StatTile label="Bairro" value={address.suburb} />
                    <StatTile label="Cidade" value={address.city} />
                    <StatTile label="UF" value={address.state} />
                    <StatTile label="CEP" value={address.postcode} />
                  </div>
                )}
              </>
            )}

            {editing && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <TextInput
                    label="Logradouro"
                    value={draft.road}
                    onChange={(v) => setDraft((d) => ({ ...d, road: v }))}
                  />
                  <TextInput
                    label="Número"
                    value={draft.houseNumber}
                    onChange={(v) => setDraft((d) => ({ ...d, houseNumber: v }))}
                  />
                  <TextInput
                    label="Bairro"
                    value={draft.suburb}
                    onChange={(v) => setDraft((d) => ({ ...d, suburb: v }))}
                  />
                  <TextInput
                    label="Cidade"
                    value={draft.city}
                    onChange={(v) => setDraft((d) => ({ ...d, city: v }))}
                  />
                  <TextInput
                    label="UF"
                    value={draft.state}
                    onChange={(v) => setDraft((d) => ({ ...d, state: v }))}
                  />
                  <TextInput
                    label="CEP"
                    value={draft.postcode}
                    onChange={(v) => setDraft((d) => ({ ...d, postcode: v }))}
                  />
                </div>
                <button
                  type="button"
                  onClick={saveEditing}
                  className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-[#05140b] transition hover:bg-accent-hover"
                >
                  Salvar endereço
                </button>
              </div>
            )}
          </section>

          {coords && (
            <CadastreCard key={`${coords.lat},${coords.lon}`} coords={coords} />
          )}

          {/* Quick actions */}
          {coords && (
            <div className="grid grid-cols-2 gap-3">
              <a
                href={googleMapsLink(coords)}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card transition hover:-translate-y-0.5 hover:border-info/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info/12 text-info">
                  <Navigation size={19} strokeWidth={1.9} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">Maps</p>
                  <p className="truncate text-[11px] text-ink-muted">
                    Ver no mapa
                  </p>
                </div>
              </a>
              <a
                href={streetViewLink(coords)}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-card transition hover:-translate-y-0.5 hover:border-violet/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet/12 text-violet">
                  <Eye size={19} strokeWidth={1.9} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-ink">Street View</p>
                  <p className="truncate text-[11px] text-ink-muted">
                    Ver a fachada
                  </p>
                </div>
              </a>
            </div>
          )}

          {/* Próximos passos */}
          <div className="space-y-3">
            <p className="px-1 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Próximos passos
            </p>
            {actions.map((a) => (
              <ActionRow key={a.title} action={a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
