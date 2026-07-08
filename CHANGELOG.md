# Changelog

Todos los cambios relevantes de este proyecto se documentan acá.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado
adhiere a [SemVer](https://semver.org/lang/es/). Cada versión corresponde a un tag `vX.Y.Z`.

## [0.11.1] — 2026-07-08

### Fixed

- **Cuartos de final no se visualizaban** en el fixture (`lib/rounds.ts` · `canonicalRound`, NUEVO;
  aplicado en `lib/api.ts` · `fetchFixture`). El backend manda slugs de ronda inconsistentes —las
  eliminatorias tempranas con guión (`round-of-32`, `round-of-16`) pero los cuartos sin guión
  (`quarterfinals`)—, así que el filtro por ronda no matcheaba la forma canónica `quarter-finals` y la
  pestaña quedaba vacía (placeholder "Por definir"), además de fallar el label i18n. Ahora la ronda se
  canonicaliza en la frontera de la API, con alias también para `semifinals` y `thirdplace` por si el
  backend los manda igual de inconsistentes en rondas futuras.

## [0.11.0] — 2026-06-29

### Added

- **Penales y avance en eliminatorias** (`components/prediction-result.tsx`): en partidos de
  eliminatoria la predicción suma un bloque **"Probabilidades de definición por penales (x%)"** —el
  porcentaje del título es la chance de que el cruce vaya a penales— con una **barra dividida**
  (tug-of-war: cada selección crece desde su lado y suman 100%) que muestra quién avanza la llave.

### Changed

- En partidos de **eliminatoria**, el bloque de probabilidades 1X2 se titula **"Probabilidades del
  partido"** (en grupos sigue siendo "Probabilidades a 90'"): el resultado mostrado aplica al partido
  (90' o, si va al alargue, 120'), sin etiquetarlo confusamente como "a 90'".

### Fixed

- El **fixture** ahora pide la predicción en modo eliminatoria (`knockout=true`) para las rondas que no
  son fase de grupos (`lib/rounds.ts` · `isKnockoutRound`). Antes los partidos de dieciseisavos en
  adelante se calculaban en modo regular, por lo que `p_advance_*` / `p_penalties` llegaban en `null` y
  el bloque de eliminatoria nunca aparecía. El predictor manual (con su toggle) no estaba afectado.
- **Estados de eliminatoria** (`lib/status.ts`, NUEVO, fuente única compartida por fixture y resultado):
  el front reconoce los estados que el back manda en fase final — `STATUS_OVERTIME` (alargue),
  `STATUS_SHOOTOUT` (penales), los cortes entre fases y los finales por alargue/penales
  (`STATUS_FINAL_AET` / `STATUS_FINAL_PEN`, con red de seguridad para cualquier `STATUS_FINAL_*`) — con
  su etiqueta es/en, color y clasificación en vivo/finalizado. La reconciliación de "en vivo trabado"
  usa una ventana más amplia en eliminatoria (suma alargue + penales) para no darlos por finalizados
  antes de tiempo.

## [0.10.0] — 2026-06-24

### Added

- **Analítica web gratuita con Vercel Analytics + Speed Insights** (`app/layout.tsx`): se montan los
  componentes `<Analytics />` y `<SpeedInsights />` en el `RootLayout`. El primero registra páginas vistas,
  referrers, países y dispositivos sin cookies (no requiere banner de consentimiento); el segundo reporta
  los Core Web Vitals reales de los usuarios. Ambos entran en el plan Hobby de Vercel sin costo. Requiere
  activar las pestañas Analytics y Speed Insights en el dashboard de Vercel para empezar a recibir datos.

## [0.9.0] — 2026-06-19

### Added

- **Caché persistente y compartida de predicciones** (`lib/prediction-cache.ts`): cada `PredictResponse`
  se guarda en `localStorage` y se reutiliza entre visitas, recargas y los tres puntos que consultan al
  predictor (fixture, predictor manual, `/eval`) — una predicción hecha en uno sirve a los demás (misma
  tupla de request → misma clave). Acelera la carga, sobre todo en `/eval`, que evalúa todos los partidos
  finalizados a la vez.

### Changed

- Frescura por proximidad al inicio: los finalizados se cachean permanentemente (inmutables); los próximos
  expiran al entrar a la ventana de confirmación del XI (~90 min antes) y desde ahí usan un TTL corto, para
  captar la alineación confirmada. `/eval` deriva sus métricas de la respuesta completa cacheada, en
  reemplazo de su caché aislada anterior (`wc-eval:v1:*`, que se purga al montar).

## [0.8.1] — 2026-06-19

### Changed

- Dependabot apunta a `staging` (`target-branch`) en vez de `main`, para que las actualizaciones entren
  por el flujo normal (PR → CI → staging) y no rompan el invariante `main == staging` del Guard main.

## [0.8.0] — 2026-06-19

### Added

- **Suite de tests** con Vitest sobre la lógica pura (`lib/model-eval`, `lib/text`, `lib/kits`,
  `lib/country-codes`); scripts `test` / `test:watch` y step de tests en el CI.
- **Gobernanza:** `CONTRIBUTING.md`, plantillas de PR e Issues, y `dependabot.yml` (npm + GitHub Actions).
- **Consistencia de entorno:** `.gitattributes` (normaliza fin de línea a LF), `.editorconfig` y `.nvmrc`.
- Badges de CI y licencia en el `README`.

## [0.7.3] — 2026-06-19

### Changed

- Promote `staging → main` estandarizado con `git read-tree --reset -u origin/staging` (snapshot exacto
  del árbol) en lugar de `git merge --squash`, que podía duplicar contenido en archivos reformateados y
  romper el build. Documentado en el README; respaldado por el `Guard main` (igualdad de árbol).

## [0.7.2] — 2026-06-18

### Changed

- Formato unificado con **Prettier** en todo el repo (`printWidth` 80 + orden de clases de Tailwind).

### Added

- `.prettierignore` (excluye lockfile y módulos/datos generados).
- Step `format:check` en el workflow de CI: el formato ahora se valida automáticamente.

## [0.7.1] — 2026-06-18

### Changed

- Documentación normalizada: `README` fiel a la estructura y features reales; `docs/backlog.md`
  marcado como roadmap 1–11 completo + sección de deuda técnica diferida.

### Fixed

- **CI `Guard main`:** se reescribió a verificación de igualdad de árbol (`main` == `staging`),
  acorde al squash-promote. Antes fallaba en cada release porque asumía fast-forward.

### Added

- `CHANGELOG.md`.
- `concurrency` en el workflow de CI (cancela corridas superadas del mismo ref).
- `lib/text.ts`: helpers de normalización/tokenización compartidos (DRY entre `key-players` y
  `shirt-names`).

## [0.7.0] — 2026-06-18

### Added

- **Sobre el modelo (`/eval`):** explicación de cómo funciona el predictor, precisión contra los
  resultados reales (accuracy de ganador, Brier score, calibración) con selector de modelo, y bloque
  de uso responsable. Acceso discreto desde el footer + nota de uso responsable app-wide.

## [0.6.0] — 2026-06-18

### Added

- **Nombre de camiseta real** en la formación (`nombre_camiseta` de la convocatoria WC2026), con
  fallback al apellido heurístico.

## [0.5.0] — 2026-06-18

### Added

- **Camisetas con diseño real WC2026:** 3 kits por selección, patrones (rayas, damero, banda…),
  regla de contraste de FIFA (local titular; visitante cambia si choca) y designación oficial por
  partido (incluye color del arquero).

## [0.4.0] — 2026-06-18

### Added

- **UX de desconexión:** tarjeta de error reconocible por causa (`offline`/`waking`/`slow`/`server`)
  con reintento, en los cuatro puntos que consumen la API.

### Fixed

- Bug i18n: los errores de red ya no se muestran siempre en español con la app en inglés.

## [0.3.0] — 2026-06-18

### Added

- **Crónica de partidos finalizados** generada por reglas a partir de datos reales (ESPN), con lista
  de goles (minuto, penal, gol en contra).

### Fixed

- **Formación:** las líneas del XI se arman por el string de formación y el orden por código de
  posición (sin mezclar roles) — PR #29.

## [0.2.1] — 2026-06-18

### Fixed

- **Ausencias destacadas** curadas contra la convocatoria oficial WC2026 (sin falsos positivos de
  jugadores no convocados o selecciones no clasificadas).

## [0.2.0] — 2026-06-18

### Added

- Identidad: logo SVG, favicon y Open Graph image.
- Footer con créditos de los desarrolladores.
- Sede unificada entre la card y el modal.
- Pulido de la formación y datos por jugador.

---

> El historial previo a `0.2.0` (narrativa traducida es→en, sede neutral i18n y la base de la app)
> está en el log de git.

[0.11.0]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/compare/v0.10.0...v0.11.0
[0.10.0]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/compare/v0.8.1...v0.9.0
[0.8.1]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/compare/v0.8.0...v0.8.1
[0.8.0]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/compare/v0.7.3...v0.8.0
[0.7.3]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/compare/v0.7.2...v0.7.3
[0.7.2]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/compare/v0.7.1...v0.7.2
[0.7.1]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/compare/v0.2.1...v0.3.0
[0.2.1]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/FlorenciaMorelli/wc_match_predictor_frontend/releases/tag/v0.2.0
