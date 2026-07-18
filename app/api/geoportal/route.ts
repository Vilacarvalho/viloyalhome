import { NextResponse } from "next/server";
import { lookupParcel } from "@/lib/geoportal";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get("lat"));
  const lon = Number(searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json(
      { available: false, reason: "error", message: "Parâmetros lat/lon inválidos." },
      { status: 400 }
    );
  }

  const result = await lookupParcel(lat, lon);
  // Always 200 with a discriminated body — the UI renders each state itself.
  return NextResponse.json(result);
}
