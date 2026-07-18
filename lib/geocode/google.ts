import type { Address } from "@/lib/types";

type Component = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleResponse = {
  status: string;
  results?: Array<{
    formatted_address?: string;
    address_components?: Component[];
  }>;
};

function pick(components: Component[], type: string): string | undefined {
  return components.find((c) => c.types.includes(type))?.long_name;
}

/** Google Geocoding — best street+number coverage for Brazil. Needs an API key. */
export async function googleReverse(
  lat: number,
  lon: number,
  key: string
): Promise<Address | null> {
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat},${lon}`);
  url.searchParams.set("language", "pt-BR");
  url.searchParams.set("key", key);

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;

  const data = (await res.json()) as GoogleResponse;
  if (data.status !== "OK" || !data.results?.length) return null;

  const best = data.results[0];
  const c = best.address_components ?? [];
  return {
    label: best.formatted_address ?? "",
    road: pick(c, "route"),
    houseNumber: pick(c, "street_number"),
    suburb: pick(c, "sublocality") ?? pick(c, "neighborhood"),
    city:
      pick(c, "administrative_area_level_2") ?? pick(c, "locality"),
    state: pick(c, "administrative_area_level_1"),
    postcode: pick(c, "postal_code"),
    country: pick(c, "country"),
  };
}
