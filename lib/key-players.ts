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
 */

const KEY_PLAYERS: Record<string, string[]> = {
  // CONMEBOL
  ar: ["Lionel Messi", "Lautaro Martínez", "Julián Álvarez", "Enzo Fernández", "Alexis Mac Allister", "Cristian Romero"],
  br: ["Vinícius Júnior", "Rodrygo", "Raphinha", "Casemiro", "Marquinhos", "Alisson"],
  uy: ["Federico Valverde", "Darwin Núñez", "Ronald Araújo", "Rodrigo Bentancur"],
  co: ["James Rodríguez", "Luis Díaz", "Jhon Córdoba"],
  ec: ["Moisés Caicedo", "Enner Valencia", "Pervis Estupiñán"],
  py: ["Miguel Almirón", "Antonio Sanabria"],
  // UEFA
  fr: ["Kylian Mbappé", "Antoine Griezmann", "Aurélien Tchouaméni", "Ousmane Dembélé", "William Saliba"],
  es: ["Rodri", "Pedri", "Gavi", "Lamine Yamal", "Nico Williams", "Álvaro Morata"],
  "gb-eng": ["Harry Kane", "Jude Bellingham", "Phil Foden", "Bukayo Saka", "Declan Rice"],
  pt: ["Cristiano Ronaldo", "Bruno Fernandes", "Bernardo Silva", "Rúben Dias", "Vitinha"],
  nl: ["Virgil van Dijk", "Frenkie de Jong", "Memphis Depay", "Cody Gakpo", "Denzel Dumfries"],
  de: ["Jamal Musiala", "Florian Wirtz", "Joshua Kimmich", "Kai Havertz", "Antonio Rüdiger"],
  be: ["Kevin De Bruyne", "Romelu Lukaku", "Jérémy Doku", "Youri Tielemans"],
  hr: ["Luka Modrić", "Mateo Kovačić", "Joško Gvardiol", "Andrej Kramarić"],
  it: ["Gianluigi Donnarumma", "Federico Chiesa", "Nicolò Barella"],
  ch: ["Granit Xhaka", "Manuel Akanji", "Breel Embolo"],
  rs: ["Dušan Vlahović", "Sergej Milinković-Savić", "Aleksandar Mitrović"],
  dk: ["Christian Eriksen", "Rasmus Højlund", "Pierre-Emile Højbjerg"],
  pl: ["Robert Lewandowski", "Piotr Zieliński", "Nicola Zalewski"],
  // CONCACAF
  us: ["Christian Pulisic", "Weston McKennie", "Tyler Adams", "Gio Reyna"],
  mx: ["Santiago Giménez", "Edson Álvarez", "Hirving Lozano"],
  ca: ["Alphonso Davies", "Jonathan David"],
  // CAF
  ma: ["Achraf Hakimi", "Hakim Ziyech", "Youssef En-Nesyri", "Sofyan Amrabat"],
  sn: ["Sadio Mané", "Kalidou Koulibaly", "Nicolas Jackson"],
  eg: ["Mohamed Salah", "Mohamed Elneny"],
  ng: ["Victor Osimhen", "Ademola Lookman", "Alex Iwobi"],
  ci: ["Sébastien Haller", "Franck Kessié"],
  gh: ["Mohammed Kudus", "Thomas Partey"],
  // AFC
  jp: ["Takefusa Kubo", "Wataru Endo", "Kaoru Mitoma", "Daichi Kamada"],
  kr: ["Son Heung-Min", "Kim Min-Jae", "Lee Kang-In"],
  au: ["Mathew Ryan", "Jackson Irvine"],
  ir: ["Mehdi Taremi", "Alireza Jahanbakhsh"],
  sa: ["Salem Al-Dawsari", "Firas Al-Buraikan"],
};

// Partículas que forman parte del apellido (no se cuentan como nombre de pila).
const PARTICLES = new Set([
  "van", "von", "der", "den", "ter", "ten", "de", "del", "della", "di", "da",
  "dos", "das", "do", "la", "le", "bin", "ibn", "al", "el", "mac", "mc", "o",
]);

// Longitud mínima de un token para considerarlo "significativo" (descarta
// iniciales y partículas cortas que generan coincidencias espurias).
const MIN_TOKEN_LEN = 4;

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca acentos (marcas combinantes)
    .toLowerCase()
    .replace(/[.'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(name: string): string[] {
  return normalize(name).split(" ").filter(Boolean);
}

function significantTokens(name: string): string[] {
  return tokens(name).filter((t) => t.length >= MIN_TOKEN_LEN && !PARTICLES.has(t));
}

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
