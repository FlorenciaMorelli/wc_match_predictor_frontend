// Equipaciones WC2026 por ISO2 (flagcdn). Dataset curado estático (mismo patrón que
// lib/key-players.ts): footballkitarchive / goal.com / fwclive 2026 como referencia de
// autoría, una sola vez. NO se consume ninguna API de kits en runtime (las disponibles
// son club-only, con imágenes con copyright y rate limit) — ver docs/backlog.md (ítem 10).
//
// Cada selección tiene 3 kits: `home` (titular), `away` (alternativa) y `third` (tercera),
// como en la designación oficial de FIFA. Cada kit es `{ primary, secondary, pattern }`:
// el cuerpo se dibuja con `primary` y el patrón (rayas, damero, banda…) se pinta con
// `secondary` recortado a la silueta. La mayoría viste liso (`solid`) — es el diseño real,
// no un atajo; las patronadas notorias llevan su patrón (AR rayas, HR damero, PE banda).
//
// La asignación por partido sigue las reglas de FIFA (ver resolveKits): el LOCAL designado
// usa su titular; el VISITANTE solo cambia a alternativa/tercera si choca con el local.

export type KitPattern =
  | "solid" // liso (primary)
  | "stripes" // rayas verticales (AR)
  | "hoops" // franjas horizontales
  | "halves" // mitades vertical
  | "sash" // banda diagonal (PE)
  | "checkers"; // damero (HR)

export type KitSlot = "home" | "away" | "third";

export interface Kit {
  primary: string; // color base del cuerpo (hex)
  secondary: string; // color del patrón / acento (hex)
  pattern: KitPattern;
}

export interface TeamKits {
  home: Kit;
  away: Kit;
  third: Kit;
}

function kit(primary: string, secondary: string, pattern: KitPattern = "solid"): Kit {
  return { primary, secondary, pattern };
}

function team(home: Kit, away: Kit, third: Kit): TeamKits {
  return { home, away, third };
}

