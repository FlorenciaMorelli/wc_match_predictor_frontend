"use client";

import { useState, useEffect, useId } from "react";
import type {
  MatchStatus,
  PlayerSlot,
  PredictResponse,
  ScoreProbability,
} from "@/types";
import FlagImage from "./flag-image";
import { notableAbsences } from "@/lib/key-players";
import { buildMatchReport, type ReportGoal } from "@/lib/match-report";
import { countryCode } from "@/lib/country-codes";
import { shirtName } from "@/lib/shirt-names";
import {
  resolveKits,
  designationFor,
  isLightColor,
  type Kit,
  type KitPattern,
} from "@/lib/kits";
import { useLanguage, teamName } from "@/lib/i18n";
import { isLiveStatus, isFinishedStatus } from "@/lib/status";

interface Props {
  result: PredictResponse;
  // Estado del partido (cuando viene del fixture). Define el mensaje al no haber
  // formación: pre-partido vs en vivo vs finalizado.
  matchStatus?: MatchStatus;
  // Marcador real (cuando viene del fixture). Habilita la comparación
  // predicción vs. resultado en partidos en vivo / finalizados.
  scoreA?: string;
  scoreB?: string;
  // ID del partido (= id de evento de ESPN, cuando viene del fixture). Habilita la
  // crónica por reglas vía /api/match-report en partidos finalizados.
  matchId?: string;
}

const TEAM_A = "var(--result-a)";
const TEAM_B = "var(--result-b)";
const DRAW = "var(--result-draw)";

function scoreWinnerColor(a: number, b: number): string {
  if (a === b) return DRAW;
  return a > b ? TEAM_A : TEAM_B;
}

// Porcentaje con hasta dos decimales (sin ceros sobrantes): 0.1643 → "16.43%", 0.1 → "10%".
function formatPct(value: number): string {
  return `${Number((value * 100).toFixed(2))}%`;
}

function WinnerLegend({ teamA, teamB }: { teamA: string; teamB: string }) {
  const { t } = useLanguage();
  const items: [string, string][] = [
    [TEAM_A, teamA],
    [DRAW, t.result.draw],
    [TEAM_B, teamB],
  ];
  return (
    <div className="text-ink-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
      {items.map(([color, label]) => (
        <span key={label} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: color }}
          />
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
  actualA,
  actualB,
  compare = false,
}: {
  scorelines: ScoreProbability[];
  teamA: string;
  teamB: string;
  dense?: boolean;
  // Marcador real: cuando `compare`, resalta la celda que coincide y agrega una
  // nota de precisión debajo de la grilla (ranking del marcador o "fuera del top").
  actualA?: number;
  actualB?: number;
  compare?: boolean;
}) {
  const { t } = useLanguage();
  if (scorelines.length === 0) return null;

  const top8 = scorelines.slice(0, 8);
  const exactIdx =
    compare && actualA != null && actualB != null
      ? top8.findIndex((s) => s.score_a === actualA && s.score_b === actualB)
      : -1;
  const precisionNote = compare
    ? exactIdx === 0
      ? t.result.compare.scoreTop
      : exactIdx > 0
        ? t.result.compare.scoreRanked(exactIdx + 1)
        : t.result.compare.scoreOutside
    : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-ink-subtle text-xs font-semibold tracking-widest uppercase">
          {t.result.mostLikelyScores}
        </p>
        <WinnerLegend teamA={teamA} teamB={teamB} />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {top8.map((s, i) => {
          const color = scoreWinnerColor(s.score_a, s.score_b);
          const isActual = i === exactIdx;
          return (
            <div
              key={i}
              className={`border-line relative flex flex-col items-center rounded-lg border ${
                dense ? "px-1 py-2" : "px-2 py-3"
              } ${isActual ? "opacity-100" : compare ? "opacity-60" : ""}`}
              style={{
                borderBottom: `2px solid ${color}`,
                ...(isActual ? { boxShadow: `0 0 0 1.5px ${color}` } : {}),
              }}
            >
              {isActual && (
                <span
                  className="absolute -top-2 rounded-full px-1.5 py-0.5 text-[0.5625rem] leading-none font-semibold"
                  style={{ backgroundColor: color, color: "var(--canvas)" }}
                >
                  {t.result.compare.actual}
                </span>
              )}
              <span
                className={`font-bold ${dense ? "text-sm" : "text-base"}`}
                style={{ color }}
              >
                {s.score_a}–{s.score_b}
              </span>
              <span className="text-ink-subtle mt-0.5 text-xs">
                {formatPct(s.probability)}
              </span>
            </div>
          );
        })}
      </div>
      {precisionNote && (
        <p className="text-ink-muted mt-3 text-center text-xs">
          {precisionNote}
        </p>
      )}
    </div>
  );
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type RenderLine = {
  names: string[];
  jerseys: (number | null)[];
  positions: (string | null)[];
};

// Silueta de la camiseta. Compartida por el cuerpo (relleno), el contorno (halo) y el
// clipPath que recorta el patrón: así rayas/damero/banda nunca se desbordan.
const JERSEY_BODY =
  "M8,3 Q12,7 16,3 L23,7 L22,13 L18,12 L18,25 L6,25 L6,12 L2,13 L1,7 Z";

// Patrón del kit recortado a la silueta (clipPath). Cubre toda la viewBox: el recorte
// se encarga de que solo aparezca dentro de la camiseta (mangas incluidas).
function KitPatternFill({
  pattern,
  color,
}: {
  pattern: KitPattern;
  color: string;
}) {
  switch (pattern) {
    case "stripes": {
      // Rayas verticales (AR): barras alternas de ~2.4 de ancho.
      const w = 2.4;
      const bars = [];
      for (let x = 0, i = 0; x < 24; x += w, i++) {
        if (i % 2 === 1)
          bars.push(
            <rect key={i} x={x} y={0} width={w} height={28} fill={color} />
          );
      }
      return <>{bars}</>;
    }
    case "hoops": {
      // Franjas horizontales: barras alternas de ~2.6 de alto.
      const h = 2.6;
      const bars = [];
      for (let y = 0, i = 0; y < 28; y += h, i++) {
        if (i % 2 === 1)
          bars.push(
            <rect key={i} x={0} y={y} width={24} height={h} fill={color} />
          );
      }
      return <>{bars}</>;
    }
    case "halves":
      // Mitad derecha del secundario.
      return <rect x={12} y={0} width={12} height={28} fill={color} />;
    case "sash":
      // Banda diagonal (PE): de hombro izquierdo a cadera derecha.
      return <path d="M0,7 L7,0 L24,17 L17,24 Z" fill={color} />;
    case "checkers": {
      // Damero (HR): cuadros de 4×4 en tablero de ajedrez.
      const s = 4;
      const squares = [];
      for (let r = 0, ri = 0; r < 28; r += s, ri++)
        for (let c = 0, ci = 0; c < 24; c += s, ci++)
          if ((ri + ci) % 2 === 0)
            squares.push(
              <rect
                key={`${ri}-${ci}`}
                x={c}
                y={r}
                width={s}
                height={s}
                fill={color}
              />
            );
      return <>{squares}</>;
    }
    case "solid":
    default:
      return null;
  }
}

// ─── JerseyIcon ───────────────────────────────────────────────────────────────
// Silueta SVG de camiseta de fútbol con patrón real (primario + secundario). Tamaño
// controlado por className. El patrón se pinta dentro de la silueta vía clipPath para
// que no se desborde; el arquero va dorado liso. Fallback: kit liso = primario.
function JerseyIcon({
  kit,
  number,
  className = "w-7 h-8",
  isGk = false,
  gkColor,
}: {
  kit: Kit;
  number?: number | null;
  className?: string;
  isGk?: boolean;
  gkColor?: string;
}) {
  // clipPath con id único por instancia: varias camisetas conviven sin pisarse.
  const clipId = useId();
  // Cuerpo = color REAL del kit (España rojo, Cabo Verde azul, etc.). Arquero: color
  // designado por FIFA si se conoce (gkColor), si no dorado liso. La claridad del cuerpo
  // (para ribete/halo/dorsal) se decide por el primario (o el color del arquero).
  const bodyColor = isGk ? (gkColor ?? "var(--gold)") : kit.primary;
  const pattern: KitPattern = isGk ? "solid" : kit.pattern;
  const lightBody = isGk
    ? gkColor
      ? isLightColor(gkColor)
      : true
    : isLightColor(kit.primary);
  // Ribete del cuello y puños: oscuro sobre cuerpo claro, blanco sobre cuerpo oscuro.
  const trimColor = lightBody ? "#1f2937" : "#ffffff";
  // En kits lisos, banda tonal sutil para dar textura de tela sin falsear el color.
  const sashColor = lightBody ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.15)";
  const numberColor = lightBody ? "#16181d" : "#ffffff";
  // Halo de contorno: el complementario del cuerpo, para despegar del verde.
  const outline = lightBody ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.85)";

  return (
    <svg
      viewBox="0 0 24 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={JERSEY_BODY} />
        </clipPath>
      </defs>
      {/* Cuerpo: color base del kit (cuello en V, hombros y mangas cortas) */}
      <path d={JERSEY_BODY} fill={bodyColor} />
      {/* Patrón (rayas/damero/banda) o banda tonal de textura, recortado a la silueta */}
      <g clipPath={`url(#${clipId})`}>
        {pattern === "solid" ? (
          <path d="M6,8 L9.5,8 L18,25 L14.5,25 Z" fill={sashColor} />
        ) : (
          <KitPatternFill pattern={pattern} color={kit.secondary} />
        )}
      </g>
      {/* Contorno por encima del patrón: bordes nítidos sobre rayas/damero */}
      <path
        d={JERSEY_BODY}
        fill="none"
        stroke={outline}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* Ribete del cuello en V */}
      <path d="M8,3 Q12,7 16,3 L15,4.4 Q12,7.7 9,4.4 Z" fill={trimColor} />
      {/* Puños de las mangas */}
      <path d="M1,7 L2,13 L3.5,12.7 L2.6,7.55 Z" fill={trimColor} />
      <path d="M23,7 L22,13 L20.5,12.7 L21.4,7.55 Z" fill={trimColor} />
      {/* Dorsal. En kits con patrón, un disco del color primario detrás del número para
          que SIEMPRE se apoye sobre el primario (contra el que numberColor ya contrasta) y
          no quede ilegible sobre una franja/cuadro del secundario. Halo con el color del
          cuerpo (paintOrder=stroke) para reforzar el borde. */}
      {number != null && (
        <>
          {pattern !== "solid" && (
            <ellipse
              cx="12"
              cy="18.5"
              rx="5.6"
              ry="5.2"
              fill={bodyColor}
              stroke={trimColor}
              strokeWidth="0.4"
              strokeOpacity="0.45"
            />
          )}
          <text
            x="12"
            y="19"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={number >= 10 ? "7" : "8.5"}
            fontWeight="800"
            fill={numberColor}
            stroke={bodyColor}
            strokeWidth="0.5"
            paintOrder="stroke"
            fontFamily="system-ui, -apple-system, sans-serif"
            letterSpacing="-0.4"
          >
            {number}
          </text>
        </>
      )}
    </svg>
  );
}

