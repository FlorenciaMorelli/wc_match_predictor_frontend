import { defineConfig } from "vitest/config";

// Tests de lógica pura (sin DOM): helpers de lib/. Los componentes se validan con
// typecheck + build + smoke manual; acá cubrimos las funciones determinísticas.
export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
  },
});
