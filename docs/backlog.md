# Backlog — TODOs diferidos

Ítems pensados pero **no implementados todavía**, con el contexto necesario para retomarlos sin
perder el razonamiento. Al cerrar uno, moverlo a "Hecho" o borrarlo (queda en el historial git).

---

## Roadmap multi-rol (junio 2026)

Plan de entregas progresivas: cada ítem es **una rama → PR → `staging`**; al cerrar una ola,
`staging → main --ff-only` + tag SemVer. Orden por prioridad: quick-wins de frontend → infra de UX →
integración externa.

| #  | Ítem                                          | Estado       | PR / Rama                       |
|----|-----------------------------------------------|--------------|---------------------------------|
| —  | Narrativa: traducción es→en (MyMemory)        | ✅ Hecho      | (ver `app/api/translate/route.ts`) |
| —  | Sede neutral / localía (i18n en el front)     | ✅ Hecho      | `fix/sede-neutral-i18n` (#15)   |
| 1  | Logo SVG + título + favicon + OG              | ✅ Hecho      | `feat/brand-logo` (#18)         |
| 2  | Footer con datos de devs                      | ✅ Hecho      | `feat/footer-credits` (#19)     |
| 3  | Unificar sede card↔modal                      | ✅ Hecho      | `feat/venue-unify` (#20)        |
| 4  | Pulido formación + datos por jugador          | ✅ Hecho      | `feat/lineup-polish` (#21)      |
| 5  | UX de desconexión (tarjeta de error)          | Pendiente    | `feat/connection-error-ux`      |
| 6  | Análisis de partido finalizado (TheSportsDB)  | Pendiente    | `feat/match-analysis-thesportsdb` |
| 7  | Evaluador de accuracy del modelo              | Pendiente    | `feat/model-evaluator`          |
| 8  | Posiciones correctas según el back            | Pendiente    | `fix/lineup-positions`          |
| 9  | Curar ausencias contra convocatoria WC2026    | Pendiente    | `fix/key-players-wc2026`        |
| 10 | Camisetas con diseño real WC2026 (patrón + 2 colores) | Pendiente | `feat/kit-designs-2026`    |

**Olas:** A = ítems 1-4 ✅ completa (`v0.2.0`). B = ítem 5 → release. C = ítem 6 → release. D = ítems 7-9 (análisis y datos) → release. E = ítem 10 (camisetas 2026) → release.

Las secciones de abajo guardan el contexto detallado de los ítems pendientes.

---

## Tanda 2 — Próximos cambios (jun 2026)

Segunda ronda de cambios. Frontend puro. Se entregan en **4 PRs temáticos por archivo** (varios
requerimientos comparten archivo, y la CI exige cada rama verde por separado):

| Req | Ítem | Estado | PR / Rama |
|----|------|--------|------|
| 3 | Modal: fondo inferior cortado → layout flex (sin `calc` mágico) | ✅ Hecho | `fix/modal-height-clip` |
| 2 | "0-0" en partidos no jugados → "vs" (gateo por estado iniciado) | ✅ Hecho | `feat/fixture-display` |
| 7 | Estado en vivo/finalizado reconciliado con la hora de inicio | ✅ Hecho | `feat/fixture-display` |
| 4 | Ir rápido a los partidos de hoy / próximos (chip + scroll) | ✅ Hecho | `feat/fixture-display` |
| 6 | Apellidos compuestos cortados en la formación (`displaySurname`) | ✅ Hecho | `feat/lineup-insights` |
| 5 | Ausencias destacadas: figuras curadas (`lib/key-players.ts`) vs XI | ✅ Hecho | `feat/lineup-insights` |

Los textos i18n nuevos (claves de fixture y de ausencias) viajan en `feat/fixture-display`; `feat/lineup-insights`
se ramifica de `staging` una vez mergeado ese PR, para que sus usos de las claves de ausencias compilen en CI.

**Pedido a backend (no se resuelve en el front):** frescura del `status` del fixture. La API a veces tarda en
pasar un partido a `finalizado`/`en juego`. El front mitiga reconciliando con la hora de inicio
(`effectiveStatus` en `fixture-section.tsx`, ventana ~140′), pero el dato duro de en-vivo/score depende de
que la API actualice su estado.

> Nota: los **ítems 5 y 6 del roadmap original** (UX de desconexión, TheSportsDB) siguen pendientes y se
> detallan abajo; no confundir con los "Req 5/6" de esta tanda.

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

---

## Evaluador de accuracy del modelo (ítem 7)

**Qué:** ruta oculta `/eval` (no linkeada desde la UI, accesible por URL directa) que muestra el historial de accuracy del modelo contra los resultados reales del WC2026.

**Fuente de datos:**
- Resultados reales: `/api/fixture` (partidos con `status === "finalizado"` y `score_a`/`score_b` no vacíos).
- Predicciones: calculadas on-demand llamando al predictor para cada partido finalizado (o cacheadas en un route handler server-side para no saturar el backend).

**Métricas previstas:**
- **Accuracy de ganador:** % de partidos donde el resultado predicho (ganador con mayor probabilidad) coincidió con el real.
- **Brier score:** mide la calibración de las probabilidades (qué tan cerca estuvieron de la realidad, no solo si acertó el ganador).
- **Calibración por rango:** tabla de "cuando el modelo dijo X%, ¿cuántas veces acertó?" (10 buckets de 10%).
- Desglose por modelo (Dixon-Coles, Bivariate Poisson, Simple Poisson).

**Arquitectura prevista:**
- `app/eval/page.tsx` (NUEVO): Server Component o `"use client"` con llamada lazy al route handler.
- `app/api/eval/route.ts` (NUEVO): fetches `/api/fixture`, filtra finalizados, llama al predictor por cada uno, calcula métricas, cachea con `revalidate`.
- No requiere base de datos: todo se deriva del fixture + el predictor en tiempo de evaluación.

**Done cuando:** `/eval` muestra accuracy, Brier score y calibración de los partidos WC2026 finalizados, con desglose por modelo, sin ser accesible desde la navegación principal.

---

## Posiciones correctas según el back (ítem 8)

**Qué:** el front agrupa el XI en líneas GK/DEF/MID/FWD según el campo de posición que llega del backend (`lineup_detail_a/b`). Actualmente el mapeo puede no reflejar lo que la API realmente envía.

**Bloqueado por:** necesitamos ver un ejemplo real de la respuesta de `/api/fixture` con XI confirmado, específicamente los campos `lineup_detail_*` y/o `squad_desc_*`, para entender el formato de posición (¿string libre? ¿código? ¿número? ¿orden dentro de un array?).

**Acción pendiente:** el usuario comparte un ejemplo de respuesta del back → se define el mapeo correcto → `fix/lineup-positions`.

---

## Curar ausencias contra convocatoria WC2026 (ítem 9)

**Qué:** el dataset en `lib/key-players.ts` tiene figuras curadas históricamente pero no validadas contra las convocatorias reales al WC2026. Jugadores no convocados (por lesión, decisión técnica, suspensión) aparecerían siempre como "ausentes" aunque nunca iban a jugar, lo que hace el chip semánticamente incorrecto.

**Trabajo necesario:** revisar las 20+ selecciones del dataset contra las listas oficiales FIFA WC2026 y remover o reemplazar a quienes no estén convocados. Ejemplos conocidos: Rodrigo Bentancur (UY, suspendido), Nicola Zalewski (PL, no convocado), Sergej Milinković-Savić (RS, retirado de la selección).

**Criterio:** solo deben listarse jugadores que estén en la convocatoria oficial WC2026 de su selección. Si un jugador está convocado pero no arranca, el chip "ausencias" tiene sentido. Si ni siquiera está convocado, no debe estar en el dataset.

**Done cuando:** `lib/key-players.ts` contiene solo jugadores convocados al WC2026, y el chip de ausencias no reporta falsos positivos por jugadores fuera de squad.

---

## Camisetas con diseño real WC2026 (ítem 10)

**Qué:** hoy la formación (`components/prediction-result.tsx`) dibuja cada camiseta como una silueta SVG de
**un solo color liso** (`KITS: Record<iso2, {home, away}>`, un hex por kit) más una banda diagonal
**cosmética** que no representa ningún diseño real. Las camisetas del Mundial 2026 tienen **primario +
secundario + patrón** (rayas de Argentina, damero de Croacia, banda de Perú, etc.). El objetivo es corregir
los diseños para que se parezcan a los reales, con
[footballkitarchive 2026](https://www.footballkitarchive.com/es/world-cup-camisetas-2026-l308/) como
referencia visual.

**Fuente de datos — decisión:** **dataset curado estático** en `lib/kits.ts` (mismo patrón que
`lib/key-players.ts`), usando footballkitarchive + el FKApi como **referencia de autoría, una sola vez**.

**Por qué NO se consume el FKApi (`sunr4y-fkapi-12.mintlify.app`) en runtime:** investigado en su fuente
([sunr4y/fkapi](https://github.com/sunr4y/fkapi)) — es **club-only** (el modelo `Kit` pertenece a un `Club`;
no hay entidad de selección nacional; se siembra por scraping on-demand), **sin URL pública confirmada** (los
docs dicen `https://your-domain.com/api/`; es self-host), rate limit **~100 req/h**, y su `main_img_url`
apunta a **fotos de producto con copyright** de footballkitarchive. No es una dependencia de runtime viable
para esta app (necesita las 48 selecciones, sin backend extra, sin CORS y robusta offline). Sí expone los
campos útiles (`primary_color`, `secondary_color[]`, `design`), por eso sirve solo como referencia.

**Render — decisión:** upgrade del `JerseyIcon` a **patrón + 2 colores**. Catálogo de patrones
(`solid | stripes | sash | hoops | halves | checkers`) dibujados **dentro de la silueta vía `clipPath`** para
que no se desborden. Se preservan halo de contorno, ribete, puños y dorsal; GK dorado. **Fallback:** una
selección sin entrada (o sin patrón) cae a primario liso → nunca rompe ni queda en blanco.

**Arquitectura prevista:**
- `lib/kits.ts` (NUEVO): tipos `KitPattern` / `Kit { primary, secondary, pattern }` / `TeamKits { home, away }`,
  el `Record` `KITS` enriquecido (48 clasificadas + extras curados, claves ISO2 como hoy, incluido `gb-eng`),
  `resolveKits(isoA, isoB)` (regla actual: A=home; B=away solo si choca la familia de color primario) y los
  helpers de color (`hexToRgb`, `isLightColor`, `colorFamily`) movidos desde el componente.
- `components/prediction-result.tsx`: reescribir `JerseyIcon` para recibir `kit: Kit`; cambiar el threading
  `color: string` → `kit: Kit` por la cadena `resolveKits → TeamLineup → SinglePitch → PlayerNode →
  JerseyIcon`; borrar el `KITS`/helpers inline (ahora en `lib/kits.ts`). No toca ninguna API de Next.

**Done cuando:** la formación muestra el diseño real de cada selección (AR rayas celeste/blanco, HR damero,
ES rojo, etc.) coincidiendo con la referencia 2026, preservando el canje a suplente por choque de color, el
arquero diferenciado y el fallback robusto; **sin dependencias de runtime ni imágenes con copyright**.
