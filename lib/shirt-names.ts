/**
 * lib/shirt-names.ts
 * Nombre real de camiseta (back-of-shirt) por jugador, desde la convocatoria WC2026.
 *
 * El backend etiqueta cada slot del XI con `name` (formato APELLIDO Nombre). El apellido
 * parseado heurísticamente NO siempre es el que va impreso en la espalda (mononímicos,
 * apodos, apellidos compuestos). Acá cruzamos cada `name` contra la fila correcta del CSV
 * oficial (lib/data/squads_wc2026.csv, pre-procesado a lib/shirt-names-data.ts) y devolvemos
 * su `nombre_camiseta`. Sin match → null (el componente cae al apellido heurístico).
 *
 * El match es generoso y agnóstico al orden nombre/apellido (misma estrategia que
 * lib/key-players.ts): comparte ≥1 token significativo. El país (ISO2) acota la búsqueda y
 * evita colisiones entre selecciones; ante varios candidatos gana el de mayor solapamiento.
 */
import { SHIRT_NAMES } from "./shirt-names-data";
import { significantTokens } from "./text";

// Índice por selección: tokens significativos del nombre completo → nombre de camiseta.
// Se construye una sola vez por ISO2 y se cachea (el XI consulta varias veces por equipo).
type IndexedRow = { tokens: Set<string>; shirt: string };
const indexCache = new Map<string, IndexedRow[]>();

function indexFor(iso2: string): IndexedRow[] {
  let idx = indexCache.get(iso2);
  if (!idx) {
    const rows = SHIRT_NAMES[iso2] ?? [];
    idx = rows.map(([full, shirt]) => ({
      tokens: new Set(significantTokens(full)),
      shirt,
    }));
    indexCache.set(iso2, idx);
  }
  return idx;
}

/**
 * Nombre de camiseta oficial para `backendName` dentro de la selección `iso2`, o null si no
 * hay match (jugador fuera del CSV, país sin datos o sin token comparable). Gana la fila con
 * más tokens significativos compartidos; con cero solapamiento → null.
 */
export function shirtName(iso2: string, backendName: string): string | null {
  const queryTokens = significantTokens(backendName);
  if (queryTokens.length === 0) return null;
  let best: IndexedRow | null = null;
  let bestScore = 0;
  for (const row of indexFor(iso2)) {
    let score = 0;
    for (const t of queryTokens) if (row.tokens.has(t)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = row;
    }
  }
  return best ? best.shirt : null;
}
