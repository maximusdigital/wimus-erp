import { readFileSync } from "node:fs"

import { defineConfig, devices } from "@playwright/test"

// .env.local laden (u. a. E2E_EMAIL/E2E_PASSWORD für das Auth-Setup).
// Kein dotenv-Dep nötig; nur fehlende Keys werden gesetzt.
try {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "")
    }
  }
} catch {
  // .env.local optional – CI setzt die Variablen direkt.
}

/**
 * Playwright-Konfiguration (Testing 50, Kap. 6–7).
 *
 * - baseURL localhost:3000, headless (CI auf Coolify + lokal Windows).
 * - Tests unter tests/e2e/.
 * - "setup" meldet sich einmal an und legt den Auth-State ab; das Projekt
 *   "authenticated" nutzt ihn für die eingeloggten Grobtests.
 * - Mobile-Projekt (390px) für die Responsive-Prüfungen (Kap. 6.2).
 * - webServer startet die App automatisch, wenn nicht bereits gestartet
 *   (reuseExistingServer nutzt einen laufenden Dev-Server).
 */
const STORAGE = "tests/e2e/.auth/user.json"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 Retry lokal fängt Dev-Cold-Compile-Timeouts im parallelen Lauf ab.
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      // Unauthentifizierte Smoke-Tests (Redirect, Login-Seite).
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: [/auth\.setup\.ts/, /authenticated\.spec\.ts/],
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
      testIgnore: [/auth\.setup\.ts/, /authenticated\.spec\.ts/],
    },
    {
      // Eingeloggte Grobtests über alle Hauptseiten.
      name: "authenticated",
      testMatch: /authenticated\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], storageState: STORAGE },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
