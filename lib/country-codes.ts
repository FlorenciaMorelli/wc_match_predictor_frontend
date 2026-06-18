/**
 * lib/country-codes.ts
 * Código FIFA de 3 letras por selección WC2026, derivado de lib/data/squads_wc2026.csv
 * (columnas `pais` + `abreviatura`). Keyed por nombre canónico normalizado; se usa para
 * mapear cada equipo del front a su competidor en ESPN (por abreviatura) al armar la
 * crónica de un partido finalizado. Selección sin entrada → "" (cae al fallback
 * local/visitante en el route, nunca rompe).
 */

const CODES: Record<string, string> = {
  algeria: "ALG",
  argentina: "ARG",
  australia: "AUS",
  austria: "AUT",
  belgium: "BEL",
  "bosnia and herzegovina": "BIH",
  brazil: "BRA",
  "cabo verde": "CPV",
  canada: "CAN",
  colombia: "COL",
  "congo dr": "COD",
  "cote d ivoire": "CIV",
  croatia: "CRO",
  curacao: "CUW",
  czechia: "CZE",
  ecuador: "ECU",
  egypt: "EGY",
  england: "ENG",
  france: "FRA",
  germany: "GER",
  ghana: "GHA",
  haiti: "HAI",
  "ir iran": "IRN",
  iraq: "IRQ",
  japan: "JPN",
  jordan: "JOR",
  "korea republic": "KOR",
  mexico: "MEX",
  morocco: "MAR",
  netherlands: "NED",
  "new zealand": "NZL",
  norway: "NOR",
  panama: "PAN",
  paraguay: "PAR",
  portugal: "POR",
  qatar: "QAT",
  "saudi arabia": "KSA",
  scotland: "SCO",
  senegal: "SEN",
  "south africa": "RSA",
  spain: "ESP",
  sweden: "SWE",
  switzerland: "SUI",
  tunisia: "TUN",
  turkiye: "TUR",
  uruguay: "URU",
  usa: "USA",
  uzbekistan: "UZB",
};

// Variantes del backend (canónico FIFA/ESPN) que no coinciden literal con el CSV.
const ALIASES: Record<string, string> = {
  "ivory coast": "CIV",
  "south korea": "KOR",
  iran: "IRN",
  "united states": "USA",
  turkey: "TUR",
  "czech republic": "CZE",
  "dr congo": "COD",
  "cape verde": "CPV",
};

function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function countryCode(name: string): string {
  const n = norm(name);
  return CODES[n] ?? ALIASES[n] ?? "";
}
