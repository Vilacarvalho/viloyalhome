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
    <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2.5 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
        {label}
      </span>
      <span className="text-right text-sm text-ink">{value}</span>
    </div>
  );
}

function ParcelView({ parcel }: { parcel: ParcelInfo }) {
  return (
    <div>
      {parcel.valorVenal !== undefined ? (
        <div className="mx-4 mt-3 mb-1 border border-accent/30 bg-accent/10 px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            Valor venal (IPTU)
          </p>
          <p className="font-mono text-xl font-semibold text-accent">
            {brl(parcel.valorVenal)}
          </p>
        </div>
      ) : parcel.areaTerreno !== undefined ? (
        <div className="mx-4 mt-3 mb-1 border border-cadastral/30 bg-cadastral/10 px-3 py-2.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
            Área do terreno
          </p>
          <p className="font-mono text-xl font-semibold text-cadastral">
            {m2(parcel.areaTerreno)}
          </p>
        </div>
      ) : null}
      <div className="mt-2 border-t border-line">
        <Row label="Inscrição" value={parcel.inscricao} />
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
    <div className="border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-ink-muted">
          Cadastro do imóvel
        </p>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
          Geoportal
        </span>
      </div>

      {result === null && (
        <div className="space-y-2 px-4 py-4">
          <div className="h-4 w-2/3 animate-pulse bg-surface-2" />
          <div className="h-4 w-1/2 animate-pulse bg-surface-2" />
        </div>
      )}

      {result?.available && <ParcelView parcel={result.parcel} />}

      {result && !result.available && result.reason === "not_found" && (
        <p className="px-4 py-3 text-sm text-ink-muted">
          Nenhuma parcela cadastral encontrada nesta coordenada. Confira a
          precisão do GPS ou ajuste o ponto no mapa.
        </p>
      )}

      {result && !result.available && result.reason === "not_configured" && (
        <div className="space-y-2 px-4 py-3">
          <p className="text-sm text-ink-muted">
            O valor venal (IPTU) é protegido por sigilo fiscal (art. 198 do
            CTN) e só o proprietário acessa, com login — nenhum app público
            consegue puxar esse número automaticamente, nem o nosso.
          </p>
          <p className="text-sm text-ink-muted">
            O que é público: endereço, área do terreno, testada, inscrição
            cadastral e até o cartório responsável pela matrícula — tudo
            consultável à mão no GeoCascavel (clique no lote no mapa).
          </p>
          <a
            href={cascavelGeoLink()}
            target="_blank"
            rel="noreferrer"
            className="inline-block font-mono text-xs font-semibold uppercase tracking-wider text-accent hover:underline"
          >
            Consultar no GeoCascavel →
          </a>
        </div>
      )}

      {result && !result.available && result.reason === "error" && (
        <p className="px-4 py-3 text-sm text-ink-muted">
          Não foi possível consultar o geoportal agora. {result.message}
        </p>
      )}
    </div>
  );
}
