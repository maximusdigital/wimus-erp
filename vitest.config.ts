import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

/**
 * Vitest-Konfiguration (Testing 50, Kap. 1–2).
 *
 * - environment "jsdom" für React-Komponenten/Hooks; reine Logik-Tests
 *   laufen ebenfalls problemlos darin.
 * - @/-Alias spiegelt tsconfig paths ("@/*": "./*").
 * - Nur tests/unit + tests/integration; E2E (Playwright) ist separat
 *   und wird ausgeschlossen.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
      include: ["lib/**/*.ts"],
      exclude: ["lib/**/*.d.ts", "lib/supabase/**", "lib/dev/**"],
    },
  },
})
