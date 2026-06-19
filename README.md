# ⚽ WC Match Predictor — Frontend

Frontend de **WC Match Predictor**, una aplicación para visualizar el fixture y predecir resultados del Mundial de Fútbol 2026 con modelos estadísticos (Dixon-Coles, Poisson bivariado y Poisson simple).

Consume la API del backend:

- **Backend:** https://github.com/JuantMartinez17/wc_match_predictor
- **API Docs:** https://wc-match-predictor.onrender.com/docs

---

## 🚀 Stack

- **Next.js 16** (App Router, React Server Components, Turbopack)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **lucide-react** (íconos), **clsx** + **tailwind-merge** (composición de clases)
- **fetch** nativo como cliente HTTP (sin cliente HTTP externo)
- **ESLint** + **Prettier**

---

## 📂 Estructura

```text
.
├── app/          # App Router: layout, página principal, /eval, route handlers (/api/*), estilos
├── components/   # Componentes de UI (kebab-case)
├── providers/    # Context providers de React (idioma)
├── lib/          # Cliente API, i18n, helpers (kits, match-report, model-eval, text, datetime…)
│   └── data/     # Datasets de referencia (CSV: squads y designación de camisetas WC2026)
├── locales/      # Diccionarios es/en + tipos de traducción
├── types/        # Tipos TypeScript compartidos (espejo de los schemas del backend)
├── scripts/      # Utilidades de build/datos (no forman parte del bundle)
└── docs/         # Documentación de proyecto (backlog/roadmap)
```

> Estructura plana e intencional para una app de una sola página. No se usa
> arquitectura por features ni carpeta `src/`.

**Convención de nombres:** los componentes usan `kebab-case` (`fixture-section.tsx`,
`team-picker.tsx`).

---

## 🛠 Requisitos

- Node.js **22+**
- npm **10+**

```bash
node -v
npm -v
```

---

## 📥 Instalación

```bash
git clone https://github.com/FlorenciaMorelli/wc_match_predictor_frontend.git
cd wc_match_predictor_frontend
npm install
```

---

## ⚙ Variables de entorno

Crear un archivo `.env.local` (podés partir de `.env.example`):

```env
API_BASE_URL=https://wc-match-predictor.onrender.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`API_BASE_URL` es server-side: el navegador llama same-origin a `/api/*` y Next
reenvía esas requests a ese backend (proxy en `next.config.ts`), evitando CORS y
manteniendo la URL del backend fuera del bundle del cliente. `NEXT_PUBLIC_SITE_URL`
se usa para `metadataBase` y las OG images.

---

## ▶ Desarrollo

```bash
npm run dev
```

Disponible en http://localhost:3000

---

## 🏗 Producción

```bash
npm run build
npm run start
```

---

## 📦 Scripts

| Script                 | Descripción                         |
| ---------------------- | ----------------------------------- |
| `npm run dev`          | Servidor de desarrollo              |
| `npm run build`        | Build de producción                 |
| `npm run start`        | Ejecuta el build de producción      |
| `npm run lint`         | ESLint                              |
| `npm run typecheck`    | Chequeo de tipos con `tsc --noEmit` |
| `npm run format`       | Formatea el código con Prettier     |
| `npm run format:check` | Verifica el formato sin escribir    |

Para correr ESLint con autofix: `npm run lint -- --fix`.

**Datos derivados:** `lib/shirt-names-data.ts` se genera desde `lib/data/squads_wc2026.csv`
con `node scripts/gen-shirt-names.mjs` (no se parsea CSV en runtime).

---

## ✨ Características

- **Predictor de partidos:** elegí dos selecciones, fecha, modelo y modo eliminatoria;
  probabilidades 1X2, goles esperados (xG) y marcadores más probables.
- **Fixture:** partidos agrupados por día, estado en vivo/finalizado y predicción on-demand.
- **Formación con camisetas reales WC2026:** XI por líneas según la posición real, camisetas
  con patrón y colores oficiales (designación de FIFA por partido) y nombre de camiseta del jugador.
- **Crónica de partidos finalizados:** texto generado por reglas a partir de datos reales (ESPN),
  con lista de goles (minuto, penal, gol en contra).
- **Sobre el modelo (`/eval`):** cómo funciona, precisión contra resultados reales (accuracy,
  Brier score, calibración) por modelo, y nota de uso responsable.
- **i18n:** español / inglés (toggle en la barra superior).
- **Tema claro / oscuro:** con persistencia y sin flash de color en la carga.

---

## 🌐 API Backend

La app consume la API REST (el navegador la llama same-origin y el proxy de Next la reenvía a `API_BASE_URL`):

- `GET /api/teams` — selecciones disponibles
- `GET /api/fixture?days_ahead=&include_past=` — fixture
- `POST /api/predict` — predicción de un partido

Route handlers locales (no van al backend): `POST /api/translate` (traducción es→en de la
narrativa) y `POST /api/match-report` (crónica de finalizados desde ESPN).

Documentación Swagger: https://wc-match-predictor.onrender.com/docs

---

## 🌳 Flujo de trabajo

El repositorio usa dos ramas protegidas por _rulesets_:

- **`staging`** — integración. Solo se actualiza vía **Pull Request** y requiere el check `build` (CI) en verde.
- **`main`** — releases. Push restringido e **historial lineal** (sin merge commits).

Ciclo de un cambio:

1. Ramificar desde `staging` (`git switch -c feat/mi-cambio`).
2. Implementar y verificar local: `npm run lint && npm run typecheck && npm run build`.
3. Abrir un **PR hacia `staging`**; al pasar el CI, _squash & merge_.
4. Promover a `main` reflejando staging: `git merge --squash staging` + commit + push, y taggear (`vX.Y.Z`).

Un workflow **Guard main** verifica que el contenido de `main` coincida con `staging` tras cada promote.
Se usa [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `refactor:`,
`docs:`, `style:`, `chore:`).

---

## 🚀 Deploy

- **Frontend:** Vercel
- **Backend:** Render

---

## 📄 Licencia

[MIT](./LICENSE)
