# Guía de contribución

Gracias por contribuir a **WC Match Predictor — Frontend**. Esta guía resume cómo trabajar en el repo.

## Requisitos

- Node.js **22+** (hay un `.nvmrc`: `nvm use`)
- npm **10+**

```bash
npm install
```

## Verificación local

Antes de abrir un PR, corré los mismos checks que el CI:

```bash
npm run format:check && npm run lint && npm run typecheck && npm test && npm run build
```

- `format:check` — Prettier (config en `.prettierrc`). Para autoformatear: `npm run format`.
- `lint` — ESLint. Autofix: `npm run lint -- --fix`.
- `typecheck` — `tsc --noEmit`.
- `test` — Vitest (lógica pura en `lib/**/*.test.ts`). En watch: `npm run test:watch`.
- `build` — build de producción de Next.

## Convenciones

- **Componentes** en `kebab-case` (`fixture-section.tsx`).
- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`,
  `refactor:`, `docs:`, `style:`, `test:`, `chore:`.
- **Datos derivados**: `lib/shirt-names-data.ts` se regenera con `node scripts/gen-shirt-names.mjs`
  (no se parsea CSV en runtime). No editarlo a mano.
- **Tests**: agregá cobertura para lógica pura nueva en `lib/` (`*.test.ts`).

## Ramas y flujo (rulesets activos)

- **`staging`** — integración. Solo por **Pull Request**; requiere el check `build` (CI) en verde.
- **`main`** — releases. Push restringido e **historial lineal** (sin merge commits).

Ciclo:

1. Ramificá desde `staging`: `git switch -c feat/mi-cambio`.
2. Implementá + verificá local (ver arriba).
3. Abrí un **PR hacia `staging`**; al pasar el CI, _squash & merge_.
4. **Promové a `main` snapshoteando el árbol de `staging`** (no `merge` — ver más abajo) y taggeá:

```bash
git switch main && git pull --ff-only origin main
git read-tree --reset -u origin/staging   # main = árbol EXACTO de staging
git commit -m "Staging to main: <descripción> + vX.Y.Z"
git push origin main
git tag -a vX.Y.Z -m "<descripción>" && git push origin vX.Y.Z
```

> **Por qué `read-tree` y no `git merge --squash`:** el merge puede dejar hunks "solo-main" o duplicar
> contenido en archivos reformateados, sin marcar conflicto (rompería el build). `read-tree` deja `main`
> idéntico a `staging`, de forma determinista. El workflow **Guard main** valida esa igualdad en cada push.

## Versionado

[SemVer](https://semver.org/lang/es/). Cada promote a `main` lleva un tag `vX.Y.Z` y una entrada en
[`CHANGELOG.md`](./CHANGELOG.md).
