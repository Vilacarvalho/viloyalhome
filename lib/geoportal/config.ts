/**
 * Geoportal configuration, driven by environment variables so the exact
 * municipal endpoint can be plugged in (and swapped per city) without code
 * changes. Nothing is hardcoded to a specific server here — set these in
 * `.env.local` (see `.env.local.example` and the README) pointing at the real
 * Cascavel cadastre layer once its URL is confirmed on a network that can
 * reach `*.cascavel.pr.gov.br`.
 */

export type FieldMap = Record<string, string[]>;

/**
 * Default source-attribute candidates for each normalized field. Brazilian
 * cadastre layers name columns inconsistently, so we try several. Override the
 * whole map via GEOPORTAL_FIELDS (JSON) when the layer uses other names.
 */
export const DEFAULT_FIELD_MAP: FieldMap = {
  inscricao: ["inscricao", "inscricao_imobiliaria", "insc_imob", "cadastro", "nr_cadastro", "matricula"],
  valorVenal: ["valor_venal", "vl_venal", "valorvenal", "vvi", "valor_venal_total", "vl_venal_imovel"],
  areaTerreno: ["area_terreno", "area_lote", "area_terr", "areaterreno", "ar_terreno"],
  areaConstruida: ["area_construida", "area_edificada", "areaconstruida", "ar_construida", "area_const"],
  logradouro: ["logradouro", "endereco", "nm_logradouro", "rua"],
  numero: ["numero", "nr_predial", "num_predial", "numero_predial"],
  bairro: ["bairro", "nm_bairro", "nome_bairro"],
  proprietario: ["proprietario", "nome_proprietario", "contribuinte", "nm_contribuinte"],
  uso: ["uso", "uso_solo", "zoneamento", "zona", "tipo_uso"],
};

export type GeoportalConfig =
  | { kind: "none" }
  | {
      kind: "arcgis";
      /** ArcGIS layer query endpoint, e.g. https://host/arcgis/rest/services/…/MapServer/0 */
      url: string;
      /** Spatial reference we send the point in (input SR). Layer is reprojected server-side. */
      inWkid: number;
      fields: FieldMap;
    }
  | {
      kind: "wms";
      url: string;
      version: string;
      layers: string;
      inWkid: number;
      fields: FieldMap;
    };

function parseFieldMap(): FieldMap {
  const raw = process.env.GEOPORTAL_FIELDS;
  if (!raw) return DEFAULT_FIELD_MAP;
  try {
    return { ...DEFAULT_FIELD_MAP, ...(JSON.parse(raw) as FieldMap) };
  } catch {
    return DEFAULT_FIELD_MAP;
  }
}

export function getGeoportalConfig(): GeoportalConfig {
  const kind = (process.env.GEOPORTAL_KIND ?? "").toLowerCase();
  const url = process.env.GEOPORTAL_URL ?? "";
  const inWkid = Number(process.env.GEOPORTAL_WKID ?? "4326") || 4326;

  if (!url) return { kind: "none" };

  if (kind === "arcgis") {
    return { kind: "arcgis", url, inWkid, fields: parseFieldMap() };
  }
  if (kind === "wms") {
    return {
      kind: "wms",
      url,
      version: process.env.GEOPORTAL_WMS_VERSION ?? "1.3.0",
      layers: process.env.GEOPORTAL_WMS_LAYERS ?? "",
      inWkid,
      fields: parseFieldMap(),
    };
  }
  return { kind: "none" };
}
