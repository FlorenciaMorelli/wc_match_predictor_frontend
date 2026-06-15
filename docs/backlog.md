# Backlog — TODOs diferidos

Ítems pensados pero **no implementados todavía**, con el contexto necesario para retomarlos sin
perder el razonamiento. Al cerrar uno, moverlo a "Hecho" o borrarlo (queda en el historial git).

---

## Análisis de partido vía API externa gratuita

**Origen:** rediseño "resultado real integrado en el modal" (rama `feat/prediccion-vs-real`). Quedó
fuera de alcance de ese branch por tamaño y por requerir trabajo más allá del frontend.

**Qué:** hoy la sección **"Análisis"** del modal de resultado muestra `narrative` (texto que arma el
backend). La idea es reemplazarla —o complementarla, sobre todo en partidos **finalizados**— por un
análisis/crónica traído de una **API gratuita** de datos de fútbol, para que el texto refleje lo que
pasó en el partido real y no solo la predicción previa.

**Por qué no entró ahora:**
- Requiere **investigar proveedores** y su free tier real (límites de requests, cobertura del
  Mundial 2026, latencia, si exponen narrativa/eventos o solo datos crudos).
- **Licencia de datos / términos de uso**: confirmar que el plan gratuito permite mostrar el
  contenido en producto.
- **CORS / proxy**: el navegador debe pegar same-origin; replicar el patrón del fixture
  (`next.config` rewrite a `BACKEND_ORIGIN`, ver memoria *frontend-api-proxy-cors*). Posiblemente
  haya que **proxyear por backend** para esconder la API key y cachear.
- Probable **trabajo de backend** (no solo frontend): normalizar la respuesta al shape que consume
  el front y cachear para no agotar el free tier.

**Consideraciones de diseño/UX al retomar:**
- En **finalizado**: crónica del partido real (goleadores, eventos). En **programado/en vivo**:
  mantener la narrativa predictiva actual (o preview).
- Estados de carga/error y *fallback* a `narrative` si la API externa falla (no romper el modal).
- Tono y idioma: el producto es es-AR / en; la fuente probablemente venga en inglés → traducir o
  elegir proveedor multilenguaje.

**Candidatos a evaluar (sin compromiso, verificar términos y free tier vigentes):**
- API-Football (api-sports.io) — free tier con límite diario; cobertura amplia.
- football-data.org — free tier; cobertura de torneos principales.
- TheSportsDB — gratuita; datos más livianos.

**Done cuando:** la sección "Análisis" muestra contenido derivado del partido real en finalizados,
con fallback robusto a `narrative`, sin filtrar API keys al cliente y sin romper si el proveedor
falla o agota cuota.

---

## Narrativa del análisis: traducción automática (es→en)

**Origen:** rama `feat/prediccion-vs-real`. Con la app en **inglés**, el texto de la sección
**"Análisis"** (`narrative` de `PredictResponse`) sigue en español porque lo **genera el backend ya
formateado**.

> **Resuelto aparte:** la **etiqueta de sede** ("cancha neutral" / localía) se resolvió en el front
> (rama `fix/sede-neutral-i18n`) sin depender del backend. Queda solo la narrativa.

**Decisión de implementación:** traducir la narrativa en caliente en el front usando la API gratuita
**MyMemory** (sin API key requerida; 5.000 chars/día de límite, suficiente para el uso real del sitio).
La narrativa es prosa estadística factual → la traducción automática es de buena calidad para este tipo
de texto. **Branch planificado:** `feat/narrative-translate`.

**Arquitectura prevista:**
- `app/api/translate/route.ts` (nuevo route de Next.js): recibe `{ text }`, llama a MyMemory
  (`api.mymemory.translated.net`) server-side (sin exponer nada al cliente), cachea la traducción
  en memoria por texto (la narrativa para la misma predicción es siempre igual).
- `prediction-result.tsx`: cuando `locale === "en"`, dispara un `useEffect` que llama a
  `/api/translate` con la narrativa. Muestra el original mientras carga (sin bloquear el modal) y
  reemplaza con la traducción al llegar. Fallback silencioso al original si falla.

**Done cuando:** con la app en inglés, la sección "Análisis" se muestra en inglés (traducción
automática), con fallback silencioso al español si el servicio falla, sin API keys hardcodeadas.

---

## UX de desconexión con el backend (estados de error reconocibles)

**Origen:** se trabajó la robustez de cold-start en `fix/predict-cold-start` (PR3: pre-flight a
`/health` + retry en 503 + timeout 240s). Eso mitiga la *carga* lenta reintentando en silencio, pero
quedó pendiente el **diseño de qué ve el usuario** cuando la reconexión no alcanza o falla. Branch
propio planificado: **`feat/connection-error-ux`**, a construir **después de que mergeen PR3 y PR4**
(depende del `predictMatch` reestructurado de PR3; comparte archivos de locales con PR4 sin conflicto).

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
- **Companion opcional de PR3:** mientras corre el pre-flight a `/health`, el `PredictLoader` puede
  mostrar "Despertando el servidor…" en lugar de "Corriendo simulaciones" (estado de carga honesto).

**Done cuando:** toda desconexión muestra la tarjeta localizada con la causa reconocible + reintento
funcional desde los 4 sitios, **sin strings de error hardcodeados en `api.ts`** y sin recargar la página.
