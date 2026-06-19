/**
 * lib/prediction-cache.ts
 * Caché persistente y compartida de predicciones (`PredictResponse`) en `localStorage`.
 *
 * Los tres puntos que consultan al predictor (fixture, predictor manual, /eval) pasan por
 * acá: una predicción hecha en cualquiera queda disponible para los otros (misma tupla de
 * request → misma clave). Mejora la carga, sobre todo en /eval, que dispara todas las
 * simulaciones de los partidos finalizados a la vez.
 *
 * Política de frescura: la decide el LLAMADOR (este módulo no conoce el dominio):
 *  - finalizados → "permanent" (inmutables: equipos, fecha y modelo no cambian).
 *  - próximos → TTL por proximidad al inicio (`upcomingFreshness`): el XI titular se
 *    confirma ~90 min antes, así que lejos del partido se cachea hasta esa ventana y,
 *    dentro de ella o ya en juego, con un TTL muy corto para captar la alineación fresca.
 *
 * Degrada con elegancia: si `localStorage` falla o no está (modo privado, SSR), simplemente
 * se llama al predictor. Nunca lanza por culpa de la caché.
 */

import type { PredictRequest, PredictResponse } from "@/types";
import { predictMatch } from "./api";

// v1: subir ante cambios de forma de `PredictResponse` para invalidar lo viejo.
const CACHE_PREFIX = "wc-predict:v1:";

// Tope de entradas: contiene la polución del predictor manual (combinaciones arbitrarias de
// equipos/fechas). 300 × ~5 KB ≈ 1,5 MB, holgado bajo el límite ~5 MB de localStorage.
const MAX_ENTRIES = 300;

// El XI titular se confirma ~90 min antes del inicio.
export const LINEUP_WINDOW_MS = 90 * 60 * 1000;
// Dentro de la ventana de confirmación del XI / ya en juego: TTL muy corto (capta el XI fresco).
export const NEAR_KICKOFF_TTL_MS = 5 * 60 * 1000;
// Tope lejos del inicio y TTL plano del predictor manual (fecha arbitraria, sin hora).
export const MAX_UPCOMING_TTL_MS = 6 * 60 * 60 * 1000;

// "permanent" = sin expiración; number = TTL en ms desde ahora.
export type Freshness = "permanent" | number;

type CacheEntry = {
  data: PredictResponse;
  ts: number; // epoch ms en que se guardó (orden LRU para el desalojo)
  exp: number | null; // epoch ms de expiración; null = permanente
};

// ---------------------------------------------------------------------------
// Helpers puros (testeables)
// ---------------------------------------------------------------------------

