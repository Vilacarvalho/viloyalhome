import type { Address, Coords } from "@/lib/types";

/** Ask the device for its current position. Requires HTTPS + user permission. */
export function getDeviceLocation(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocalização não é suportada neste dispositivo."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: "device",
        }),
      (err) => {
        const messages: Record<number, string> = {
          1: "Permissão de localização negada. Autorize o acesso para continuar.",
          2: "Não foi possível obter a localização agora. Tente de novo ao ar livre.",
          3: "Tempo esgotado ao buscar a localização.",
        };
        reject(new Error(messages[err.code] ?? "Falha ao obter a localização."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

/**
 * Try to read GPS coordinates embedded in the photo's EXIF metadata. Many
 * phone cameras strip this, and browsers often drop it on <input capture>, so
 * this is a best-effort fallback — it resolves to null when nothing is found.
 */
export async function getExifLocation(file: File): Promise<Coords | null> {
  try {
    const exifr = (await import("exifr")).default;
    const gps = await exifr.gps(file);
    if (
      gps &&
      typeof gps.latitude === "number" &&
      typeof gps.longitude === "number"
    ) {
      return { lat: gps.latitude, lon: gps.longitude, source: "exif" };
    }
  } catch {
    // exifr throws on files with no parseable metadata — treat as "no GPS".
  }
  return null;
}

/** Reverse geocode via our own API route (keeps the Nominatim contact + caching server-side). */
export async function reverseGeocode(coords: Coords): Promise<Address | null> {
  const res = await fetch(
    `/api/geocode?lat=${coords.lat}&lon=${coords.lon}`
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { address: Address | null };
  return data.address;
}

export function formatCoords(coords: Coords): string {
  return `${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;
}
