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
export function cityForVenue(venue: string | null | undefined, locale: Locale): string | null {
  if (!venue) return null;
  return VENUE_CITY[venue.trim()]?.[locale] ?? null;
}
