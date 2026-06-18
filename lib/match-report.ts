/**
 * lib/match-report.ts
 * Generador de crónicas por REGLAS (sin LLM) para partidos finalizados del WC2026.
 *
 * Toma los datos estáticos del partido (marcador final + parcial + goleadores con
 * minuto, de ESPN vía /api/match-report) y las señales del modelo (prob. del
 * desenlace, sorpresa) y compone un texto en tono mundialista, con una apreciación
 * más humana. La variedad se logra eligiendo de pools de frases con una semilla
 * estable por partido: el mismo partido siempre da el mismo texto, pero distintos
 * partidos no suenan calcados.
 *
 * Es generación determinística, no prosa libre: arma el texto por "beats" narrativos
 * (titular → cómo se dio → lectura del modelo) detectados de las estadísticas.
 */

export type ReportGoal = {
  name: string;
  minute: number | null;
  team: "a" | "b";
  penalty: boolean;
  owngoal: boolean;
  offset: number | null;
};

export type MatchReportInput = {
  ft: [number, number]; // marcador final [A, B]
  ht: [number, number] | null; // parcial [A, B]
  goals: ReportGoal[];
  teamA: string; // nombre para mostrar (ya localizado)
  teamB: string;
  outcomeProb: number; // prob. del modelo para el desenlace real (0–1)
  isUpset: boolean; // el desenlace tenía baja probabilidad
};

type Locale = "es" | "en";

function pct(p: number): string {
  return `${Math.round(p * 100)}%`;
}

// Elección determinística-pero-variada: estable por partido (misma semilla → misma
// frase), distinta entre partidos.
function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

type Lexicon = {
  blowoutHeadline: (w: string, l: string, gf: number, ga: number, s: number) => string;
  winHeadline: (w: string, l: string, gf: number, ga: number, s: number) => string;
  narrowHeadline: (w: string, l: string, gf: number, ga: number, s: number) => string;
  drawHeadline: (a: string, b: string, g: number, s: number) => string;
  goallessHeadline: (a: string, b: string, s: number) => string;
  hatTrickHeadline: (p: string, w: string, l: string, gf: number, ga: number, s: number) => string;
  comeback: (s: number) => string;
  lateWinner: (min: number, s: number) => string;
  opener: (name: string, min: number, pen: boolean, s: number) => string;
  brace: (p: string, s: number) => string;
  goalless: (s: number) => string;
  extraDetail: (pen: boolean, og: boolean) => string;
  upset: (p: string, s: number) => string;
  expected: (s: number) => string;
};

