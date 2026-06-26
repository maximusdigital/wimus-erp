import { expect, test as setup } from "@playwright/test"

/**
 * Auth-Setup: meldet sich einmal über die echte Login-Maske an und speichert
 * den Browser-Auth-State für die eingeloggten Grobtests.
 *
 * Zugangsdaten kommen aus der Umgebung (nie im Repo):
 *   E2E_EMAIL / E2E_PASSWORD
 * Fehlen sie, schlägt das Setup mit klarer Meldung fehl (und damit das
 * abhängige "authenticated"-Projekt – die unauth. Smoke-Tests laufen weiter).
 */
const STORAGE = "tests/e2e/.auth/user.json"

setup("anmelden", async ({ page }) => {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD
  setup.skip(
    !email || !password,
    "E2E_EMAIL/E2E_PASSWORD nicht gesetzt – eingeloggte Tests übersprungen."
  )

  await page.goto("/login")
  await page.locator('input[type="email"]').fill(email!)
  await page.locator('input[type="password"]').fill(password!)
  await page.getByRole("button", { name: /anmelden/i }).click()

  // Erfolgreicher Login verlässt /login (Dashboard oder redirect-Ziel).
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 })

  await page.context().storageState({ path: STORAGE })
})
