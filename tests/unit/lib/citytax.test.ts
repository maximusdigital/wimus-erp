import { describe, expect, it } from "vitest"

import { citytaxBetrag, citytaxSatz, naechte } from "@/lib/utils/citytax"

// Testing 50, Kap. 3.1 – CityTax-Berechnung
describe("CityTax", () => {
  it("Stuttgart Standard: 2 Personen, 3 Nächte = 18,00 EUR", () => {
    expect(
      citytaxBetrag({
        stadt: "Stuttgart",
        personen: 2,
        checkin: "2026-06-01",
        checkout: "2026-06-04",
      })
    ).toBe(18.0)
  })

  it("Ludwigsburg Standard: 3 Personen, 2 Nächte = 12,00 EUR", () => {
    expect(
      citytaxBetrag({
        stadt: "Ludwigsburg",
        personen: 3,
        checkin: "2026-06-01",
        checkout: "2026-06-03",
      })
    ).toBe(12.0)
  })

  it("Kinder unter 18 zählen nicht: 2 Erwachsene + 1 Kind, 1 Nacht = 6,00 EUR", () => {
    // Kinder werden nicht als steuerpflichtige Person übergeben -> personen = 2
    expect(
      citytaxBetrag({
        stadt: "Stuttgart",
        personen: 2,
        checkin: "2026-06-01",
        checkout: "2026-06-02",
      })
    ).toBe(6.0)
  })

  it("Nullfall: 0 Personen = 0,00 EUR, kein Fehler", () => {
    expect(
      citytaxBetrag({
        stadt: "Stuttgart",
        personen: 0,
        checkin: "2026-06-01",
        checkout: "2026-06-04",
      })
    ).toBe(0)
  })

  it("Nicht hinterlegte Gemeinde (München) -> null (manuell prüfen)", () => {
    expect(
      citytaxBetrag({
        stadt: "München",
        personen: 2,
        checkin: "2026-06-01",
        checkout: "2026-06-04",
      })
    ).toBeNull()
  })

  it("Sätze: Stuttgart 3 €, Ludwigsburg 2 €, sonst 0", () => {
    expect(citytaxSatz("Stuttgart")).toBe(3)
    expect(citytaxSatz("Ludwigsburg")).toBe(2)
    expect(citytaxSatz("Berlin")).toBe(0)
  })

  it("Nächte: zählt Übernachtungen, ungültige/leere Daten = 0", () => {
    expect(naechte("2026-06-01", "2026-06-04")).toBe(3)
    expect(naechte("2026-06-04", "2026-06-01")).toBe(0)
    expect(naechte(null, "2026-06-04")).toBe(0)
  })
})