const LEX: Record<Locale, Lexicon> = {
  es: {
    blowoutHeadline: (w, l, gf, ga, s) =>
      pick(
        [
          `Goleada de ${w}: ${gf}-${ga} a ${l}.`,
          `${w} pasó por encima de ${l}, ${gf}-${ga}.`,
          `Baile de ${w}, que goleó ${gf}-${ga} a ${l}.`,
        ],
        s,
      ),
    winHeadline: (w, l, gf, ga, s) =>
      pick(
        [
          `${w} se quedó con el partido: ${gf}-${ga} a ${l}.`,
          `Triunfo de ${w} por ${gf}-${ga} ante ${l}.`,
          `${w} venció ${gf}-${ga} a ${l}.`,
        ],
        s,
      ),
    narrowHeadline: (w, l, gf, ga, s) =>
      pick(
        [
          `${w} lo ganó por la mínima: ${gf}-${ga} a ${l}.`,
          `Triunfo ajustado de ${w}, ${gf}-${ga} ante ${l}.`,
          `${w} se impuso por un gol, ${gf}-${ga}, a ${l}.`,
        ],
        s,
      ),
    drawHeadline: (a, b, g, s) =>
      pick(
        [
          `${a} y ${b} igualaron ${g}-${g}.`,
          `Reparto de puntos entre ${a} y ${b}: ${g}-${g}.`,
          `${a} y ${b} empataron ${g}-${g}.`,
        ],
        s,
      ),
    goallessHeadline: (a, b, s) =>
      pick(
        [
          `${a} y ${b} no se sacaron ventajas: 0-0.`,
          `Empate sin goles entre ${a} y ${b}.`,
        ],
        s,
      ),
    hatTrickHeadline: (p, w, l, gf, ga, s) =>
      pick(
        [
          `Noche de ${p}: ${w} goleó ${gf}-${ga} a ${l} con su triplete.`,
          `${p} se vistió de héroe y ${w} goleó ${gf}-${ga} a ${l}.`,
        ],
        s,
      ),
    comeback: (s) =>
      pick(
        [
          `Lo dio vuelta tras irse en desventaja al descanso.`,
          `Lo terminó remontando después de un primer tiempo en contra.`,
        ],
        s,
      ),
    lateWinner: (min, s) =>
      pick(
        [`Lo resolvió sobre la hora, a los ${min}'.`, `Se lo aseguró en el final, con el gol a los ${min}'.`],
        s,
      ),
    opener: (name, min, pen, s) =>
      pick(
        [
          `${name} rompió el cero a los ${min}'${pen ? " de penal" : ""}.`,
          `${name} abrió el marcador a los ${min}'${pen ? ", desde los doce pasos" : ""}.`,
        ],
        s,
      ),
    brace: (p, s) => pick([`${p} firmó un doblete.`, `${p} se anotó por partida doble.`], s),
    goalless: (s) =>
      pick([`Mucho trámite y pocas situaciones claras.`, `Un duelo trabado, de pocas chances.`], s),
    extraDetail: (pen, og) =>
      pen && og
        ? `Hubo lugar para un penal y un gol en contra.`
        : pen
        ? `Uno de los gritos llegó desde los doce pasos.`
        : `Con un gol en contra de por medio.`,
    upset: (p, s) =>
      pick(
        [
          `Un batacazo: el modelo le daba apenas ${p} a este desenlace.`,
          `Una sorpresa que el pronóstico veía poco probable (${p}).`,
        ],
        s,
      ),
    expected: (s) =>
      pick([`En sintonía con lo que anticipaba el modelo.`, `Un resultado en línea con el pronóstico.`], s),
  },
  en: {
    blowoutHeadline: (w, l, gf, ga, s) =>
      pick(
        [`${w} ran riot: ${gf}–${ga} against ${l}.`, `${w} swept past ${l} ${gf}–${ga}.`, `A rout for ${w}, ${gf}–${ga} over ${l}.`],
        s,
      ),
    winHeadline: (w, l, gf, ga, s) =>
      pick(
        [`${w} took the points: ${gf}–${ga} against ${l}.`, `${w} beat ${l} ${gf}–${ga}.`, `A win for ${w}, ${gf}–${ga} over ${l}.`],
        s,
      ),
    narrowHeadline: (w, l, gf, ga, s) =>
      pick(
        [`${w} edged it ${gf}–${ga} against ${l}.`, `A narrow win for ${w}, ${gf}–${ga} over ${l}.`, `${w} won by a single goal, ${gf}–${ga}, against ${l}.`],
        s,
      ),
    drawHeadline: (a, b, g, s) =>
      pick([`${a} and ${b} drew ${g}–${g}.`, `Honours even between ${a} and ${b}: ${g}–${g}.`], s),
    goallessHeadline: (a, b, s) =>
      pick([`${a} and ${b} played out a goalless draw.`, `No goals between ${a} and ${b}.`], s),
    hatTrickHeadline: (p, w, l, gf, ga, s) =>
      pick(
        [`${p}'s night: ${w} routed ${l} ${gf}–${ga} on the back of a hat-trick.`, `${p} stole the show as ${w} beat ${l} ${gf}–${ga}.`],
        s,
      ),
    comeback: (s) =>
      pick([`A comeback after trailing at the break.`, `They fought back from behind to win it.`], s),
    lateWinner: (min, s) =>
      pick([`It was settled late, in the ${min}th minute.`, `The decider came near the end, on ${min}'.`], s),
    opener: (name, min, pen, s) =>
      pick(
        [
          `${name} broke the deadlock on ${min}'${pen ? " from the spot" : ""}.`,
          `${name} opened the scoring in the ${min}th minute${pen ? ", from the penalty spot" : ""}.`,
        ],
        s,
      ),
    brace: (p, s) => pick([`${p} bagged a brace.`, `${p} scored twice.`], s),
    goalless: (s) => pick([`Plenty of midfield battle but few clear chances.`, `A tight, low-chance affair.`], s),
    extraDetail: (pen, og) =>
      pen && og
        ? `There was room for a penalty and an own goal.`
        : pen
        ? `One of the goals came from the penalty spot.`
        : `With an own goal in the mix.`,
    upset: (p, s) =>
      pick([`A genuine upset: the model gave this outcome just ${p}.`, `A surprise the model rated unlikely (${p}).`], s),
    expected: (s) =>
      pick([`In line with what the model expected.`, `A result that matched the prediction.`], s),
  },
};

