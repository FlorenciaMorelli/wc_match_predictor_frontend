// Tipos espejo de los schemas de FastAPI (backend/api/schemas.py).
// No modificar manualmente — deben mantenerse sincronizados con el backend.
//
// NOTA: los IDs de equipo son numéricos (el backend migró de slug a entero).
// El `id` del partido (FixtureMatch.id) sigue siendo string.

export interface Team {
  id: number;        // ID numérico estable (ej. 20). Usar para /api/predict.
  canonical: string; // nombre interno en inglés: "Argentina", "Korea Republic"
  name_es: string;   // nombre en español para mostrar al usuario
  flag: string;      // código ISO2 para flagcdn.com (ej. "ar")
}

export interface FixtureMatch {
  id: string;          // ID del partido (string, ej. "760440")
  date: string;        // "2026-06-15"
  time_utc: string;    // hora UTC: "20:00" o, a veces, hora suelta "20"
  team_a_id: number;   // ID numérico — usar para llamar a /api/predict
  team_b_id: number;
  team_a: string;      // canónico inglés (para debugging)
  team_b: string;
  team_a_es: string;   // nombre en español para mostrar
  team_b_es: string;
  flag_a: string;
  flag_b: string;
  status: MatchStatus;
  score_a: string;
  score_b: string;
  neutral: boolean;
  round: string;
  venue: string;
}

export interface PlayerSlot {
  name: string;
  jersey: number | null;
  position: string | null;
  formation_place: number | null;
}

export interface PredictRequest {
  team_a_id: number;   // ID numérico de /api/teams
  team_b_id: number;
  date?: string;       // "YYYY-MM-DD"; default = hoy
  knockout?: boolean;  // true = modo eliminatoria con penales
  model?: "dixon_coles" | "bivariate_poisson" | "poisson_simple";
}

export interface ScoreProbability {
  score_a: number;
  score_b: number;
  probability: number; // 0–1
}

export interface PredictResponse {
  // Equipos
  team_a_id: number;   // ID numérico — clave estable
  team_b_id: number;
  team_a: string;      // canónico inglés
  team_b: string;
  team_a_es: string;   // español para mostrar
  team_b_es: string;
  flag_a: string;
  flag_b: string;

  // Probabilidades 90 min
  p_a: number;         // probabilidad de victoria equipo A (0–1)
  p_draw: number;      // probabilidad de empate (0–1)
  p_b: number;         // probabilidad de victoria equipo B (0–1)

  // Goles esperados
  xg_a: number;
  xg_b: number;

  // Marcadores más probables (top 8, ordenados desc por probabilidad)
  top_scorelines: ScoreProbability[];

  // Sede
  neutral: boolean;
  home_team_id: number | null;  // ID del equipo local; null = cancha neutral
  venue_label: string;          // texto listo para mostrar

  // Fuente de datos de plantilla
  squad_desc_a: string;
  squad_desc_b: string;
  lineup_confirmed_a: boolean;
  lineup_confirmed_b: boolean;
  // XI inicial confirmado (nombres ESPN, en el orden publicado). null si no está
  // disponible. Garantía del backend: confirmed === true ⟺ array de 11 nombres.
  lineup_a: string[] | null;
  lineup_b: string[] | null;
  // Formación real (ej. "4-4-2") y detalle de jugadores con dorsal + formation_place.
  // Opcionales: solo presentes cuando el backend tiene datos estructurados del XI.
  formation_a: string | null;
  formation_b: string | null;
  lineup_detail_a: PlayerSlot[] | null;
  lineup_detail_b: PlayerSlot[] | null;

  // Narrativa en español lista para mostrar al usuario
  narrative: string;

  // Modo eliminatoria (null si no aplica)
  is_knockout: boolean;
  p_penalties: number | null;
  p_advance_a: number | null;
  p_advance_b: number | null;
}

export type MatchStatus =
  | "programado"
  | "en juego"
  | "descanso"
  | "finalizado"
  | "postergado"
  | "cancelado"
  | "suspendido"
  | "STATUS_FIRST_HALF"
  | "STATUS_SECOND_HALF"
  | "STATUS_HALFTIME"
  | "STATUS_FULL_TIME";