// Partículas nobiliarias/de apellido que NO deben quedar separadas del apellido al
// abreviar (la convención Sofascore/FotMob muestra el apellido solo). Sin esto,
// "Virgil van Dijk" se mostraba como "Dijk" y "Frenkie de Jong" como "Jong".
const SURNAME_PARTICLES = new Set([
  "van",
  "von",
  "der",
  "den",
  "ter",
  "ten",
  "de",
  "del",
  "della",
  "di",
  "da",
  "dos",
  "das",
  "do",
  "la",
  "le",
  "bin",
  "ibn",
  "al",
  "el",
  "mac",
  "mc",
  "o'",
]);

// Apellido a mostrar: última palabra + las partículas que la preceden (multi-
// partícula: "van der", "de la"). Para nombres de una sola palabra (mononímicos),
// devuelve el nombre completo. En el peor caso muestra de más, nunca corta el apellido.
function displaySurname(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name.trim();
  let i = parts.length - 1;
  while (i > 0 && SURNAME_PARTICLES.has(parts[i - 1].toLowerCase())) i--;
  return parts.slice(i).join(" ");
}

// ─── PlayerNode ───────────────────────────────────────────────────────────────
// Camiseta + apellido con la fuente display del sitio (Archivo).
// Convención Sofascore / FotMob: apellido solo, tooltip con nombre completo.
function PlayerNode({
  name,
  iso2,
  kit,
  jersey,
  position,
  isGk = false,
  gkColor,
}: {
  name: string;
  iso2: string;
  kit: Kit;
  jersey?: number | null;
  position?: string | null;
  isGk?: boolean;
  gkColor?: string;
}) {
  // Etiqueta: nombre de camiseta oficial WC2026 si hay match; si no, el apellido heurístico.
  const surname = shirtName(iso2, name) ?? displaySurname(name);

  return (
    <div
      className="flex w-12 flex-col items-center gap-0.5"
      title={position ? `${name} · ${position}` : name}
    >
      <JerseyIcon
        kit={kit}
        number={jersey}
        className="h-8 w-7 drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] sm:h-9 sm:w-8"
        isGk={isGk}
        gkColor={gkColor}
      />
      <span className="font-display rounded-[3px] bg-white/90 px-1 py-px text-center text-[0.6rem] leading-tight font-bold tracking-tight whitespace-nowrap text-slate-900 shadow-sm sm:text-[0.68rem]">
        {surname}
      </span>
    </div>
  );
}