// 48 selecciones + extras (gb, gb-sct, gb-wls). En kits lisos `secondary` guarda un acento
// (no se dibuja). Patronadas reales: AR (rayas), HR (damero), PE (banda). Las terceras son
// curadas para contrastar con titular y alternativa (se refinarán con el PDF de FIFA).
export const KITS: Record<string, TeamKits> = {
  // CONMEBOL
  ar: team(kit("#75AADB", "#FFFFFF", "stripes"), kit("#1A1A2E", "#75AADB"), kit("#2E1A47", "#FFFFFF")),
  br: team(kit("#FABE18", "#003082"), kit("#003082", "#FABE18"), kit("#FFFFFF", "#003082")),
  co: team(kit("#FCD116", "#003087"), kit("#003087", "#FCD116"), kit("#FFFFFF", "#FCD116")),
  ec: team(kit("#FFD100", "#003087"), kit("#003087", "#FFD100"), kit("#101418", "#FFD100")),
  uy: team(kit("#5EB6E4", "#000000"), kit("#000000", "#5EB6E4"), kit("#FFFFFF", "#5EB6E4")),
  ve: team(kit("#8E1F2B", "#FFFFFF"), kit("#FFFFFF", "#8E1F2B"), kit("#101418", "#FFFFFF")),
  py: team(kit("#D52B1E", "#FFFFFF"), kit("#FFFFFF", "#D52B1E"), kit("#003087", "#FFFFFF")),
  cl: team(kit("#D52B1E", "#FFFFFF"), kit("#FFFFFF", "#D52B1E"), kit("#1A3A8F", "#FFFFFF")),
  pe: team(kit("#FFFFFF", "#D52B1E", "sash"), kit("#D52B1E", "#FFFFFF"), kit("#101A3A", "#FFFFFF")),
  bo: team(kit("#007940", "#FFFFFF"), kit("#FFFFFF", "#007940"), kit("#101418", "#FFFFFF")),
  // CONCACAF
  us: team(kit("#FFFFFF", "#041E42"), kit("#041E42", "#FFFFFF"), kit("#B31942", "#FFFFFF")),
  mx: team(kit("#006847", "#000000"), kit("#000000", "#006847"), kit("#FFFFFF", "#006847")),
  ca: team(kit("#CC0000", "#000000"), kit("#000000", "#CC0000"), kit("#FFFFFF", "#CC0000")),
  pa: team(kit("#CF142B", "#FFFFFF"), kit("#FFFFFF", "#CF142B"), kit("#102A52", "#FFFFFF")),
  hn: team(kit("#0073CF", "#FFFFFF"), kit("#FFFFFF", "#0073CF"), kit("#101418", "#FFFFFF")),
  cr: team(kit("#002B7F", "#FFFFFF"), kit("#FFFFFF", "#002B7F"), kit("#CC0000", "#FFFFFF")),
  jm: team(kit("#FFCD00", "#000000"), kit("#000000", "#FFCD00"), kit("#009A44", "#FFCD00")),
  ht: team(kit("#16438F", "#FFFFFF"), kit("#FFFFFF", "#16438F"), kit("#CC0000", "#FFFFFF")),
  cw: team(kit("#003DA5", "#FFFFFF"), kit("#FFFFFF", "#003DA5"), kit("#101418", "#FFFFFF")),
  tt: team(kit("#DA1A35", "#FFFFFF"), kit("#FFFFFF", "#DA1A35"), kit("#101418", "#FFFFFF")),
  gt: team(kit("#4997D0", "#FFFFFF"), kit("#FFFFFF", "#4997D0"), kit("#102A52", "#FFFFFF")),
  sv: team(kit("#1B3D8F", "#FFFFFF"), kit("#FFFFFF", "#1B3D8F"), kit("#101418", "#FFFFFF")),
  sr: team(kit("#007749", "#FFFFFF"), kit("#FFFFFF", "#007749"), kit("#101418", "#FFFFFF")),
  // UEFA
  de: team(kit("#FFFFFF", "#000000"), kit("#000000", "#FFFFFF"), kit("#C8102E", "#FFFFFF")),
  fr: team(kit("#002395", "#FFFFFF"), kit("#FFFFFF", "#002395"), kit("#1A1F2E", "#FFFFFF")),
  es: team(kit("#AA151B", "#FFFFFF"), kit("#1A2B6B", "#FFFFFF"), kit("#FFFFFF", "#AA151B")),
  pt: team(kit("#006600", "#AA151B"), kit("#AA151B", "#006600"), kit("#101418", "#006600")),
  "gb-eng": team(kit("#FFFFFF", "#CC0000"), kit("#CC0000", "#FFFFFF"), kit("#1A3A8F", "#FFFFFF")),
  gb: team(kit("#FFFFFF", "#CC0000"), kit("#CC0000", "#FFFFFF"), kit("#1A3A8F", "#FFFFFF")),
  nl: team(kit("#FF6600", "#000000"), kit("#000000", "#FF6600"), kit("#FFFFFF", "#FF6600")),
  it: team(kit("#003399", "#FFFFFF"), kit("#FFFFFF", "#003399"), kit("#0E5C2E", "#FFFFFF")),
  be: team(kit("#CC0000", "#000000"), kit("#000000", "#CC0000"), kit("#FFFFFF", "#CC0000")),
  hr: team(kit("#E21B1B", "#FFFFFF", "checkers"), kit("#003399", "#FFFFFF"), kit("#101418", "#FFFFFF")),
  tr: team(kit("#CC0000", "#FFFFFF"), kit("#FFFFFF", "#CC0000"), kit("#101418", "#FFFFFF")),
  ch: team(kit("#FF0000", "#FFFFFF"), kit("#FFFFFF", "#FF0000"), kit("#101418", "#FFFFFF")),
  at: team(kit("#CC0000", "#FFFFFF"), kit("#FFFFFF", "#CC0000"), kit("#101418", "#FFFFFF")),
  rs: team(kit("#C6363C", "#FFFFFF"), kit("#FFFFFF", "#C6363C"), kit("#1A2456", "#FFFFFF")),
  ua: team(kit("#FFD700", "#003087"), kit("#003087", "#FFD700"), kit("#FFFFFF", "#FFD700")),
  "gb-sct": team(kit("#003399", "#CC0000"), kit("#CC0000", "#003399"), kit("#FFFFFF", "#003399")),
  pl: team(kit("#FFFFFF", "#CC0000"), kit("#CC0000", "#FFFFFF"), kit("#102A52", "#FFFFFF")),
  ro: team(kit("#FFD700", "#003087"), kit("#003087", "#FFD700"), kit("#CC0000", "#FFD700")),
  hu: team(kit("#CC0000", "#FFFFFF"), kit("#FFFFFF", "#CC0000"), kit("#0E7C3A", "#FFFFFF")),
  cz: team(kit("#D7141A", "#FFFFFF"), kit("#FFFFFF", "#D7141A"), kit("#1A3A8F", "#FFFFFF")),
  si: team(kit("#003DA5", "#FFFFFF"), kit("#FFFFFF", "#003DA5"), kit("#0E7C3A", "#FFFFFF")),
  sk: team(kit("#003DA5", "#CC0000"), kit("#CC0000", "#003DA5"), kit("#FFFFFF", "#003DA5")),
  no: team(kit("#BA0C2F", "#FFFFFF"), kit("#FFFFFF", "#BA0C2F"), kit("#102A52", "#FFFFFF")),
  dk: team(kit("#C8102E", "#FFFFFF"), kit("#FFFFFF", "#C8102E"), kit("#102A52", "#FFFFFF")),
  se: team(kit("#FECC00", "#005CBF"), kit("#005CBF", "#FECC00"), kit("#FFFFFF", "#FECC00")),
  gr: team(kit("#004C98", "#FFFFFF"), kit("#FFFFFF", "#004C98"), kit("#101418", "#FFFFFF")),
  "gb-wls": team(kit("#C8102E", "#00B5A0"), kit("#00B5A0", "#C8102E"), kit("#101418", "#C8102E")),
  ie: team(kit("#009A44", "#FFFFFF"), kit("#FFFFFF", "#009A44"), kit("#FF7900", "#FFFFFF")),
  ba: team(kit("#002F6C", "#FFFFFF"), kit("#FFFFFF", "#002F6C"), kit("#FFD700", "#002F6C")),
  is: team(kit("#003897", "#FFFFFF"), kit("#FFFFFF", "#003897"), kit("#CC0000", "#FFFFFF")),
  al: team(kit("#E41B17", "#000000"), kit("#000000", "#E41B17"), kit("#FFFFFF", "#E41B17")),
  // AFC
  jp: team(kit("#003087", "#FFFFFF"), kit("#FFFFFF", "#003087"), kit("#101418", "#FFFFFF")),
  kr: team(kit("#C00000", "#FFFFFF"), kit("#FFFFFF", "#C00000"), kit("#101418", "#FFFFFF")),
  au: team(kit("#FFB81C", "#00843D"), kit("#00843D", "#FFB81C"), kit("#1A2456", "#FFB81C")),
  sa: team(kit("#006C35", "#FFFFFF"), kit("#FFFFFF", "#006C35"), kit("#101418", "#FFFFFF")),
  ir: team(kit("#FFFFFF", "#239F40"), kit("#239F40", "#FFFFFF"), kit("#CC0000", "#FFFFFF")),
  qa: team(kit("#8D153A", "#FFFFFF"), kit("#FFFFFF", "#8D153A"), kit("#101418", "#FFFFFF")),
  jo: team(kit("#007A3D", "#FFFFFF"), kit("#FFFFFF", "#007A3D"), kit("#CC0000", "#FFFFFF")),
  uz: team(kit("#1EB53A", "#003087"), kit("#FFFFFF", "#1EB53A"), kit("#003087", "#1EB53A")),
  iq: team(kit("#CC0000", "#FFFFFF"), kit("#FFFFFF", "#CC0000"), kit("#0E7C3A", "#FFFFFF")),
  bh: team(kit("#CC0000", "#FFFFFF"), kit("#FFFFFF", "#CC0000"), kit("#101418", "#FFFFFF")),
  om: team(kit("#DB161B", "#FFFFFF"), kit("#FFFFFF", "#DB161B"), kit("#0E7C3A", "#FFFFFF")),
  id: team(kit("#CC0000", "#FFFFFF"), kit("#FFFFFF", "#CC0000"), kit("#0E7C3A", "#FFFFFF")),
  cn: team(kit("#CC0000", "#FFFFFF"), kit("#FFFFFF", "#CC0000"), kit("#FFD700", "#CC0000")),
  // CAF
  cv: team(kit("#003082", "#FFFFFF"), kit("#FFFFFF", "#003082"), kit("#CC0000", "#FFFFFF")),
  ma: team(kit("#C1272D", "#FFFFFF"), kit("#FFFFFF", "#C1272D"), kit("#0E7C3A", "#FFFFFF")),
  sn: team(kit("#00853F", "#FFFFFF"), kit("#FFFFFF", "#00853F"), kit("#CC0000", "#FFFFFF")),
  ng: team(kit("#008751", "#FFFFFF"), kit("#FFFFFF", "#008751"), kit("#101418", "#FFFFFF")),
  eg: team(kit("#CC0000", "#FFFFFF"), kit("#FFFFFF", "#CC0000"), kit("#101418", "#FFFFFF")),
  cm: team(kit("#007A5E", "#FFFFFF"), kit("#FFFFFF", "#007A5E"), kit("#CC0000", "#FFFFFF")),
  ci: team(kit("#FF6600", "#003087"), kit("#003087", "#FF6600"), kit("#FFFFFF", "#FF6600")),
  za: team(kit("#007A5E", "#FFD700"), kit("#FFD700", "#007A5E"), kit("#FFFFFF", "#007A5E")),
  dz: team(kit("#FFFFFF", "#006233"), kit("#006233", "#FFFFFF"), kit("#101418", "#FFFFFF")),
  gh: team(kit("#006B3F", "#FFFFFF"), kit("#FFFFFF", "#006B3F"), kit("#101418", "#FFFFFF")),
  ml: team(kit("#009A44", "#FFFFFF"), kit("#FFFFFF", "#009A44"), kit("#FFD700", "#009A44")),
  cd: team(kit("#007FFF", "#FFFFFF"), kit("#FFFFFF", "#007FFF"), kit("#CC0000", "#FFFFFF")),
  tz: team(kit("#1EB53A", "#003087"), kit("#003087", "#1EB53A"), kit("#FFFFFF", "#1EB53A")),
  ke: team(kit("#CC0000", "#FFFFFF"), kit("#FFFFFF", "#CC0000"), kit("#0E7C3A", "#FFFFFF")),
  tn: team(kit("#E70013", "#FFFFFF"), kit("#FFFFFF", "#E70013"), kit("#102A52", "#FFFFFF")),
  ao: team(kit("#CE1126", "#000000"), kit("#000000", "#CE1126"), kit("#FFFFFF", "#CE1126")),
  gn: team(kit("#CE1126", "#FFFFFF"), kit("#FFFFFF", "#CE1126"), kit("#FFD700", "#CE1126")),
  // OFC
  nz: team(kit("#FFFFFF", "#2B3A8C"), kit("#2B3A8C", "#FFFFFF"), kit("#101418", "#FFFFFF")),
};

