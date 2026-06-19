import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PredictRequest, PredictResponse } from "@/types";
import {
  predictionCacheKey,
  isEntryFresh,
  upcomingFreshness,
  selectEvictions,
  cachedPredict,
  LINEUP_WINDOW_MS,
  NEAR_KICKOFF_TTL_MS,
  MAX_UPCOMING_TTL_MS,
} from "./prediction-cache";

// Mock del transporte: cachedPredict no debe pegarle al backend en los tests.
const { predictMatchMock } = vi.hoisted(() => ({ predictMatchMock: vi.fn() }));
vi.mock("./api", () => ({ predictMatch: predictMatchMock }));

// localStorage en memoria (el entorno de test es node, sin DOM).
function installLocalStorage() {
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  };
  vi.stubGlobal("localStorage", ls);
  vi.stubGlobal("window", { localStorage: ls });
  return store;
}

beforeEach(() => {
  predictMatchMock.mockReset();
  installLocalStorage();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const req: PredictRequest = { team_a_id: 1, team_b_id: 2, date: "2026-06-20" };
const res = {
  team_a_id: 1,
  team_b_id: 2,
  p_a: 0.5,
} as unknown as PredictResponse;

describe("predictionCacheKey", () => {
  it("colisiona cuando los defaults coinciden (fixture sin model ≡ eval con dixon_coles)", () => {
    const fromFixture = predictionCacheKey(
      { team_a_id: 1, team_b_id: 2, date: "2026-06-20" },
      "2026-06-19"
    );
    const fromEval = predictionCacheKey(
      {
        team_a_id: 1,
        team_b_id: 2,
        date: "2026-06-20",
        model: "dixon_coles",
        knockout: false,
      },
      "2026-06-19"
    );
    expect(fromFixture).toBe(fromEval);
  });

  it("distingue el orden A↔B (modelo asimétrico local/visitante)", () => {
    expect(predictionCacheKey({ team_a_id: 1, team_b_id: 2 }, "t")).not.toBe(
      predictionCacheKey({ team_a_id: 2, team_b_id: 1 }, "t")
    );
  });

  it("distingue model, knockout y date", () => {
    const base = predictionCacheKey(req, "t");
    expect(base).not.toBe(
      predictionCacheKey({ ...req, model: "poisson_simple" }, "t")
    );
    expect(base).not.toBe(predictionCacheKey({ ...req, knockout: true }, "t"));
    expect(base).not.toBe(
      predictionCacheKey({ ...req, date: "2026-06-21" }, "t")
    );
  });

  it("usa el `today` provisto cuando falta date", () => {
    expect(
      predictionCacheKey({ team_a_id: 1, team_b_id: 2 }, "2026-06-19")
    ).toContain("2026-06-19");
  });
});

describe("isEntryFresh", () => {
  const entry = { data: res, ts: 0, exp: 100 as number | null };

  it("permanente (exp null) siempre fresco", () => {
    expect(isEntryFresh({ ...entry, exp: null }, 9_999_999)).toBe(true);
  });

  it("fresco antes de expirar, vencido al llegar o pasar exp", () => {
    expect(isEntryFresh(entry, 50)).toBe(true);
    expect(isEntryFresh(entry, 100)).toBe(false);
    expect(isEntryFresh(entry, 150)).toBe(false);
  });
});

describe("upcomingFreshness", () => {
  it("sin hora de inicio → TTL corto conservador", () => {
    expect(upcomingFreshness(1000, null)).toBe(NEAR_KICKOFF_TTL_MS);
  });

  it("dentro de la ventana de confirmación o en juego → TTL corto", () => {
    const kickoff = 10_000_000;
    const windowStart = kickoff - LINEUP_WINDOW_MS;
    expect(upcomingFreshness(windowStart, kickoff)).toBe(NEAR_KICKOFF_TTL_MS); // justo al borde
    expect(upcomingFreshness(kickoff + 5000, kickoff)).toBe(
      NEAR_KICKOFF_TTL_MS
    ); // ya empezado
  });

  it("lejos del inicio → expira al entrar a la ventana, con tope MAX", () => {
    // Moderadamente lejos: la entrada vive hasta `kickoff − 90 min`.
    const now = 0;
    const kickoff = LINEUP_WINDOW_MS + 60_000; // ventana arranca en 60_000
    expect(upcomingFreshness(now, kickoff)).toBe(60_000);

    // Muy lejos: el tope MAX manda.
    const farKickoff = LINEUP_WINDOW_MS + MAX_UPCOMING_TTL_MS + 1000;
    expect(upcomingFreshness(0, farKickoff)).toBe(MAX_UPCOMING_TTL_MS);
  });
});

describe("selectEvictions", () => {
  const entries = [
    { key: "a", ts: 3 },
    { key: "b", ts: 1 },
    { key: "c", ts: 2 },
  ];

  it("no desaloja si está dentro del tope", () => {
    expect(selectEvictions(entries, 3)).toEqual([]);
    expect(selectEvictions(entries, 5)).toEqual([]);
  });

  it("desaloja las más viejas por ts hasta el tope", () => {
    expect(selectEvictions(entries, 1)).toEqual(["b", "c"]); // conserva la más nueva (a)
  });
});

describe("cachedPredict", () => {
  it("primera llamada pega al backend; la segunda es hit de caché", async () => {
    predictMatchMock.mockResolvedValue(res);

    const a = await cachedPredict(req, "permanent");
    expect(a).toEqual(res);
    expect(predictMatchMock).toHaveBeenCalledTimes(1);

    const b = await cachedPredict(req, "permanent");
    expect(b).toEqual(res);
    expect(predictMatchMock).toHaveBeenCalledTimes(1); // sin nueva llamada
  });

  it("una entrada expirada se vuelve a pedir", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    predictMatchMock.mockResolvedValue(res);

    await cachedPredict(req, 1000); // exp = 1000
    vi.setSystemTime(2000); // ya venció
    await cachedPredict(req, 1000);

    expect(predictMatchMock).toHaveBeenCalledTimes(2);
  });

  it("si el storage no está, predice igual (degradación)", async () => {
    vi.unstubAllGlobals(); // sin window/localStorage
    predictMatchMock.mockResolvedValue(res);

    const out = await cachedPredict(req, "permanent");
    expect(out).toEqual(res);
    expect(predictMatchMock).toHaveBeenCalledTimes(1);
  });
});
