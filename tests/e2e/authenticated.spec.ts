import { expect, test, type Page } from "@playwright/test"

/**
 * Eingeloggte Grobtests (Testing 50, Kap. 6.1): jede Hauptseite muss als
 * angemeldeter Nutzer fehlerfrei rendern (kein 5xx, kein Next-Error-Overlay,
 * eine Überschrift sichtbar). Fängt Render-/Worker-Crashs wie auf der
 * Betriebskosten-Detailseite ab.
 *
 * Auth-State kommt aus dem "setup"-Projekt (storageState).
 */

const HAUPTSEITEN: string[] = [
  "/",
  "/objekte",
  "/einheiten",
  "/kontakte",
  "/vertraege",
  "/vorgaenge",
  "/vorgaenge/plantafel",
  "/inventar",
  "/buchungen",
  "/finanzen",
  "/finanzen/mahnlauf",
  "/betriebskosten",
  "/betriebskosten/positionen",
  "/fristen",
  "/dokumente",
  "/fibu/belege",
  "/fibu/gesellschafter",
  "/fibu/konten",
  "/fibu/kontierungsregeln",
  "/fibu/lieferanten",
  "/fibu/feststellung",
  "/fibu/export",
]

/** Prüft: kein 5xx, nicht auf /login geworfen, kein Error-Overlay, eine Überschrift. */
async function erwarteGesund(page: Page, pfad: string) {
  const resp = await page.goto(pfad, { waitUntil: "domcontentloaded" })
  expect(resp, `${pfad}: keine Antwort`).toBeTruthy()
  expect(resp!.status(), `${pfad}: HTTP-Status`).toBeLessThan(500)
  await expect(page, `${pfad}: nicht eingeloggt (redirect /login)`).not.toHaveURL(
    /\/login/
  )
  for (const marker of [
    "Runtime Error",
    "Unhandled Runtime Error",
    "Jest worker",
    "Application error",
  ]) {
    await expect(
      page.locator("body"),
      `${pfad}: Fehler-Overlay "${marker}"`
    ).not.toContainText(marker)
  }
  await expect(page.locator("h1").first(), `${pfad}: keine Überschrift`).toBeVisible()
}

for (const pfad of HAUPTSEITEN) {
  test(`Seite rendert: ${pfad}`, async ({ page }) => {
    await erwarteGesund(page, pfad)
  })
}

test("Betriebskosten: Detail eines Eintrags rendert", async ({ page }) => {
  await page.goto("/betriebskosten", { waitUntil: "domcontentloaded" })

  // Ersten Eintrag finden: Link auf eine Detail-UUID.
  const href = await page
    .locator('a[href^="/betriebskosten/"]')
    .evaluateAll((els) =>
      els
        .map((e) => (e as HTMLAnchorElement).getAttribute("href") || "")
        .find((h) => /\/betriebskosten\/[0-9a-f-]{36}$/.test(h))
    )

  test.skip(!href, "Keine Betriebskosten-Einträge vorhanden (Seed nötig).")

  await page.goto(href!, { waitUntil: "domcontentloaded" })
  await expect(page.locator("body")).not.toContainText("Runtime Error")
  await expect(page.locator("body")).not.toContainText("Jest worker")
  await expect(page.locator("h1").first()).toBeVisible()

  // Auch die Abrechnungs-Ansicht (rechenintensiver Pfad) prüfen.
  await page.goto(`${href}/abrechnung`, { waitUntil: "domcontentloaded" })
  await expect(page.locator("body")).not.toContainText("Runtime Error")
  await expect(page.locator("body")).not.toContainText("Jest worker")
})
