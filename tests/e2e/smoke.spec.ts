import { expect, test } from "@playwright/test"

/**
 * E2E Smoke (Testing 50, Kap. 6.1 / 6.2).
 *
 * Minimaler Happy-Path: nicht angemeldete Nutzer werden auf /login
 * umgeleitet, die Login-Seite rendert. Erweiterte Szenarien (Objekt
 * anlegen, KZV-Buchung, Gästemappe …) bauen darauf auf.
 *
 * Voraussetzung: laufende App unter baseURL (webServer in playwright.config).
 */
test("Geschützte Route leitet auf /login um", async ({ page }) => {
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/login/)
})

test("Login-Seite rendert ein Passwort-Feld", async ({ page }) => {
  await page.goto("/login")
  await expect(page.locator('input[type="password"]')).toBeVisible()
})
