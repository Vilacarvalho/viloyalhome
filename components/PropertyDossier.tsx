"use client";

import dynamic from "next/dynamic";
import CadastreCard from "@/components/CadastreCard";
import type { Address, Coords } from "@/lib/types";
import { formatCoords } from "@/lib/geo";
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

export default function PropertyDossier({
  photoDataUrl,
  coords,
  address,
}: {
  photoDataUrl: string;
  coords: Coords | null;
  address: Address | null;
}) {
  return (
    <div className="space-y-5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photoDataUrl}
        alt="Foto do imóvel"
        className="max-h-72 w-full rounded-xl border border-line object-cover"
      />

      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-[11px] uppercase tracking-wider text-ink-muted">
          Endereço estimado
        </p>
        <p className="mt-1 text-base leading-snug text-ink">
          {address?.label ?? "Endereço não identificado para esta coordenada."}
        </p>

        {address && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Field label="Logradouro" value={address.road} />
            <Field label="Número" value={address.houseNumber} />
            <Field label="Bairro" value={address.suburb} />
            <Field label="Cidade" value={address.city} />
            <Field label="UF" value={address.state} />
            <Field label="CEP" value={address.postcode} />
          </div>
        )}

        {coords && (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            <span>{formatCoords(coords)}</span>
            <span aria-hidden>·</span>
            <span>
              {coords.source === "device"
                ? "GPS do aparelho"
                : "GPS embutido na foto (EXIF)"}
            </span>
            {coords.accuracy ? (
              <>
                <span aria-hidden>·</span>
                <span>precisão ~{Math.round(coords.accuracy)} m</span>
              </>
            ) : null}
          </div>
        )}
      </div>

      {coords && <MapView coords={coords} />}

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
            desc="Pesquisa de bens para descobrir em qual cartório está a matrícula."
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
