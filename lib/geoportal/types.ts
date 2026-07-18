/** Normalized parcel/cadastre data, provider-agnostic. */
export type ParcelInfo = {
  /** Inscrição imobiliária / cadastral. */
  inscricao?: string;
  /** Valor venal (IPTU), em reais, quando exposto pelo geoportal. */
  valorVenal?: number;
  /** Área do terreno (m²). */
  areaTerreno?: number;
  /** Área construída (m²). */
  areaConstruida?: number;
  /** Logradouro cadastrado. */
  logradouro?: string;
  numero?: string;
  bairro?: string;
  /** Proprietário, quando público no cadastro. */
  proprietario?: string;
  /** Uso/zoneamento, quando disponível. */
  uso?: string;
  /** Atributos crus da feição, para depuração e campos não mapeados. */
  raw?: Record<string, unknown>;
};

export type GeoportalResult =
  | { available: true; parcel: ParcelInfo; provider: string }
  | { available: false; reason: "not_configured" | "not_found" | "error"; message: string };
