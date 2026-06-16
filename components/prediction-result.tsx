"use client";

import { useState, useEffect } from "react";
import type { MatchStatus, PlayerSlot, PredictResponse, ScoreProbability } from "@/types";
import FlagImage from "./flag-image";
import { useLanguage, teamName } from "@/lib/i18n";

interface Props {
  result: PredictResponse;
  // Estado del partido (cuando viene del fixture). Define el mensaje al no haber
  // formación: pre-partido vs en vivo vs finalizado.
  matchStatus?: MatchStatus;
  // Marcador real (cuando viene del fixture). Habilita la comparación
  // predicción vs. resultado en partidos en vivo / finalizados.
  scoreA?: string;
  scoreB?: string;
}

const TEAM_A = "var(--result-a)";
const TEAM_B = "var(--result-b)";
const DRAW   = "var(--result-draw)";

// Equipaciones por ISO2 (flagcdn). home = camiseta titular, away = alternativa.
// Cuando dos equipos tienen colores similares, team B cambia a away automáticamente.
const KITS: Record<string, { home: string; away: string }> = {
  // CONMEBOL
  ar: { home: "#74ACDF", away: "#FFFFFF" }, // Argentina – celeste / blanca
  br: { home: "#FABE18", away: "#003082" }, // Brasil – amarilla / azul
  co: { home: "#FCD116", away: "#003087" }, // Colombia – amarilla / azul
  ec: { home: "#FFD100", away: "#003087" }, // Ecuador – amarilla / azul
  uy: { home: "#5EB6E4", away: "#000000" }, // Uruguay – celeste / negra
  ve: { home: "#CF142B", away: "#FFFFFF" }, // Venezuela – roja / blanca
  py: { home: "#D52B1E", away: "#FFFFFF" }, // Paraguay – roja / blanca
  cl: { home: "#D52B1E", away: "#FFFFFF" }, // Chile – roja / blanca
  pe: { home: "#D52B1E", away: "#FFFFFF" }, // Perú – roja / blanca
  bo: { home: "#007940", away: "#FFFFFF" }, // Bolivia – verde / blanca
  // CONCACAF
  us: { home: "#FFFFFF", away: "#041E42" }, // USA – blanca / azul marino
  mx: { home: "#006847", away: "#000000" }, // México – verde / negra
  ca: { home: "#CC0000", away: "#000000" }, // Canadá – roja / negra
  pa: { home: "#CF142B", away: "#FFFFFF" }, // Panamá – roja / blanca
  hn: { home: "#0073CF", away: "#FFFFFF" }, // Honduras – azul / blanca
  cr: { home: "#002B7F", away: "#FFFFFF" }, // Costa Rica – azul / blanca
  jm: { home: "#FFCD00", away: "#000000" }, // Jamaica – amarilla / negra
  ht: { home: "#16438F", away: "#FFFFFF" }, // Haití – azul / blanca
  cw: { home: "#003DA5", away: "#FFFFFF" }, // Curazao – azul / blanca
  tt: { home: "#DA1A35", away: "#FFFFFF" }, // Trinidad y Tobago – roja / blanca
  gt: { home: "#4997D0", away: "#FFFFFF" }, // Guatemala – celeste / blanca
  sv: { home: "#1B3D8F", away: "#FFFFFF" }, // El Salvador – azul / blanca
  sr: { home: "#007749", away: "#FFFFFF" }, // Surinam – verde / blanca
  // UEFA
  de: { home: "#FFFFFF", away: "#000000" }, // Alemania – blanca / negra
  fr: { home: "#002395", away: "#FFFFFF" }, // Francia – azul / blanca
  es: { home: "#AA151B", away: "#FFFFFF" }, // España – roja / blanca
  pt: { home: "#006600", away: "#AA151B" }, // Portugal – verde / roja
  "gb-eng": { home: "#FFFFFF", away: "#CC0000" }, // Inglaterra – blanca / roja
  gb: { home: "#FFFFFF", away: "#CC0000" },        // fallback gb
  nl: { home: "#FF6600", away: "#000000" }, // Países Bajos – naranja / negra
  it: { home: "#003399", away: "#FFFFFF" }, // Italia – azul / blanca
  be: { home: "#CC0000", away: "#000000" }, // Bélgica – roja / negra
  hr: { home: "#CC0000", away: "#003399" }, // Croacia – roja / azul
  tr: { home: "#CC0000", away: "#FFFFFF" }, // Turquía – roja / blanca
  ch: { home: "#FF0000", away: "#000000" }, // Suiza – roja / negra
  at: { home: "#CC0000", away: "#FFFFFF" }, // Austria – roja / blanca
  rs: { home: "#C6363C", away: "#FFFFFF" }, // Serbia – roja / blanca
  ua: { home: "#FFD700", away: "#003087" }, // Ucrania – amarilla / azul
  "gb-sct": { home: "#003399", away: "#CC0000" }, // Escocia – azul / roja
  pl: { home: "#FFFFFF", away: "#CC0000" }, // Polonia – blanca / roja
  ro: { home: "#FFD700", away: "#003087" }, // Rumania – amarilla / azul
  hu: { home: "#CC0000", away: "#FFFFFF" }, // Hungría – roja / blanca
  cz: { home: "#D7141A", away: "#FFFFFF" }, // Rep. Checa – roja / blanca
  si: { home: "#003DA5", away: "#FFFFFF" }, // Eslovenia – azul / blanca
  sk: { home: "#003DA5", away: "#CC0000" }, // Eslovaquia – azul / roja
  no: { home: "#BA0C2F", away: "#FFFFFF" }, // Noruega – roja / blanca
  dk: { home: "#C8102E", away: "#FFFFFF" }, // Dinamarca – roja / blanca
  se: { home: "#FECC00", away: "#005CBF" }, // Suecia – amarilla / azul
  gr: { home: "#004C98", away: "#FFFFFF" }, // Grecia – azul / blanca
  "gb-wls": { home: "#C8102E", away: "#00B5A0" }, // Gales – roja / verde
  ie: { home: "#009A44", away: "#FFFFFF" }, // Irlanda – verde / blanca
  ba: { home: "#002F6C", away: "#FFFFFF" }, // Bosnia y Herzegovina – azul / blanca
  is: { home: "#003897", away: "#FFFFFF" }, // Islandia – azul / blanca
  al: { home: "#E41B17", away: "#000000" }, // Albania – roja / negra
  // AFC
  jp: { home: "#003087", away: "#FFFFFF" }, // Japón – azul / blanca
  kr: { home: "#C00000", away: "#FFFFFF" }, // Corea del Sur – roja / blanca
  au: { home: "#FFB81C", away: "#00843D" }, // Australia – dorada / verde
  sa: { home: "#006C35", away: "#FFFFFF" }, // Arabia Saudita – verde / blanca
  ir: { home: "#FFFFFF", away: "#239F40" }, // Irán – blanca / verde
  qa: { home: "#8D153A", away: "#FFFFFF" }, // Qatar – granate / blanca
  jo: { home: "#007A3D", away: "#FFFFFF" }, // Jordania – verde / blanca
  uz: { home: "#1EB53A", away: "#003087" }, // Uzbekistán – verde / azul
  iq: { home: "#CC0000", away: "#FFFFFF" }, // Irak – roja / blanca
  bh: { home: "#CC0000", away: "#FFFFFF" }, // Bahréin – roja / blanca
  om: { home: "#DB161B", away: "#FFFFFF" }, // Omán – roja / blanca
  id: { home: "#CC0000", away: "#FFFFFF" }, // Indonesia – roja / blanca
  cn: { home: "#CC0000", away: "#FFFFFF" }, // China – roja / blanca
  // CAF
  cv: { home: "#003082", away: "#FFFFFF" }, // Cabo Verde – azul / blanca
  ma: { home: "#C1272D", away: "#FFFFFF" }, // Marruecos – roja / blanca
  sn: { home: "#00853F", away: "#FFFFFF" }, // Senegal – verde / blanca
  ng: { home: "#008751", away: "#FFFFFF" }, // Nigeria – verde / blanca
  eg: { home: "#CC0000", away: "#FFFFFF" }, // Egipto – roja / blanca
  cm: { home: "#007A5E", away: "#FFFFFF" }, // Camerún – verde / blanca
  ci: { home: "#FF6600", away: "#003087" }, // Costa de Marfil – naranja / azul
  za: { home: "#007A5E", away: "#FFD700" }, // Sudáfrica – verde / amarilla
  dz: { home: "#FFFFFF", away: "#006233" }, // Argelia – blanca / verde
  gh: { home: "#006B3F", away: "#FFFFFF" }, // Ghana – verde / blanca
  ml: { home: "#009A44", away: "#FFFFFF" }, // Mali – verde / blanca
  cd: { home: "#007FFF", away: "#FFFFFF" }, // Congo RD – azul / blanca
  tz: { home: "#1EB53A", away: "#003087" }, // Tanzania – verde / azul
  ke: { home: "#CC0000", away: "#FFFFFF" }, // Kenia – roja / blanca
  tn: { home: "#E70013", away: "#FFFFFF" }, // Túnez – roja / blanca
  ao: { home: "#CE1126", away: "#000000" }, // Angola – roja / negra
  gn: { home: "#CE1126", away: "#FFFFFF" }, // Guinea – roja / blanca
  // OFC
  nz: { home: "#FFFFFF", away: "#2B3A8C" }, // Nueva Zelanda – blanca / azul
};