// ─── Helpers de color ─────────────────────────────────────────────────────────

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Luminancia perceptual (0–255). > 140 = color claro.
export function isLightColor(hex: string): boolean {
  if (!hex.startsWith("#")) return false;
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 140;
}

// Familia de color general (rojo, azul, blanca, etc.) a partir del hex. La idea
// es agrupar por percepción, no por hex exacto: #AA151B y #C1272D son ambos "red".
// Se usa para detectar choque de camisetas sin importar el tono preciso.
export function colorFamily(hex: string): string {
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

// Camiseta por defecto para países sin kit definido: blanca lisa.
export const DEFAULT_KIT: Kit = { primary: "#FFFFFF", secondary: "#1f2937", pattern: "solid" };
const DEFAULT_TEAM_KITS: TeamKits = { home: DEFAULT_KIT, away: DEFAULT_KIT, third: DEFAULT_KIT };

// Kit concreto de una selección por slot (con fallback a blanca lisa).
export function kitFor(iso: string, slot: KitSlot): Kit {
  return (KITS[iso] ?? DEFAULT_TEAM_KITS)[slot];
}

// ¿Chocan dos colores? Misma familia general (ambos rojos, ambos blancos…). El contraste
// claro/oscuro es un criterio extra (FIFA prefiere un kit claro y uno oscuro por partido).
function clashes(a: string, b: string): boolean {
  return colorFamily(a) === colorFamily(b);
}

// Elige el par (local, visitante) aplicando las reglas de FIFA:
//   1. El LOCAL designado usa SIEMPRE su titular (home).
//   2. El VISITANTE usa su titular si NO choca y hay contraste claro/oscuro con el local.
//   3. Si no, prueba su alternativa (away); si tampoco, su tercera (third).
//   4. Último recurso: la tercera (garantiza salida aunque todas “choquen”).
function pickPair(localIso: string, visitorIso: string): { localKit: Kit; visitorKit: Kit } {
  const localKit = (KITS[localIso] ?? DEFAULT_TEAM_KITS).home;
  const v = KITS[visitorIso] ?? DEFAULT_TEAM_KITS;
  const candidates = [v.home, v.away, v.third];
  const lp = localKit.primary;
  const lightL = isLightColor(lp);
  // Pase 1: distinta familia Y distinto claro/oscuro (el ideal de FIFA).
  let pick = candidates.find((k) => !clashes(lp, k.primary) && isLightColor(k.primary) !== lightL);
  // Pase 2: al menos distinta familia.
  if (!pick) pick = candidates.find((k) => !clashes(lp, k.primary));
  // Pase 3: lo que haya — la tercera como red de seguridad.
  if (!pick) pick = v.third;
  return { localKit, visitorKit: pick };
}

// Resuelve qué kit viste cada lado del gráfico (A y B). `localSide` indica quién es el
// LOCAL designado por el sorteo (del backend: home_team_id). En sede neutral o local
// desconocido → null, y se toma A como local nominal (comportamiento previo). El que
// NO es local resuelve su kit contra el titular del local con las reglas de arriba.
export function resolveKits(
  isoA: string,
  isoB: string,
  localSide: "a" | "b" | null = "a",
): { kitA: Kit; kitB: Kit } {
  if (localSide === "b") {
    const { localKit, visitorKit } = pickPair(isoB, isoA);
    return { kitA: visitorKit, kitB: localKit };
  }
  const { localKit, visitorKit } = pickPair(isoA, isoB);
  return { kitA: localKit, kitB: visitorKit };
}

// ─── Designaciones oficiales por partido (FIFA) ───────────────────────────────
// Fuente: PDF oficial "FWC2026 Match Colours Designation" (DAM de FIFA), transcripto a
// lib/data/fwc2026_match_colours.csv. El PDF NO indica slot home/away/third: da el COLOR
// real de la camiseta de campo y del arquero por selección y por partido. Por eso acá
// guardamos el color tal cual (en palabras) y lo resolvemos a un Kit: para AR/HR/US se
// reconstruye el patrón icónico (rayas/damero/franjas); el resto, liso con el color del PDF.
//
// Paleta de colores del PDF → hex. Frases multipalabra primero (se matchean exactas);
// si no, cae a la primera palabra. Tolera repeticiones/ruido del scraping (toma el 1er token).
const COLOR_HEX: Record<string, string> = {
  white: "#FFFFFF",
  black: "#14171C",
  grey: "#6B7280",
  "light grey": "#C8CDD3",
  "dark grey": "#383D44",
  red: "#CE1126",
  "port red": "#7A1E2B",
  port: "#7A1E2B",
  maroon: "#6E1B2E",
  green: "#1E8E3E",
  "dark green": "#0C5A2C",
  "light green": "#6BBE6E",
  "olive green": "#707D33",
  "neon green": "#46E35A",
  turquoise: "#1BB5AD",
  blue: "#1565C0",
  "light blue": "#5BA6E0",
  navy: "#16223D",
  "navy blue": "#16223D",
  yellow: "#F5C518",
  gold: "#D9A520",
  orange: "#F0792A",
  magenta: "#C42C7E",
  purple: "#6E2FA6",
  bronze: "#A87833",
  light: "#9CC9EE",
  dark: "#1F2937",
};

// Una frase de color del PDF → hex (o null si no se reconoce / no es color, p. ej. ruido).
function colorToHex(phrase: string): string | null {
  const p = phrase.toLowerCase().replace(/\s+/g, " ").trim();
  if (!p) return null;
  if (COLOR_HEX[p]) return COLOR_HEX[p];
  const first = p.split(" ")[0];
  return COLOR_HEX[first] ?? null;
}

// Descripción de camiseta del PDF ("port red / olive green") → Kit. Reconstruye el patrón
// icónico de AR (rayas celeste/blanco), HR (damero rojo/blanco) y US (franjas blanco/rojo)
// cuando los colores corresponden; el resto, liso con el primer color del PDF.
function shirtToKit(iso: string, desc: string): Kit {
  const tokens = desc
    .toLowerCase()
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  const joined = tokens.join(" ");
  const has = (c: string) => joined.includes(c);

  if (iso === "ar" && !has("navy") && (has("light") || has("sky") || has("white"))) return KITS.ar.home;
  if (iso === "hr" && !has("navy") && !has("blue") && has("red")) return KITS.hr.home;
  if (iso === "us" && has("white") && has("red")) return { primary: "#FFFFFF", secondary: "#BF0A30", pattern: "stripes" };

  const primary = colorToHex(tokens[0] ?? "") ?? (KITS[iso]?.home.primary ?? DEFAULT_KIT.primary);
  const secondary = colorToHex(tokens[1] ?? "") ?? "#FFFFFF";
  return { primary, secondary, pattern: "solid" };
}

interface SideColours {
  shirt: string; // color(es) de la camiseta de campo, en palabras (del PDF)
  gk?: string; // color de la camiseta del arquero, en palabras; ausente/no-color → dorado
}

// Designación oficial por partido. Clave = los dos ISO2 ordenados alfabéticamente unidos con
// "|" (p. ej. "ar|dz"); valor = los colores de cada selección por su ISO2. Transcripto del
// CSV (lib/data/fwc2026_match_colours.csv). Cubre los 72 partidos de fase de grupos.
const MATCH_COLOURS: Record<string, Partial<Record<string, SideColours>>> = {
  "mx|za": { mx: { shirt: "green", gk: "purple" }, za: { shirt: "yellow", gk: "light blue" } },
  "cz|kr": { kr: { shirt: "red", gk: "yellow" }, cz: { shirt: "white", gk: "turquoise" } },
  "ba|ca": { ca: { shirt: "red", gk: "blue" }, ba: { shirt: "white", gk: "yellow" } },
  "py|us": { us: { shirt: "white / red", gk: "yellow" }, py: { shirt: "navy blue", gk: "orange" } },
  "gb-sct|ht": { ht: { shirt: "white", gk: "yellow" }, "gb-sct": { shirt: "red", gk: "blue" } },
  "au|tr": { au: { shirt: "gold", gk: "black" }, tr: { shirt: "port red", gk: "blue" } },
  "br|ma": { br: { shirt: "yellow", gk: "light grey" }, ma: { shirt: "red", gk: "light blue" } },
  "ch|qa": { qa: { shirt: "maroon", gk: "yellow" }, ch: { shirt: "light grey", gk: "light blue" } },
  "ci|ec": { ci: { shirt: "orange", gk: "turquoise" }, ec: { shirt: "navy blue", gk: "olive green" } },
  "cw|de": { de: { shirt: "white", gk: "dark green" }, cw: { shirt: "blue", gk: "orange" } },
  "jp|nl": { nl: { shirt: "orange", gk: "green" }, jp: { shirt: "navy blue" } },
  "se|tn": { se: { shirt: "yellow", gk: "green" }, tn: { shirt: "red", gk: "turquoise" } },
  "sa|uy": { sa: { shirt: "dark green", gk: "yellow" }, uy: { shirt: "light blue", gk: "orange" } },
  "cv|es": { es: { shirt: "red" }, cv: { shirt: "white", gk: "yellow" } },
  "ir|nz": { ir: { shirt: "white", gk: "light blue" }, nz: { shirt: "black", gk: "magenta" } },
  "be|eg": { be: { shirt: "red", gk: "green" }, eg: { shirt: "white", gk: "light green" } },
  "fr|sn": { fr: { shirt: "navy blue", gk: "yellow" }, sn: { shirt: "white", gk: "orange" } },
  "iq|no": { iq: { shirt: "white", gk: "yellow" }, no: { shirt: "red", gk: "light blue" } },
  "ar|dz": { ar: { shirt: "white / light" }, dz: { shirt: "dark green", gk: "yellow" } },
  "at|jo": { at: { shirt: "red", gk: "light blue" }, jo: { shirt: "white", gk: "yellow" } },
  "gh|pa": { gh: { shirt: "yellow", gk: "turquoise" }, pa: { shirt: "red", gk: "grey" } },
  "gb-eng|hr": { "gb-eng": { shirt: "white / red" }, hr: { shirt: "blue / navy" } },
  "cd|pt": { pt: { shirt: "port red", gk: "gold" }, cd: { shirt: "blue", gk: "light grey" } },
  "co|uz": { uz: { shirt: "white", gk: "orange" }, co: { shirt: "navy blue", gk: "magenta" } },
  "cz|za": { cz: { shirt: "red" }, za: { shirt: "yellow", gk: "light blue" } },
  "ba|ch": { ch: { shirt: "red", gk: "light blue" }, ba: { shirt: "white", gk: "yellow" } },
  "ca|qa": { ca: { shirt: "black", gk: "yellow" }, qa: { shirt: "white", gk: "dark green" } },
  "kr|mx": { mx: { shirt: "black", gk: "olive green" }, kr: { shirt: "magenta", gk: "yellow" } },
  "br|ht": { br: { shirt: "navy blue", gk: "magenta" }, ht: { shirt: "white", gk: "yellow" } },
  "gb-sct|ma": { "gb-sct": { shirt: "navy blue", gk: "yellow" }, ma: { shirt: "white", gk: "neon green" } },
  "py|tr": { tr: { shirt: "white" }, py: { shirt: "navy blue", gk: "orange" } },
  "au|us": { us: { shirt: "white / red", gk: "blue" }, au: { shirt: "gold", gk: "purple" } },
  "ci|de": { de: { shirt: "white", gk: "blue" }, ci: { shirt: "orange", gk: "yellow" } },
  "cw|ec": { ec: { shirt: "yellow", gk: "blue" }, cw: { shirt: "blue", gk: "light grey" } },
  "nl|se": { nl: { shirt: "orange", gk: "green" }, se: { shirt: "blue", gk: "light grey" } },
  "jp|tn": { tn: { shirt: "white", gk: "orange" }, jp: { shirt: "navy blue", gk: "yellow" } },
  "cv|uy": { uy: { shirt: "light blue", gk: "green" }, cv: { shirt: "red", gk: "yellow" } },
  "es|sa": { es: { shirt: "red" }, sa: { shirt: "white", gk: "light blue" } },
  "be|ir": { be: { shirt: "red", gk: "green" }, ir: { shirt: "white", gk: "light blue" } },
  "eg|nz": { nz: { shirt: "white", gk: "neon green" }, eg: { shirt: "red", gk: "green" } },
  "no|sn": { no: { shirt: "black", gk: "light blue" }, sn: { shirt: "white" } },
  "fr|iq": { fr: { shirt: "navy blue", gk: "yellow" }, iq: { shirt: "white", gk: "orange" } },
  "ar|at": { ar: { shirt: "white / light" }, at: { shirt: "red", gk: "yellow" } },
  "dz|jo": { jo: { shirt: "red", gk: "yellow" }, dz: { shirt: "white", gk: "light blue" } },
  "gb-eng|gh": { "gb-eng": { shirt: "white / red" }, gh: { shirt: "yellow", gk: "magenta" } },
  "hr|pa": { pa: { shirt: "navy blue", gk: "neon green" }, hr: { shirt: "white / red", gk: "yellow" } },
  "pt|uz": { pt: { shirt: "port red", gk: "neon green" }, uz: { shirt: "white", gk: "neon green" } },
  "cd|co": { co: { shirt: "yellow / red", gk: "green" }, cd: { shirt: "blue", gk: "light grey" } },
  "br|gb-sct": { "gb-sct": { shirt: "navy blue", gk: "grey" }, br: { shirt: "yellow", gk: "red" } },
  "ht|ma": { ma: { shirt: "red", gk: "white" }, ht: { shirt: "blue", gk: "yellow" } },
  "ca|ch": { ch: { shirt: "red", gk: "yellow" }, ca: { shirt: "white", gk: "blue" } },
  "ba|qa": { ba: { shirt: "blue", gk: "orange" }, qa: { shirt: "white", gk: "yellow" } },
  "cz|mx": { cz: { shirt: "red" }, mx: { shirt: "white", gk: "green" } },
  "kr|za": { za: { shirt: "yellow", gk: "light blue" }, kr: { shirt: "red", gk: "green" } },
  "ci|cw": { cw: { shirt: "blue", gk: "light grey" }, ci: { shirt: "orange", gk: "yellow" } },
  "de|ec": { ec: { shirt: "yellow" }, de: { shirt: "navy blue", gk: "orange" } },
  "jp|se": { jp: { shirt: "navy blue" }, se: { shirt: "yellow", gk: "green" } },
  "nl|tn": { tn: { shirt: "white", gk: "turquoise" }, nl: { shirt: "orange", gk: "green" } },
  "tr|us": { tr: { shirt: "white" }, us: { shirt: "navy blue", gk: "yellow" } },
  "au|py": { py: { shirt: "red", gk: "light blue" }, au: { shirt: "gold", gk: "black" } },
  "fr|no": { no: { shirt: "red", gk: "light blue" }, fr: { shirt: "light green", gk: "yellow" } },
  "iq|sn": { sn: { shirt: "white" }, iq: { shirt: "dark green", gk: "black" } },
  "eg|ir": { eg: { shirt: "red", gk: "yellow" }, ir: { shirt: "white", gk: "light blue" } },
  "be|nz": { nz: { shirt: "white", gk: "neon green" }, be: { shirt: "red", gk: "yellow" } },
  "cv|sa": { cv: { shirt: "navy blue", gk: "yellow" }, sa: { shirt: "white", gk: "light blue" } },
  "es|uy": { uy: { shirt: "navy blue", gk: "orange" }, es: { shirt: "white", gk: "yellow" } },
  "gb-eng|pa": { pa: { shirt: "white", gk: "turquoise" }, "gb-eng": { shirt: "red", gk: "olive green" } },
  "gh|hr": { hr: { shirt: "white / red", gk: "green" }, gh: { shirt: "yellow", gk: "turquoise" } },
  "at|dz": { dz: { shirt: "white", gk: "light blue" }, at: { shirt: "red", gk: "yellow" } },
  "ar|jo": { jo: { shirt: "white", gk: "yellow" }, ar: { shirt: "navy blue", gk: "dark green" } },
  "co|pt": { co: { shirt: "yellow / red", gk: "light grey" }, pt: { shirt: "port red", gk: "neon green" } },
  "cd|uz": { cd: { shirt: "red", gk: "green" }, uz: { shirt: "white", gk: "grey" } },
};

// Designación oficial para un cruce (si está cargada), resuelta a kit + color de arquero
// (hex) por lado A/B del gráfico. Sin entrada → null (se usa la regla de contraste).
export function designationFor(
  isoA: string,
  isoB: string,
): { a: { kit: Kit; gk?: string }; b: { kit: Kit; gk?: string } } | null {
  const key = [isoA, isoB].slice().sort().join("|");
  const d = MATCH_COLOURS[key];
  if (!d) return null;
  const a = d[isoA];
  const b = d[isoB];
  if (!a || !b) return null;
  return {
    a: { kit: shirtToKit(isoA, a.shirt), gk: colorToHex(a.gk ?? "") ?? undefined },
    b: { kit: shirtToKit(isoB, b.shirt), gk: colorToHex(b.gk ?? "") ?? undefined },
  };
}
