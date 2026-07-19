"use client";

import { useEffect, useState } from "react";
import { Landmark, ExternalLink } from "lucide-react";
import type { Coords } from "@/lib/types";
import type { GeoportalResult, ParcelInfo } from "@/lib/geoportal/types";
import { cascavelGeoLink } from "@/lib/portals";

const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const m2 = (n: number) => `${n.toLocaleString("pt-BR")} m²`;

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-line">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="tabnum text-right text-sm font-medium text-ink">
        {value}
      </span>
    </div>
  );
}

function ParcelView({ parcel }: { parcel: ParcelInfo }) {
  const highlight =
    parcel.valorVenal !== undefined
      ? { label: "Valor venal (IPTU)", value: brl(parcel.valorVenal) }
      : parcel.areaTerreno !== undefined
        ? { label: "Área do terreno", value: m2(parcel.areaTerreno) }
        : null;

  return (
    <div className="px-4 pb-4 sm:px-5 sm:pb-5">
      {highlight && (
        <div className="mb-3 rounded-xl border border-gold/25 bg-gold/10 px-4 py-3">
          <p className="text-[11px] font-medium text-gold/90">
            {highlight.label}
          </p>
          <p className="tabnum text-xl font-extrabold text-gold">
            {highlight.value}
          </p>
        </div>
      )}
      <div>
        <Row label="Inscrição" value={parcel.inscricao} />
        <Row
          label="Área construída"
          value={
            parcel.areaConstruida !== undefined
              ? m2(parcel.areaConstruida)
              : undefined
          }
        />
        <Row
          label="Endereço cadastral"
          value={
            [parcel.logradouro, parcel.numero].filter(Boolean).join(", ") ||
            undefined
          }
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
    <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex items-center justify-between px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/12 text-gold">
            <Landmark size={16} strokeWidth={2} />
          </div>
          <h3 className="text-sm font-bold text-ink">Cadastro do imóvel</h3>
        </div>
        <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-muted">
          Geoportal
        </span>
      </div>

      {result === null && (
        <div className="space-y-2 px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="h-4 w-2/3 animate-pulse rounded bg-surface-2" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-surface-2" />
        </div>
      )}

      {result?.available && <ParcelView parcel={result.parcel} />}

      {result && !result.available && result.reason === "not_found" && (
        <p className="px-4 pb-4 text-sm text-ink-muted sm:px-5 sm:pb-5">
          Nenhuma parcela cadastral encontrada nesta coordenada. Confira a
          precisão do GPS ou ajuste o ponto no mapa.
        </p>
      )}

      {result && !result.available && result.reason === "not_configured" && (
        <div className="space-y-2.5 px-4 pb-4 sm:px-5 sm:pb-5">
          <p className="text-sm leading-relaxed text-ink-muted">
            O valor venal (IPTU) é protegido por sigilo fiscal (art. 198 do CTN)
            — só o proprietário acessa, com login. Nenhum app público consegue
            puxar automaticamente, nem o nosso.
          </p>
          <p className="text-sm leading-relaxed text-ink-muted">
            O que é público: endereço, área, testada, inscrição e até o cartório
            da matrícula — consultável à mão no GeoCascavel (clique no lote).
          </p>
          <a
            href={cascavelGeoLink()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gold/12 px-3.5 py-2 text-sm font-semibold text-gold transition hover:bg-gold/20"
          >
            Consultar no GeoCascavel
            <ExternalLink size={14} />
          </a>
        </div>
      )}

      {result && !result.available && result.reason === "error" && (
        <p className="px-4 pb-4 text-sm text-ink-muted sm:px-5 sm:pb-5">
          Não foi possível consultar o geoportal agora. {result.message}
        </p>
      )}
    </section>
  );
}
