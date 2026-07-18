import { getGeoportalConfig } from "@/lib/geoportal/config";
import { arcgisLookup } from "@/lib/geoportal/arcgis";
import { wmsLookup } from "@/lib/geoportal/wms";
import type { GeoportalResult } from "@/lib/geoportal/types";

/**
 * Look up cadastre/IPTU data for a coordinate against the configured municipal
 * geoportal. Returns a discriminated result so the UI can distinguish "not
 * configured" from "nothing found here" from "the service errored".
 */
export async function lookupParcel(
  lat: number,
  lon: number
): Promise<GeoportalResult> {
  const cfg = getGeoportalConfig();

  if (cfg.kind === "none") {
    return {
      available: false,
      reason: "not_configured",
      message:
        "Geoportal não configurado. Defina GEOPORTAL_KIND e GEOPORTAL_URL (veja o README).",
    };
  }

  try {
    const parcel =
      cfg.kind === "arcgis"
        ? await arcgisLookup(cfg.url, lat, lon, cfg.inWkid, cfg.fields)
        : await wmsLookup(cfg.url, cfg.version, cfg.layers, lat, lon, cfg.fields);

    if (!parcel) {
      return {
        available: false,
        reason: "not_found",
        message: "Nenhuma parcela cadastral encontrada nesta coordenada.",
      };
    }

    return { available: true, parcel, provider: cfg.kind };
  } catch (err) {
    return {
      available: false,
      reason: "error",
      message:
        err instanceof Error ? err.message : "Falha ao consultar o geoportal.",
    };
  }
}
