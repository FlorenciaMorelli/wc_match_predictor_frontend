"use client";

import { useState } from "react";
import type { MatchStatus, PredictResponse, ScoreProbability } from "@/types";
import FlagImage from "./flag-image";
import { useLanguage } from "@/lib/i18n";

interface Props {
  result: PredictResponse;
  // Estado del partido (cuando viene del fixture). Define el mensaje al no haber
  // formación: pre-partido vs en vivo vs finalizado.
  matchStatus?: MatchStatus;
}

const TEAM_A = "var(--result-a)";
const TEAM_B = "var(--result-b)";
const DRAW   = "var(--result-draw)";

function scoreWinnerColor(a: number, b: number): string {
  if (a === b) return DRAW;
  return a > b ? TEAM_A : TEAM_B;
}

// Porcentaje con hasta dos decimales (sin ceros sobrantes): 0.1643 → "16.43%", 0.1 → "10%".
function formatPct(value: number): string {
  return `${Number((value * 100).toFixed(2))}%`;
}

// Estados con el partido en curso / ya jugado. Definen qué mensaje mostrar
// cuando no hay formación: en vivo o finalizado NO deben decir "se publican ~1h
// antes" (ya arrancó). Se tipan como string para tolerar variantes del backend.
const LIVE_STATUSES = new Set<string>([
  "en juego",
  "STATUS_FIRST_HALF",
  "STATUS_SECOND_HALF",
  "descanso",
  "STATUS_HALFTIME",
]);
const FINISHED_STATUSES = new Set<string>(["finalizado", "STATUS_FULL_TIME"]);

