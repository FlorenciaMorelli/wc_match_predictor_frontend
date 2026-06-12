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

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
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
