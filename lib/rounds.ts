/**
 * lib/rounds.ts
 * Helpers de ronda del fixture (lógica pura, sin React).
 */

// El valor de `round` que el backend usa para la fase de grupos.
const GROUP_STAGE = "group-stage";

// El backend es inconsistente con los slugs de ronda. Vocabulario real
// (verificado contra `/api/fixture`): `group-stage`, `round-of-32`,
// `round-of-16`, `quarterfinals`, `semifinals`, `3rd-place-match`, `final` —
// o sea, las eliminatorias tempranas con guión, las finales sin guión, y el
// tercer puesto con su propia forma con número y sufijo `-match`. El frontend
// usa una única forma canónica con guión para agrupar en pestañas y buscar el
// label i18n, así que mapeamos cada variante conocida a su slug canónico. Lo
// desconocido pasa tal cual (ya en minúsculas y sin espacios) para no romper
// rondas futuras.
const ROUND_ALIASES: Record<string, string> = {
  quarterfinals: "quarter-finals",
  quarterfinal: "quarter-finals",
  semifinals: "semi-finals",
  semifinal: "semi-finals",
  "3rd-place-match": "third-place",
  "3rd-place": "third-place",
  "third-place-match": "third-place",
  thirdplace: "third-place",
};

// Canonicaliza el slug de ronda del backend a la forma que usa el frontend.
// Se aplica en la frontera de la API (fetchFixture) para que todo lo de abajo
// trabaje con un único vocabulario.
export function canonicalRound(round: string | null | undefined): string {
  const r = (round ?? "").toLowerCase().trim();
  return ROUND_ALIASES[r] ?? r;
}

// ¿La ronda es de eliminatoria? El backend solo simula alargue + penales (y por
// ende devuelve `p_advance_*` / `p_penalties`) cuando el request lleva
// `knockout: true`. El fixture deriva ese flag de la ronda del partido: cualquier
// ronda que NO sea fase de grupos es eliminatoria (round-of-32, round-of-16,
// quarter-finals, semi-finals, third-place, final y cualquier ronda futura).
// Vacío / desconocido → false (modo regular seguro).
export function isKnockoutRound(round: string | null | undefined): boolean {
  return !!round && round.toLowerCase().trim() !== GROUP_STAGE;
}
