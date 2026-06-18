/**
 * lib/text.ts
 * Helpers de normalización y tokenización de nombres, compartidos por los matchers
 * por país (lib/key-players.ts y lib/shirt-names.ts). El match es deliberadamente
 * generoso y agnóstico al orden nombre/apellido: dos nombres "coinciden" si comparten
 * al menos un token significativo.
 */

// Partículas de apellido (no cuentan como token discriminante: "van", "de", "al", …).
const PARTICLES = new Set([
  "van", "von", "der", "den", "ter", "ten", "de", "del", "della", "di", "da",
  "dos", "das", "do", "la", "le", "bin", "ibn", "al", "el", "mac", "mc", "o",
]);

// Largo mínimo de un token "significativo" (descarta iniciales y partículas cortas
// que generan coincidencias espurias).
const MIN_TOKEN_LEN = 4;

// Normaliza un nombre: saca acentos, pasa a minúsculas y unifica separadores.
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // marcas combinantes (acentos)
    .toLowerCase()
    .replace(/[.'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Tokens significativos de un nombre: palabras de largo >= MIN_TOKEN_LEN que no sean
// partículas. Es la base del match generoso (comparten >= 1 token).
export function significantTokens(name: string): string[] {
  return normalize(name)
    .split(" ")
    .filter((t) => t.length >= MIN_TOKEN_LEN && !PARTICLES.has(t));
}