// ─── Kit color helpers ────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Luminancia perceptual (0–255). > 140 = color claro.
function isLightColor(hex: string): boolean {
  if (!hex.startsWith("#")) return false;
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140;
}

// Familia de color general (rojo, azul, blanca, etc.) a partir del hex. La idea
// es agrupar por percepción, no por hex exacto: #AA151B y #C1272D son ambos "red".
// Se usa para detectar choque de camisetas sin importar el tono preciso.
function colorFamily(hex: string): string {
  if (!hex.startsWith("#")) return "other";
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  // Acromáticos: muy claro → blanca, muy oscuro → negra, gris medio → al más cercano.
  if (l > 0.82) return "white";
  if (l < 0.12) return "black";
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (s < 0.15) return l > 0.5 ? "white" : "black";
  // Cromáticos: bucketizar por matiz (HSL hue).
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  if (h < 20 || h >= 345) return "red";
  if (h < 45) return "orange";
  if (h < 70) return "yellow";
  if (h < 170) return "green";
  if (h < 255) return "blue";
  if (h < 290) return "purple";
  return "red"; // magenta/rosa → familia roja
}

// Camiseta por defecto para países sin kit definido: blanca.
const DEFAULT_KIT = "#FFFFFF";

// Resuelve qué color usa cada equipo. Regla: team A siempre usa su titular; el
// "obligado" a la suplente es SIEMPRE team B, y solo si comparte familia de color
// general con A (ambos rojos, ambos azules, ambos blancos…), sin importar el hex.
// Si un país no está en KITS, se usa la camiseta blanca por defecto.
function resolveKitColors(
  isoA: string,
  isoB: string,
): { colorA: string; colorB: string } {
  const homeA = KITS[isoA]?.home ?? DEFAULT_KIT;
  const homeB = KITS[isoB]?.home ?? DEFAULT_KIT;
  const awayB = KITS[isoB]?.away ?? DEFAULT_KIT;
  const colorB = colorFamily(homeA) === colorFamily(homeB) ? awayB : homeB;
  return { colorA: homeA, colorB };
}

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
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
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
              className={`relative flex flex-col items-center rounded-lg border border-line ${
                dense ? "px-1 py-2" : "px-2 py-3"
              } ${isActual ? "opacity-100" : compare ? "opacity-60" : ""}`}
              style={{
                borderBottom: `2px solid ${color}`,
                ...(isActual ? { boxShadow: `0 0 0 1.5px ${color}` } : {}),
              }}
            >
              {isActual && (
                <span
                  className="absolute -top-2 rounded-full px-1.5 py-0.5 text-[0.5625rem] font-semibold leading-none"
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
              <span className="mt-0.5 text-xs text-ink-subtle">
                {formatPct(s.probability)}
              </span>
            </div>
          );
        })}
      </div>
      {precisionNote && (
        <p className="mt-3 text-center text-xs text-ink-muted">{precisionNote}</p>
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

// ─── JerseyIcon ───────────────────────────────────────────────────────────────
// Silueta SVG de camiseta de fútbol. Tamaño controlado por className.
// Incluye un reflejo sutil en la manga izquierda para dar sensación de tela.
function JerseyIcon({
  color,
  number,
  className = "w-7 h-8",
  isGk = false,
}: {
  color: string;
  number?: number | null;
  className?: string;
  isGk?: boolean;
}) {
  // Cuerpo = color REAL del kit (España rojo, Cabo Verde azul, etc.). El contraste
  // contra el césped lo dan el contorno (halo) + el tag blanco del nombre, no el
  // cuerpo. Ribete/puños y dorsal se calculan para contrastar con el cuerpo.
  const lightBody = isGk || isLightColor(color);
  const bodyColor = isGk ? "var(--gold)" : color;
  // Ribete del cuello y puños: oscuro sobre cuerpo claro, blanco sobre cuerpo oscuro.
  const trimColor = lightBody ? "#1f2937" : "#ffffff";
  // Banda tonal sutil para dar textura de tela sin falsear el color del kit.
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
      {/* Cuerpo: cuello en V, hombros y mangas cortas */}
      <path
        d="M8,3 Q12,7 16,3 L23,7 L22,13 L18,12 L18,25 L6,25 L6,12 L2,13 L1,7 Z"
        fill={bodyColor}
        stroke={outline}
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      {/* Banda diagonal tonal (no altera el color base del kit) */}
      <path d="M6,8 L9.5,8 L18,25 L14.5,25 Z" fill={sashColor} />
      {/* Ribete del cuello en V */}
      <path d="M8,3 Q12,7 16,3 L15,4.4 Q12,7.7 9,4.4 Z" fill={trimColor} />
      {/* Puños de las mangas */}
      <path d="M1,7 L2,13 L3.5,12.7 L2.6,7.55 Z" fill={trimColor} />
      <path d="M23,7 L22,13 L20.5,12.7 L21.4,7.55 Z" fill={trimColor} />
      {/* Dorsal */}
      {number != null && (
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
      )}
    </svg>
  );
}

// ─── PlayerNode ───────────────────────────────────────────────────────────────
// Camiseta + apellido con la fuente display del sitio (Archivo).
// Convención Sofascore / FotMob: apellido solo, tooltip con nombre completo.
function PlayerNode({
  name,
  color,
  jersey,
  position,
  isGk = false,
}: {
  name: string;
  color: string;
  jersey?: number | null;
  position?: string | null;
  isGk?: boolean;
}) {
  const parts = name.trim().split(" ");
  const surname = parts.length > 1 ? parts[parts.length - 1] : name;

  return (
    <div
      className="flex w-12 flex-col items-center gap-0.5"
      title={position ? `${name} · ${position}` : name}
    >
      <JerseyIcon
        color={color}
        number={jersey}
        className="h-8 w-7 drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)] sm:h-9 sm:w-8"
        isGk={isGk}
      />
      <span className="font-display whitespace-nowrap rounded-[3px] bg-white/90 px-1 py-px text-center text-[0.6rem] font-bold leading-tight tracking-tight text-slate-900 shadow-sm sm:text-[0.68rem]">
        {surname}
      </span>
    </div>
  );
}

// ─── computeFormationLines ────────────────────────────────────────────────────
// Convierte plantel + datos de formación en líneas de renderizado.
// Retorna [FWD, ..., GK] (de adelante hacia atrás).
// Para Team A (mitad inferior): usar tal cual (FWD cerca del centro).
// Para Team B (mitad superior): invertir antes de renderizar (GK arriba).
function computeFormationLines(
  players: string[],
  formation: string | null | undefined,
  detail: PlayerSlot[] | null | undefined,
): RenderLine[] {
  if (formation && detail && detail.length === 11) {
    const nums = formation.split("-").map(Number);
    if (
      nums.length >= 2 &&
      !nums.some((n) => !Number.isInteger(n) || n < 1) &&
      nums.reduce((a, b) => a + b, 0) === 10
    ) {
      const lineSizes = [1, ...nums];
      const sorted = [...detail].sort(
        (a, b) => (a.formation_place ?? 99) - (b.formation_place ?? 99),
      );
      let cursor = 0;
      const lines: RenderLine[] = lineSizes.map((size) => {
        const slots = sorted.slice(cursor, cursor + size);
        cursor += size;
        return {
          names: slots.map((s) => s.name),
          jerseys: slots.map((s) => s.jersey),
          positions: slots.map((s) => s.position),
        };
      });
      return [...lines].reverse(); // [FWD, ..., GK]
    }
  }

  if (players.length === 11) {
    return [
      { names: players.slice(8, 11), jerseys: [null, null, null], positions: [null, null, null] },
      { names: players.slice(5, 8), jerseys: [null, null, null], positions: [null, null, null] },
      { names: players.slice(1, 5), jerseys: [null, null, null, null], positions: [null, null, null, null] },
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
  color,
  formation,
  detail,
}: {
  players: string[];
  color: string;
  formation?: string | null;
  detail?: PlayerSlot[] | null;
}) {
  const { t } = useLanguage();

  const lines = computeFormationLines(players, formation, detail);

  if (lines.length === 0) {
    return (
      <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl bg-canvas px-4 py-3 text-sm text-ink-muted">
        {players.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ol>
    );
  }

  return (
    <div className="mt-3">
      <div
        className="overflow-hidden rounded-xl border border-line shadow-md"
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
            <rect x="3" y="2" width="94" height="96" stroke="white" strokeOpacity="0.55" strokeWidth="0.8" />
            {/*
              Semicírculo del círculo central: centro en la línea de mediocampo (y=2),
              r=13. sweep=0 comba HACIA ADENTRO de la cancha (zona visible y>2),
              de (37,2) pasando por (50,15) hasta (63,2). Con sweep=1 se dibujaba
              hacia arriba, fuera del campo (por eso no se veía).
              Stroke grueso porque la perspectiva comprime esta zona visualmente.
            */}
            <path d="M 37,2 A 13,13 0 0 0 63,2" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" />
            {/* Área grande (portería propia, abajo) */}
            <rect x="22" y="67" width="56" height="31" stroke="white" strokeOpacity="0.5" strokeWidth="0.7" fill="none" />
            {/* Área chica */}
            <rect x="35" y="87" width="30" height="11" stroke="white" strokeOpacity="0.4" strokeWidth="0.6" fill="none" />
            {/* Punto de penal */}
            <circle cx="50" cy="76" r="1.1" fill="var(--gold)" fillOpacity="0.95" />
            {/*
              Arco D: semicírculo centrado en el punto de penal (50,76), r=16.
              Intersecta el borde del área en x≈37 y x≈63 (y=67).
              sweep=1 (horario) dibuja el arco hacia el mediocampo — "hacia afuera"
              del área, pasando por (50,60). Correcto según reglamento FIFA.
            */}
            <path d="M 37,67 A 16,16 0 0 1 63,67" stroke="white" strokeOpacity="0.35" strokeWidth="0.6" />
            {/*
              Córners en línea de gol (abajo): arco de cuarto de círculo r=4.
              Arrancan desde la línea de banda/gol y curvan HACIA adentro del campo.
              La línea de mediocampo (y=2) NO lleva córners.
            */}
            {/* Inferior izquierdo: desde (3,94) en la banda, horario hasta (7,98) en la línea de gol */}
            <path d="M 3,94 A 4,4 0 0 1 7,98" stroke="white" strokeOpacity="0.45" strokeWidth="0.6" />
            {/* Inferior derecho: desde (93,98) en la línea de gol, antihorario hasta (97,94) en la banda */}
            <path d="M 93,98 A 4,4 0 0 1 97,94" stroke="white" strokeOpacity="0.45" strokeWidth="0.6" />
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
                      color={color}
                      jersey={line.jerseys[j]}
                      position={line.positions[j]}
                      isGk={isGkLine}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="mt-2 text-center text-[0.6875rem] text-ink-subtle">
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
  color,
  pendingNote,
  started,
  formation,
  detail,
}: {
  flag: string;
  name: string;
  confirmed: boolean;
  players: string[] | null;
  color: string;
  pendingNote: string;
  started: boolean;
  formation?: string | null;
  detail?: PlayerSlot[] | null;
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
            {!(confirmed && started) && (
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
            )}
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
        <SinglePitch
          players={players}
          color={color}
          formation={formation}
          detail={detail}
        />
      )}
    </div>
  );
}

export default function PredictionResult({ result, matchStatus, scoreA, scoreB }: Props) {
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
          setNarrativeTranslation({ source: narrative, result: data.translated });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [narrative, locale, teamAEs, teamBEs, team_a, team_b]);

  // Nombre a mostrar según idioma. Se nombran igual que los campos del response
  // para no tocar cada uso; el valor ya respeta el locale (en = canónico, es = _es).
  const team_a_es = teamName(team_a, teamAEs, locale);
  const team_b_es = teamName(team_b, teamBEs, locale);

  // Mensaje cuando un equipo no tiene XI: pre-partido informa el horario de
  // publicación; en vivo o finalizado, "no disponible" (no el de pre-partido).
  const lineupPendingNote =
    matchStatus && LIVE_STATUSES.has(matchStatus)
      ? t.result.lineupUnavailableLive
      : matchStatus && FINISHED_STATUSES.has(matchStatus)
      ? t.result.lineupUnavailableFinished
      : t.result.lineupPendingNote;

  const topScore = top_scorelines[0];

  // Estado del partido + resultado real (gateado por estado, no por "hay marcador":
  // los programados vienen 0–0). El marcador en el hero se muestra en vivo o
  // finalizado; los enriquecimientos de comparación, SOLO finalizados ("lo
  // definido es lo que ya se jugó"): en vivo nada está decidido todavía.
  const isLive = matchStatus != null && LIVE_STATUSES.has(matchStatus);
  const isFinished = matchStatus != null && FINISHED_STATUSES.has(matchStatus);
  const hasStarted = isLive || isFinished;
  const actualA = Number.parseInt(scoreA ?? "", 10);
  const actualB = Number.parseInt(scoreB ?? "", 10);
  const hasIntScore = Number.isInteger(actualA) && Number.isInteger(actualB);
  const hasScore = (isLive || isFinished) && hasIntScore; // marcador en el hero
  const compare = isFinished && hasIntScore; // comparación enriquecida

  // Desenlace real (1X2) y su probabilidad según el modelo.
  const outcome: "a" | "b" | "draw" =
    actualA > actualB ? "a" : actualA < actualB ? "b" : "draw";
  const actualOutcomeProb = outcome === "a" ? p_a : outcome === "b" ? p_b : p_draw;
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
                isLive ? "bg-danger-soft text-danger" : "bg-canvas text-ink-muted"
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
            <FlagImage iso2={flag_a} name={team_a_es} size="lg" className="shadow-sm" />
            <span className="text-center text-lg font-semibold text-ink">{team_a_es}</span>
          </div>
          {hasScore ? (
            <span
              className="shrink-0 text-3xl font-bold tabular-nums"
              style={{ color: scoreWinnerColor(actualA, actualB) }}
            >
              {actualA} – {actualB}
            </span>
          ) : (
            <span className="text-xs font-semibold uppercase tracking-widest text-ink-subtle">
              {t.result.vs}
            </span>
          )}
          <div className="flex flex-1 flex-col items-center gap-2">
            <FlagImage iso2={flag_b} name={team_b_es} size="lg" className="shadow-sm" />
            <span className="text-center text-lg font-semibold text-ink">{team_b_es}</span>
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

      {/* Probabilidades 1X2. En finalizados se resalta el desenlace real (outline +
          "real") y se atenúan los otros; en el resto, las tres planas. */}
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink-subtle">
          {t.result.probabilitiesAt90}
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
              <div key={key} className={compare && !occurred ? "opacity-60" : ""}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span
                    className="font-medium text-ink"
                    style={occurred ? { color } : undefined}
                  >
                    {label}
                  </span>
                  <span className="font-semibold" style={{ color }}>
                    {formatPct(value)}
                  </span>
                </div>
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full bg-line"
                  style={occurred ? { boxShadow: `0 0 0 1.5px ${color}` } : undefined}
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
        <div className="flex items-center justify-between rounded-xl bg-canvas px-8 py-5">
          <div className="text-center">
            <p className="mb-1 text-xs uppercase tracking-widest text-ink-subtle">
              xG {team_a_es}
            </p>
            <p className="font-mono text-3xl font-bold text-ink">{xg_a.toFixed(1)}</p>
            {compare && (
              <p className="mt-1 text-xs text-ink-muted">
                {t.result.compare.goalsLabel}:{" "}
                <span className="font-semibold text-ink">{actualA}</span>
              </p>
            )}
          </div>
          <span className="text-2xl font-light text-line">—</span>
          <div className="text-center">
            <p className="mb-1 text-xs uppercase tracking-widest text-ink-subtle">
              xG {team_b_es}
            </p>
            <p className="font-mono text-3xl font-bold text-ink">{xg_b.toFixed(1)}</p>
            {compare && (
              <p className="mt-1 text-xs text-ink-muted">
                {t.result.compare.goalsLabel}:{" "}
                <span className="font-semibold text-ink">{actualB}</span>
              </p>
            )}
          </div>
        </div>
        {compare && (
          <p className="mt-2 text-center text-xs text-ink-muted">{goalNote}</p>
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
        <p className="text-sm leading-7 text-ink-muted">{narrativeDisplay}</p>
      </div>

      <div className="rounded-xl border border-line px-5 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-subtle">
          {t.result.squadFormation}
        </p>
        <div className="space-y-4">
          {(() => {
            const { colorA, colorB } = resolveKitColors(flag_a, flag_b);
            return (
              <>
                <TeamLineup
                  flag={flag_a}
                  name={team_a_es}
                  confirmed={lineup_confirmed_a}
                  players={lineup_a}
                  color={colorA}
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
                  color={colorB}
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
      )}
    </div>
  );
}