// YYYY-MM-DD de hoy en horario local. El backend resuelve `date` ausente como "hoy", así
// que lo usamos de default en la clave para que dos llamadas en días distintos no colisionen.
function todayYmd(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Clave canónica de la tupla de request. Rellena los defaults del backend (model =
// dixon_coles, knockout = false, date = hoy) para que llamadas equivalentes desde sitios
// distintos colisionen a la MISMA clave (p. ej. el fixture omite model y /eval lo pasa
// explícito). El orden A↔B NO se ordena: el modelo es asimétrico (local/visitante). El
// marcador no participa: la predicción no depende de él.
export function predictionCacheKey(req: PredictRequest, today: string): string {
  const model = req.model ?? "dixon_coles";
  const ko = req.knockout ? "ko" : "reg";
  const date = req.date ?? today;
  return `${CACHE_PREFIX}${model}:${ko}:${req.team_a_id}v${req.team_b_id}:${date}`;
}

// Una entrada está fresca si es permanente o todavía no expiró.
export function isEntryFresh(entry: CacheEntry, now: number): boolean {
  return entry.exp === null || entry.exp > now;
}

// TTL (ms) para un partido NO finalizado, según su proximidad al inicio:
//  - sin hora de inicio → TTL corto conservador (no sabemos cuán cerca está).
//  - dentro de la ventana de confirmación del XI o ya empezado → TTL corto.
//  - lejos → expira justo al entrar a esa ventana (kickoff − 90 min), con tope MAX.
export function upcomingFreshness(
  now: number,
  kickoffMs: number | null
): number {
  if (kickoffMs === null) return NEAR_KICKOFF_TTL_MS;
  const windowStart = kickoffMs - LINEUP_WINDOW_MS;
  if (now >= windowStart) return NEAR_KICKOFF_TTL_MS;
  return Math.min(MAX_UPCOMING_TTL_MS, windowStart - now);
}

// Claves a desalojar para no superar `max`: las más viejas por `ts` (LRU). Devuelve solo
// el excedente (las `n − max` más antiguas); [] si ya está dentro del tope.
export function selectEvictions(
  entries: { key: string; ts: number }[],
  max: number
): string[] {
  if (entries.length <= max) return [];
  return [...entries]
    .sort((a, b) => a.ts - b.ts)
    .slice(0, entries.length - max)
    .map((e) => e.key);
}

// ---------------------------------------------------------------------------
// Acceso a localStorage (guardado; nunca lanza)
// ---------------------------------------------------------------------------

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readEntry(key: string): CacheEntry | null {
  if (!hasStorage()) return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as CacheEntry) : null;
  } catch {
    return null;
  }
}

// Entradas propias (bajo el prefijo) con su `ts`, para el desalojo LRU. Una entrada
// corrupta se reporta con ts 0 → es la primera en desalojarse.
function ownEntries(): { key: string; ts: number }[] {
  const out: { key: string; ts: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(CACHE_PREFIX)) continue;
    try {
      const raw = localStorage.getItem(key);
      const ts = raw ? (JSON.parse(raw) as CacheEntry).ts : 0;
      out.push({ key, ts: typeof ts === "number" ? ts : 0 });
    } catch {
      out.push({ key, ts: 0 });
    }
  }
  return out;
}

function writeEntry(key: string, entry: CacheEntry): void {
  if (!hasStorage()) return;
  const payload = JSON.stringify(entry);
  try {
    // Poda proactiva por tope (dejamos lugar para la que estamos por escribir).
    for (const k of selectEvictions(ownEntries(), MAX_ENTRIES - 1))
      localStorage.removeItem(k);
    localStorage.setItem(key, payload);
  } catch {
    // Probable QuotaExceededError: desalojamos a la mitad y reintentamos una sola vez.
    try {
      for (const k of selectEvictions(
        ownEntries(),
        Math.floor(MAX_ENTRIES / 2)
      ))
        localStorage.removeItem(k);
      localStorage.setItem(key, payload);
    } catch {
      // Sigue sin entrar: seguimos sin cachear (no es crítico).
    }
  }
}

// ---------------------------------------------------------------------------
// API pública
// ---------------------------------------------------------------------------

// Devuelve una predicción usando la caché compartida: hit fresco → la entrada guardada;
// si no, llama al predictor y guarda con la expiración que pida `freshness`. Cualquier
// problema con el storage degrada a un `predictMatch` normal.
export async function cachedPredict(
  req: PredictRequest,
  freshness: Freshness
): Promise<PredictResponse> {
  const key = predictionCacheKey(req, todayYmd());
  const now = Date.now();

  const cached = readEntry(key);
  if (cached && isEntryFresh(cached, now)) return cached.data;

  const data = await predictMatch(req);
  const exp = freshness === "permanent" ? null : now + freshness;
  writeEntry(key, { data, ts: now, exp });
  return data;
}

// Limpia entradas de un prefijo anterior (p. ej. la caché aislada de /eval, superada por
// esta caché compartida). Inofensivo si no hay ninguna. Se llama una vez al montar.
export function purgeLegacy(prefix: string): void {
  if (!hasStorage()) return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) toRemove.push(key);
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    // ignorar
  }
}
