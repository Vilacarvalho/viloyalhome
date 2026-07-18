import type { Address } from "@/lib/types";

type NominatimResponse = {
  display_name?: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

const CONTACT =
  process.env.GEOCODER_CONTACT ?? "viloyalhome (contato: exemplo@viloyalhome.app)";

/** Free OSM-based reverse geocoding. Good coverage varies a lot by city. */
export async function nominatimReverse(
  lat: number,
  lon: number
): Promise<Address | null> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "pt-BR");

  const res = await fetch(url, {
    headers: { "User-Agent": CONTACT },
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as NominatimResponse;
  const a = data.address ?? {};
  return {
    label: data.display_name ?? "",
    road: a.road,
    houseNumber: a.house_number,
    suburb: a.suburb ?? a.neighbourhood,
    city: a.city ?? a.town ?? a.village ?? a.municipality,
    state: a.state,
    postcode: a.postcode,
    country: a.country,
  };
}
