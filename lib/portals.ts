import type { Address, Coords } from "@/lib/types";

/**
 * Outbound deep-links to official / public services. We never scrape these —
 * each function returns a URL the user opens themselves. Listing portals have
 * no public API, so we hand off with a site-scoped web search instead.
 */

function addressQuery(address: Address | null): string {
  if (!address) return "";
  if (address.road) {
    // Quote just the street name (multi-word) and leave the rest as loose
    // terms — quoting the whole comma-heavy address as one exact phrase
    // rarely matches how listing sites actually format it, so it returns
    // zero results.
    return [`"${address.road}"`, address.houseNumber, address.city]
      .filter(Boolean)
      .join(" ");
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
  const scoped = `${q} (site:vivareal.com.br OR site:zapimoveis.com.br OR site:olx.com.br OR site:imovelweb.com.br)`;
  return `https://www.google.com/search?q=${encodeURIComponent(scoped)}`;
}

/**
 * ONR — Registradores (Operador Nacional do Sistema de Registro Eletrônico de
 * Imóveis). Official national portal: certidão requests, matrícula lookup,
 * and "pesquisa de bens" (find the responsible cartório) all live here.
 * `pedidodecertidao.onr.org.br` (the previous link) doesn't resolve — DNS
 * failure, not a temporary outage — so it was simply a wrong subdomain.
 */
export function onrCertidaoLink(): string {
  return "https://registradores.onr.org.br/";
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
