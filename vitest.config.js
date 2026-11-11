import { defineConfig } from "vitest/config";

// Los tests no usan servidor ni base de datos. El umbral de cupo bajo se fija acá para que no dependa del .env.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.js"],
    env: { CUPO_BAJO_THRESHOLD: "2" },
  },
});
