import { describe, expect, it } from "vitest"

import {
  aktenzeichenPraefix,
  generateAktenzeichen,
  naechsteLfdNr,
} from "@/lib/utils/aktenzeichen"

// Testing 50, Kap. 3.4 – Aktenzeichen-Generator
describe("Aktenzeichen", () => {
  it("Standardformat: 2025 / IS / 17 / A1 -> 2025IS17A1WH01", () => {
    expect(
      generateAktenzeichen(
        { jahr: 2025, mandant: "IS", objekt: "17", einheit: "A1" },
        1
      )
    ).toBe("2025IS17A1WH01")
  })

  it("LfdNr hochzählen: zweiter Vorgang gleicher Einheit/Jahr -> WH02", () => {
    const teile = { jahr: 2025, mandant: "IS", objekt: "17", einheit: "A1" }
    const praefix = aktenzeichenPraefix(teile)
    const naechste = naechsteLfdNr(praefix, ["2025IS17A1WH01"])
    expect(naechste).toBe(2)
    expect(generateAktenzeichen(teile, naechste)).toBe("2025IS17A1WH02")
  })

  it("Jahreswechsel: erster Vorgang 2026 startet wieder bei 01", () => {
    const teile = { jahr: 2026, mandant: "IS", objekt: "17", einheit: "A1" }
    const praefix = aktenzeichenPraefix(teile)
    // Bestand enthält nur 2025er Aktenzeichen -> kein Match
    const naechste = naechsteLfdNr(praefix, ["2025IS17A1WH01", "2025IS17A1WH02"])
    expect(naechste).toBe(1)
    expect(generateAktenzeichen(teile, naechste)).toBe("2026IS17A1WH01")
  })

  it("Ohne Einheit (Objekt-Ebene): kein Einheit-Kürzel", () => {
    expect(
      generateAktenzeichen({ jahr: 2025, mandant: "IS", objekt: "17" }, 1)
    ).toBe("2025IS17WH01")
    expect(
      generateAktenzeichen(
        { jahr: 2025, mandant: "IS", objekt: "17", einheit: "" },
        1
      )
    ).toBe("2025IS17WH01")
  })

  it("Kürzel mit Sonderzeichen/Ziffern: korrekte Konkatenation", () => {
    expect(
      generateAktenzeichen({ jahr: 2025, mandant: "IS", objekt: "BS5A" }, 1)
    ).toBe("2025ISBS5AWH01")
  })

  it("naechsteLfdNr ignoriert fremde Präfixe und nicht-numerische Reste", () => {
    const praefix = aktenzeichenPraefix({
      jahr: 2025,
      mandant: "IS",
      objekt: "17",
      einheit: "A1",
    })
    expect(
      naechsteLfdNr(praefix, [
        "2025IS17A1WH03",
        "2025MS13B2WH09", // anderes Objekt/Einheit
        "2025IS17A1WHxx", // kaputter Rest
      ])
    ).toBe(4)
  })
})
