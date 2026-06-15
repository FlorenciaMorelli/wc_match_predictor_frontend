# Backlog — TODOs diferidos

Ítems pensados pero **no implementados todavía**, con el contexto necesario para retomarlos sin
perder el razonamiento. Al cerrar uno, moverlo a "Hecho" o borrarlo (queda en el historial git).

---

## Roadmap multi-rol (junio 2026)

Plan de entregas progresivas: cada ítem es **una rama → PR → `staging`**; al cerrar una ola,
`staging → main --ff-only` + tag SemVer. Orden por prioridad: quick-wins de frontend → infra de UX →
integración externa.

| #  | Ítem                                          | Estado       | Rama                            |
|----|-----------------------------------------------|--------------|---------------------------------|
| —  | Narrativa: traducción es→en (MyMemory)        | ✅ Hecho      | (ver `app/api/translate/route.ts`) |
| —  | Sede neutral / localía (i18n en el front)     | ✅ Hecho      | `fix/sede-neutral-i18n` (#15)   |
| 1  | Logo SVG + título + favicon + OG              | En curso     | `feat/brand-logo`               |
| 2  | Footer con datos de devs                      | Pendiente    | `feat/footer-credits`           |
| 3  | Unificar sede card↔modal                      | Pendiente    | `feat/venue-unify`              |
| 4  | Pulido formación + datos por jugador          | Pendiente    | `feat/lineup-polish`            |
| 5  | UX de desconexión (tarjeta de error)          | Pendiente    | `feat/connection-error-ux`      |
| 6  | Análisis de partido finalizado (TheSportsDB)  | Pendiente    | `feat/match-analysis-thesportsdb` |

**Olas:** A = ítems 1-4 (frontend puro) → release. B = ítem 5 → release. C = ítem 6 → release.

Las features 1-4 son frontend puro y se construyen en esta tanda (no se difieren). Las secciones de abajo
guardan el contexto detallado de los ítems que requieren más diseño/decisión (5 y 6).

---

## Análisis de partido finalizado vía TheSportsDB

**Origen:** rediseño "resultado real integrado en el modal" (rama `feat/prediccion-vs-real`). Quedó fuera
de alcance de ese branch por tamaño.

**Decisión (jun 2026):** usar **TheSportsDB** (gratis, **sin API key**) vía route handler de Next (espejo
de `app/api/translate/route.ts`), para **no** sumar trabajo al backend de Juan (sobrecargado). **Rama:**
`feat/match-analysis-thesportsdb`.

**Qué:** hoy la sección **"Análisis"** del modal muestra `narrative` (texto que arma el backend, de tono
predictivo). En partidos **finalizados** se reemplaza/complementa por una **crónica real**
(goleadores/eventos) traída de TheSportsDB, para que el texto refleje lo que pasó y no solo la predicción
previa.

**Arquitectura prevista:**
- `app/api/match-analysis/route.ts` (NUEVO): recibe equipos + fecha (o score), llama a TheSportsDB
  server-side (free key `3`/`123`, p. ej. `searchevents`/`eventsday`), **normaliza** la respuesta a un
  shape chico `{ home, away, scorers/events }` y cachea en memoria. Matchea por **fecha + equipos** para
  no traer el evento equivocado.
- `prediction-result.tsx`: si `matchStatus` es finalizado, `useEffect` que llama a `/api/match-analysis`;
  render de la crónica en la sección "Análisis", **con fallback robusto a `narrative`** si la API falla,
  no matchea o no hay cobertura. No-finalizados: se mantiene la narrativa predictiva actual.
- i18n: rótulos de crónica ("Goles", "Fuente: TheSportsDB") en es/en.

**Consideraciones de UX:** estados de carga/error sin bloquear el modal; tono y idioma del producto
(es-AR / en) — la fuente probablemente venga en inglés, traducir o mostrar datos crudos localizados.

**Riesgo:** cobertura real de WC2026 en TheSportsDB a verificar en implementación → el fallback a
`narrative` es la red de seguridad (nunca rompe el modal).

**Done cuando:** en finalizados, "Análisis" muestra contenido derivado del partido real con fallback
robusto a `narrative`, sin API keys en el cliente y sin romper si el proveedor falla o no cubre el partido.

---

## UX de desconexión con el backend (estados de error reconocibles)

**Origen:** se trabajó la robustez de cold-start en `fix/predict-cold-start` (PR3: pre-flight a
`/health` + retry en 503 + timeout 240s). Eso mitiga la *carga* lenta reintentando en silencio, pero
quedó pendiente el **diseño de qué ve el usuario** cuando la reconexión no alcanza o falla. Branch
propio: **`feat/connection-error-ux`**.

**Qué:** hoy `lib/api.ts` mapea **toda** falla de red a un **string en español hardcodeado** y los tres
sitios que consumen la API lo muestran como un **banner rojo plano, idéntico para todos los casos**.
Hay que: (a) tipar los errores por causa, (b) crear una **tarjeta de error reusable** con copy
localizado por causa + reintento, y (c) cablearla en los 4 sitios.

**Dos problemas que resuelve:**
- **Bug i18n real:** con la app en inglés, toda desconexión se ve en español. Los `t.*.errorPredict` /
  `t.*.errorLoad` localizados son solo *fallback* y casi nunca se alcanzan, porque `api.ts` siempre
  tira `Error(string)` en español. A diferencia de la narrativa/sede (texto del backend), **este string
  se arma en el cliente → sí se arregla en el front.**
- **Sin lenguaje visual por causa:** un cold-start ("esperá, reintenta solo") se ve igual que un "estás
  sin internet" o un 500. Y el reintento es inconsistente: el fixture (carga) y los teams **no tienen
  botón de reintentar**; solo el modal sí.

**Inventario de sitios afectados:**
- `FixtureSection` (cargar fixture): spinner + banner rojo, **sin** reintento.
- `MatchCard` modal (predict): `PredictLoader` + banner rojo **con** reintento (`handleOpen`).
- `PredictorSection` (predict): botón "Calculando" + banner rojo; reintento = volver a apretar Predecir.
- `PredictorSection` (cargar teams): banner genérico + pickers deshabilitados, **sin** reintento.

**Diseño (decisión UX: tarjeta serena).** Taxonomía de **4 causas**, misma tarjeta (ícono + título +
subtítulo + Reintentar), tono calmo y no técnico (sin códigos HTTP), accesible (`role="alert"`), en el
lenguaje visual del `PhasePlaceholder`:

| `kind` | Falla del backend | Ícono (lucide) | Título es / en | Subtítulo (es) |
|---|---|---|---|---|
| `offline` | `fetch` rechaza (no timeout) | `WifiOff` | Sin conexión / You're offline | Revisá tu internet y reintentá. |
| `waking` | 503 (predictor arrancando) | `Coffee`/`Loader` | Despertando el servidor / Waking the server | Estaba en reposo. Esperá unos segundos y reintentá. |
| `slow` | TimeoutError, 502, 504 | `Clock` | Tardó demasiado / Took too long | El servidor está lento. Reintentá en un momento. |
| `server` | otro 4xx/5xx (con `detail`) | `ServerCrash` | Algo salió mal / Something went wrong | Tuvimos un problema. Reintentá. (`detail` en letra chica, opcional) |

**Implementación prevista:**
- `lib/api.ts`: clase `ApiError extends Error` con `kind: "offline" | "waking" | "slow" | "server"` +
  `detail?`. Reemplazar los `throw new Error(string)` por `throw new ApiError(kind, detail)`.
- `components/connection-error.tsx` (NUEVO): reusable, props `{ kind, onRetry, detail? }`; copy desde
  `t.errors[kind]`; íconos de `lucide-react` (ya en uso). Reutiliza `RotateCcw` para Reintentar.
- Cablear los 4 sitios: cambiar el state de error de `string` a `kind`; render `<ConnectionError>` con
  el `onRetry` correspondiente (`load`, `handleOpen`, `handlePredict`, refetch de `fetchTeams`).
- i18n (`locales/types.ts` + es + en): bloque `errors` con `retry` + `{ title, body }` por `kind`.

**Done cuando:** toda desconexión muestra la tarjeta localizada con la causa reconocible + reintento
funcional desde los 4 sitios, **sin strings de error hardcodeados en `api.ts`** y sin recargar la página.
