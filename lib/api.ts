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

// Timeout de seguridad generoso: el predict puede tardar ~150s en Render. Lo
// dejamos por ENCIMA del proxyTimeout de next.config (180s) para que, si algo se
// cuelga, el cliente reciba el error del proxy en vez de abortar antes de tiempo.
const REQUEST_TIMEOUT_MS = 190_000;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      ...init,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "TimeoutError") {
      throw new Error(
        "El servidor está tardando más de lo normal (puede estar despertando). Esperá unos segundos y reintentá."
      );
    }
    throw new Error(
      "No pudimos conectar con el servidor. Revisá tu conexión y reintentá."
    );
  }

  if (!res.ok) {
    // 503: el predictor todavía se está cargando tras arrancar la instancia.
    if (res.status === 503) {
      throw new Error(
        "El predictor se está iniciando. Probá de nuevo en unos segundos."
      );
    }
    // 502/504: el proxy (Next o Vercel) cortó esperando al backend lento.
    if (res.status === 502 || res.status === 504) {
      throw new Error(
        "El servidor tardó demasiado en responder. Reintentá en un momento."
      );
    }
    const detail = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof detail.detail === "string"
        ? detail.detail
        : JSON.stringify(detail.detail)
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

export async function fetchFixture(daysAhead = 10): Promise<FixtureMatch[]> {
  return apiFetch<FixtureMatch[]>(
    `/api/fixture?days_ahead=${daysAhead}&include_past=1`
  );
}

// ---------------------------------------------------------------------------
// Predicción
// ---------------------------------------------------------------------------

export async function predictMatch(
  req: PredictRequest
): Promise<PredictResponse> {
  return apiFetch<PredictResponse>("/api/predict", {
    method: "POST",
    body: JSON.stringify(req),
  });
}
