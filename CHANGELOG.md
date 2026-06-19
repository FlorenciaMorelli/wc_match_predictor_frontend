# Changelog

Todos los cambios relevantes de este proyecto se documentan acá.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el versionado
adhiere a [SemVer](https://semver.org/lang/es/). Cada versión corresponde a un tag `vX.Y.Z`.

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
