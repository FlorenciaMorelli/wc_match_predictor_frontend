import { describe, it, expect } from "vitest";
import {
  outcomeOf,
  predictedOutcome,
  summarize,
  type MatchEval,
} from "./model-eval";

describe("outcomeOf", () => {
  it("deriva el desenlace del marcador", () => {
    expect(outcomeOf(2, 0)).toBe("a");
    expect(outcomeOf(0, 2)).toBe("b");
    expect(outcomeOf(1, 1)).toBe("draw");
  });
});

describe("predictedOutcome", () => {
  it("toma el desenlace de mayor probabilidad", () => {
    const base = { id: "x", predA: 0, predB: 0, actualA: 0, actualB: 0 };
    expect(predictedOutcome({ ...base, pA: 0.7, pDraw: 0.2, pB: 0.1 })).toBe(
      "a"
    );
    expect(predictedOutcome({ ...base, pA: 0.1, pDraw: 0.2, pB: 0.7 })).toBe(
      "b"
    );
    expect(predictedOutcome({ ...base, pA: 0.2, pDraw: 0.6, pB: 0.2 })).toBe(
      "draw"
    );
  });
});

describe("summarize", () => {
  const evals: MatchEval[] = [
    // acertado (ganador A) y marcador exacto 2-0
    {
      id: "1",
      pA: 0.7,
      pDraw: 0.2,
      pB: 0.1,
      predA: 2,
      predB: 0,
      actualA: 2,
      actualB: 0,
    },
    // ganó A pero el modelo dijo B, y marcador no coincide
    {
      id: "2",
      pA: 0.1,
      pDraw: 0.2,
      pB: 0.7,
      predA: 0,
      predB: 1,
      actualA: 2,
      actualB: 0,
    },
  ];

  it("calcula accuracy de ganador y marcador exacto", () => {
    const s = summarize(evals);
    expect(s.n).toBe(2);
    expect(s.winnerAccuracy).toBe(0.5);
    expect(s.exactScoreRate).toBe(0.5);
  });

  it("el Brier score queda en rango [0, 2]", () => {
    const { brier } = summarize(evals);
    expect(brier).toBeGreaterThanOrEqual(0);
    expect(brier).toBeLessThanOrEqual(2);
  });

  it("la calibración tiene 10 buckets y acumula 3 probabilidades por partido", () => {
    const s = summarize(evals);
    expect(s.calibration).toHaveLength(10);
    const totalPuntos = s.calibration.reduce((acc, b) => acc + b.n, 0);
    expect(totalPuntos).toBe(evals.length * 3);
  });

  it("sin partidos → todo en cero y 10 buckets vacíos", () => {
    const s = summarize([]);
    expect(s).toMatchObject({
      n: 0,
      winnerAccuracy: 0,
      brier: 0,
      exactScoreRate: 0,
    });
    expect(s.calibration).toHaveLength(10);
    expect(s.calibration.every((b) => b.n === 0)).toBe(true);
  });
});
