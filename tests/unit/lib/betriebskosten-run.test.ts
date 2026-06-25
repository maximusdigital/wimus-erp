import { describe, expect, it } from "vitest"

import { isUmlageschluessel, periodeRange } from "@/lib/betriebskosten-run"

// Spec 0001 – BK-Abrechnung: Perioden-/Schlüssel-Helfer
describe("periodeRange", () => {
  it("Jahr → 01.01.–31.12.", () => {
    expect(periodeRange("2025")).toEqual({ von: "2025-01-01", bis: "2025-12-31" })
  })
  it("kein/ungültiges Format → null/null", () => {
    expect(periodeRange(undefined)).toEqual({ von: null, bis: null })
    expect(periodeRange("Q1-2025")).toEqual({ von: null, bis: null })
  })
})

describe("isUmlageschluessel", () => {
  it("erkennt gültige Schlüssel", () => {
    expect(isUmlageschluessel("flaeche")).toBe(true)
    expect(isUmlageschluessel("kopfzahl")).toBe(true)
    expect(isUmlageschluessel("quatsch")).toBe(false)
    expect(isUmlageschluessel(null)).toBe(false)
  })
})
