import type { Address, Coords } from "@/lib/types";

/**
 * Outbound deep-links to official / public services. We never scrape these —
 * each function returns a URL the user opens themselves. Listing portals have
 * no public API, so we hand off with a site-scoped web search instead.
 */

function addressQuery(address: Address | null): string {
  if (!address) return "";
  if (address.road) {
    return [
      address.houseNumber ? `${address.road}, ${address.houseNumber}` : address.road,
      address.suburb,
      address.city,
      address.state,
    ]
      .filter(Boolean)
      .join(", ");
  }
  return address.label ?? "";
}

export function googleMapsLink(coords: Coords): string {
  return `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`;
}

export function streetViewLink(coords: Coords): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${coords.lat},${coords.lon}`;
}

/** Web search scoped to the main BR listing portals (VivaReal, Zap, OLX, Imovelweb). */
export function listingsSearchLink(address: Address | null): string {
  const q = addressQuery(address) || "imóvel à venda";
  const scoped = `"${q}" (site:vivareal.com.br OR site:zapimoveis.com.br OR site:olx.com.br OR site:imovelweb.com.br)`;
  return `https://www.google.com/search?q=${encodeURIComponent(scoped)}`;
}

/** ONR — Pedido de Certidão de Matrícula (registro de imóveis). Paid, official. */
export function onrCertidaoLink(): string {
  return "https://pedidodecertidao.onr.org.br/";
}

/** ONR — pesquisa de bens (localizar em qual cartório está a matrícula). */
export function onrPesquisaLink(): string {
  return "https://www.registradores.org.br/";
}

/**
 * GeoCascavel — Cascavel/PR's public cadastral map viewer (lote, quadra,
 * inscrição, área, testada, matrícula, cartório). Confirmed working by manual
 * DevTools inspection. Valor venal is NOT exposed here (or anywhere public):
 * it's protected by sigilo fiscal (CTN art. 198), and the viewer itself is
 * reCAPTCHA-gated, so this stays a manual deep-link rather than an automated
 * lookup — both intentional protections we won't try to route around.
 */
export function cascavelGeoLink(): string {
  return "https://geocascavel.cascavel.pr.gov.br/geo-view/index.ctm";
}
