import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/geocode";

// Reverse geocoding proxy. Runs server-side so provider keys stay off the
// client and Nominatim gets a proper contact header. Provider is picked by
// whichever key is set (see lib/geocode) — Google/Mapbox when configured,
// Nominatim otherwise.

export const runtime = "nodejs";

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

  try {
    const address = await reverseGeocode(lat, lon);
    return NextResponse.json({ address });
  } catch {
    return NextResponse.json(
      { address: null, error: "Falha ao consultar o serviço de geocodificação." },
      { status: 502 }
    );
  }
}
