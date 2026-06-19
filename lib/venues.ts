/**
 * lib/venues.ts
 * Mapa estático estadio → ciudad anfitriona del Mundial 2026.
 *
 * El backend (/api/fixture) envía `venue` con SOLO el nombre del estadio, sin
 * ciudad ni país. Los 16 estadios sede son fijos y públicos, así que resolvemos
 * la ciudad en el front. Las claves son los strings EXACTOS que emite el backend
 * (incluye nombres con sponsor: "Estadio Banorte" = ex Azteca, "GEHA Field at
 * Arrowhead Stadium"). Si en algún momento el backend agrega `city` al schema,
 * este mapa se puede retirar.
 *
 * Distribución: 11 sedes en EE. UU., 3 en México, 2 en Canadá.
 */

import type { Locale } from "@/lib/i18n";

// Ciudad por idioma. La mayoría coincide en es/en; sólo difieren los exónimos
// (Nueva York, Los Ángeles, Filadelfia, Ciudad de México).
const VENUE_CITY: Record<string, { es: string; en: string }> = {
  // Estados Unidos
  "MetLife Stadium": { es: "Nueva York", en: "New York" },
  "SoFi Stadium": { es: "Los Ángeles", en: "Los Angeles" },
  "AT&T Stadium": { es: "Dallas", en: "Dallas" },
  "NRG Stadium": { es: "Houston", en: "Houston" },
  "Mercedes-Benz Stadium": { es: "Atlanta", en: "Atlanta" },
  "Lincoln Financial Field": { es: "Filadelfia", en: "Philadelphia" },
  "Levi's Stadium": { es: "San Francisco", en: "San Francisco" },
  "Lumen Field": { es: "Seattle", en: "Seattle" },
  "Hard Rock Stadium": { es: "Miami", en: "Miami" },
  "Gillette Stadium": { es: "Boston", en: "Boston" },
  "GEHA Field at Arrowhead Stadium": { es: "Kansas City", en: "Kansas City" },
  // México
  "Estadio Banorte": { es: "Ciudad de México", en: "Mexico City" },
  "Estadio BBVA": { es: "Monterrey", en: "Monterrey" },
  "Estadio Akron": { es: "Guadalajara", en: "Guadalajara" },
  // Canadá
  "BC Place": { es: "Vancouver", en: "Vancouver" },
  "BMO Field": { es: "Toronto", en: "Toronto" },
};

/**
 * Devuelve la ciudad anfitriona del estadio en el idioma dado, o `null` si el
 * estadio no está en el mapa (estadio nuevo/renombrado por el backend). El
 * llamador degrada mostrando sólo el estadio; nunca rompe el layout.
 */
export function cityForVenue(
  venue: string | null | undefined,
  locale: Locale
): string | null {
  if (!venue) return null;
  return VENUE_CITY[venue.trim()]?.[locale] ?? null;
}

// ISO2 del país anfitrión por estadio. Coincide con FixtureMatch.flag_a / flag_b
// (que vienen como ISO2 de flagcdn.com). Solo los 3 países sede del WC2026.
const VENUE_HOST: Record<string, string> = {
  // Estados Unidos
  "MetLife Stadium": "us",
  "SoFi Stadium": "us",
  "AT&T Stadium": "us",
  "NRG Stadium": "us",
  "Mercedes-Benz Stadium": "us",
  "Lincoln Financial Field": "us",
  "Levi's Stadium": "us",
  "Lumen Field": "us",
  "Hard Rock Stadium": "us",
  "Gillette Stadium": "us",
  "GEHA Field at Arrowhead Stadium": "us",
  // México
  "Estadio Banorte": "mx",
  "Estadio BBVA": "mx",
  "Estadio Akron": "mx",
  // Canadá
  "BC Place": "ca",
  "BMO Field": "ca",
};

/**
 * Devuelve el ISO2 del país anfitrión del estadio, o `null` si no está mapeado.
 * Usarlo junto a `FixtureMatch.flag_a/flag_b` para derivar el equipo local
 * sin depender del campo `home_team_id` (que solo viene en PredictResponse).
 */
export function homeNationIso(venue: string | null | undefined): string | null {
  if (!venue) return null;
  return VENUE_HOST[venue.trim()] ?? null;
}
