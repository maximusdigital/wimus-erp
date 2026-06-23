import { defineConfig, devices } from "@playwright/test"

/**
 * Playwright-Konfiguration (Testing 50, Kap. 6–7).
 *
 * - baseURL localhost:3000, headless (CI auf Coolify + lokal Windows).
 * - Tests unter tests/e2e/.
 * - Mobile-Projekt (390px) für die Responsive-Prüfungen (Kap. 6.2).
 * - webServer startet die App automatisch, wenn nicht bereits gestartet.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
