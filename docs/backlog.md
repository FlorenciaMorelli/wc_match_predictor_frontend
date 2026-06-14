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
