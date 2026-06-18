/**
 * lib/api.ts
 * Cliente tipado para la API FastAPI del predictor WC 2026.
 *
 * El navegador siempre llama a "/api/*" en el MISMO origen; Next reenvía esas
 * requests al backend real (API_BASE_URL) vía el proxy `rewrites` de
 * next.config.ts. Así no hay CORS y la URL del backend no queda en el bundle.
 */

import type {
  FixtureMatch,
  PredictRequest,
  PredictResponse,
  Team,
} from "@/types";

// Error tipado por causa: el cliente decide qué tarjeta mostrar según `kind`.
// offline = fetch rechaza (sin red) · waking = 503 (predictor arrancando) ·
// slow = timeout / 502 / 504 · server = otro 4xx/5xx (con `detail` opcional).
export type ApiErrorKind = "offline" | "waking" | "slow" | "server";

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly detail?: string;
  constructor(kind: ApiErrorKind, detail?: string) {
    super(detail ?? kind);
    this.name = "ApiError";
    this.kind = kind;
    this.detail = detail;
  }
}

// Normaliza cualquier error atrapado a un ApiError (los desconocidos → "server").
export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;
  return new ApiError("server", e instanceof Error ? e.message : undefined);
}

// Timeout para requests normales (fixture, teams). Generoso pero no crítico.
const REQUEST_TIMEOUT_MS = 30_000;
// Timeout para el predict: el modelo puede tardar ~150s en Render en frío.
// 240s da margen sobre el proxyTimeout de next.config para que el cliente reciba
// el error del proxy antes de que el AbortController lo corte por su cuenta.
const PREDICT_TIMEOUT_MS = 240_000;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...init,
    });
  } catch (e) {
    // TimeoutError (AbortSignal.timeout) → lento; cualquier otro rechazo → sin red.
    if (e instanceof DOMException && e.name === "TimeoutError") throw new ApiError("slow");
    throw new ApiError("offline");
  }

  if (!res.ok) {
    if (res.status === 503) throw new ApiError("waking"); // predictor arrancando
    if (res.status === 502 || res.status === 504) throw new ApiError("slow"); // proxy cortó
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(
      "server",
      typeof detail.detail === "string" ? detail.detail : JSON.stringify(detail.detail)
    );
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Equipos
// ---------------------------------------------------------------------------

export async function fetchTeams(): Promise<Team[]> {
  return apiFetch<Team[]>("/api/teams");
}

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

// Días pasados a incluir en el fixture. 40 cubre desde el primer día del Mundial
// (2026-06-11): el backend nunca consulta días previos a esa fecha, así que pedir
// un número alto es seguro (no dispara llamadas de más) y los días ya jugados se
// cachean 24 h. Esto es lo que hace visibles los partidos finalizados en la grilla.
const FIXTURE_INCLUDE_PAST = 40;

export async function fetchFixture(daysAhead = 10): Promise<FixtureMatch[]> {
  return apiFetch<FixtureMatch[]>(
    `/api/fixture?days_ahead=${daysAhead}&include_past=${FIXTURE_INCLUDE_PAST}`
  );
}

// ---------------------------------------------------------------------------
// Health / cold-start resilience
// ---------------------------------------------------------------------------

// Tiempo máximo por intento de health check y demora entre intentos.
const HEALTH_TIMEOUT_MS = 4_000;
const HEALTH_POLL_DELAY_MS = 3_000;
const HEALTH_MAX_POLLS = 5;

// Espera (sin lanzar) hasta que /health responda predictor="ready", o hasta
// agotar los intentos. Si se agota, el predict corre igual y maneja el error.
async function pollUntilReady(): Promise<void> {
  for (let i = 0; i < HEALTH_MAX_POLLS; i++) {
    try {
      const res = await fetch("/api/health", {
        signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
      });
      if (res.ok) {
        const body = await res.json().catch(() => null);
        if (body?.predictor === "ready") return;
      }
    } catch {
      // timeout de red: el servidor está levantando, seguimos esperando
    }
    if (i < HEALTH_MAX_POLLS - 1) {
      await new Promise((r) => setTimeout(r, HEALTH_POLL_DELAY_MS));
    }
  }
}

// ---------------------------------------------------------------------------
// Predicción
// ---------------------------------------------------------------------------

export async function predictMatch(
  req: PredictRequest
): Promise<PredictResponse> {
  // Pre-flight: esperamos a que el predictor cargue su modelo antes de mandar
  // la request pesada. Evita el cold-start de ~150s en Render mandando antes
  // de que el predictor esté disponible.
  await pollUntilReady();

  // Reintentamos hasta 2 veces en 503: puede aparecer en la ventana entre que
  // /health dice "ready" y el predictor procesa su primer request real.
  const MAX_RETRIES = 2;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let res: Response;
    try {
      res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
        signal: AbortSignal.timeout(PREDICT_TIMEOUT_MS),
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === "TimeoutError") throw new ApiError("slow");
      throw new ApiError("offline");
    }

    if (res.status === 503 && attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, 5_000));
      continue;
    }

    if (!res.ok) {
      if (res.status === 503) throw new ApiError("waking");
      if (res.status === 502 || res.status === 504) throw new ApiError("slow");
      const detail = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(
        "server",
        typeof detail.detail === "string" ? detail.detail : JSON.stringify(detail.detail)
      );
    }

    return res.json() as Promise<PredictResponse>;
  }
  throw new ApiError("waking");
}
