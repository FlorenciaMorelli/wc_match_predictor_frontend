/**
 * lib/api.ts
 * Cliente tipado para la API FastAPI del predictor WC 2026.
 *
 * Por defecto el navegador llama a "/api/*" en el mismo origen y Next reenvía
 * esas requests al backend real (ver el proxy `rewrites` en next.config.ts),
 * evitando CORS por completo. Para apuntar el navegador directo a un backend
 * (p. ej. un FastAPI local) definí NEXT_PUBLIC_API_URL.
 */

import type {
  FixtureMatch,
  PredictRequest,
  PredictResponse,
  Team,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Timeout de seguridad generoso: el predict en cold-start de Render (instancia
// dormida + 100k simulaciones) puede tardar más de un minuto. Preferimos esperar
// y, si se pasa, dar un mensaje claro antes que dejar un spinner colgado.
const REQUEST_TIMEOUT_MS = 120_000;

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
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