// ─── Nomenclatura de posiciones del backend ───────────────────────────────────
// G/GK=portero · RB/LB=lateral D/I · RWB/LWB=carrilero D/I · CD-R/CD-L=central D/I
// CD/CB=central · SW=líbero · DM=volante defensivo · CM-R/CM-L=central D/I
// CM/M=mediocampista · RM/LM=volante por banda D/I · AM-R/AM-L=mediapunta D/I
// AM/OM=enganche · RW/LW=extremo D/I · WF-R/WF-L=variante de extremo
// CF-R/CF-L=delantero D/I · F/ST=punta · SS=segunda punta
//
// Dos mapeos, ambos derivados del CÓDIGO de posición (formation_place del backend
// viene mezclado entre líneas → no sirve para ordenar):
//   • attackingDepth: profundidad vertical (atrás→adelante) para ordenar el XI.
//   • horizontalOrder: izquierda→derecha dentro de una línea.
// La ESTRUCTURA (cuántas líneas y de qué tamaño) la define el string `formation`.

// attackingDepth — profundidad vertical: 0=arquero … 70=delantero (mayor = más
// adelantado). Escala ordinal; solo importa el orden relativo. Los carrileros (20)
// quedan entre centrales (10/12) y volantes (30/40): el corte por tamaños del
// esquema decide si caen en una defensa de 5 (5-3-2) o en un medio de 5 (3-5-2).
const ATTACKING_DEPTH: Record<string, number> = {
  G: 0,
  GK: 0,
  CD: 10,
  CB: 10,
  "CD-L": 10,
  "CD-R": 10,
  "CD-C": 10,
  SW: 10,
  LB: 12,
  RB: 12,
  LWB: 20,
  RWB: 20,
  DM: 30,
  "DM-L": 30,
  "DM-R": 30,
  "DM-C": 30,
  CM: 40,
  "CM-L": 40,
  "CM-R": 40,
  "CM-C": 40,
  LM: 40,
  RM: 40,
  M: 40,
  AM: 50,
  "AM-L": 50,
  "AM-R": 50,
  "AM-C": 50,
  OM: 50,
  "OM-L": 50,
  "OM-R": 50,
  LW: 60,
  RW: 60,
  WF: 60,
  "WF-L": 60,
  "WF-R": 60,
  SS: 62,
  CF: 70,
  "CF-L": 70,
  "CF-R": 70,
  "CF-C": 70,
  ST: 70,
  F: 70,
  FW: 70,
};

function attackingDepth(pos: string | null): number {
  if (!pos) return 40;
  return ATTACKING_DEPTH[pos.toUpperCase().trim()] ?? 40;
}

function isGk(pos: string | null): boolean {
  if (!pos) return false;
  const p = pos.toUpperCase().trim();
  return p === "G" || p === "GK";
}

// horizontalOrder — izquierda→derecha dentro de la línea, por regla prefijo/sufijo
// (robusta a códigos no listados). En Inglaterra 4-2-3-1, formation_place invertiría
// James(RB) y O'Reilly(LB); el código de posición es la fuente canónica.
//   prefijo L (LB/LWB/LM/LW) = flanco izq → 1   · sufijo -L = interior izq → 2
//   prefijo R (RB/RWB/RM/RW) = flanco der → 5   · sufijo -R = interior der → 4
//   central (CD/CM/DM/AM/ST/F/SW…)                                          → 3
function horizontalOrder(pos: string | null): number {
  if (!pos) return 3;
  const p = pos.toUpperCase().trim();
  if (p.startsWith("L")) return 1;
  if (p.startsWith("R")) return 5;
  if (p.endsWith("-L")) return 2;
  if (p.endsWith("-R")) return 4;
  return 3;
}

// parseFormation — string del esquema → tamaños de línea (atrás→adelante).
// "3-5-2" → [3,5,2]. null si no parsea o no suma 10 (jugadores de campo, sin GK).
function parseFormation(formation: string | null | undefined): number[] | null {
  if (!formation) return null;
  const parts = formation
    .split(/[^0-9]+/)
    .filter(Boolean)
    .map(Number);
  if (parts.length < 2) return null;
  if (parts.some((n) => !Number.isInteger(n) || n < 1 || n > 5)) return null;
  if (parts.reduce((a, b) => a + b, 0) !== 10) return null;
  return parts;
}

// ─── computeFormationLines ────────────────────────────────────────────────────
// Retorna [FWD, ..., GK] (de adelante hacia atrás).
function computeFormationLines(
  players: string[],
  formation: string | null | undefined,
  detail: PlayerSlot[] | null | undefined
): RenderLine[] {
  if (detail && detail.length === 11) {
    const toLine = (slots: PlayerSlot[]): RenderLine => ({
      names: slots.map((s) => s.name),
      jerseys: slots.map((s) => s.jersey),
      positions: slots.map((s) => s.position),
    });

    const gk = detail.filter((s) => isGk(s.position));
    const outfield = detail.filter((s) => !isGk(s.position));
    const sizes = parseFormation(formation);

    // Camino canónico: el string de formación define las líneas; ordenamos por
    // profundidad y cortamos por esos tamaños; cada línea se ordena izq→derecha.
    if (
      gk.length === 1 &&
      sizes &&
      sizes.reduce((a, b) => a + b, 0) === outfield.length
    ) {
      const ordered = outfield
        .map((s, i) => ({ s, i }))
        .sort(
          (a, b) =>
            attackingDepth(a.s.position) - attackingDepth(b.s.position) ||
            a.i - b.i
        )
        .map((x) => x.s);

      const lines: RenderLine[] = [toLine(gk)]; // [GK, DEF, …, FWD]
      let k = 0;
      for (const size of sizes) {
        const band = ordered
          .slice(k, k + size)
          .map((s, i) => ({ s, i }))
          .sort(
            (a, b) =>
              horizontalOrder(a.s.position) - horizontalOrder(b.s.position) ||
              a.i - b.i
          )
          .map((x) => x.s);
        lines.push(toLine(band));
        k += size;
      }
      return lines.reverse(); // → [FWD, …, GK]
    }

    // Fallback (sin formación válida): bandas gruesas por profundidad.
    const bands: PlayerSlot[][] = [[], [], [], []]; // GK · DEF · MID · FWD
    for (const s of detail) {
      const d = attackingDepth(s.position);
      bands[d === 0 ? 0 : d < 30 ? 1 : d < 60 ? 2 : 3].push(s);
    }
    bands.forEach((b) =>
      b.sort(
        (a, c) => horizontalOrder(a.position) - horizontalOrder(c.position)
      )
    );
    return bands
      .filter((b) => b.length > 0)
      .map(toLine)
      .reverse();
  }

  if (players.length === 11) {
    return [
      {
        names: players.slice(8, 11),
        jerseys: [null, null, null],
        positions: [null, null, null],
      },
      {
        names: players.slice(5, 8),
        jerseys: [null, null, null],
        positions: [null, null, null],
      },
      {
        names: players.slice(1, 5),
        jerseys: [null, null, null, null],
        positions: [null, null, null, null],
      },
      { names: players.slice(0, 1), jerseys: [null], positions: [null] },
    ];
  }

  return [];
}

