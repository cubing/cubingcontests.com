import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [".next/**", "node_modules/**"],
    setupFiles: ["./vitest-setup.ts"],
    env: {
      TZ: "UTC",
      PROD_BASE_URL: "test",
    },
  },
  resolve: {
    alias: { "~": Deno.cwd() },
  },
});