function WinnerLegend({ teamA, teamB }: { teamA: string; teamB: string }) {
  const { t } = useLanguage();
  const items: [string, string][] = [
    [TEAM_A, teamA],
    [DRAW, t.result.draw],
    [TEAM_B, teamB],
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
      {items.map(([color, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {label}
        </span>
      ))}
    </div>
  );
}

function Scorelines({
  scorelines,
  teamA,
  teamB,
  dense = false,
}: {
  scorelines: ScoreProbability[];
  teamA: string;
  teamB: string;
  dense?: boolean;
}) {
  const { t } = useLanguage();
  if (scorelines.length === 0) return null;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
          {t.result.mostLikelyScores}
        </p>
        <WinnerLegend teamA={teamA} teamB={teamB} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {scorelines.slice(0, 8).map((s, i) => {
          const color = scoreWinnerColor(s.score_a, s.score_b);
          return (
            <div
              key={i}
              className={`flex flex-col items-center rounded-lg border border-line ${
                dense ? "px-1 py-2" : "px-2 py-3"
              }`}
              style={{ borderBottom: `2px solid ${color}` }}
            >
              <span
                className={`font-bold ${dense ? "text-sm" : "text-base"}`}
                style={{ color }}
              >
                {s.score_a}–{s.score_b}
              </span>
              <span className="mt-0.5 text-xs text-ink-subtle">
                {formatPct(s.probability)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Una ficha de jugador en la cancha: disco en el color del equipo (anillo blanco
// + sombra y brillo sutil) y el nombre en un chip translúcido para que se lea
// sobre el césped. Nombre tal cual de ESPN, a 2 líneas máx.
function PitchPlayer({ name, color }: { name: string; color: string }) {
  return (
    <div className="flex w-[4.25rem] flex-col items-center gap-1">
      <span
        className="relative h-6 w-6 rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,0.45)]"
        style={{ backgroundColor: color }}
      >
        <span className="absolute inset-x-[3px] top-[3px] h-1.5 rounded-full bg-white/35" />
      </span>
      <span
        title={name}
        className="line-clamp-2 w-full rounded bg-black/40 px-1 py-0.5 text-center text-[0.625rem] font-semibold leading-tight text-white"
      >
        {name}
      </span>
    </div>
  );
}

// Esquema de cancha con identidad WC2026: césped verde a rayas, marcas blancas
// reglamentarias y acentos dorados (firma del Mundial + franja tricolor). El
// backend manda los 11 en orden ESPN sin posición, así que asumimos un 4-3-3 y
// lo avisamos abajo ("posiciones aproximadas"). Si no vienen 11, caemos a lista.
function LineupPitch({ players, color }: { players: string[]; color: string }) {
  const { t } = useLanguage();

  if (players.length !== 11) {
    return (
      <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl bg-canvas px-4 py-3 text-sm text-ink-muted">
        {players.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ol>
    );
  }

  // De arriba (delanteros) hacia abajo (arquero).
  const lines: { label: string; names: string[] }[] = [
    { label: t.result.lineFwd, names: players.slice(8, 11) },
    { label: t.result.lineMid, names: players.slice(5, 8) },
    { label: t.result.lineDef, names: players.slice(1, 5) },
    { label: t.result.lineGk, names: players.slice(0, 1) },
  ];

  const gold = "var(--gold)";

  return (
    <div className="mt-3">
      <div className="overflow-hidden rounded-xl border border-line shadow-sm">
        {/* Firma WC2026: franja tricolor (Canadá / México / EE.UU.) */}
        <div className="wc-tricolor h-1" />

        {/* Campo */}
        <div
          className="relative min-h-[21rem]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(180deg, rgba(255,255,255,0.06) 0 1.25rem, rgba(255,255,255,0) 1.25rem 2.5rem), linear-gradient(170deg, #2f9e5e 0%, #1c7341 100%)",
          }}
        >
          {/* Marcas reglamentarias (decorativas) */}
          <span className="pointer-events-none absolute inset-3 rounded-sm border border-white/25" />
          <span className="pointer-events-none absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-white/25" />
          <span className="pointer-events-none absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
          {/* Áreas (penal + arco) arriba y abajo */}
          <span className="pointer-events-none absolute left-1/2 top-3 h-14 w-44 -translate-x-1/2 border-x border-b border-white/25" />
          <span className="pointer-events-none absolute left-1/2 top-3 h-7 w-24 -translate-x-1/2 border-x border-b border-white/25" />
          <span className="pointer-events-none absolute bottom-3 left-1/2 h-14 w-44 -translate-x-1/2 border-x border-t border-white/25" />
          <span className="pointer-events-none absolute bottom-3 left-1/2 h-7 w-24 -translate-x-1/2 border-x border-t border-white/25" />
          {/* Arcos de córner */}
          <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 rounded-br-full border-b border-r border-white/25" />
          <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 rounded-bl-full border-b border-l border-white/25" />
          <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 rounded-tr-full border-r border-t border-white/25" />
          <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 rounded-tl-full border-l border-t border-white/25" />
          {/* Acentos dorados WC2026: punto central + puntos de penal */}
          <span
            className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: gold }}
          />
          <span
            className="pointer-events-none absolute left-1/2 top-[2.5rem] h-1.5 w-1.5 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: gold }}
          />
          <span
            className="pointer-events-none absolute bottom-[2.5rem] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: gold }}
          />

          {/* Jugadores (delanteros arriba → arquero abajo) */}
          <div className="absolute inset-0 flex flex-col justify-between px-3 py-6">
            {lines.map((line) => (
              <div key={line.label} className="flex items-center">
                <span className="w-7 shrink-0 text-right text-[0.625rem] font-semibold uppercase tracking-wide text-white/40">
                  {line.label}
                </span>
                <div className="flex flex-1 justify-around gap-1">
                  {line.names.map((name) => (
                    <PitchPlayer key={name} name={name} color={color} />
                  ))}
                </div>
                <span className="w-7 shrink-0" aria-hidden />
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-[0.6875rem] text-ink-subtle">
        {t.result.lineupApprox}
      </p>
    </div>
  );
}

// Bloque de un equipo: bandera + nombre + badge de estado. Si el XI está
// confirmado, un toggle revela el esquema de cancha (colapsado por defecto para
// no meter ruido). Si no, una nota de cuándo se publican las alineaciones.
function TeamLineup({
  flag,
  name,
  confirmed,
  players,
  color,
  pendingNote,
}: {
  flag: string;
  name: string;
  confirmed: boolean;
  players: string[] | null;
  color: string;
  pendingNote: string;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const hasLineup = confirmed && players != null && players.length > 0;

  return (
    <div>
      <div className="flex items-start gap-2.5">
        <FlagImage iso2={flag} name={name} size="xs" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-ink">{name}</span>
            <span
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${
                confirmed ? "bg-brand-soft text-brand" : "bg-canvas text-ink-muted"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  confirmed ? "bg-brand" : "bg-ink-subtle"
                }`}
              />
              {confirmed ? t.result.lineupConfirmed : t.result.lineupPending}
            </span>
          </div>

          {hasLineup ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="mt-1.5 inline-flex items-center gap-1 rounded-sm text-xs font-semibold text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              {open ? t.result.lineupHide : t.result.lineupView}
              <svg
                className={`h-3.5 w-3.5 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          ) : (
            <p className="mt-0.5 text-xs leading-5 text-ink-muted">
              {pendingNote}
            </p>
          )}
        </div>
      </div>

      {hasLineup && open && players && (
        <LineupPitch players={players} color={color} />
      )}
    </div>
  );
}

export default function PredictionResult({ result, matchStatus }: Props) {
  const { t } = useLanguage();
  const {
    team_a_es,
    team_b_es,
    flag_a,
    flag_b,
    p_a,
    p_draw,
    p_b,
    xg_a,
    xg_b,
    top_scorelines,
    narrative,
    venue_label,
    neutral,
    home_team_id,
    lineup_confirmed_a,
    lineup_confirmed_b,
    lineup_a,
    lineup_b,
    is_knockout,
    p_penalties,
    p_advance_a,
    p_advance_b,
  } = result;

  // Mensaje cuando un equipo no tiene XI: pre-partido informa el horario de
  // publicación; en vivo o finalizado, "no disponible" (no el de pre-partido).
  const lineupPendingNote =
    matchStatus && LIVE_STATUSES.has(matchStatus)
      ? t.result.lineupUnavailableLive
      : matchStatus && FINISHED_STATUSES.has(matchStatus)
      ? t.result.lineupUnavailableFinished
      : t.result.lineupPendingNote;

  const topScore = top_scorelines[0];

  // El "resultado más probable" debe respetar el marcador más probable:
  // si el top scoreline es un empate (p. ej. 0–0), el titular es Empate,
  // aunque el agregado 1X2 favorezca a un equipo. Sin scoreline, caemos al 1X2.
  const drawMostLikely = topScore
    ? topScore.score_a === topScore.score_b
    : p_draw >= p_a && p_draw >= p_b;
  const favorsA = topScore ? topScore.score_a > topScore.score_b : p_a >= p_b;
  const winnerName = drawMostLikely ? t.result.draw : favorsA ? team_a_es : team_b_es;
  const winnerFlag = drawMostLikely ? null : favorsA ? flag_a : flag_b;
  const winnerHeadline = drawMostLikely
    ? t.result.draw
    : t.result.winsTeamHeadline(favorsA ? team_a_es : team_b_es);
  // Probabilidad del desenlace mostrado (coherente con el titular).
  const winnerProb = drawMostLikely ? p_draw : favorsA ? p_a : p_b;
  const confidence =
    winnerProb >= 0.6
      ? t.result.confidenceHigh
      : winnerProb >= 0.45
      ? t.result.confidenceMedium
      : t.result.confidenceLow;

  const isHome = !neutral && home_team_id != null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex flex-1 flex-col items-center gap-2">
          <FlagImage iso2={flag_a} name={team_a_es} size="lg" className="shadow-sm" />
          <span className="text-center text-lg font-semibold text-ink">{team_a_es}</span>
        </div>
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
          {t.result.vs}
        </span>
        <div className="flex flex-1 flex-col items-center gap-2">
          <FlagImage iso2={flag_b} name={team_b_es} size="lg" className="shadow-sm" />
          <span className="text-center text-lg font-semibold text-ink">{team_b_es}</span>
        </div>
      </div>

      <div className="flex justify-center">
        <span
          className={`rounded-full px-3.5 py-1 text-xs font-medium ${
            isHome ? "bg-brand-soft text-brand" : "bg-canvas text-ink-muted"
          }`}
        >
          {venue_label}
        </span>
      </div>

      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-subtle">
          {t.result.probabilitiesAt90}
        </p>
        <div className="space-y-4">
          {(
            [
              { label: team_a_es, value: p_a, color: TEAM_A },
              { label: t.result.draw, value: p_draw, color: DRAW },
              { label: team_b_es, value: p_b, color: TEAM_B },
            ] as const
          ).map(({ label, value, color }) => (
            <div key={label}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="font-medium text-ink">{label}</span>
                <span className="font-semibold" style={{ color }}>
                  {formatPct(value)}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    width: `${Math.round(value * 100)}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-canvas px-8 py-5">
        <div className="text-center">
          <p className="mb-1 text-xs uppercase tracking-widest text-ink-subtle">
            xG {team_a_es}
          </p>
          <p className="font-mono text-3xl font-bold text-ink">{xg_a.toFixed(1)}</p>
        </div>
        <span className="text-2xl font-light text-line">—</span>
        <div className="text-center">
          <p className="mb-1 text-xs uppercase tracking-widest text-ink-subtle">
            xG {team_b_es}
          </p>
          <p className="font-mono text-3xl font-bold text-ink">{xg_b.toFixed(1)}</p>
        </div>
      </div>

      <Scorelines scorelines={top_scorelines} teamA={team_a_es} teamB={team_b_es} />

      {is_knockout && p_advance_a != null && p_advance_b != null && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <div
              className="flex-1 rounded-xl p-4 text-center"
              style={{ backgroundColor: `${TEAM_A}18` }}
            >
              <p
                className="mb-1 text-xs font-semibold uppercase tracking-widest"
                style={{ color: TEAM_A }}
              >
                {t.result.advancesTeamLabel(team_a_es)}
              </p>
              <p className="text-2xl font-bold" style={{ color: TEAM_A }}>
                {formatPct(p_advance_a)}
              </p>
            </div>
            <div
              className="flex-1 rounded-xl p-4 text-center"
              style={{ backgroundColor: `${TEAM_B}18` }}
            >
              <p
                className="mb-1 text-xs font-semibold uppercase tracking-widest"
                style={{ color: TEAM_B }}
              >
                {t.result.advancesTeamLabel(team_b_es)}
              </p>
              <p className="text-2xl font-bold" style={{ color: TEAM_B }}>
                {formatPct(p_advance_b)}
              </p>
            </div>
          </div>
          {p_penalties != null && (
            <p className="text-center text-xs text-ink-muted">
              {t.result.penaltiesProbability}{" "}
              <span className="font-semibold text-ink">
                {formatPct(p_penalties)}
              </span>
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl bg-canvas px-5 py-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink-subtle">
          {t.result.analysis}
        </p>
        <p className="text-sm leading-7 text-ink-muted">{narrative}</p>
      </div>

      <div className="rounded-xl border border-line px-5 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-subtle">
          {t.result.squadFormation}
        </p>
        <div className="space-y-4">
          <TeamLineup
            flag={flag_a}
            name={team_a_es}
            confirmed={lineup_confirmed_a}
            players={lineup_a}
            color={TEAM_A}
            pendingNote={lineupPendingNote}
          />
          <TeamLineup
            flag={flag_b}
            name={team_b_es}
            confirmed={lineup_confirmed_b}
            players={lineup_b}
            color={TEAM_B}
            pendingNote={lineupPendingNote}
          />
        </div>
      </div>

      <div className="rounded-xl bg-gold-soft px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">
          {t.result.mostLikelyResult}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {winnerFlag && (
              <FlagImage iso2={winnerFlag} name={winnerName} size="md" className="shadow-sm" />
            )}
            <div className="min-w-0">
              <p className="truncate text-2xl font-bold text-gold">{winnerHeadline}</p>
              <p className="mt-0.5 text-sm text-ink-muted">
                {formatPct(winnerProb)} · {t.result.confidencePhrase(confidence)}
              </p>
            </div>
          </div>

          {topScore && (
            <div className="ml-auto shrink-0 text-right">
              <p className="text-xs uppercase tracking-widest text-gold">
                {t.result.score}
              </p>
              <p className="text-xl font-bold text-ink">
                {topScore.score_a}–{topScore.score_b}
              </p>
              <p className="text-xs text-ink-muted">
                {formatPct(topScore.probability)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
