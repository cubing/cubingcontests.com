import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [".next/**", "node_modules/**"],
    setupFiles: ["__mocks__/setup.ts"],
    env: {
      PROD_BASE_URL: "test",
    },
  },
  resolve: {
    alias: { "~": Deno.cwd() },
  },
});
