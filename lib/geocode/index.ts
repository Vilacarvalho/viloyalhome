import type { Address } from "@/lib/types";
import { nominatimReverse } from "@/lib/geocode/nominatim";
import { mapboxReverse } from "@/lib/geocode/mapbox";
import { googleReverse } from "@/lib/geocode/google";

/**
 * Reverse geocode a coordinate to an address. Provider is chosen by which key
 * is configured (best-quality first), always falling back to free Nominatim:
 *
 *   GOOGLE_MAPS_API_KEY  -> Google   (best street+number for Brazil)
 *   MAPBOX_TOKEN         -> Mapbox   (good BR data, free tier, no credit card)
 *   (none)               -> Nominatim (OSM, free, patchy in some cities)
 *
 * Set GEOCODER_PROVIDER to force one (google|mapbox|nominatim).
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<Address | null> {
  const forced = (process.env.GEOCODER_PROVIDER ?? "").toLowerCase();
  const googleKey = process.env.GOOGLE_MAPS_API_KEY;
  const mapboxToken = process.env.MAPBOX_TOKEN;

  const useGoogle = googleKey && (forced === "google" || (!forced && !!googleKey));
  const useMapbox =
    mapboxToken && (forced === "mapbox" || (!forced && !googleKey && !!mapboxToken));

  try {
    if (forced !== "nominatim") {
      if (useGoogle) {
        const a = await googleReverse(lat, lon, googleKey!);
        if (a?.road) return a;
      } else if (useMapbox) {
        const a = await mapboxReverse(lat, lon, mapboxToken!);
        if (a?.road) return a;
      }
    }
  } catch {
    // Fall through to Nominatim on any provider error.
  }

  return nominatimReverse(lat, lon);
}