// ─── SinglePitch ──────────────────────────────────────────────────────────────
// Cancha individual por equipo: verde oscuro premium, marcas reglamentarias en
// SVG overlay, camisetas con dorsal. FWD arriba → GK abajo. Responsive.
// Fondo sin rayas CSS para mantener coherencia con el diseño editorial del sitio.
function SinglePitch({
  players,
  iso2,
  kit,
  gkColor,
  formation,
  detail,
}: {
  players: string[];
  iso2: string;
  kit: Kit;
  gkColor?: string;
  formation?: string | null;
  detail?: PlayerSlot[] | null;
}) {
  const { t } = useLanguage();

  const lines = computeFormationLines(players, formation, detail);

  if (lines.length === 0) {
    return (
      <ol className="bg-canvas text-ink-muted mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl px-4 py-3 text-sm">
        {players.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ol>
    );
  }

  return (
    <div className="mt-3">
      <div
        className="border-line overflow-hidden rounded-xl border shadow-md"
        style={{ perspective: "900px" }}
      >
        <div className="wc-tricolor h-1" />

        {/*
          Mitad de cancha con perspectiva: rayas verticales que convergen al fondo.
          rotateX + transform-origin: bottom → GK cerca del espectador, FWD al fondo.
          viewBox 0 0 100 100 = mitad de cancha reglamentaria.
        */}
        <div
          className="relative flex min-h-[22rem] flex-col sm:min-h-[27rem]"
          style={{
            background:
              "repeating-linear-gradient(180deg, #1e5c30 0rem, #1e5c30 1.25rem, #175226 1.25rem, #175226 2.5rem)",
            transform: "rotateX(20deg)",
            transformOrigin: "bottom center",
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            fill="none"
          >
            {/* Borde de la mitad de cancha */}
            <rect
              x="3"
              y="2"
              width="94"
              height="96"
              stroke="white"
              strokeOpacity="0.55"
              strokeWidth="0.8"
            />
            {/*
              Semicírculo del círculo central: centro en la línea de mediocampo (y=2),
              r=13. sweep=0 comba HACIA ADENTRO de la cancha (zona visible y>2),
              de (37,2) pasando por (50,15) hasta (63,2). Con sweep=1 se dibujaba
              hacia arriba, fuera del campo (por eso no se veía).
              Stroke grueso porque la perspectiva comprime esta zona visualmente.
            */}
            <path
              d="M 37,2 A 13,13 0 0 0 63,2"
              stroke="white"
              strokeOpacity="0.7"
              strokeWidth="1.2"
            />
            {/* Área grande (portería propia, abajo) */}
            <rect
              x="22"
              y="67"
              width="56"
              height="31"
              stroke="white"
              strokeOpacity="0.5"
              strokeWidth="0.7"
              fill="none"
            />
            {/* Área chica */}
            <rect
              x="35"
              y="87"
              width="30"
              height="11"
              stroke="white"
              strokeOpacity="0.4"
              strokeWidth="0.6"
              fill="none"
            />
            {/* Punto de penal */}
            <circle
              cx="50"
              cy="76"
              r="1.1"
              fill="var(--gold)"
              fillOpacity="0.95"
            />
            {/*
              Arco D: semicírculo centrado en el punto de penal (50,76), r=16.
              Intersecta el borde del área en x≈37 y x≈63 (y=67).
              sweep=1 (horario) dibuja el arco hacia el mediocampo — "hacia afuera"
              del área, pasando por (50,60). Correcto según reglamento FIFA.
            */}
            <path
              d="M 37,67 A 16,16 0 0 1 63,67"
              stroke="white"
              strokeOpacity="0.35"
              strokeWidth="0.6"
            />
            {/*
              Córners en línea de gol (abajo): arco de cuarto de círculo r=4.
              Arrancan desde la línea de banda/gol y curvan HACIA adentro del campo.
              La línea de mediocampo (y=2) NO lleva córners.
            */}
            {/* Inferior izquierdo: desde (3,94) en la banda, horario hasta (7,98) en la línea de gol */}
            <path
              d="M 3,94 A 4,4 0 0 1 7,98"
              stroke="white"
              strokeOpacity="0.45"
              strokeWidth="0.6"
            />
            {/* Inferior derecho: desde (93,98) en la línea de gol, antihorario hasta (97,94) en la banda */}
            <path
              d="M 93,98 A 4,4 0 0 1 97,94"
              stroke="white"
              strokeOpacity="0.45"
              strokeWidth="0.6"
            />
          </svg>

          {/* Jugadores: FWD arriba (mediocampo) → GK abajo (portería propia) */}
          <div className="relative z-10 flex flex-1 flex-col justify-around px-3 py-4">
            {lines.map((line, i) => {
              const isGkLine = i === lines.length - 1;
              return (
                <div key={i} className="flex items-center justify-around gap-1">
                  {line.names.map((name, j) => (
                    <PlayerNode
                      key={j}
                      name={name}
                      iso2={iso2}
                      kit={kit}
                      jersey={line.jerseys[j]}
                      position={line.positions[j]}
                      isGk={isGkLine}
                      gkColor={gkColor}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-ink-subtle mt-2 text-center text-[0.6875rem]">
        {formation ?? t.result.lineupApprox}
      </p>
    </div>
  );
}

// Bloque de un equipo: bandera + nombre + badge de estado + toggle de cancha.
// Si el XI está confirmado, "Ver formación" revela SinglePitch (colapsado por
// defecto). Si no, muestra la nota de estado. El badge se oculta tras el KO.
function TeamLineup({
  flag,
  name,
  confirmed,
  players,
  kit,
  gkColor,
  pendingNote,
  started,
  formation,
  detail,
}: {
  flag: string;
  name: string;
  confirmed: boolean;
  players: string[] | null;
  kit: Kit;
  gkColor?: string;
  pendingNote: string;
  started: boolean;
  formation?: string | null;
  detail?: PlayerSlot[] | null;
}) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const hasLineup = confirmed && players != null && players.length > 0;
  // Figuras curadas que no aparecen en el XI confirmado. Solo con XI confirmado.
  const absences = hasLineup && players ? notableAbsences(flag, players) : [];

  return (
    <div>
      <div className="flex items-start gap-2.5">
        <FlagImage iso2={flag} name={name} size="xs" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-ink text-sm font-medium">{name}</span>
            {!(confirmed && started) && (
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium ${
                  confirmed
                    ? "bg-brand-soft text-brand"
                    : "bg-canvas text-ink-muted"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    confirmed ? "bg-brand" : "bg-ink-subtle"
                  }`}
                />
                {confirmed ? t.result.lineupConfirmed : t.result.lineupPending}
              </span>
            )}
          </div>

          {hasLineup ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="text-brand hover:text-brand-hover focus-visible:ring-brand mt-1.5 inline-flex items-center gap-1 rounded-sm text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
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
            <p className="text-ink-muted mt-0.5 text-xs leading-5">
              {pendingNote}
            </p>
          )}

          {absences.length > 0 && (
            <div
              className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300/90"
              title={t.result.absencesNote}
            >
              <span className="font-semibold">{t.result.absencesLabel}:</span>
              <span>{absences.join(", ")}</span>
            </div>
          )}
        </div>
      </div>

      {hasLineup && open && players && (
        <SinglePitch
          players={players}
          iso2={flag}
          kit={kit}
          gkColor={gkColor}
          formation={formation}
          detail={detail}
        />
      )}
    </div>
  );
}

// ─── MatchGoals ───────────────────────────────────────────────────────────────
// Detalle de goles por selección (columnas = países). Una línea por goleador, con
// TODOS sus minutos agrupados y ordenados; cada minuto aclara penal "(P)" o gol en
// contra "(EC)". Formato: "12' (P), 42' Harry Kane". El autor de un gol en contra
// aparece en la columna del rival (la selección a la que le sumó el gol).
function MatchGoals({
  goals,
  teamA,
  teamB,
  heading,
  penaltyTag,
  ownGoalTag,
}: {
  goals: ReportGoal[];
  teamA: string;
  teamB: string;
  heading: string;
  penaltyTag: string;
  ownGoalTag: string;
}) {
  const minuteToken = (g: ReportGoal) => {
    if (g.minute == null) return "";
    const tag = g.penalty
      ? ` (${penaltyTag})`
      : g.owngoal
        ? ` (${ownGoalTag})`
        : "";
    return `${g.minute}${g.offset ? `+${g.offset}` : ""}'${tag}`;
  };

  // Líneas de una columna: agrupa por goleador (orden de su primer gol) y une sus
  // minutos. "31', 45+5' Folarin Balogun".
  const lines = (side: "a" | "b") => {
    const sideGoals = goals
      .filter((g) => g.team === side)
      .sort(
        (x, y) =>
          (x.minute ?? 0) - (y.minute ?? 0) || (x.offset ?? 0) - (y.offset ?? 0)
      );
    const order: string[] = [];
    const byPlayer = new Map<string, ReportGoal[]>();
    for (const g of sideGoals) {
      const key = g.name || "—";
      if (!byPlayer.has(key)) {
        byPlayer.set(key, []);
        order.push(key);
      }
      byPlayer.get(key)!.push(g);
    }
    return order.map((name) => {
      const minutes = byPlayer
        .get(name)!
        .map(minuteToken)
        .filter(Boolean)
        .join(", ");
      return `${minutes} ${name}`.trim();
    });
  };

  const cols = [
    { name: teamA, list: lines("a") },
    { name: teamB, list: lines("b") },
  ];

  return (
    <div className="border-line mt-3 border-t pt-3">
      <p className="text-ink-subtle mb-2 text-[0.7rem] font-semibold tracking-widest uppercase">
        {heading}
      </p>
      <div className="text-ink-muted grid grid-cols-2 gap-4 text-sm">
        {cols.map((col, i) => (
          <div key={i}>
            <p className="text-ink truncate font-semibold">{col.name}</p>
            <ul className="mt-1 space-y-0.5">
              {col.list.length ? (
                col.list.map((line, j) => <li key={j}>{line}</li>)
              ) : (
                <li className="text-ink-subtle">—</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── KnockoutOutlook ──────────────────────────────────────────────────────────
// Bloque de penales (eliminatoria): el título lleva la chance de que el cruce se
// defina por penales entre paréntesis, y debajo, quién avanza la llave como barra
// dividida (tug-of-war, A desde la izquierda / B desde la derecha; p_advance_* suman
// ≈1). Mismo lenguaje de color que el 1X2.
function KnockoutOutlook({
  teamA,
  teamB,
  flagA,
  flagB,
  pAdvanceA,
  pAdvanceB,
  pPenalties,
}: {
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
  pAdvanceA: number;
  pAdvanceB: number;
  pPenalties: number | null;
}) {
  const { t } = useLanguage();
  // Anchos de la barra normalizados a 100% (el backend suma ≈1; guardamos contra
  // a+b=0 para no dividir por cero y caer a un 50/50 neutro).
  const total = pAdvanceA + pAdvanceB;
  const aShare = total > 0 ? (pAdvanceA / total) * 100 : 50;

  return (
    <div>
      {/* Título con la chance de que el cruce se defina por penales entre paréntesis */}
      <p className="text-ink-subtle mb-3 text-xs font-semibold tracking-widest uppercase">
        {t.result.knockoutHeading}
        {pPenalties != null && (
          <span className="text-ink"> ({formatPct(pPenalties)})</span>
        )}
      </p>

      {/* Equipos a cada extremo de la barra */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <FlagImage iso2={flagA} name={teamA} size="xs" />
          <span className="text-ink truncate text-sm font-medium">{teamA}</span>
        </div>
        <div className="flex min-w-0 items-center justify-end gap-2">
          <span className="text-ink truncate text-sm font-medium">{teamB}</span>
          <FlagImage iso2={flagB} name={teamB} size="xs" />
        </div>
      </div>

      {/* Barra dividida: A crece desde la izquierda, B desde la derecha */}
      <div
        role="img"
        aria-label={`${t.result.advancesTeamLabel(teamA)} ${formatPct(
          pAdvanceA
        )}, ${t.result.advancesTeamLabel(teamB)} ${formatPct(pAdvanceB)}`}
        className="bg-line flex h-3 w-full overflow-hidden rounded-full"
      >
        <div style={{ width: `${aShare}%`, backgroundColor: TEAM_A }} />
        <div style={{ width: `${100 - aShare}%`, backgroundColor: TEAM_B }} />
      </div>

      {/* Porcentajes bajo cada extremo */}
      <div className="mt-1.5 flex items-center justify-between text-sm font-bold">
        <span style={{ color: TEAM_A }}>{formatPct(pAdvanceA)}</span>
        <span style={{ color: TEAM_B }}>{formatPct(pAdvanceB)}</span>
      </div>
    </div>
  );
}

export default function PredictionResult({
  result,
  matchStatus,
  scoreA,
  scoreB,
  matchId,
}: Props) {
  const { t, locale } = useLanguage();
  const {
    team_a,
    team_b,
    team_a_es: teamAEs,
    team_b_es: teamBEs,
    flag_a,
    flag_b,
    p_a,
    p_draw,
    p_b,
    xg_a,
    xg_b,
    top_scorelines,
    narrative,
    neutral,
    home_team_id,
    team_a_id,
    team_b_id,
    lineup_confirmed_a,
    lineup_confirmed_b,
    lineup_a,
    lineup_b,
    formation_a,
    formation_b,
    lineup_detail_a,
    lineup_detail_b,
    is_knockout,
    p_penalties,
    p_advance_a,
    p_advance_b,
  } = result;

  // Traducción automática de la narrativa (es→en) cuando la app está en inglés.
  // El estado guarda { source, result } para que el display se derive de forma pura:
  // si source no matchea la narrativa actual (nuevo partido) se muestra el original
  // automáticamente, sin necesidad de un setState síncrono en el efecto.
  const [narrativeTranslation, setNarrativeTranslation] = useState<{
    source: string;
    result: string;
  } | null>(null);
  const narrativeDisplay =
    locale === "en" && narrativeTranslation?.source === narrative
      ? narrativeTranslation.result
      : narrative;
  useEffect(() => {
    if (locale !== "en" || !narrative) return;
    let cancelled = false;
    fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: narrative,
        // src: nombre en español tal como aparece en la narrativa del backend.
        // dst: nombre canónico en inglés que el sistema ya conoce.
        termA: { src: teamAEs, dst: team_a },
        termB: { src: teamBEs, dst: team_b },
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && typeof data?.translated === "string") {
          setNarrativeTranslation({
            source: narrative,
            result: data.translated,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [narrative, locale, teamAEs, teamBEs, team_a, team_b]);

  // Nombre a mostrar según idioma. Se nombran igual que los campos del response
  // para no tocar cada uso; el valor ya respeta el locale (en = canónico, es = _es).
  const team_a_es = teamName(team_a, teamAEs, locale);
  const team_b_es = teamName(team_b, teamBEs, locale);

  // Mensaje cuando un equipo no tiene XI: pre-partido informa el horario de
  // publicación; en vivo o finalizado, "no disponible" (no el de pre-partido).
  const lineupPendingNote =
    matchStatus && isLiveStatus(matchStatus)
      ? t.result.lineupUnavailableLive
      : matchStatus && isFinishedStatus(matchStatus)
        ? t.result.lineupUnavailableFinished
        : t.result.lineupPendingNote;

  const topScore = top_scorelines[0];

  // Estado del partido + resultado real (gateado por estado, no por "hay marcador":
  // los programados vienen 0–0). El marcador en el hero se muestra en vivo o
  // finalizado; los enriquecimientos de comparación, SOLO finalizados ("lo
  // definido es lo que ya se jugó"): en vivo nada está decidido todavía.
  const isLive = matchStatus != null && isLiveStatus(matchStatus);
  const isFinished = matchStatus != null && isFinishedStatus(matchStatus);
  const hasStarted = isLive || isFinished;

  // Crónica por reglas en finalizados: trae los datos del partido de ESPN (matcheo
  // EXACTO por id de evento = id de fixture) vía /api/match-report y arma el texto con
  // lib/match-report. Patrón puro como la traducción: { key, data } para que un partido
  // nuevo no muestre datos viejos. Sin cobertura → cae a la síntesis local.
  const abbrA = countryCode(team_a);
  const abbrB = countryCode(team_b);
  type MatchReportData = {
    ft: [number, number];
    ht: [number, number] | null;
    goals: ReportGoal[];
  };
  const [report, setReport] = useState<{
    key: string;
    data: MatchReportData;
  } | null>(null);
  const reportKey = matchId ?? "";
  useEffect(() => {
    if (!isFinished || !matchId) return;
    let cancelled = false;
    fetch("/api/match-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: matchId, abbrA, abbrB }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (
          cancelled ||
          !data?.found ||
          !Array.isArray(data.ft) ||
          data.ft.length !== 2
        )
          return;
        setReport({
          key: matchId,
          data: {
            ft: data.ft,
            ht: Array.isArray(data.ht) ? data.ht : null,
            goals: Array.isArray(data.goals) ? data.goals : [],
          },
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isFinished, matchId, abbrA, abbrB]);
  const actualA = Number.parseInt(scoreA ?? "", 10);
  const actualB = Number.parseInt(scoreB ?? "", 10);
  const hasIntScore = Number.isInteger(actualA) && Number.isInteger(actualB);
  const hasScore = (isLive || isFinished) && hasIntScore; // marcador en el hero
  const compare = isFinished && hasIntScore; // comparación enriquecida

  // Desenlace real (1X2) y su probabilidad según el modelo.
  const outcome: "a" | "b" | "draw" =
    actualA > actualB ? "a" : actualA < actualB ? "b" : "draw";
  const actualOutcomeProb =
    outcome === "a" ? p_a : outcome === "b" ? p_b : p_draw;
  // "Resultado inesperado": lo que pasó tenía baja probabilidad (< 25%). Pondera por
  // el modelo, no por el marcador exacto: capta al favorito que no gana (p. ej. 84.8%
  // de Suiza y terminó empate), no solo el marcador raro.
  const isUpset = compare && actualOutcomeProb < 0.25;

  // Goles reales vs. esperados (xG) POR equipo: un veredicto agregado engaña cuando un
  // equipo marca de más y el otro de menos (Suiza por debajo, Catar por encima). Si
  // divergen, lo decimos así; si no, comparamos el total con banda de tolerancia ±0.75.
  const devA = actualA - xg_a;
  const devB = actualB - xg_b;
  const goalsDiverge =
    Math.sign(devA) !== Math.sign(devB) &&
    Math.max(Math.abs(devA), Math.abs(devB)) >= 0.75 &&
    Math.min(Math.abs(devA), Math.abs(devB)) >= 0.3;
  const totalDiff = devA + devB;
  const goalNote = goalsDiverge
    ? t.result.compare.goalsMixed(team_a_es, devA > 0, team_b_es, devB > 0)
    : totalDiff > 0.75
      ? t.result.compare.goalsMore
      : totalDiff < -0.75
        ? t.result.compare.goalsFewer
        : t.result.compare.goalsAsExpected;

  // Comentario "cómo estuvo el partido" para finalizados, sintetizado de los datos
  // reales (marcador + xG + probabilidad del modelo): desenlace + carácter (goleada /
  // por la mínima / muchos goles) + relación con el pronóstico. Se arma en es/en vía
  // i18n, sin fuentes externas, y reemplaza la narrativa predictiva del backend (que
  // post-partido lee mal). Sin marcador válido (compare=false) → cae a la narrativa.
  let matchSummary: string | null = null;
  if (compare) {
    const s = t.result.summary;
    const winner =
      outcome === "a" ? team_a_es : outcome === "b" ? team_b_es : null;
    const loser =
      outcome === "a" ? team_b_es : outcome === "b" ? team_a_es : null;
    const gf = Math.max(actualA, actualB);
    const ga = Math.min(actualA, actualB);
    const total = actualA + actualB;
    const margin = Math.abs(actualA - actualB);

    const base = winner
      ? s.win(winner, loser!, gf, ga)
      : s.draw(team_a_es, team_b_es, actualA);
    const character =
      winner && margin >= 3
        ? s.blowout
        : winner && margin === 1
          ? s.narrow
          : total >= 4
            ? s.highScoring
            : "";
    const expectation = isUpset
      ? s.surprise(formatPct(actualOutcomeProb))
      : actualOutcomeProb >= 0.5
        ? s.expected
        : "";

    const first = character ? `${base} ${character}` : base;
    matchSummary = expectation ? `${first}. ${expectation}.` : `${first}.`;
  }

  // Crónica completa (ESPN + reglas) cuando hay datos del partido; si no, la síntesis
  // local de arriba; y si tampoco, la narrativa predictiva del backend.
  const activeReport = report && report.key === reportKey ? report.data : null;
  const reportText = activeReport
    ? buildMatchReport(locale, {
        ft: activeReport.ft,
        ht: activeReport.ht,
        goals: activeReport.goals,
        teamA: team_a_es,
        teamB: team_b_es,
        outcomeProb: actualOutcomeProb,
        isUpset,
      })
    : null;

  // El "resultado más probable" debe respetar el marcador más probable:
  // si el top scoreline es un empate (p. ej. 0–0), el titular es Empate,
  // aunque el agregado 1X2 favorezca a un equipo. Sin scoreline, caemos al 1X2.
  const drawMostLikely = topScore
    ? topScore.score_a === topScore.score_b
    : p_draw >= p_a && p_draw >= p_b;
  const favorsA = topScore ? topScore.score_a > topScore.score_b : p_a >= p_b;
  const winnerName = drawMostLikely
    ? t.result.draw
    : favorsA
      ? team_a_es
      : team_b_es;
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

  // Etiqueta de sede construida en el front (localizada), en vez del venue_label
  // que el backend manda ya formateado en español. neutral → "Cancha neutral";
  // con local → "Local: {equipo}" usando el nombre ya localizado. Si no se puede
  // determinar el local (home_team_id no matchea ninguno), se oculta.
  const isHome = !neutral && home_team_id != null;
  const homeName =
    home_team_id === team_a_id
      ? team_a_es
      : home_team_id === team_b_id
        ? team_b_es
        : null;
  const venueLabel = neutral
    ? t.result.venueNeutral
    : homeName != null
      ? t.result.venueHome(homeName)
      : null;

  return (
    <div className="space-y-6">
      {/* Resultado con estado/veredicto encima del bloque de banderas y marcador:
          el estado (Finalizado / En juego, con pulso en vivo) arriba a la derecha y,
          más cerca del marcador, "Resultado inesperado" centrado (desenlace improbable). */}
      <div className="space-y-2">
        {hasScore && (
          <div className="flex justify-end">
            <span
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isLive
                  ? "bg-danger-soft text-danger"
                  : "bg-canvas text-ink-muted"
              }`}
            >
              {isLive && (
                <span className="h-1.5 w-1.5 rounded-full bg-current motion-safe:animate-pulse" />
              )}
              {matchStatus ? t.fixture.status[matchStatus] : ""}
            </span>
          </div>
        )}
        {isUpset && (
          <div className="flex justify-center">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300/90">
              {t.result.compare.surprise}
            </span>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="flex flex-1 flex-col items-center gap-2">
            <FlagImage
              iso2={flag_a}
              name={team_a_es}
              size="lg"
              className="shadow-sm"
            />
            <span className="text-ink text-center text-lg font-semibold">
              {team_a_es}
            </span>
          </div>
          {hasScore ? (
            <span
              className="shrink-0 text-3xl font-bold tabular-nums"
              style={{ color: scoreWinnerColor(actualA, actualB) }}
            >
              {actualA} – {actualB}
            </span>
          ) : (
            <span className="text-ink-subtle text-xs font-semibold tracking-widest uppercase">
              {t.result.vs}
            </span>
          )}
          <div className="flex flex-1 flex-col items-center gap-2">
            <FlagImage
              iso2={flag_b}
              name={team_b_es}
              size="lg"
              className="shadow-sm"
            />
            <span className="text-ink text-center text-lg font-semibold">
              {team_b_es}
            </span>
          </div>
        </div>
      </div>

      {venueLabel && (
        <div className="flex justify-center">
          <span
            className={`rounded-full px-3.5 py-1 text-xs font-medium ${
              isHome ? "bg-brand-soft text-brand" : "bg-canvas text-ink-muted"
            }`}
          >
            {venueLabel}
          </span>
        </div>
      )}

      {/* Eliminatoria: el cruce se define por penales / quién avanza. Va primero,
          como titular de la llave: "quién avanza" es la pregunta central de una
          eliminatoria, y así los bloques de goles (1X2 → xG → marcadores) quedan juntos. */}
      {is_knockout && p_advance_a != null && p_advance_b != null && (
        <KnockoutOutlook
          teamA={team_a_es}
          teamB={team_b_es}
          flagA={flag_a}
          flagB={flag_b}
          pAdvanceA={p_advance_a}
          pAdvanceB={p_advance_b}
          pPenalties={p_penalties}
        />
      )}

      {/* Probabilidades 1X2. En finalizados se resalta el desenlace real (outline +
          "real") y se atenúan los otros; en el resto, las tres planas. */}
      <div>
        <p className="text-ink-subtle mb-4 text-xs font-semibold tracking-widest uppercase">
          {is_knockout
            ? t.result.probabilitiesKnockout
            : t.result.probabilitiesAt90}
        </p>
        <div className="space-y-4">
          {(
            [
              { key: "a", label: team_a_es, value: p_a, color: TEAM_A },
              { key: "draw", label: t.result.draw, value: p_draw, color: DRAW },
              { key: "b", label: team_b_es, value: p_b, color: TEAM_B },
            ] as const
          ).map(({ key, label, value, color }) => {
            const occurred = compare && key === outcome;
            return (
              <div
                key={key}
                className={compare && !occurred ? "opacity-60" : ""}
              >
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span
                    className="text-ink font-medium"
                    style={occurred ? { color } : undefined}
                  >
                    {label}
                  </span>
                  <span className="font-semibold" style={{ color }}>
                    {formatPct(value)}
                  </span>
                </div>
                <div
                  className="bg-line h-2.5 w-full overflow-hidden rounded-full"
                  style={
                    occurred ? { boxShadow: `0 0 0 1.5px ${color}` } : undefined
                  }
                >
                  <div
                    className="h-2.5 rounded-full"
                    style={{
                      width: `${Math.round(value * 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="bg-canvas flex items-center justify-between rounded-xl px-8 py-5">
          <div className="text-center">
            <p className="text-ink-subtle mb-1 text-xs tracking-widest uppercase">
              xG {team_a_es}
            </p>
            <p className="text-ink font-mono text-3xl font-bold">
              {xg_a.toFixed(1)}
            </p>
            {compare && (
              <p className="text-ink-muted mt-1 text-xs">
                {t.result.compare.goalsLabel}:{" "}
                <span className="text-ink font-semibold">{actualA}</span>
              </p>
            )}
          </div>
          <span className="text-line text-2xl font-light">—</span>
          <div className="text-center">
            <p className="text-ink-subtle mb-1 text-xs tracking-widest uppercase">
              xG {team_b_es}
            </p>
            <p className="text-ink font-mono text-3xl font-bold">
              {xg_b.toFixed(1)}
            </p>
            {compare && (
              <p className="text-ink-muted mt-1 text-xs">
                {t.result.compare.goalsLabel}:{" "}
                <span className="text-ink font-semibold">{actualB}</span>
              </p>
            )}
          </div>
        </div>
        {compare && (
          <p className="text-ink-muted mt-2 text-center text-xs">{goalNote}</p>
        )}
      </div>

      <Scorelines
        scorelines={top_scorelines}
        teamA={team_a_es}
        teamB={team_b_es}
        actualA={actualA}
        actualB={actualB}
        compare={compare}
      />

      <div className="bg-canvas rounded-xl px-5 py-4">
        <p className="text-ink-subtle mb-2 text-xs font-semibold tracking-widest uppercase">
          {t.result.analysis}
        </p>
        <p className="text-ink-muted text-sm leading-7">
          {reportText ?? matchSummary ?? narrativeDisplay}
        </p>
        {activeReport && activeReport.goals.length > 0 && (
          <MatchGoals
            goals={activeReport.goals}
            teamA={team_a_es}
            teamB={team_b_es}
            heading={t.result.goalsHeading}
            penaltyTag={t.result.penaltyTag}
            ownGoalTag={t.result.ownGoalTag}
          />
        )}
      </div>

      <div className="border-line rounded-xl border px-5 py-4">
        <p className="text-ink-subtle mb-3 text-xs font-semibold tracking-widest uppercase">
          {t.result.squadFormation}
        </p>
        <div className="space-y-4">
          {(() => {
            // Local designado por el sorteo (regla FIFA #1): del backend (home_team_id).
            // Sede neutral o local indeterminado → null (A como local nominal).
            const localSide: "a" | "b" | null = neutral
              ? null
              : home_team_id === team_a_id
                ? "a"
                : home_team_id === team_b_id
                  ? "b"
                  : null;
            // Override oficial por cruce si está cargado (PDF de FIFA); si no, la regla.
            // El color del arquero viene de la designación; sin dato → dorado (undefined).
            const designation = designationFor(flag_a, flag_b);
            const { kitA, kitB } = designation
              ? { kitA: designation.a.kit, kitB: designation.b.kit }
              : resolveKits(flag_a, flag_b, localSide);
            const gkA = designation?.a.gk;
            const gkB = designation?.b.gk;
            return (
              <>
                <TeamLineup
                  flag={flag_a}
                  name={team_a_es}
                  confirmed={lineup_confirmed_a}
                  players={lineup_a}
                  kit={kitA}
                  gkColor={gkA}
                  pendingNote={lineupPendingNote}
                  started={hasStarted}
                  formation={formation_a}
                  detail={lineup_detail_a}
                />
                <TeamLineup
                  flag={flag_b}
                  name={team_b_es}
                  confirmed={lineup_confirmed_b}
                  players={lineup_b}
                  kit={kitB}
                  gkColor={gkB}
                  pendingNote={lineupPendingNote}
                  started={hasStarted}
                  formation={formation_b}
                  detail={lineup_detail_b}
                />
              </>
            );
          })()}
        </div>
      </div>

      {/* Tarjeta "Resultado más probable": el cierre de la predicción. Se quita en
          finalizados (el resultado real manda); se mantiene en vivo y en el predictor. */}
      {!isFinished && (
        <div className="bg-gold-soft rounded-xl px-6 py-5">
          <p className="text-gold text-xs font-semibold tracking-widest uppercase">
            {t.result.mostLikelyResult}
          </p>
          <div className="mt-2 flex items-center gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {winnerFlag && (
                <FlagImage
                  iso2={winnerFlag}
                  name={winnerName}
                  size="md"
                  className="shadow-sm"
                />
              )}
              <div className="min-w-0">
                <p className="text-gold truncate text-2xl font-bold">
                  {winnerHeadline}
                </p>
                <p className="text-ink-muted mt-0.5 text-sm">
                  {formatPct(winnerProb)} ·{" "}
                  {t.result.confidencePhrase(confidence)}
                </p>
              </div>
            </div>

            {topScore && (
              <div className="ml-auto shrink-0 text-right">
                <p className="text-gold text-xs tracking-widest uppercase">
                  {t.result.score}
                </p>
                <p className="text-ink text-xl font-bold">
                  {topScore.score_a}–{topScore.score_b}
                </p>
                <p className="text-ink-muted text-xs">
                  {formatPct(topScore.probability)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
