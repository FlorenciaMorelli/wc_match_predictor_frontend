/**
 * lib/status.ts
 * Clasificación de estados de partido (lógica pura, sin React). Única fuente de
 * verdad compartida por el fixture y el componente de resultado.
 *
 * El backend mezcla estados en español (`programado`, `en juego`, `finalizado`…)
 * con los códigos de ESPN (`STATUS_*`). En eliminatoria aparecen además los de
 * alargue y penales (`STATUS_OVERTIME`, `STATUS_SHOOTOUT`, `STATUS_FINAL_PEN`…).
 */

// En juego: incluye el entretiempo y, en eliminatoria, el alargue, la tanda de
// penales y los cortes entre fases (el partido sigue su curso, no terminó).
const LIVE_STATUSES = new Set<string>([
  "en juego",
  "descanso",
  "STATUS_FIRST_HALF",
  "STATUS_SECOND_HALF",
  "STATUS_HALFTIME",
  "STATUS_OVERTIME",
  "STATUS_END_OF_REGULATION",
  "STATUS_END_OF_EXTRATIME",
  "STATUS_SHOOTOUT",
]);

// Terminado: final regular (90'), por alargue (AET) o por penales. El prefijo
// `STATUS_FINAL` atrapa cualquier variante futura (`STATUS_FINAL_*`) que el back
// pueda mandar, para no degradar a "no empezado" un partido ya jugado.
const FINISHED_STATUSES = new Set<string>([
  "finalizado",
  "STATUS_FULL_TIME",
  "STATUS_FINAL",
  "STATUS_FINAL_PEN",
  "STATUS_FINAL_AET",
]);

export function isLiveStatus(status: string): boolean {
  return LIVE_STATUSES.has(status);
}

export function isFinishedStatus(status: string): boolean {
  return FINISHED_STATUSES.has(status) || /^STATUS_FINAL/.test(status);
}
