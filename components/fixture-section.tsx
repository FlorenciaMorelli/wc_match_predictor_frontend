"use client";

import { useState, useEffect, useId, useRef } from "react";
import { CalendarDays } from "lucide-react";
import type { FixtureMatch, MatchStatus, PredictResponse } from "@/types";
import { fetchFixture, predictMatch } from "@/lib/api";
import PredictionResult from "./prediction-result";
import PredictLoader from "./predict-loader";
import FlagImage from "./flag-image";
import Modal from "./modal";
import { useLanguage, teamName } from "@/lib/i18n";
import { formatLocalTime, localTimeZoneName, localDateString, matchKickoff } from "@/lib/datetime";
import { cityForVenue, homeNationIso } from "@/lib/venues";

const LIVE_STATUSES = new Set([
  "en juego", "STATUS_FIRST_HALF", "STATUS_SECOND_HALF", "descanso", "STATUS_HALFTIME",
]);

const FINISHED_STATUSES = new Set(["finalizado", "STATUS_FULL_TIME"]);

// Ventana máxima de un partido (90' + entretiempo + descuento + colchón). Pasado
// esto, un partido que la API todavía marca "en vivo" se considera finalizado: la
// API a veces tarda en transicionar el estado y, sin esto, la card queda pulsando
// como en vivo indefinidamente. NO hacemos lo inverso (forzar "en vivo" sobre un
// `programado`): no se puede distinguir un inicio real de un retraso/postergación.
const MAX_MATCH_MS = 140 * 60 * 1000;

function effectiveStatus(match: FixtureMatch): MatchStatus {
  if (LIVE_STATUSES.has(match.status)) {
    const ko = matchKickoff(match.date, match.time_utc);
    if (ko && Date.now() > ko.getTime() + MAX_MATCH_MS) return "finalizado";
  }
  return match.status;
}

const STATUS_STYLE: Record<string, string> = {
  "en juego":         "text-emerald-700 bg-emerald-50 dark:text-emerald-300/90 dark:bg-emerald-900/20",
  STATUS_FIRST_HALF:  "text-emerald-700 bg-emerald-50 dark:text-emerald-300/90 dark:bg-emerald-900/20",
  STATUS_SECOND_HALF: "text-emerald-700 bg-emerald-50 dark:text-emerald-300/90 dark:bg-emerald-900/20",
  descanso:           "text-amber-700  bg-amber-50  dark:text-amber-300/90  dark:bg-amber-900/20",
  STATUS_HALFTIME:    "text-amber-700  bg-amber-50  dark:text-amber-300/90  dark:bg-amber-900/20",
  finalizado:         "text-ink-muted bg-canvas",
  STATUS_FULL_TIME:   "text-ink-muted bg-canvas",
  postergado:         "text-danger bg-danger-soft",
  cancelado:          "text-danger bg-danger-soft",
  suspendido:         "text-danger bg-danger-soft",
  programado:         "text-ink-muted bg-canvas",
};

// Ventana del fixture: 30 días cubre toda la fase de grupos desde el arranque.
const FIXTURE_DAYS_AHEAD = 30;

// Rondas de eliminatoria en orden. "third-place" sólo se muestra si tiene
// partidos (no entra en la grilla de placeholders por pedido del producto).
const KNOCKOUT_PHASES = [
  "round-of-32",
  "round-of-16",
  "quarter-finals",
  "semi-finals",
  "third-place",
  "final",
] as const;

const normalizeRound = (round: string) => (round ?? "").toLowerCase();

const kickoffMs = (m: FixtureMatch) =>
  matchKickoff(m.date, m.time_utc)?.getTime() ?? Number.POSITIVE_INFINITY;

// Una pestaña de la navegación horizontal: una fecha de grupos o una ronda.
type Segment = {
  id: string;
  tabLabel: string;
  heading: string;
  matches: FixtureMatch[];
};

