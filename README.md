# ⚽ WC Match Predictor — Frontend

Frontend de **WC Match Predictor**, una aplicación para visualizar el fixture y predecir resultados del Mundial de Fútbol 2026 utilizando modelos estadísticos (Dixon-Coles, Poisson bivariado y Poisson simple).

Consume la API del backend:

- **Backend:** https://github.com/JuantMartinez17/wc_match_predictor
- **API Docs:** https://wc-match-predictor.onrender.com/docs

---

## 🚀 Stack

- **Next.js 16** (App Router, React Server Components)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **fetch** nativo para el cliente HTTP (sin librerías externas)
- **ESLint** + **Prettier**

---

## 📂 Estructura

```text
.
├── app/          # App Router: layout, página principal, estilos globales
├── components/   # Componentes de UI (kebab-case)
├── providers/    # Context providers de React (idioma)
├── lib/          # Cliente API, i18n, stores de tema/idioma, helpers de fecha
├── locales/      # Diccionarios es/en + tipos de traducción
└── types/        # Tipos TypeScript compartidos (espejo de los schemas del backend)
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
NEXT_PUBLIC_API_URL=https://wc-match-predictor.onrender.com
```

Si no se define, el cliente usa `http://localhost:8000` como fallback.

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

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Ejecuta el build de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Chequeo de tipos con `tsc --noEmit` |
| `npm run format` | Formatea el código con Prettier |
| `npm run format:check` | Verifica el formato sin escribir |

Para correr ESLint con autofix: `npm run lint -- --fix`.

---

## ✨ Características

- **Predictor de partidos:** elegí dos selecciones, fecha, modelo y modo eliminatoria.
- **Fixture:** próximos partidos agrupados por día, con predicción on-demand.
- **i18n:** español / inglés (toggle en la barra superior).
- **Tema claro / oscuro:** con persistencia y sin flash de color en la carga.

---

## 🌐 API Backend

La app consume la API REST en `NEXT_PUBLIC_API_URL`:

- `GET /api/teams` — selecciones disponibles
- `GET /api/fixture?days_ahead=&include_past=` — fixture
- `POST /api/predict` — predicción de un partido

Documentación Swagger: https://wc-match-predictor.onrender.com/docs

---

## 🌳 Flujo de trabajo

1. Crear una rama desde `main` (`git checkout -b feat/mi-cambio`).
2. Implementar los cambios.
3. Verificar: `npm run lint && npm run typecheck && npm run build`.
4. Abrir un Pull Request hacia `main`.

Se usa [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`,
`refactor:`, `docs:`, `style:`, `test:`, `chore:`).

---

## 🚀 Deploy

- **Frontend:** Vercel
- **Backend:** Render

---

## 📄 Licencia

[MIT](./LICENSE)
