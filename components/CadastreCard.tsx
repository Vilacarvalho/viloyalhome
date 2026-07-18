"use client";

import { useEffect, useState } from "react";
import type { Coords } from "@/lib/types";
import type { GeoportalResult, ParcelInfo } from "@/lib/geoportal/types";
import { cascavelGeoLink } from "@/lib/portals";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const m2 = (n: number) => `${n.toLocaleString("pt-BR")} m²`;

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line py-1.5 last:border-0">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="text-right text-sm text-ink">{value}</span>
    </div>
  );
}

function ParcelView({ parcel }: { parcel: ParcelInfo }) {
  return (
    <div className="mt-1">
      {parcel.valorVenal !== undefined && (
        <div className="mb-3 rounded-lg bg-surface-2 p-3">
          <p className="text-[11px] uppercase tracking-wider text-ink-muted">
            Valor venal (IPTU)
          </p>
          <p className="text-xl font-semibold text-accent">
            {brl(parcel.valorVenal)}
          </p>
        </div>
      )}
      <Row label="Inscrição" value={parcel.inscricao} />
      <Row
        label="Área do terreno"
        value={parcel.areaTerreno !== undefined ? m2(parcel.areaTerreno) : undefined}
      />
      <Row
        label="Área construída"
        value={
          parcel.areaConstruida !== undefined ? m2(parcel.areaConstruida) : undefined
        }
      />
      <Row
        label="Endereço cadastral"
        value={[parcel.logradouro, parcel.numero].filter(Boolean).join(", ") || undefined}
      />
      <Row label="Bairro" value={parcel.bairro} />
      <Row label="Proprietário" value={parcel.proprietario} />
      <Row label="Uso / zona" value={parcel.uso} />
    </div>
  );
}

export default function CadastreCard({ coords }: { coords: Coords }) {
  const [result, setResult] = useState<GeoportalResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/geoportal?lat=${coords.lat}&lon=${coords.lon}`)
      .then((r) => r.json())
      .then((data: GeoportalResult) => {
        if (!cancelled) setResult(data);
      })
      .catch(() => {
        if (!cancelled)
          setResult({
            available: false,
            reason: "error",
            message: "Falha ao consultar o geoportal.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [coords]);

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wider text-ink-muted">
          Cadastro & valor venal
        </p>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
          Geoportal
        </span>
      </div>

      {result === null && (
        <div className="mt-3 space-y-2">
          <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-surface-2" />
        </div>
      )}

      {result?.available && <ParcelView parcel={result.parcel} />}

      {result && !result.available && result.reason === "not_found" && (
        <p className="mt-2 text-sm text-ink-muted">
          Nenhuma parcela cadastral encontrada nesta coordenada. Confira a
          precisão do GPS ou ajuste o ponto no mapa.
        </p>
      )}

      {result && !result.available && result.reason === "not_configured" && (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-ink-muted">
            A consulta automática de cadastro/valor venal ainda não está
            configurada para este ambiente.
          </p>
          <a
            href={cascavelGeoLink()}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm font-medium text-accent hover:underline"
          >
            Consultar no portal de Cascavel →
          </a>
        </div>
      )}

      {result && !result.available && result.reason === "error" && (
        <p className="mt-2 text-sm text-ink-muted">
          Não foi possível consultar o geoportal agora. {result.message}
        </p>
      )}
    </div>
  );
}
