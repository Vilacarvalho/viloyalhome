import { NextResponse } from "next/server";
import type { Address } from "@/lib/types";

// Reverse geocoding proxy. Runs server-side so we can send a proper
// User-Agent / contact (Nominatim's usage policy requires it) and keep the
// external call off the client. Swap the provider here later without touching
// the app code.

export const runtime = "nodejs";

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { error: "Parâmetros lat/lon inválidos." },
      { status: 400 }
    );
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "pt-BR");

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": CONTACT },
      // Cache identical coordinates for a day — reverse geocodes are stable.
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { address: null, error: "Serviço de geocodificação indisponível." },
        { status: 502 }
      );
    }

    const data = (await res.json()) as NominatimResponse;
    const a = data.address ?? {};
    const address: Address = {
      label: data.display_name ?? "",
      road: a.road,
      houseNumber: a.house_number,
      suburb: a.suburb ?? a.neighbourhood,
      city: a.city ?? a.town ?? a.village ?? a.municipality,
      state: a.state,
      postcode: a.postcode,
      country: a.country,
    };

    return NextResponse.json({ address });
  } catch {
    return NextResponse.json(
      { address: null, error: "Falha ao consultar o serviço de geocodificação." },
      { status: 502 }
    );
  }
}
