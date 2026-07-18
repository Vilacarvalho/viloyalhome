import type { ParcelInfo } from "@/lib/geoportal/types";
import { applyFieldMap, type FetchLike } from "@/lib/geoportal/map";
import type { FieldMap } from "@/lib/geoportal/config";

type ArcgisQueryResponse = {
  features?: Array<{ attributes?: Record<string, unknown> }>;
  error?: { message?: string };
};

/**
 * Query an ArcGIS FeatureServer/MapServer layer for the parcel that contains a
 * point. Works with the standard Esri REST `query` operation used by most
 * Brazilian municipal geoportals.
 */
export async function arcgisLookup(
  url: string,
  lat: number,
  lon: number,
  inWkid: number,
  fields: FieldMap,
  fetchImpl: FetchLike = fetch
): Promise<ParcelInfo | null> {
  const geometry = JSON.stringify({
    x: lon,
    y: lat,
    spatialReference: { wkid: inWkid },
  });

  const q = new URLSearchParams({
    f: "json",
    geometry,
    geometryType: "esriGeometryPoint",
    inSR: String(inWkid),
    spatialRel: "esriSpatialRelIntersects",
    outFields: "*",
    returnGeometry: "false",
    where: "1=1",
  });

  const endpoint = `${url.replace(/\/$/, "")}/query?${q.toString()}`;
  const res = await fetchImpl(endpoint, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`ArcGIS respondeu ${res.status}`);

  const data = (await res.json()) as ArcgisQueryResponse;
  if (data.error) throw new Error(data.error.message ?? "Erro no serviço ArcGIS");

  const attrs = data.features?.[0]?.attributes;
  if (!attrs) return null;

  return applyFieldMap(attrs, fields);
}
