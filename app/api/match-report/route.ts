import { NextRequest, NextResponse } from "next/server";

// Crónica de partidos FINALIZADOS desde ESPN (API pública del scoreboard, SIN API
// key). Espejo de app/api/translate/route.ts: se consume server-side y el cliente
// nunca habla con ESPN. El `id` de fixture del backend ES el id de evento de ESPN,
// así que matcheamos EXACTO por id (sin depender de nombres, que es lo que fallaba
// con openfootball). ESPN trae minutos siempre, penales y goles en contra. Alimenta
// lib/match-report. Robusto: ante cualquier problema → { found: false } y el cliente
// cae a la síntesis/narrativa, sin romper el modal.

const SUMMARY = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/summary?event=";

type Competitor = {
  homeAway?: string;
  score?: string | number;
  team?: { id?: string | number; abbreviation?: string };
};
type KeyEvent = {
  type?: { text?: string };
  clock?: { displayValue?: string };
  team?: { id?: string | number };
  participants?: { athlete?: { displayName?: string } }[];
};

type Goal = {
  name: string;
  minute: number | null;
  team: "a" | "b";
  penalty: boolean;
  owngoal: boolean;
  offset: number | null;
};
type Hit = { found: true; ft: [number, number]; ht: [number, number] | null; goals: Goal[] };
type Miss = { found: false };

// Caché por evento: un partido finalizado no cambia.
const cache = new Map<string, Hit | Miss>();

// "9'" → {9,null} · "45'+5'" → {45,5} · "90'+4'" → {90,4}.
function parseClock(v: unknown): { minute: number | null; offset: number | null } {
  const m = String(v ?? "").match(/(\d+)'?(?:\s*\+\s*(\d+))?/);
  return { minute: m ? Number(m[1]) : null, offset: m && m[2] ? Number(m[2]) : null };
}

// Penal y gol en contra se detectan por el texto del tipo ("Penalty - Scored",
// "Own Goal"): los flags booleanos de ESPN vienen vacíos. Se excluyen penales
// errados/atajados y definiciones por penales.
function isGoalType(t: string): boolean {
  const x = t.toLowerCase();
  if (/miss|saved|shootout/.test(x)) return false;
  return /goal/.test(x) || /penalty - scored/.test(x);
}

export async function POST(req: NextRequest) {
  let eventId: string;
  let abbrA: string;
  let abbrB: string;
  try {
    ({ eventId, abbrA, abbrB } = await req.json());
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (typeof eventId !== "string" || !eventId.trim()) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  abbrA = typeof abbrA === "string" ? abbrA.toUpperCase() : "";
  abbrB = typeof abbrB === "string" ? abbrB.toUpperCase() : "";

  const cached = cache.get(eventId);
  if (cached) return NextResponse.json(cached);

  const miss: Miss = { found: false };

  try {
    const res = await fetch(`${SUMMARY}${encodeURIComponent(eventId)}`, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return NextResponse.json(miss);
    const data = await res.json();

    const comps = data?.header?.competitions?.[0]?.competitors as Competitor[] | undefined;
    if (!Array.isArray(comps) || comps.length !== 2) return NextResponse.json(miss);

    const abbrOf = (c: Competitor) => String(c.team?.abbreviation ?? "").toUpperCase();
    const idOf = (c: Competitor) => String(c.team?.id ?? "");
    const scoreOf = (c: Competitor) => {
      const n = Number.parseInt(String(c.score ?? ""), 10);
      return Number.isInteger(n) ? n : 0;
    };

    // Lado A/B de cada competidor: por abreviatura (códigos FIFA, coinciden con los
    // del front) y, si no resuelve, fallback local=A / visitante=B.
    let aComp = abbrA ? comps.find((c) => abbrOf(c) === abbrA) : undefined;
    let bComp = abbrB ? comps.find((c) => abbrOf(c) === abbrB) : undefined;
    if (aComp && !bComp) bComp = comps.find((c) => c !== aComp);
    else if (bComp && !aComp) aComp = comps.find((c) => c !== bComp);
    if (!aComp || !bComp || aComp === bComp) {
      aComp = comps.find((c) => c.homeAway === "home");
      bComp = comps.find((c) => c.homeAway === "away");
    }
    if (!aComp || !bComp) return NextResponse.json(miss);

    const sideById = new Map<string, "a" | "b">([
      [idOf(aComp), "a"],
      [idOf(bComp), "b"],
    ]);

    const events = (Array.isArray(data?.keyEvents) ? data.keyEvents : []) as KeyEvent[];
    const goals: Goal[] = [];
    for (const k of events) {
      const typeText = String(k.type?.text ?? "");
      if (!isGoalType(typeText)) continue;
      const side = sideById.get(String(k.team?.id ?? ""));
      if (!side) continue;
      const { minute, offset } = parseClock(k.clock?.displayValue);
      goals.push({
        name: String(k.participants?.[0]?.athlete?.displayName ?? "").trim(),
        minute,
        offset,
        team: side,
        penalty: /penalty/i.test(typeText),
        owngoal: /own goal/i.test(typeText),
      });
    }

    // Parcial (HT) derivado de los goles hasta el 45' (+ descuento de 1er tiempo).
    const htOf = (side: "a" | "b") => goals.filter((g) => g.team === side && (g.minute ?? 99) <= 45).length;

    const hit: Hit = {
      found: true,
      ft: [scoreOf(aComp), scoreOf(bComp)],
      ht: [htOf("a"), htOf("b")],
      goals,
    };
    cache.set(eventId, hit);
    return NextResponse.json(hit);
  } catch {
    return NextResponse.json(miss);
  }
}
