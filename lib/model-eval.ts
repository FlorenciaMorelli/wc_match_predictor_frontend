/**
 * lib/model-eval.ts
 * Métricas del evaluador de accuracy (ítem 7), puras y testeables. La página /eval
 * arma un `MatchEval` por partido finalizado (predicción del modelo vs. resultado real)
 * y acá se agregan en accuracy de ganador, Brier score y curva de calibración.
 */

export type Outcome = "a" | "draw" | "b";

// Contribución de un partido finalizado: probabilidades 1X2 del modelo, marcador más
// probable (top scoreline) y marcador real. Inmutable para un partido ya jugado.
export type MatchEval = {
  id: string;
  pA: number;
  pDraw: number;
  pB: number;
  predA: number; // marcador más probable del modelo
  predB: number;
  actualA: number; // marcador real
  actualB: number;
};

export type CalibrationBucket = {
  lo: number; // límite inferior del bucket (0–1)
  hi: number;
  n: number; // cantidad de probabilidades caídas en el bucket
  predMean: number; // probabilidad media predicha en el bucket
  obsRate: number; // frecuencia observada real en el bucket
};

export type EvalSummary = {
  n: number;
  winnerAccuracy: number; // 0–1: acierto del ganador (argmax 1X2)
  brier: number; // 0–2: Brier multiclase (menor = mejor calibrado)
  exactScoreRate: number; // 0–1: acierto del marcador exacto (top scoreline)
  calibration: CalibrationBucket[]; // 10 buckets de 10%
};

export function outcomeOf(a: number, b: number): Outcome {
  return a > b ? "a" : a < b ? "b" : "draw";
}

// Desenlace que predijo el modelo: el de mayor probabilidad (empate como desempate).
export function predictedOutcome(e: MatchEval): Outcome {
  if (e.pA >= e.pDraw && e.pA >= e.pB) return "a";
  if (e.pB >= e.pDraw && e.pB >= e.pA) return "b";
  return "draw";
}

const BUCKETS = 10;

export function summarize(evals: MatchEval[]): EvalSummary {
  const n = evals.length;
  const buckets = Array.from({ length: BUCKETS }, (_, i) => ({
    lo: i / BUCKETS,
    hi: (i + 1) / BUCKETS,
    sumP: 0,
    sumY: 0,
    n: 0,
  }));
  if (n === 0) {
    return {
      n: 0,
      winnerAccuracy: 0,
      brier: 0,
      exactScoreRate: 0,
      calibration: buckets.map((b) => ({
        lo: b.lo,
        hi: b.hi,
        n: 0,
        predMean: 0,
        obsRate: 0,
      })),
    };
  }

  let correct = 0;
  let brierSum = 0;
  let exact = 0;
  const outcomes: Outcome[] = ["a", "draw", "b"];

  for (const e of evals) {
    const actual = outcomeOf(e.actualA, e.actualB);
    if (predictedOutcome(e) === actual) correct++;
    if (e.predA === e.actualA && e.predB === e.actualB) exact++;

    const p: Record<Outcome, number> = { a: e.pA, draw: e.pDraw, b: e.pB };
    for (const o of outcomes) {
      const y = actual === o ? 1 : 0;
      brierSum += (p[o] - y) ** 2; // Brier multiclase: suma sobre los 3 desenlaces
      const idx = Math.min(
        BUCKETS - 1,
        Math.max(0, Math.floor(p[o] * BUCKETS))
      );
      buckets[idx].sumP += p[o];
      buckets[idx].sumY += y;
      buckets[idx].n++;
    }
  }

  return {
    n,
    winnerAccuracy: correct / n,
    brier: brierSum / n,
    exactScoreRate: exact / n,
    calibration: buckets.map((b) => ({
      lo: b.lo,
      hi: b.hi,
      n: b.n,
      predMean: b.n ? b.sumP / b.n : 0,
      obsRate: b.n ? b.sumY / b.n : 0,
    })),
  };
}
