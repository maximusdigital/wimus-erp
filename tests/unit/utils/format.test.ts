import { describe, expect, it } from "vitest"

import { formatAdresse, formatDate, formatEUR } from "@/lib/utils/format"

// Phase 0 – Fundament: Formatter-Utils
describe("format", () => {
  describe("formatEUR", () => {
    it("formatiert Beträge als EUR (de-DE, ohne Nachkommastellen)", () => {
      // non-breaking space vor dem €-Zeichen -> tolerant prüfen
      const out = formatEUR(1234)
      expect(out).toMatch(/1\.234/)
      expect(out).toContain("€")
    })

    it("null/undefined -> Gedankenstrich", () => {
      expect(formatEUR(null)).toBe("–")
      expect(formatEUR(undefined)).toBe("–")
    })

    it("0 ist ein gültiger Betrag (nicht Gedankenstrich)", () => {
      expect(formatEUR(0)).not.toBe("–")
    })
  })

  describe("formatDate", () => {
    it("formatiert ISO-Datum als TT.MM.JJJJ", () => {
      expect(formatDate("2026-06-23")).toBe("23.06.2026")
    })

    it("leer/ungültig -> Gedankenstrich", () => {
      expect(formatDate(null)).toBe("–")
      expect(formatDate("")).toBe("–")
      expect(formatDate("kein-datum")).toBe("–")
    })
  })

  describe("formatAdresse", () => {
    it("setzt Strasse Hausnummer, PLZ Ort zusammen", () => {
      expect(
        formatAdresse({
          strasse: "Bauhofstr.",
          hausnummer: "16",
          plz: "71634",
          ort: "Ludwigsburg",
        })
      ).toBe("Bauhofstr. 16, 71634 Ludwigsburg")
    })

    it("überspringt leere Teile", () => {
      expect(formatAdresse({ strasse: "Austraße", hausnummer: "125" })).toBe(
        "Austraße 125"
      )
    })

    it("komplett leer -> Gedankenstrich", () => {
      expect(formatAdresse({})).toBe("–")
    })
  })
})