export function buildMatchReport(locale: Locale, m: MatchReportInput): string {
  const L = LEX[locale];
  const [a, b] = m.ft;
  const winnerSide: "a" | "b" | null = a > b ? "a" : b > a ? "b" : null;
  const winnerName = winnerSide === "a" ? m.teamA : winnerSide === "b" ? m.teamB : null;
  const loserName = winnerSide === "a" ? m.teamB : winnerSide === "b" ? m.teamA : null;
  const gf = Math.max(a, b);
  const ga = Math.min(a, b);
  const margin = Math.abs(a - b);
  const total = a + b;

  // Goleadores reales (excluye goles en contra para no atribuir mal autorías).
  const realGoals = m.goals.filter((g) => !g.owngoal && g.name);
  const counts = new Map<string, number>();
  for (const g of realGoals) counts.set(g.name, (counts.get(g.name) ?? 0) + 1);
  let topScorer: string | null = null;
  let topCount = 0;
  for (const [name, c] of counts) {
    if (c > topCount) {
      topScorer = name;
      topCount = c;
    }
  }

  const byMinute = [...m.goals]
    .filter((g) => g.minute != null)
    .sort((x, y) => x.minute! - y.minute! || (x.offset ?? 0) - (y.offset ?? 0));
  const opener = byMinute[0] ?? null;
  const winnerGoals = winnerSide ? byMinute.filter((g) => g.team === winnerSide) : [];
  const lastWinnerGoal = winnerGoals.length ? winnerGoals[winnerGoals.length - 1] : null;

  // Remontada: quien iba ganando al descanso no es quien ganó al final.
  let comeback = false;
  if (m.ht && winnerSide) {
    const htDiff = m.ht[0] - m.ht[1];
    comeback = winnerSide === "a" ? htDiff < 0 : htDiff > 0;
  }

  const lateWinner = !!(winnerSide && margin === 1 && lastWinnerGoal && (lastWinnerGoal.minute ?? 0) >= 85);
  const hatTrick = topCount >= 3;
  const brace = topCount === 2;
  const hasPenalty = m.goals.some((g) => g.penalty);
  const hasOwnGoal = m.goals.some((g) => g.owngoal);

  const seed = total * 17 + (opener?.minute ?? 3) * 3 + (winnerSide === "a" ? 1 : winnerSide === "b" ? 2 : 0);

  // ── Beat 1: titular ──
  let headline: string;
  if (winnerName && loserName) {
    if (hatTrick && topScorer)
      headline = L.hatTrickHeadline(topScorer, winnerName, loserName, gf, ga, seed);
    else if (margin >= 3) headline = L.blowoutHeadline(winnerName, loserName, gf, ga, seed);
    else if (margin === 1) headline = L.narrowHeadline(winnerName, loserName, gf, ga, seed);
    else headline = L.winHeadline(winnerName, loserName, gf, ga, seed);
  } else {
    headline = total === 0 ? L.goallessHeadline(m.teamA, m.teamB, seed) : L.drawHeadline(m.teamA, m.teamB, a, seed);
  }

  // ── Beat 2: cómo se dio (una historia saliente) ──
  const beats: string[] = [];
  if (comeback && winnerName) beats.push(L.comeback(seed));
  else if (lateWinner && lastWinnerGoal?.minute != null) beats.push(L.lateWinner(lastWinnerGoal.minute, seed));
  else if (!hatTrick && opener && opener.minute != null && !opener.owngoal && opener.name)
    beats.push(L.opener(opener.name, opener.minute, opener.penalty, seed));
  else if (!winnerName && total === 0) beats.push(L.goalless(seed));

  if (!hatTrick && brace && topScorer && beats.length === 0) beats.push(L.brace(topScorer, seed));
  if (margin >= 3 && (hasPenalty || hasOwnGoal)) beats.push(L.extraDetail(hasPenalty, hasOwnGoal));

  // ── Beat 3: lectura del modelo ──
  const model = m.isUpset ? L.upset(pct(m.outcomeProb), seed) : m.outcomeProb >= 0.5 ? L.expected(seed) : "";

  return [headline, ...beats, model].filter(Boolean).join(" ");
}
