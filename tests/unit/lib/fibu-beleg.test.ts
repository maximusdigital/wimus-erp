import { describe, expect, it } from "vitest"

import { gating, ibanGueltig, pruefeBeleg } from "@/lib/utils/fibu-beleg"

const HEUTE = "2026-06-26"

// Spec 0002 / 60_tests – Validierung (deterministisch)
describe("pruefeBeleg", () => {
  const ok = {
    netto: 100,
    ust_betrag: 19,
    brutto: 119,
    ust_satz: 19,
    belegdatum: "2026-03-15",
  }

  it("stimmiger Beleg → ok, kein review_flag", () => {
    const r = pruefeBeleg(ok, HEUTE)
    expect(r.ok).toBe(true)
    expect(r.review_flag).toBe(false)
  })

  it("netto + ust ≠ brutto (100+18=119) → review_flag", () => {
    const r = pruefeBeleg({ ...ok, ust_betrag: 18 }, HEUTE)
    expect(r.review_flag).toBe(true)
    expect(r.gruende).toContain("netto + USt ≠ brutto")
  })

  it("ust passt nicht zum Satz (netto 100 × 19% ≠ 7) → review_flag", () => {
    const r = pruefeBeleg(
      { netto: 100, ust_betrag: 7, brutto: 107, ust_satz: 19, belegdatum: "2026-03-15" },
      HEUTE
    )
    expect(r.review_flag).toBe(true)
    expect(r.gruende).toContain("USt-Betrag passt nicht zum Satz")
  })

  it("7%-Satz korrekt → ok (KZV)", () => {
    const r = pruefeBeleg(
      { netto: 100, ust_betrag: 7, brutto: 107, ust_satz: 7, belegdatum: "2026-03-15" },
      HEUTE
    )
    expect(r.ok).toBe(true)
  })

  it("Zukunftsdatum → review_flag", () => {
    const r = pruefeBeleg({ ...ok, belegdatum: "2027-01-01" }, HEUTE)
    expect(r.review_flag).toBe(true)
    expect(r.gruende).toContain("Belegdatum liegt in der Zukunft")
  })

  it("1970 → review_flag (unplausibel alt)", () => {
    const r = pruefeBeleg({ ...ok, belegdatum: "1970-01-01" }, HEUTE)
    expect(r.review_flag).toBe(true)
    expect(r.gruende).toContain("Belegdatum unplausibel alt")
  })

  it("1-Cent-Toleranz wird akzeptiert", () => {
    const r = pruefeBeleg(
      { netto: 100, ust_betrag: 19, brutto: 119.01, ust_satz: 19, belegdatum: "2026-03-15" },
      HEUTE
    )
    expect(r.ok).toBe(true)
  })
})

// Spec 0002 / 60_tests – IBAN-Prüfsumme
describe("ibanGueltig", () => {
  it("gültige DE-IBAN → true", () => {
    expect(ibanGueltig("DE89 3704 0044 0532 0130 00")).toBe(true)
  })
  it("manipulierte IBAN → false", () => {
    expect(ibanGueltig("DE89 3704 0044 0532 0130 01")).toBe(false)
  })
  it("leer/Unsinn → false", () => {
    expect(ibanGueltig(null)).toBe(false)
    expect(ibanGueltig("DE00")).toBe(false)
  })
})

// Spec 0002 / 60_tests – Gating
describe("gating", () => {
  it("Confidence hoch + Betrag unter Schwelle → auto-buchbar", () => {
    expect(gating(0.98, 80).auto_buchbar).toBe(true)
  })
  it("Betrag über Schwelle → immer Mensch (auch confidence 1.0)", () => {
    const r = gating(1.0, 5000)
    expect(r.auto_buchbar).toBe(false)
    expect(r.review_flag).toBe(true)
  })
  it("Confidence niedrig → review", () => {
    expect(gating(0.5, 50).auto_buchbar).toBe(false)
  })
  it("eigene Schwellen", () => {
    expect(gating(0.8, 1000, { minConfidence: 0.7, maxBetrag: 2000 }).auto_buchbar).toBe(true)
  })
})
