import type { ParcelInfo } from "@/lib/geoportal/types";
import { applyFieldMap, type FetchLike } from "@/lib/geoportal/map";
import type { FieldMap } from "@/lib/geoportal/config";

type WmsFeatureCollection = {
  features?: Array<{ properties?: Record<string, unknown> }>;
};

/** Project lon/lat (EPSG:4326) to Web Mercator meters (EPSG:3857). */
function toMercator(lon: number, lat: number): [number, number] {
  const R = 20037508.34;
  const x = (lon * R) / 180;
  const y =
    (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180)) *
    (R / 180);
  return [x, y];
}

/**
 * WMS GetFeatureInfo for the parcel under a point. We query in EPSG:3857 to
 * sidestep the WMS 1.3.0 lat/lon axis-order trap that EPSG:4326 triggers.
 */
export async function wmsLookup(
  baseUrl: string,
  version: string,
  layers: string,
  lat: number,
  lon: number,
  fields: FieldMap,
  fetchImpl: FetchLike = fetch
): Promise<ParcelInfo | null> {
  const [x, y] = toMercator(lon, lat);
  const half = 1; // ~2m box around the point
  const bbox = [x - half, y - half, x + half, y + half];
  const size = 3;
  const center = 1;
  const is13 = version.startsWith("1.3");

  const params: Record<string, string> = {
    SERVICE: "WMS",
    VERSION: version,
    REQUEST: "GetFeatureInfo",
    LAYERS: layers,
    QUERY_LAYERS: layers,
    FORMAT: "image/png",
    INFO_FORMAT: "application/json",
    WIDTH: String(size),
    HEIGHT: String(size),
    BBOX: bbox.join(","),
    FEATURE_COUNT: "1",
    [is13 ? "CRS" : "SRS"]: "EPSG:3857",
    [is13 ? "I" : "X"]: String(center),
    [is13 ? "J" : "Y"]: String(center),
  };

  const sep = baseUrl.includes("?") ? "&" : "?";
  const endpoint = `${baseUrl}${sep}${new URLSearchParams(params).toString()}`;
  const res = await fetchImpl(endpoint, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`WMS respondeu ${res.status}`);

  const data = (await res.json()) as WmsFeatureCollection;
  const props = data.features?.[0]?.properties;
  if (!props) return null;

  return applyFieldMap(props, fields);
}
