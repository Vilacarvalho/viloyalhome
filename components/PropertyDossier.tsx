"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import CadastreCard from "@/components/CadastreCard";
import type { Address, Coords } from "@/lib/types";
import { formatCoords, reverseGeocode } from "@/lib/geo";
import {
  googleMapsLink,
  listingsSearchLink,
  onrCertidaoLink,
  onrPesquisaLink,
  streetViewLink,
} from "@/lib/portals";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-56 w-full animate-pulse rounded-xl border border-line bg-surface-2" />
  ),
});

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</p>
      <p className="text-sm text-ink">{value}</p>
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
      <span className="text-[11px] uppercase tracking-wider text-ink-muted">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-accent"
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
      className="group flex flex-col gap-1 rounded-xl border border-line bg-surface p-4 transition-colors hover:border-accent"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">{title}</p>
        {tag && (
          <span className="shrink-0 rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
            {tag}
          </span>
        )}
      </div>
      <p className="text-xs leading-relaxed text-ink-muted">{desc}</p>
      <span className="mt-1 text-xs font-medium text-accent group-hover:underline">
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
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoDataUrl}
        alt="Foto do imóvel"
        className="max-h-72 w-full rounded-xl border border-line object-cover"
      />

      <div className="rounded-xl border border-line bg-surface p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] uppercase tracking-wider text-ink-muted">
            Endereço estimado
          </p>
          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="shrink-0 text-xs font-medium text-accent hover:underline"
            >
              Editar
            </button>
          )}
        </div>

        {!editing && (
          <p className="mt-1 text-base leading-snug text-ink">
            {locating
              ? "Atualizando endereço…"
              : (address?.label ?? "Endereço não identificado para esta coordenada.")}
          </p>
        )}

        {!editing && address && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Logradouro" value={address.road} />
            <Field label="Número" value={address.houseNumber} />
            <Field label="Bairro" value={address.suburb} />
            <Field label="Cidade" value={address.city} />
            <Field label="UF" value={address.state} />
            <Field label="CEP" value={address.postcode} />
          </div>
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
            <div className="flex gap-3">
              <button
                type="button"
                onClick={saveEditing}
                className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {coords && !editing && (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span>{formatCoords(coords)}</span>
            <span aria-hidden>·</span>
            <span>{SOURCE_LABEL[coords.source]}</span>
            {coords.accuracy ? (
              <>
                <span aria-hidden>·</span>
                <span>precisão ~{Math.round(coords.accuracy)} m</span>
              </>
            ) : null}
          </div>
        )}
      </div>

      {coords && (
        <div>
          <MapView coords={coords} draggable onPinMoved={handlePinMoved} />
          <p className="mt-2 text-[11px] text-ink-muted">
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
        <p className="mb-2 text-[11px] uppercase tracking-wider text-ink-muted">
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
            desc="Pedir a certidão de matrícula no ONR (Registro de Imóveis). Serviço oficial e pago — não é puxada automática."
            href={onrCertidaoLink()}
            cta="Pedir certidão"
            tag="ONR"
          />

          <ActionCard
            title="Localizar o cartório"
            desc="Pesquisa de bens no ONR. Dica: em Cascavel, clicar no lote no GeoCascavel já mostra o cartório responsável direto."
            href={onrPesquisaLink()}
            cta="Pesquisar"
            tag="ONR"
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
