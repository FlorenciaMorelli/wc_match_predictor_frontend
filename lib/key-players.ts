/**
 * lib/key-players.ts
 * Figuras clave por selección, curadas en el front.
 *
 * El backend solo expone el XI confirmado (no hay datos de lesiones/suspensiones,
 * y no se le suma trabajo). Para señalar "ausencias destacadas" comparamos un
 * conjunto curado de figuras por selección contra el XI confirmado: las que no
 * aparecen se muestran como ausentes. Las claves son ISO2 (flagcdn) — los mismos
 * `flag_a`/`flag_b` del backend (incluye "gb-eng" para Inglaterra).
 *
 * IMPORTANTE — copy neutral: esto NO afirma lesión ni motivo. Solo dice que la
 * figura "no está en el XI confirmado" (puede ser descanso, táctica, lesión, etc.).
 * Dataset de mantenimiento manual; un equipo sin entrada simplemente no muestra nada.
 *
 * El match es deliberadamente generoso (comparte ≥1 token significativo): preferimos
 * ocultar una ausencia real (falso "presente") antes que reportar una ausencia falsa.
 *
 * ÚLTIMA VALIDACIÓN: jun 2026 contra squads oficiales WC2026 (lib/data/squads_wc2026.csv).
 * Selecciones no clasificadas (it, rs, dk, pl, ng) quitadas del dataset.
 * Jugadores no convocados removidos: Morata (ES), Griezmann (FR), Foden (ENG),
 * Rodrygo (BR), Lozano (MEX), Ziyech+En-Nesyri (MA), Elneny (EG),
 * Haller (CI), Kudus (GHA), Endo+Mitoma (JP), Al-Buraikan (SA).
 */

import { significantTokens } from "./text";

const KEY_PLAYERS: Record<string, string[]> = {
  // CONMEBOL
  ar: [
    "Lionel Messi",
    "Lautaro Martínez",
    "Julián Álvarez",
    "Enzo Fernández",
    "Alexis Mac Allister",
    "Cristian Romero",
  ],
  br: [
    "Vinícius Júnior",
    "Neymar Jr",
    "Raphinha",
    "Casemiro",
    "Marquinhos",
    "Alisson",
  ],
  uy: [
    "Federico Valverde",
    "Darwin Núñez",
    "Ronald Araújo",
    "Rodrigo Bentancur",
  ],
  co: ["James Rodríguez", "Luis Díaz", "Jhon Córdoba"],
  ec: ["Moisés Caicedo", "Enner Valencia", "Pervis Estupiñán"],
  py: ["Miguel Almirón", "Antonio Sanabria"],
  // UEFA — solo selecciones clasificadas al WC2026
  // (IT, RS, DK, PL no clasificaron → eliminadas)
  fr: [
    "Kylian Mbappé",
    "Marcus Thuram",
    "Aurélien Tchouaméni",
    "Ousmane Dembélé",
    "William Saliba",
  ],
  es: ["Rodri", "Pedri", "Gavi", "Lamine Yamal", "Nico Williams"],
  "gb-eng": [
    "Harry Kane",
    "Jude Bellingham",
    "Bukayo Saka",
    "Declan Rice",
    "Marcus Rashford",
  ],
  pt: [
    "Cristiano Ronaldo",
    "Bruno Fernandes",
    "Bernardo Silva",
    "Rúben Dias",
    "Vitinha",
  ],
  nl: [
    "Virgil van Dijk",
    "Frenkie de Jong",
    "Memphis Depay",
    "Cody Gakpo",
    "Denzel Dumfries",
  ],
  de: [
    "Jamal Musiala",
    "Florian Wirtz",
    "Joshua Kimmich",
    "Kai Havertz",
    "Antonio Rüdiger",
  ],
  be: ["Kevin De Bruyne", "Romelu Lukaku", "Jérémy Doku", "Youri Tielemans"],
  hr: ["Luka Modrić", "Mateo Kovačić", "Joško Gvardiol", "Andrej Kramarić"],
  ch: ["Granit Xhaka", "Manuel Akanji", "Breel Embolo"],
  // CONCACAF
  us: ["Christian Pulisic", "Weston McKennie", "Tyler Adams", "Gio Reyna"],
  mx: ["Santiago Giménez", "Edson Álvarez", "Raúl Jiménez"],
  ca: ["Alphonso Davies", "Jonathan David"],
  // CAF — solo clasificadas (NG no clasificó → eliminada)
  ma: ["Achraf Hakimi", "Brahim Díaz", "Sofyan Amrabat", "Bilal El Khannouss"],
  sn: ["Sadio Mané", "Kalidou Koulibaly", "Nicolas Jackson"],
  eg: ["Mohamed Salah", "Omar Marmoush"],
  ci: ["Amad Diallo", "Franck Kessié", "Seko Fofana"],
  gh: ["Iñaki Williams", "Thomas Partey", "Antoine Semenyo"],
  // AFC
  jp: ["Takefusa Kubo", "Daichi Kamada", "Ritsu Doan", "Junya Ito"],
  kr: ["Son Heung-Min", "Kim Min-Jae", "Lee Kang-In"],
  au: ["Mathew Ryan", "Jackson Irvine"],
  ir: ["Mehdi Taremi", "Alireza Jahanbakhsh"],
  sa: ["Salem Al-Dawsari", "Nasser Al-Dawsari"],
};

/**
 * Figuras curadas de `iso2` que NO aparecen en el XI confirmado. Devuelve [] si el
 * equipo no está curado, si no hay XI, o si todas las figuras están presentes.
 * Una figura se considera presente si comparte algún token significativo con
 * algún nombre del XI (match generoso, agnóstico al orden nombre/apellido).
 */
export function notableAbsences(iso2: string, xi: string[]): string[] {
  const keys = KEY_PLAYERS[iso2];
  if (!keys || keys.length === 0 || xi.length === 0) return [];
  const xiSets = xi.map((n) => new Set(significantTokens(n)));
  return keys.filter((player) => {
    const kt = significantTokens(player);
    if (kt.length === 0) return false; // sin token comparable → no lo reportamos
    const present = xiSets.some((set) => kt.some((t) => set.has(t)));
    return !present;
  });
}
