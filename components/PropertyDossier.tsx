"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
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
    <div className="h-56 w-full animate-pulse border border-line bg-surface-2" />
  ),
});

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2.5 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
        {label}
      </span>
      <span className="text-right text-sm text-ink">{value}</span>
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
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-line bg-surface-2 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent"
      />
    </label>
  );
}

function ActionCard({
  title,
  desc,
  href,
  cta,
  tag,
}: {
  title: string;
  desc: string;
  href: string;
  cta: string;
  tag?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col gap-1.5 border border-line bg-surface p-4 transition-colors hover:border-accent"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink">
          {title}
        </p>
        {tag && (
          <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
            {tag}
          </span>
        )}
      </div>
      <p className="text-xs leading-relaxed text-ink-muted">{desc}</p>
      <span className="mt-1 font-mono text-xs font-medium text-accent group-hover:underline">
        {cta} →
      </span>
    </a>
  );
}

const SOURCE_LABEL: Record<Coords["source"], string> = {
  device: "GPS do aparelho",
  exif: "GPS embutido na foto (EXIF)",
  manual: "Ajustado manualmente no mapa",
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

export default function PropertyDossier({
  photoDataUrl,
  coords,
  address,
  onUpdate,
}: {
  photoDataUrl: string;
  coords: Coords | null;
  address: Address | null;
  onUpdate: (patch: { coords?: Coords; address?: Address | null }) => void;
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

  return (
    <div className="space-y-5">
      {/* Hero: photo framed like an instrument viewfinder, with a live
          coordinate readout HUD — the "scan" made visible. */}
      <div className="relative border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoDataUrl}
          alt="Foto do imóvel"
          className="block max-h-80 w-full object-cover"
        />
        {coords && (
          <>
            <div className="viewfinder-corner viewfinder-corner--tl" />
            <div className="viewfinder-corner viewfinder-corner--tr" />
            <div className="viewfinder-corner viewfinder-corner--bl" />
            <div className="viewfinder-corner viewfinder-corner--br" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-5 pb-3 pt-8">
              <p className="font-mono text-xs font-medium text-accent">
                {locating ? "atualizando…" : formatCoords(coords)}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-white/70">
                {SOURCE_LABEL[coords.source]}
                {coords.accuracy ? ` · ±${Math.round(coords.accuracy)}m` : ""}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            Endereço
          </p>
          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="font-mono text-[10px] font-semibold uppercase tracking-wider text-accent hover:underline"
            >
              Editar
            </button>
          )}
        </div>

        {!editing && (
          <p className="px-4 py-3 text-base leading-snug text-ink">
            {locating
              ? "Atualizando endereço…"
              : (address?.label ?? "Endereço não identificado para esta coordenada.")}
          </p>
        )}

        {!editing && address && (
          <div className="border-t border-line">
            <Row label="Logradouro" value={address.road} />
            <Row label="Número" value={address.houseNumber} />
            <Row label="Bairro" value={address.suburb} />
            <Row label="Cidade" value={address.city} />
            <Row label="UF" value={address.state} />
            <Row label="CEP" value={address.postcode} />
          </div>
        )}

        {editing && (
          <div className="space-y-3 px-4 py-4">
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
            <div className="flex gap-3">
              <button
                type="button"
                onClick={saveEditing}
                className="bg-accent px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[#06110c] hover:bg-accent-hover"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="border border-line px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-ink-muted hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {coords && (
        <div>
          <MapView coords={coords} draggable onPinMoved={handlePinMoved} />
          <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
            O endereço automático pode errar em condomínios ou ruas sem
            numeração completa. Arraste o pino até a casa exata para
            atualizar o endereço, ou edite os campos manualmente acima.
          </p>
        </div>
      )}

      {coords && (
        <CadastreCard key={`${coords.lat},${coords.lon}`} coords={coords} />
      )}

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          Próximos passos
        </p>
        <div className="grid gap-3">
          {coords && (
            <div className="grid grid-cols-2 gap-3">
              <ActionCard
                title="Google Maps"
                desc="Abrir a coordenada exata no mapa."
                href={googleMapsLink(coords)}
                cta="Abrir"
              />
              <ActionCard
                title="Street View"
                desc="Ver a fachada de perto."
                href={streetViewLink(coords)}
                cta="Abrir"
              />
            </div>
          )}

          <ActionCard
            title="Matrícula do imóvel"
            desc="Pedir certidão ou localizar o cartório responsável no ONR (Registro de Imóveis). Serviço oficial, direto no cartório, pago à parte — não é puxado automático. Dica: em Cascavel, clicar no lote no GeoCascavel já mostra o cartório direto."
            href={onrCertidaoLink()}
            cta="Abrir ONR"
            tag="ONR · oficial"
          />

          <ActionCard
            title="Certidão com ajuda de terceiro"
            desc="Serviço PRIVADO (não é o governo) que pede a certidão por você direto no cartório, cobrando uma taxa de intermediação. Mais mão na roda, mas mais caro que ir direto no ONR."
            href={certidaoPrivadaLink()}
            cta="Abrir serviço privado"
            tag="Privado"
          />

          <ActionCard
            title="Está à venda / anunciado?"
            desc="Busca por este endereço nos portais (VivaReal, Zap, OLX, Imovelweb)."
            href={listingsSearchLink(address)}
            cta="Buscar anúncios"
            tag="Busca"
          />
        </div>
      </div>
    </div>
  );
}
