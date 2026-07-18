import type { ParcelInfo } from "@/lib/geoportal/types";
import type { FieldMap } from "@/lib/geoportal/config";

export type FetchLike = (
  input: string,
  init?: { headers?: Record<string, string> }
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

/** Case-insensitive lookup of the first present candidate attribute. */
function pick(attrs: Record<string, unknown>, candidates: string[]): unknown {
  const lowerKeys = new Map(
    Object.keys(attrs).map((k) => [k.toLowerCase(), k])
  );
  for (const cand of candidates) {
    const realKey = lowerKeys.get(cand.toLowerCase());
    if (realKey !== undefined) {
      const v = attrs[realKey];
      if (v !== null && v !== "" && v !== undefined) return v;
    }
  }
  return undefined;
}

/** Parse BR-formatted numbers ("1.234,56") and plain numbers alike. */
export function parseNumber(value: unknown): number | undefined {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value !== "string") return undefined;
  const cleaned = value.trim().replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function str(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const s = String(value).trim();
  return s.length ? s : undefined;
}

/** Map raw feature attributes onto the normalized ParcelInfo using the field map. */
export function applyFieldMap(
  attrs: Record<string, unknown>,
  fields: FieldMap
): ParcelInfo {
  return {
    inscricao: str(pick(attrs, fields.inscricao ?? [])),
    valorVenal: parseNumber(pick(attrs, fields.valorVenal ?? [])),
    areaTerreno: parseNumber(pick(attrs, fields.areaTerreno ?? [])),
    areaConstruida: parseNumber(pick(attrs, fields.areaConstruida ?? [])),
    logradouro: str(pick(attrs, fields.logradouro ?? [])),
    numero: str(pick(attrs, fields.numero ?? [])),
    bairro: str(pick(attrs, fields.bairro ?? [])),
    proprietario: str(pick(attrs, fields.proprietario ?? [])),
    uso: str(pick(attrs, fields.uso ?? [])),
    raw: attrs,
  };
}
