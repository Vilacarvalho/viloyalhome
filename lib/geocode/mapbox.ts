import type { Address } from "@/lib/types";

type Feature = {
  text?: string;
  address?: string;
  place_name?: string;
  context?: Array<{ id: string; text: string }>;
};

type MapboxResponse = { features?: Feature[] };

function ctx(feature: Feature, prefix: string): string | undefined {
  return feature.context?.find((c) => c.id.startsWith(prefix))?.text;
}

/** Mapbox reverse geocoding — good BR coverage, free tier without a credit card. */
export async function mapboxReverse(
  lat: number,
  lon: number,
  token: string
): Promise<Address | null> {
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("language", "pt");
  url.searchParams.set("limit", "1");
  url.searchParams.set("types", "address");

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return null;

  const data = (await res.json()) as MapboxResponse;
  const f = data.features?.[0];
  if (!f) return null;

  return {
    label: f.place_name ?? "",
    road: f.text,
    houseNumber: f.address,
    suburb: ctx(f, "neighborhood") ?? ctx(f, "locality"),
    city: ctx(f, "place"),
    state: ctx(f, "region"),
    postcode: ctx(f, "postcode"),
    country: ctx(f, "country"),
  };
}
