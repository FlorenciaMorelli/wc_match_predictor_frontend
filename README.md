# ⚽ WC Match Predictor Frontend

Frontend de **WC Match Predictor**, una aplicación para visualizar y predecir resultados del Mundial de Fútbol utilizando modelos de Machine Learning.

Este proyecto consume la API del repositorio backend:

- Backend Repo: https://github.com/JuantMartinez17/wc_match_predictor
- API Docs: https://wc-match-predictor.onrender.com/docs

---

# 🚀 Tecnologías

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Axios
- ESLint
- Prettier

---

# 📂 Estructura del proyecto

```text
src/
│
├── app/                # App Router de Next.js
├── components/         # Componentes reutilizables
├── features/           # Funcionalidades agrupadas por dominio
├── services/           # Comunicación con la API
├── lib/                # Helpers y utilidades
├── hooks/              # Custom hooks
├── types/              # Definiciones TypeScript
├── constants/          # Constantes globales
├── styles/             # Estilos adicionales
└── assets/             # Recursos estáticos
```

---

# 🛠 Requisitos

- Node.js 22+
- npm 10+

Verificar versiones:

```bash
node -v
npm -v
```

---

# 📥 Instalación

Clonar el repositorio:

```bash
git clone https://github.com/<usuario>/wc_match_predictor_frontend.git

cd wc_match_predictor_frontend
```

Instalar dependencias:

```bash
npm install
```

---

# ⚙ Variables de entorno

Crear un archivo:

```text
.env.local
```

con:

```env
NEXT_PUBLIC_API_URL=https://wc-match-predictor.onrender.com
```

---

# ▶ Ejecutar en desarrollo

```bash
npm run dev
```

La aplicación estará disponible en:

```text
http://localhost:3000
```

---

# 🏗 Build de producción

Generar build:

```bash
npm run build
```

Ejecutar:

```bash
npm run start
```

---

# 🧹 Calidad de código

Ejecutar ESLint:

```bash
npm run lint
```

Corregir automáticamente:

```bash
npm run lint --fix
```

---

# 📦 Scripts disponibles

| Script | Descripción |
|----------|-------------|
| npm run dev | Inicia el servidor de desarrollo |
| npm run build | Genera la versión de producción |
| npm run start | Ejecuta la aplicación compilada |
| npm run lint | Ejecuta ESLint |
| npm run lint --fix | Corrige errores automáticamente |

---

# 🌐 API Backend

La aplicación consume la API REST:

```text
https://wc-match-predictor.onrender.com
```

Documentación Swagger:

```text
https://wc-match-predictor.onrender.com/docs
```

---

# 🏛 Arquitectura

Se utiliza una arquitectura orientada a features:

```text
src/
│
├── features
│   ├── matches
│   ├── predictions
│   ├── teams
│   └── statistics
│
├── components
├── services
├── hooks
├── types
└── lib
```

Cada feature debe contener:

```text
feature-name/
│
├── components/
├── hooks/
├── services/
├── types/
└── index.ts
```

---

# 📋 Convenciones

## Componentes

PascalCase:

```text
MatchCard.tsx
PredictionTable.tsx
TeamSelector.tsx
```

---

## Hooks

camelCase:

```text
useMatches.ts
usePredictions.ts
```

---

## Types

```text
match.ts
team.ts
prediction.ts
```

---

## Services

```text
matchService.ts
teamService.ts
predictionService.ts
```

---

# 🧪 Ejemplo de service

```ts
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getTeams() {
    const response = await axios.get(`${API_URL}/teams`);
    return response.data;
}
```

---

# 🌳 Flujo de trabajo con Git

Crear rama:

```bash
git checkout -b feature/team-selector
```

Realizar cambios:

```bash
git add .
git commit -m "feat: add team selector component"
```

Subir cambios:

```bash
git push origin feature/team-selector
```

Abrir Pull Request hacia:

```text
main
```

---

# Commit Convention

Se recomienda Conventional Commits.

### Feature

```text
feat: add prediction table
```

### Bugfix

```text
fix: correct team sorting
```

### Refactor

```text
refactor: simplify api service
```

### Documentation

```text
docs: update README
```

### Styling

```text
style: improve spacing on cards
```

### Tests

```text
test: add prediction service tests
```

---

# 🚀 Deploy

El frontend está pensado para desplegarse en:

- Vercel

y consumir el backend desplegado en:

- Render

---

# 🤝 Contribuciones

1. Crear una rama desde `main`.
2. Implementar los cambios.
3. Verificar que el proyecto compile correctamente.
4. Ejecutar ESLint.
5. Abrir un Pull Request.

---

# 📄 Licencia

MIT

---

Desarrollado con Next.js y TypeScript.