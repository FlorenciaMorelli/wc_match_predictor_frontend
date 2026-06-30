/**
 * lib/rounds.ts
 * Helpers de ronda del fixture (lógica pura, sin React).
 */

// El valor de `round` que el backend usa para la fase de grupos.
const GROUP_STAGE = "group-stage";

// ¿La ronda es de eliminatoria? El backend solo simula alargue + penales (y por
// ende devuelve `p_advance_*` / `p_penalties`) cuando el request lleva
// `knockout: true`. El fixture deriva ese flag de la ronda del partido: cualquier
// ronda que NO sea fase de grupos es eliminatoria (round-of-32, round-of-16,
// quarter-finals, semi-finals, third-place, final y cualquier ronda futura).
// Vacío / desconocido → false (modo regular seguro).
export function isKnockoutRound(round: string | null | undefined): boolean {
  return !!round && round.toLowerCase().trim() !== GROUP_STAGE;
}