function todayLocalYmd(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function lastLocalDate(matches: FixtureMatch[]): string | null {
  let max: string | null = null;
  for (const m of matches) {
    const d = localDateString(m.date, m.time_utc);
    if (max === null || d > max) max = d;
  }
  return max;
}

// Pestaña a abrir por defecto: la primera que aún no terminó (en curso o por
// venir respecto de hoy). Si ya pasaron todas las que tienen fecha, la siguiente
// ronda (aún sin definir). Las pasadas siguen accesibles como pestañas.
function defaultSegmentIndex(segments: Segment[]): number {
  const today = todayLocalYmd();
  const ongoing = segments.findIndex((s) => {
    const last = lastLocalDate(s.matches);
    return last !== null && today <= last;
  });
  if (ongoing >= 0) return ongoing;
  let lastDated = -1;
  segments.forEach((s, i) => {
    if (s.matches.length > 0) lastDated = i;
  });
  return lastDated >= 0 ? Math.min(lastDated + 1, segments.length - 1) : 0;
}

type JumpTarget = { date: string; segId: string; isToday: boolean };

// R4 — destino del botón "Ir a hoy": fecha (y su segmento/pestaña) a la que saltar.
// Hoy si tiene partidos; si no, el próximo partido futuro. null si no hay futuro.
// A nivel módulo (como todayLocalYmd/defaultSegmentIndex) para no llamar funciones
// impuras (Date.now) directamente en el cuerpo del componente.
function computeJumpTarget(
  matches: FixtureMatch[],
  segments: Segment[],
): JumpTarget | null {
  const today = todayLocalYmd();
  const inToday = (m: FixtureMatch) =>
    localDateString(m.date, m.time_utc) === today;
  if (matches.some(inToday)) {
    const seg = segments.find((s) => s.matches.some(inToday));
    if (seg) return { date: today, segId: seg.id, isToday: true };
  }
  const now = Date.now();
  let best: { ms: number; date: string; segId: string } | null = null;
  for (const s of segments) {
    for (const m of s.matches) {
      const ms = kickoffMs(m);
      if (ms >= now && (best === null || ms < best.ms)) {
        best = { ms, date: localDateString(m.date, m.time_utc), segId: s.id };
      }
    }
  }
  return best ? { date: best.date, segId: best.segId, isToday: false } : null;
}

function formatDay(dateStr: string, dateLocale: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(dateLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function relativeDayKey(dateStr: string): "today" | "tomorrow" | null {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const tmrw = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const tomorrow = `${tmrw.getFullYear()}-${pad(tmrw.getMonth() + 1)}-${pad(tmrw.getDate())}`;
  if (dateStr === today) return "today";
  if (dateStr === tomorrow) return "tomorrow";
  return null;
}

// Deriva la fecha (matchday 1/2/3) de cada partido de grupos sin depender de un
// campo del backend: cada equipo juega una vez por fecha, así que el N-ésimo
// partido cronológico de un equipo es la Fecha N. Ambos equipos coinciden.
function groupMatchdayMap(groupMatches: FixtureMatch[]): Map<string, number> {
  const byTeam = new Map<number, FixtureMatch[]>();
  for (const m of groupMatches) {
    for (const id of [m.team_a_id, m.team_b_id]) {
      const list = byTeam.get(id);
      if (list) list.push(m);
      else byTeam.set(id, [m]);
    }
  }
  const matchday = new Map<string, number>();
  for (const list of byTeam.values()) {
    list.sort((a, b) => kickoffMs(a) - kickoffMs(b));
    list.forEach((m, i) => {
      matchday.set(m.id, Math.max(matchday.get(m.id) ?? 0, i + 1));
    });
  }
  return matchday;
}

function MatchCard({ match }: { match: FixtureMatch }) {
  const { t, locale } = useLanguage();
  const [prediction, setPrediction] = useState<PredictResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  // Estado efectivo: reconcilia el estado de la API con la hora de inicio para que
  // un partido cuya ventana ya pasó no quede marcado "en vivo". Todo lo de abajo
  // (anillo, badge, hasStarted, estado al modal) se deriva de `status`, no de `match.status`.
  const status = effectiveStatus(match);
  // Cuándo effectiveStatus cambió el estado ("en juego" → "finalizado"), la API
  // probablemente tampoco actualizó el marcador todavía → no mostrarlo para evitar
  // la combinación engañosa "Finalizado 0-0". Se confía en el marcador solo cuando
  // la API lo confirma explícitamente (estado no fue inferido por nosotros).
  const statusWasInferred = status !== match.status;
  const isLive = LIVE_STATUSES.has(status);
  const statusStyle = STATUS_STYLE[status] ?? "text-ink-muted bg-canvas";
  const statusLabel = t.fixture.status[status] ?? status;
  const roundLabel = match.round
    ? (t.fixture.rounds[match.round.toLowerCase()] ?? match.round)
    : "";
  const localTime = formatLocalTime(match.date, match.time_utc, t.meta.dateLocale);
  const tzName = localTimeZoneName(match.date, t.meta.dateLocale, match.time_utc);
  const utcTooltip = match.time_utc ? `${match.time_utc} ${t.fixture.utcSuffix}` : "";
  const isFinished = FINISHED_STATUSES.has(status);
  // "Ver análisis" si el partido ya arrancó (en vivo) o terminó; si no, "Ver predicción".
  const hasStarted = isLive || isFinished;
  // Ciudad del estadio (mapa estático de los 16 venues WC2026). null si el backend
  // manda un estadio no mapeado → se muestra solo el estadio, sin romper el layout.
  const city = cityForVenue(match.venue, locale);
  const nameA = teamName(match.team_a, match.team_a_es, locale);
  const nameB = teamName(match.team_b, match.team_b_es, locale);

  // Etiqueta local/neutral para la card: se deriva del país anfitrión del estadio
  // (ISO2 del venue) matcheando contra flag_a / flag_b. No depende de PredictResponse.
  const hostIso = homeNationIso(match.venue);
  const homeTeamName =
    !match.neutral && hostIso != null
      ? match.flag_a === hostIso
        ? nameA
        : match.flag_b === hostIso
        ? nameB
        : null
      : null;
  const cardVenueLabel = match.neutral
    ? t.result.venueNeutral
    : homeTeamName != null
    ? t.result.venueHome(homeTeamName)
    : null;

  // Solo mostramos marcador si el partido arrancó (en vivo o finalizado) Y la API
  // lo confirma explícitamente (no lo inferimos nosotros). Los `programado` llegan
  // con "0"/"0" del backend; si inferimos el estado, el marcador puede ser igual de
  // obsoleto → "Finalizado 0-0" sería engañoso. Espeja a prediction-result.tsx.
  const hasScore =
    hasStarted &&
    !statusWasInferred &&
    match.score_a !== "" &&
    match.score_b !== "" &&
    match.score_a !== "None" &&
    match.score_b !== "None";

  async function handleOpen() {
    setOpen(true);
    if (prediction || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await predictMatch({
        team_a_id: match.team_a_id,
        team_b_id: match.team_b_id,
        date: match.date,
      });
      setPrediction(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.fixture.errorPredict);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div
        className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-surface shadow-[0_1px_3px_rgba(0,0,0,0.06)] ${
          isLive ? "border-danger ring-1 ring-danger" : "border-line"
        }`}
      >
        <div className="flex-1 p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-ink-subtle" title={utcTooltip}>
              {localTime && tzName ? `${localTime} ${tzName}` : localTime}
            </span>
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}${isLive ? " motion-safe:animate-pulse" : ""}`}
            >
              {isLive && (
                <span className="h-1.5 w-1.5 motion-safe:animate-pulse rounded-full bg-current" />
              )}
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 flex-col items-center gap-2">
              <FlagImage iso2={match.flag_a} name={nameA} size="md" />
              <div className="flex min-h-[2.5rem] w-full items-start justify-center">
                <span title={nameA} className="line-clamp-2 text-center text-sm font-semibold leading-tight text-ink">
                  {nameA}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center gap-0.5">
              {hasScore ? (
                <span className="text-2xl font-bold text-ink">
                  {match.score_a} – {match.score_b}
                </span>
              ) : (
                <span className="text-sm font-semibold text-ink-subtle">
                  {t.fixture.vs}
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col items-center gap-2">
              <FlagImage iso2={match.flag_b} name={nameB} size="md" />
              <div className="flex min-h-[2.5rem] w-full items-start justify-center">
                <span title={nameB} className="line-clamp-2 text-center text-sm font-semibold leading-tight text-ink">
                  {nameB}
                </span>
              </div>
            </div>
          </div>

          {(city || match.venue || cardVenueLabel) && (
            <p className="mt-3 text-center text-xs text-ink-subtle">
              {[city, match.venue, cardVenueLabel].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>

        <div className="border-t border-line px-6 py-3">
          <button
            type="button"
            onClick={handleOpen}
            className="w-full rounded-sm text-center text-xs font-semibold uppercase tracking-widest text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            {hasStarted ? t.fixture.viewAnalysis : t.fixture.viewPrediction}
          </button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        labelledBy={titleId}
        header={
          <div className="min-w-0">
            <h3 id={titleId} className="truncate text-base font-semibold text-ink">
              {nameA}{" "}
              <span className="font-normal text-ink-subtle">{t.fixture.vs}</span>{" "}
              {nameB}
            </h3>
            <p className="mt-0.5 truncate text-xs capitalize text-ink-subtle">
              {[
                formatDay(match.date, t.meta.dateLocale),
                localTime && tzName ? `${localTime} ${tzName}` : localTime,
                roundLabel,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {(city || match.venue) && (
              <p className="mt-0.5 truncate text-xs text-ink-subtle">
                {[city, match.venue].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        }
      >
        {loading && (
          <PredictLoader
            flagA={match.flag_a}
            nameA={nameA}
            flagB={match.flag_b}
            nameB={nameB}
          />
        )}
        {error && (
          <div className="py-8">
            <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </p>
            <button
              type="button"
              onClick={handleOpen}
              className="mt-4 rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink-muted transition-colors hover:bg-canvas"
            >
              {t.fixture.retry}
            </button>
          </div>
        )}
        {prediction && !loading && (
          <PredictionResult
            result={prediction}
            matchStatus={status}
            scoreA={statusWasInferred ? "" : match.score_a}
            scoreB={statusWasInferred ? "" : match.score_b}
          />
        )}
      </Modal>
    </>
  );
}

// Grilla de partidos agrupada por día local, con encabezado de día y badges
// "Hoy/Mañana". Reutilizable por cada fase y por cada fecha de grupos.
function MatchDays({ matches }: { matches: FixtureMatch[] }) {
  const { t } = useLanguage();

  const grouped = matches.reduce<Record<string, FixtureMatch[]>>((acc, m) => {
    const key = localDateString(m.date, m.time_utc);
    (acc[key] ??= []).push(m);
    return acc;
  }, {});
  for (const date of Object.keys(grouped)) {
    grouped[date].sort((a, b) => kickoffMs(a) - kickoffMs(b));
  }
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="space-y-8">
      {sortedDates.map((date) => {
        const rel = relativeDayKey(date);
        return (
          <div key={date} id={`fixture-day-${date}`} className="scroll-mt-24">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold capitalize text-ink-muted">
              {rel && (
                <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-brand">
                  {t.fixture[rel]}
                </span>
              )}
              {formatDay(date, t.meta.dateLocale)}
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grouped[date].map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Placeholder armonioso para rondas/fechas todavía sin partidos definidos.
function PhasePlaceholder() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas/40 px-6 py-14 text-center">
      <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-soft text-brand">
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3" y="4.5" width="18" height="16" rx="2.5" />
          <path d="M3 9h18M8 2.5v4M16 2.5v4" />
        </svg>
      </span>
      <p className="text-sm font-semibold text-ink-muted">{t.fixture.pendingTitle}</p>
      <p className="mt-1 max-w-xs text-xs text-ink-subtle">
        {t.fixture.pendingDescription}
      </p>
    </div>
  );
}

// Encabezado de fase con título y línea divisoria.
function PhaseHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4">
      <h3 className="font-display text-xl font-bold tracking-tight text-ink md:text-2xl">
        {title}
      </h3>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export default function FixtureSection() {
  const { t } = useLanguage();
  const [matches, setMatches] = useState<FixtureMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // null = todavía no hubo interacción; se usa la pestaña por defecto (hoy).
  const [activeId, setActiveId] = useState<string | null>(null);
  // R4 — fecha pendiente de scroll tras cambiar de pestaña. Ref (no state) para no
  // disparar renders extra ni llamar setState dentro del efecto.
  const pendingScrollDate = useRef<string | null>(null);

  // R4 — cuando cambia la pestaña activa, si hay una fecha pendiente, scrollear a su
  // grupo de día (ya renderizado tras el commit) y limpiar la marca.
  useEffect(() => {
    const date = pendingScrollDate.current;
    if (!date) return;
    pendingScrollDate.current = null;
    document
      .getElementById(`fixture-day-${date}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [activeId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchFixture(FIXTURE_DAYS_AHEAD);
        if (!cancelled) setMatches(data);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : t.fixture.errorLoad);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [t.fixture.errorLoad]);

  // Segmentos en orden: 3 fechas de grupos + eliminatorias. Los partidos ya
  // jugados quedan dentro de su fecha/ronda (no se descartan).
  const groupMatches = matches.filter(
    (m) => normalizeRound(m.round) === "group-stage"
  );
  const matchdayMap = groupMatchdayMap(groupMatches);

  const segments: Segment[] = [];
  for (const n of [1, 2, 3]) {
    segments.push({
      id: `md-${n}`,
      tabLabel: t.fixture.matchday(n),
      heading: `${t.fixture.rounds["group-stage"]} · ${t.fixture.matchday(n)}`,
      matches: groupMatches.filter((m) => matchdayMap.get(m.id) === n),
    });
  }
  for (const round of KNOCKOUT_PHASES) {
    const ms = matches.filter((m) => normalizeRound(m.round) === round);
    // El tercer puesto sólo aparece cuando ya tiene partido.
    if (round === "third-place" && ms.length === 0) continue;
    segments.push({
      id: round,
      tabLabel: t.fixture.rounds[round],
      heading: t.fixture.rounds[round],
      matches: ms,
    });
  }

  const defaultId = segments[defaultSegmentIndex(segments)]?.id ?? null;
  const activeSeg =
    segments.find((s) => s.id === (activeId ?? defaultId)) ?? segments[0];

  // R4 — destino del botón "Hoy/Próximos" (hoy si tiene partidos; si no, el próximo).
  const jumpTarget = computeJumpTarget(matches, segments);

  function handleJump() {
    if (!jumpTarget) return;
    pendingScrollDate.current = jumpTarget.date;
    if (activeId === jumpTarget.segId) {
      // La pestaña ya está activa: el efecto [activeId] no se dispara → scroll directo.
      pendingScrollDate.current = null;
      document
        .getElementById(`fixture-day-${jumpTarget.date}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setActiveId(jumpTarget.segId);
    }
  }

  return (
    <section id="fixture" className="mx-auto max-w-7xl px-6 py-20 md:px-12">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-ink-subtle">
        {t.fixture.sectionLabel}
      </p>
      <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
        {t.fixture.heading}
      </h2>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        {t.fixture.description}
      </p>

      {loading && (
        <div className="mt-12 flex justify-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
        </div>
      )}

      {error && (
        <p className="mt-8 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {!loading && !error && activeSeg && (
        <div className="mt-10">
          {jumpTarget && (
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={handleJump}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                <CalendarDays size={15} aria-hidden />
                {jumpTarget.isToday ? t.fixture.today : t.fixture.jumpUpcoming}
              </button>
            </div>
          )}
          {/* Navegación horizontal por fecha/ronda */}
          <div className="-mx-6 overflow-x-auto px-6 md:mx-0 md:px-0">
            <div
              role="tablist"
              aria-label={t.fixture.sectionLabel}
              className="flex min-w-max gap-1 border-b border-line"
            >
              {segments.map((s) => {
                const isActive = activeSeg.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveId(s.id)}
                    className={`relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                      isActive ? "text-brand" : "text-ink-muted hover:text-ink"
                    }`}
                  >
                    {s.tabLabel}
                    {isActive && (
                      <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contenido de la pestaña activa */}
          <div role="tabpanel" className="mt-8">
            <PhaseHeader title={activeSeg.heading} />
            <div className="mt-8">
              {activeSeg.matches.length > 0 ? (
                <MatchDays matches={activeSeg.matches} />
              ) : (
                <PhasePlaceholder />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
